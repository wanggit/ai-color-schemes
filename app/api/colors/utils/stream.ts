import { ApiI18nHandler } from "@/lib/api-i18n";
import { createAiColorExample, requestAiColor, createTailwindConfig, createBootstrap5CustomVariables } from "./ai";
import { decrementUserCredits } from "./db";
import { PrismaClient } from "@prisma/client";

// 请求AI生成颜色分析响应
export async function generateColorResponseWithProgress(hex: string, writer: WritableStreamDefaultWriter<Uint8Array>, userId: string, i18n: ApiI18nHandler, prisma: PrismaClient) {
    const encoder = new TextEncoder();
    const token = process.env.OPENAI_API_KEY;

    // 辅助函数：发送流式更新，每条消息后添加明确的分隔符
    async function sendStreamUpdate(data: any) {
        try {
            // 发送JSON对象，每条消息单独成行并以换行符分隔
            const jsonString = JSON.stringify(data) + "\n";
            console.log(jsonString);
            await writer.write(encoder.encode(jsonString));
            return true;
        } catch (error) {
            console.error(i18n.log("sendStreamUpdateFailed"), error);
            // 如果流已关闭，不再尝试写入
            if ((error as any).code === 'ERR_INVALID_STATE') {
                return false;
            }
            throw error;
        }
    }

    try {
        // 发送进度更新：开始生成
        await sendStreamUpdate({
            type: 'progress',
            step: 'start',
            message: i18n.log("startAnalyzing"),
            progress: 0
        });

        // 请求AI生成颜色分析
        await sendStreamUpdate({
            type: 'progress',
            step: 'requesting_ai',
            message: i18n.log("requestingAi"),
            progress: 10
        });

        const aiColorResponse = await requestAiColor(hex, token || '', i18n);
        await decrementUserCredits(prisma, userId);

        // 解析AI返回数据
        await sendStreamUpdate({
            type: 'progress',
            step: 'parsing',
            message: i18n.log("parsingAiResponse"),
            progress: 30
        });

        // 初始化aiJson变量
        let aiJson;

        try {
            const processAiResponse = (aiColorResponse: string) => {
                // 增加错误处理，确保AI返回了正确的格式
                let parsedResponse;
                try {
                    parsedResponse = JSON.parse(aiColorResponse);
                } catch (error) {
                    console.error(i18n.log("aiDataFormatError"), aiColorResponse);
                    throw new Error(i18n.log("aiDataFormatError"));
                }

                // 检查是否是我们自己生成的错误响应
                if (parsedResponse.choices?.[0]?.message?.content) {
                    try {
                        const innerContent = JSON.parse(parsedResponse.choices[0].message.content);
                        if (innerContent.error === true) {
                            console.error(i18n.log("aiResponseError"), innerContent.message);
                            throw new Error(innerContent.message);
                        }
                    } catch (e) {
                        // 如果不是JSON格式，继续正常处理
                    }
                }

                // 检查AI返回结构是否符合预期
                if (!parsedResponse.choices || !parsedResponse.choices[0] || !parsedResponse.choices[0].message || !parsedResponse.choices[0].message.content) {
                    console.error(i18n.log("aiStructureIncorrect"), parsedResponse);
                    throw new Error(i18n.log("aiStructureIncorrect"));
                }

                let content = parsedResponse.choices[0].message.content;
                content = content.trim();
                if (content.startsWith('```json')) {
                    content = content.substring(7, content.length - 3);
                }
                if (content.endsWith('```')) {
                    content = content.substring(0, content.length - 3);
                }
                return content;
            };

            let content = processAiResponse(aiColorResponse);

            try {
                aiJson = JSON.parse(content);
            } catch (error) {
                console.error(i18n.log("aiParseJsonFailed"), content);
                console.log("Retrying AI request...");

                // 重试一次
                const newAiColorResponse = await requestAiColor(hex, token || '', i18n);
                content = processAiResponse(newAiColorResponse);
                aiJson = JSON.parse(content); // 如果这里失败，会由外层catch捕获
            }

            // 确保colorSchemes字段存在
            if (!aiJson.colorAnalysis || !aiJson.colorAnalysis.colorSchemes) {
                console.error(i18n.log("aiMissingColorSchemes"), aiJson);
                throw new Error(i18n.log("aiMissingColorSchemes"));
            }
        } catch (error) {
            console.error(i18n.log("aiAnalysisFailed"), error);
            throw new Error(i18n.log("aiParseJsonFailed"));
        }

        const colorSchemes = aiJson.colorAnalysis.colorSchemes;

        // 发送基础颜色信息
        const sentPartialData = await sendStreamUpdate({
            type: 'partial_data',
            data: aiJson,
            message: i18n.log("basicAnalysisComplete"),
            progress: 50
        });

        if (!sentPartialData) {
            return aiJson; // 如果发送失败，停止处理
        }

        // 生成每个配色方案的示例
        const sentProgress = await sendStreamUpdate({
            type: 'progress',
            step: 'generating_examples',
            message: i18n.log("generatingExamples"),
            progress: 60
        });

        if (!sentProgress) {
            return aiJson; // 如果发送失败，停止处理
        }

        // 总计划数量
        const totalTasks = colorSchemes.length * 3; // 每个方案有3个任务：示例、Tailwind、Bootstrap
        let completedTasks = 0;

        // 并发处理所有任务，但流式返回结果
        const allPromises = colorSchemes.flatMap((colorScheme: any) => {
            const createAndHandleTask = async (taskName: string, taskFn: () => Promise<any>, getPayload: (result: any) => object) => {
                try {
                    const result = await taskFn();
                    completedTasks++;
                    await decrementUserCredits(prisma, userId);
                    await sendStreamUpdate({
                        type: 'scheme_progress',
                        theory: colorScheme.theory,
                        task: taskName,
                        status: 'complete',
                        progress: 60 + Math.floor((completedTasks / totalTasks) * 40),
                        ...getPayload(result),
                    });
                } catch (error) {
                    console.log(`Failed to process ${taskName} for color scheme ${colorScheme.theory}:`, error);
                    completedTasks++; // 即使失败，也算任务完成，以推进进度条
                    await sendStreamUpdate({
                        type: 'scheme_error',
                        theory: colorScheme.theory,
                        task: taskName,
                        message: `Failed to generate ${taskName} for ${colorScheme.theory}`,
                        progress: 60 + Math.floor((completedTasks / totalTasks) * 40),
                    });
                }
            };

            const examplePromise = createAndHandleTask(
                'example',
                async () => {
                    const result = await createAiColorExample(hex, colorScheme, token || '', userId, i18n);
                    return result;
                },
                (result) => ({
                    exampleUrl: colorScheme.exampleUrl || '',
                    previewUrl: result.previewUrl || ''
                })
            );

            const tailwindPromise = createAndHandleTask(
                'tailwind',
                async () => {
                    const config = await createTailwindConfig(colorScheme, token || '', userId, i18n);
                    colorScheme.tailwindConfig = config;
                    return config;
                },
                (config) => ({ tailwindConfig: config })
            );

            const bootstrapPromise = createAndHandleTask(
                'bootstrap',
                async () => {
                    const vars = await createBootstrap5CustomVariables(colorScheme, token || '', userId, i18n);
                    colorScheme.bootstrap5CustomVariables = vars;
                    return vars;
                },
                (vars) => ({ bootstrap5CustomVariables: vars })
            );

            return [examplePromise, tailwindPromise, bootstrapPromise];
        });

        await Promise.all(allPromises);

        // 发送完成信息
        await sendStreamUpdate({
            type: 'complete',
            data: aiJson,
            message: i18n.success("schemeGenerated"),
            progress: 100
        });

        // 关闭流
        try {
            await writer.close();
        } catch (error) {
            console.error(i18n.log("sendStreamUpdateFailed"), error);
            // 忽略已关闭的流错误
        }

        return aiJson;
    } catch (error) {
        console.error(i18n.log("generateColorFailed"), error);

        // 尝试发送错误信息
        await sendStreamUpdate({
            type: 'error',
            message: i18n.error("generateFailed"),
            error: error instanceof Error ? error.message : String(error)
        }).catch(e => console.error(i18n.log("sendStreamUpdateFailed"), e));

        // 尝试关闭流
        try {
            await writer.close();
        } catch (streamError) {
            console.error(i18n.log("sendStreamUpdateFailed"), streamError);
            // 忽略已关闭的流错误
        }

        throw error;
    }
} 