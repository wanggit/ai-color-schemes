import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ApiI18nHandler } from "@/lib/api-i18n";
import { authenticateAndValidateUser } from "../utils/auth";
import { findExistingColor, saveBasicAnalysis, decrementUserCredits } from "../utils/db";
import { COLOR_ANALYSIS_SYSTEM_PROMPT } from "../constants";
import { gpt4oModel } from '@/lib/ai-provider';
import { streamText } from 'ai';

export const dynamic = 'force-dynamic'; // 强制动态渲染，禁用缓存

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const i18n = await ApiI18nHandler.create(request);

        const authResult = await authenticateAndValidateUser(prisma, i18n);
        if (authResult.error) {
            return authResult.error;
        }
        const { userId } = authResult;

        const { hex, regenerate } = await request.json();
        console.log(i18n.log("startBasicAnalysis", {
            hex,
            regenerate: regenerate ? i18n.log("forceRegenerate") : ""
        }));

        if (!hex || typeof hex !== "string") {
            return NextResponse.json({ error: i18n.error("invalidColorValue") }, { status: 400 });
        }

        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!hexRegex.test(hex)) {
            return NextResponse.json({ error: i18n.error("invalidColorFormat") }, { status: 400 });
        }

        if (!regenerate) {
            const existingColor = await findExistingColor(prisma, hex, userId);
            if (existingColor && existingColor.aiJson) {
                return NextResponse.json(JSON.parse(existingColor.aiJson));
            }
        }

        // 扣除积分
        await decrementUserCredits(prisma, userId);

        // 创建流式响应
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();
        const encoder = new TextEncoder();

        // 异步处理流式生成
        generateBasicAnalysisStream(hex, writer, encoder, userId, i18n, prisma)
            .catch(error => {
                // Vercel生产环境日志: 异步流处理中未捕获的错误
                console.error("[STREAM_ERROR] Unhandled error in async generateBasicAnalysisStream process.", {
                    errorMessage: error instanceof Error ? error.message : String(error),
                    errorStack: error instanceof Error ? error.stack : undefined,
                    error,
                });
            });

        return new Response(stream.readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error) {
        const fallbackI18n = new (await import("@/lib/api-i18n")).ApiI18nHandler('en');
        // Vercel生产环境日志
        console.error("[API_ERROR] /api/colors/basic-analysis: Unhandled error in POST handler.", {
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            error,
        });
        return NextResponse.json(
            { error: fallbackI18n.error("internalServerError") },
            { status: 500 }
        );
    }
}

