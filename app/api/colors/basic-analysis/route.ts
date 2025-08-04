import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ApiI18nHandler } from "@/lib/api-i18n";
import { authenticateAndValidateUser } from "../utils/auth";
import { findExistingColor, saveBasicAnalysis, decrementUserCredits } from "../utils/db";
import { COLOR_ANALYSIS_SYSTEM_PROMPT } from "../constants";
import { gpt4oModel } from '@/lib/ai-provider';
import { generateText } from 'ai';

export const dynamic = 'force-dynamic';

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

        // 生成基础分析
        const analysisResult = await generateBasicAnalysis(hex, userId, i18n, prisma);

        return NextResponse.json(analysisResult);

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

async function generateBasicAnalysis(
    hex: string,
    userId: string,
    i18n: ApiI18nHandler,
    prisma: PrismaClient
) {
    // Vercel生产环境日志: 记录函数入口和参数
    console.warn("[ANALYSIS_START] generateBasicAnalysis called.", { hex, userId });

    try {
        // 检查环境变量
        const token = process.env.OPENAI_API_KEY;

        if (!token) {
            throw new Error(i18n.log("aiConfigurationError"));
        }

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
        console.log("[AI_REQUEST] Calling generateText with messages.", { userId, hex });

        let fullResponse: string;
        try {
            const result = await generateText({
                model: gpt4oModel,
                messages: messages,
                temperature: 0.7,
                maxTokens: 2000,
            });
            fullResponse = result.text;
        } catch (aiError) {
            console.error("[AI_ERROR] generateText call itself failed.", {
                userId,
                hex,
                errorMessage: aiError instanceof Error ? aiError.message : String(aiError),
                errorStack: aiError instanceof Error ? aiError.stack : undefined,
                error: aiError,
            });
            // 抛出错误，让外层catch处理，并终止函数
            throw new Error('AI service call failed.');
        }

        // Vercel生产环境日志: 记录从AI获取的完整响应
        console.log("[AI_RESPONSE] Full response from AI.", {
            userId,
            hex,
            responseLength: fullResponse.length,
            responsePrefix: fullResponse.substring(0, 500) + (fullResponse.length > 500 ? "..." : ""),
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
                    // 让AI修复JSON格式
                    try {
                        const result = await generateText({
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

                        fullResponse = result.text;
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
                    throw new Error(i18n.log('api.basicAnalysis.parseFailedRaw', { maxAttempts: maxRetries + 1, rawResponse: `${fullResponse.substring(0, 200)}...` }));
                }
            }
        }

        // Vercel生产环境日志: 准备将解析后的数据存入数据库
        console.log("[DB_SAVE] Saving basic analysis to database.", { userId, hex, dataSize: JSON.stringify(parsedResponse).length });

        // 保存基础分析到数据库
        await saveBasicAnalysis(prisma, hex, userId, parsedResponse);

        return parsedResponse;

    } catch (error) {
        // Vercel生产环境日志: 生成过程中发生未捕获的错误
        console.error("[ANALYSIS_ERROR] Unhandled error in generateBasicAnalysis.", {
            userId,
            hex,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            error,
        });

        throw error;
    }
}