async function generateBasicAnalysisStream(
    hex: string,
    writer: WritableStreamDefaultWriter<Uint8Array>,
    encoder: TextEncoder,
    userId: string,
    i18n: ApiI18nHandler,
    prisma: PrismaClient
) {
    // Vercel生产环境日志: 记录函数入口和参数
    console.warn("[STREAM_START] generateBasicAnalysisStream called.", { hex, userId });

    try {
        // 发送开始消息
        await sendStreamUpdate(writer, encoder, {
            type: 'progress',
            step: 'start',
            message: i18n.log('api.basicAnalysis.start'),
            progress: 0
        });

        // 发送AI请求开始消息
        await sendStreamUpdate(writer, encoder, {
            type: 'progress',
            step: 'requesting_ai',
            message: i18n.log('api.basicAnalysis.requestingAI'),
            progress: 10
        });

        // 检查环境变量
        const token = process.env.OPENAI_API_KEY;

        if (!token) {
            throw new Error(i18n.log("aiConfigurationError"));
        }

        // 发送解析开始消息
        await sendStreamUpdate(writer, encoder, {
            type: 'progress',
            step: 'parsing',
            message: i18n.log('api.basicAnalysis.parsingResponse'),
            progress: 30
        });

        // 使用 Vercel AI SDK 进行流式生成
        let fullResponse = '';

        const messages: Array<{ role: 'system' | 'user'; content: string }> = [
            {
                role: 'system',
                content: COLOR_ANALYSIS_SYSTEM_PROMPT
            },
            {
                role: 'user',
                content: `Please analyze the color ${hex} and generate a complete color analysis report. IMPORTANT: All your responses, including thinking process, analysis, and output must be in English only.`
            }
        ];

        // Vercel生产环境日志: 记录发送给AI的请求
        console.log("[AI_REQUEST] Calling streamText with messages.", { userId, hex });

        let textStream;
        try {
            const streamResult = await streamText({
                model: gpt4oModel,
                messages: messages,
                temperature: 0.7,
                maxTokens: 2000,
            });
            textStream = streamResult.textStream;
        } catch (aiError) {
            console.error("[AI_ERROR] streamText call itself failed.", {
                userId,
                hex,
                errorMessage: aiError instanceof Error ? aiError.message : String(aiError),
                errorStack: aiError instanceof Error ? aiError.stack : undefined,
                error: aiError,
            });
            // 抛出错误，让外层catch处理，并终止函数
            throw new Error('AI service call failed.');
        }


        // 处理流式响应
        for await (const delta of textStream) {
            fullResponse += delta;

            // 发送流式内容更新
            await sendStreamUpdate(writer, encoder, {
                type: 'stream_content',
                content: delta,
                progress: 50
            });
        }

        // Vercel生产环境日志: 记录从AI流中获取的完整响应
        console.log("[AI_RESPONSE] Full response from AI stream.", {
            userId,
            hex,
            responseLength: fullResponse.length,
            responsePrefix: fullResponse.substring(0, 500) + (fullResponse.length > 500 ? "..." : ""),
        });

        // 发送解析完成消息
        await sendStreamUpdate(writer, encoder, {
            type: 'progress',
            step: 'parsing_complete',
            message: i18n.log('api.basicAnalysis.parsingComplete'),
            progress: 70
        });

        // 解析AI响应
        let parsedResponse;
        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
            try {
                // 清理响应内容
                let cleanedResponse = fullResponse.trim();
                if (cleanedResponse.startsWith('```json')) {
                    cleanedResponse = cleanedResponse.substring(7, cleanedResponse.length - 3);
                }
                if (cleanedResponse.endsWith('```')) {
                    cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
                }
                parsedResponse = JSON.parse(cleanedResponse);
                break; // 成功解析，跳出循环
            } catch (error) {
                retryCount++;
                // Vercel生产环境日志: JSON解析失败
                console.error("[JSON_PARSE_ERROR] Failed to parse AI response.", {
                    userId,
                    hex,
                    attempt: `${retryCount}/${maxRetries + 1}`,
                    errorMessage: error instanceof Error ? error.message : String(error),
                    rawResponse: fullResponse,
                    error,
                });

                if (retryCount <= maxRetries) {
                    // 发送重试消息
                    await sendStreamUpdate(writer, encoder, {
                        type: 'retry',
                        message: i18n.log('api.basicAnalysis.retryInvalidJson', { retryCount, maxRetries }),
                        attempt: retryCount,
                        maxAttempts: maxRetries,
                        rawResponse: fullResponse
                    });

                    // 让AI修复JSON格式
                    await sendStreamUpdate(writer, encoder, {
                        type: 'progress',
                        step: 'fixing_json',
                        message: i18n.log('api.basicAnalysis.fixingJson', { retryCount, maxRetries }),
                        progress: 40
                    });

                    try {
                        const { textStream: retryTextStream } = await streamText({
                            model: gpt4oModel,
                            messages: [
                                {
                                    role: 'system',
                                    content: `You are a JSON format expert. Your task is to fix the provided JSON string to make it valid JSON format. You must respond with ONLY the corrected JSON string, no explanations or additional text. The JSON should follow the exact structure required for color analysis.`
                                },
                                {
                                    role: 'user',
                                    content: `Please fix this invalid JSON and return ONLY the corrected JSON string:\n\n${fullResponse}`
                                }
                            ],
                            temperature: 0.1,
                            maxTokens: 4000,
                        });

                        fullResponse = '';
                        for await (const delta of retryTextStream) {
                            fullResponse += delta;

                            // 发送流式内容更新
                            await sendStreamUpdate(writer, encoder, {
                                type: 'stream_content',
                                content: delta,
                                progress: 50
                            });
                        }
                    } catch (retryError) {
                        console.error('[AI_RETRY_ERROR] Retry request to fix JSON failed:', {
                            userId,
                            hex,
                            errorMessage: retryError instanceof Error ? retryError.message : String(retryError),
                            error: retryError
                        });
                        // 继续下一次重试
                    }
                } else {
                    // 所有重试都失败了
                    await sendStreamUpdate(writer, encoder, {
                        type: 'error',
                        message: i18n.log('api.basicAnalysis.parseFailed', { maxAttempts: maxRetries + 1 }),
                        error: i18n.log('api.basicAnalysis.invalidJsonFormat', { rawResponse: `${fullResponse.substring(0, 500)}...` }),
                        rawResponse: fullResponse
                    });
                    throw new Error(i18n.log('api.basicAnalysis.parseFailedRaw', { maxAttempts: maxRetries + 1, rawResponse: `${fullResponse.substring(0, 200)}...` }));
                }
            }
        }

        // 发送保存开始消息
        await sendStreamUpdate(writer, encoder, {
            type: 'progress',
            step: 'saving',
            message: i18n.log('api.basicAnalysis.savingToDb'),
            progress: 80
        });

        // Vercel生产环境日志: 准备将解析后的数据存入数据库
        console.log("[DB_SAVE] Saving basic analysis to database.", { userId, hex, dataSize: JSON.stringify(parsedResponse).length });

        // 保存基础分析到数据库
        await saveBasicAnalysis(prisma, hex, userId, parsedResponse);

        // 发送完成消息
        await sendStreamUpdate(writer, encoder, {
            type: 'complete',
            data: parsedResponse,
            message: i18n.log('api.basicAnalysis.analysisComplete'),
            progress: 100
        });

        // 关闭流
        await writer.close();

    } catch (error) {
        // Vercel生产环境日志: 流式生成过程中发生未捕获的错误
        console.error("[STREAM_ERROR] Unhandled error in generateBasicAnalysisStream.", {
            userId,
            hex,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            error,
        });

        // 发送错误消息
        await sendStreamUpdate(writer, encoder, {
            type: 'error',
            message: error instanceof Error ? error.message : '未知错误',
            error: error instanceof Error ? error.message : String(error)
        });

        // 尝试关闭流
        try {
            await writer.close();
        } catch (streamError) {
            console.error('Failed to close stream:', streamError);
        }
    }
}

async function sendStreamUpdate(
    writer: WritableStreamDefaultWriter<Uint8Array>,
    encoder: TextEncoder,
    data: any
) {
    try {
        const jsonString = JSON.stringify(data) + "\n";
        await writer.write(encoder.encode(jsonString));
        return true;
    } catch (error) {
        console.error('Failed to send stream update:', error);
        return false;
    }
}
