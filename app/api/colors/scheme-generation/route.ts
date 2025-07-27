import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ApiI18nHandler } from "@/lib/api-i18n";
import { authenticateAndValidateUser } from "../utils/auth";
import { deepseekr1Model } from '@/lib/ai-provider';
import { generateText } from 'ai';
import { put } from "@vercel/blob";
import { COLOR_SCHEME_SYSTEM_PROMPT, COLOR_SCHEME_TAILWINDCSS_CUSTOM, COLOR_SCHEME_BOOTSTRAP5_CUSTOM } from "../constants";
import { decrementUserCredits } from "../utils/db";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const i18n = await ApiI18nHandler.create(request);

        const authResult = await authenticateAndValidateUser(prisma, i18n);
        if (authResult.error) {
            return authResult.error;
        }
        const { userId } = authResult;

        const { hex, theory, task, colorScheme } = await request.json();
        console.log("scheme-generation: ", hex, theory, task, colorScheme);

        if (!hex || !theory || !task || !colorScheme) {
            return NextResponse.json({ error: i18n.error("missingRequiredParameters") }, { status: 400 });
        }

        // 扣除积分
        await decrementUserCredits(prisma, userId, 2);

        // 支持 task 为字符串或数组
        const tasks = Array.isArray(task) ? task : [task];

        // 并发执行所有任务
        const taskPromises = tasks.map((t) => {
            switch (t) {
                case 'example':
                    return generateExample(hex, theory, colorScheme, i18n).then(result => ({ task: t, result }));
                case 'tailwind':
                    return generateTailwindConfig(hex, theory, colorScheme, i18n).then(result => ({ task: t, result }));
                case 'bootstrap':
                    return generateBootstrapVariables(hex, theory, colorScheme, i18n).then(result => ({ task: t, result }));
                default:
                    return Promise.resolve({ task: t, error: i18n.error("invalidTaskType") });
            }
        });

        const results = await Promise.all(taskPromises);

        // 保存有 url 的结果到数据库
        await Promise.all(
            results
                .filter(r => 'result' in r && r.result && r.result.url)
                .map(r => saveToDatabase(hex, theory, r.task, (r as { result: { url: string } }).result.url, userId, i18n))
        );

        // 返回所有结果
        return NextResponse.json(results);

    } catch (error) {
        const fallbackI18n = new (await import("@/lib/api-i18n")).ApiI18nHandler('en');
        console.error(fallbackI18n.log("schemeGenerationFailed"), error);
        return NextResponse.json(
            { error: fallbackI18n.error("internalServerError") },
            { status: 500 }
        );
    }
}

async function generateExample(hex: string, theory: string, colorScheme: any, i18n: ApiI18nHandler) {
    // 构建颜色分析JSON数据
    const colorSchemeData = {
        theory: theory,
        colors: colorScheme.colors,
        description: colorScheme.description,
        uiApplication: colorScheme.uiApplication,
        strengths: colorScheme.strengths,
        recommendedRatio: colorScheme.recommendedRatio,
        bestFor: colorScheme.bestFor
    };

    const { text } = await generateText({
        model: deepseekr1Model,
        messages: [
            {
                role: 'system',
                content: COLOR_SCHEME_SYSTEM_PROMPT
            },
            {
                role: 'user',
                content: JSON.stringify(colorSchemeData, null, 2)
            }
        ],
        maxTokens: 5000,
        temperature: 0.7,
    });

    console.log(text);
    // 从text中只提取```html 到 ``` 之间的内容
    const htmlContent = text.match(/```html\n([\s\S]*?)\n```/)?.[1];
    if (!htmlContent) {
        throw new Error('No HTML content found in the response');
    }
    console.log(htmlContent);

    // 上传HTML示例到Vercel Blob
    const cleanHex = hex.startsWith('#') ? hex.substring(1) : hex;
    const theoryFileName = theory.toLowerCase().replace(/ /g, '-');
    const timestamp = Date.now();
    const htmlFilename = `${theoryFileName}-${timestamp}.html`;
    const htmlPath = `${cleanHex}/${htmlFilename}`;

    console.log(`📁 HTML示例上传路径: ${htmlPath}`);
    const { url } = await put(
        `ai-colors-examples/${htmlPath}`,
        htmlContent,
        {
            access: 'public',
            contentType: 'text/html; charset=utf-8',
            addRandomSuffix: false,
            allowOverwrite: true
        }
    );
    console.log(`✅ HTML示例上传成功，URL: ${url}`);

    return {
        url: url,
        html: htmlContent
    };
}

async function generateTailwindConfig(hex: string, theory: string, colorScheme: any, i18n: ApiI18nHandler) {
    // 构建颜色分析JSON数据
    const colorSchemeData = {
        theory: theory,
        colors: colorScheme.colors,
        description: colorScheme.description || `${theory} color scheme based on ${hex}`,
        uiApplication: colorScheme.uiApplication || `Use colors appropriately for ${theory.toLowerCase()} design`,
        strengths: colorScheme.strengths || `Balanced and harmonious ${theory.toLowerCase()} color combination`,
        recommendedRatio: colorScheme.recommendedRatio || `Equal distribution of colors`,
        bestFor: colorScheme.bestFor || `Modern web applications and interfaces`
    };

    const { text } = await generateText({
        model: deepseekr1Model,
        messages: [
            {
                role: 'system',
                content: COLOR_SCHEME_TAILWINDCSS_CUSTOM
            },
            {
                role: 'user',
                content: JSON.stringify(colorSchemeData, null, 2)
            }
        ],
        maxTokens: 2000,
        temperature: 0.5,
    });

    console.log(text);
    // 从text中只提取```javascript 到 ``` 之间的内容
    const javascriptContent = text.match(/```javascript\n([\s\S]*?)\n```/)?.[1];
    if (!javascriptContent) {
        throw new Error('No JavaScript content found in the response');
    }
    console.log(javascriptContent);

    // 上传Tailwind配置到Vercel Blob
    const cleanHex = hex.startsWith('#') ? hex.substring(1) : hex;
    const theoryFileName = theory.toLowerCase().replace(/ /g, '-');
    const timestamp = Date.now();
    const configFilename = `tailwind-${theoryFileName}-${timestamp}.js`;
    const configPath = `${cleanHex}/${configFilename}`;

    console.log(`📁 Tailwind配置上传路径: ${configPath}`);
    const { url } = await put(
        `ai-colors-configs/${configPath}`,
        javascriptContent,
        {
            access: 'public',
            contentType: 'application/javascript; charset=utf-8',
            addRandomSuffix: false,
            allowOverwrite: true
        }
    );
    console.log(`✅ Tailwind配置上传成功，URL: ${url}`);

    return {
        url: url,
        config: javascriptContent
    };
}

async function generateBootstrapVariables(hex: string, theory: string, colorScheme: any, i18n: ApiI18nHandler) {
    // 构建颜色分析JSON数据
    const colorSchemeData = {
        theory: theory,
        colors: colorScheme.colors,
        description: colorScheme.description || `${theory} color scheme based on ${hex}`,
        uiApplication: colorScheme.uiApplication || `Use colors appropriately for ${theory.toLowerCase()} design`,
        strengths: colorScheme.strengths || `Balanced and harmonious ${theory.toLowerCase()} color combination`,
        recommendedRatio: colorScheme.recommendedRatio || `Equal distribution of colors`,
        bestFor: colorScheme.bestFor || `Modern web applications and interfaces`
    };

    const { text } = await generateText({
        model: deepseekr1Model,
        messages: [
            {
                role: 'system',
                content: COLOR_SCHEME_BOOTSTRAP5_CUSTOM
            },
            {
                role: 'user',
                content: JSON.stringify(colorSchemeData, null, 2)
            }
        ],
        maxTokens: 2000,
        temperature: 0.5,
    });

    console.log(text);
    // 从text中只提取```scss 到 ``` 之间的内容
    const scssContent = text.match(/```scss\n([\s\S]*?)\n```/)?.[1];
    if (!scssContent) {
        throw new Error('No SCSS content found in the response');
    }
    console.log(scssContent);

    // 上传Bootstrap配置到Vercel Blob
    const cleanHex = hex.startsWith('#') ? hex.substring(1) : hex;
    const theoryFileName = theory.toLowerCase().replace(/ /g, '-');
    const timestamp = Date.now();
    const configFilename = `bootstrap-${theoryFileName}-${timestamp}.css`;
    const configPath = `${cleanHex}/${configFilename}`;

    console.log(`📁 Bootstrap配置上传路径: ${configPath}`);
    const { url } = await put(
        `ai-colors-configs/${configPath}`,
        scssContent,
        {
            access: 'public',
            contentType: 'text/css; charset=utf-8',
            addRandomSuffix: false,
            allowOverwrite: true
        }
    );
    console.log(`✅ Bootstrap配置上传成功，URL: ${url}`);

    return {
        url: url,
        config: scssContent
    };
}

// 获取配色方案对应的字段名
function getSchemeKey(theory: string, task: string): string {
    const theorySuffix = (() => {
        switch (theory) {
            case "Complementary": return "Comp";
            case "Analogous": return "Anal";
            case "Triadic": return "Tria";
            case "Monochromatic": return "Mono";
            case "Split-Complementary": return "SpCo";
            default: return theory.replace(/[^a-zA-Z0-9]/g, "");
        }
    })();

    switch (task) {
        case 'example': return `example${theorySuffix}`;
        case 'tailwind': return `tailwind${theorySuffix}`;
        case 'bootstrap': return `bootstrap${theorySuffix}`;
        default: return `${task}${theorySuffix}`;
    }
}

// 保存到数据库
async function saveToDatabase(hex: string, theory: string, task: string, url: string, userId: string, i18n: ApiI18nHandler) {
    try {
        const schemeKey = getSchemeKey(theory, task);
        console.log(`💾 保存到数据库 - 字段: ${schemeKey}, URL: ${url}`);

        // 查找现有记录
        const existingRecord = await prisma.aiColor.findFirst({
            where: {
                hex: hex.toLowerCase(),
                userId: userId
            }
        });

        if (existingRecord) {
            // 更新现有记录
            await prisma.aiColor.update({
                where: { id: existingRecord.id },
                data: {
                    [schemeKey]: url,
                    updatedAt: new Date()
                }
            });
            console.log(`✅ 数据库记录更新成功 - 字段: ${schemeKey}`);
        } else {
            console.log(`⚠️ 未找到现有记录，无法保存 - 颜色: ${hex}`);
        }
    } catch (error) {
        console.error(`❌ 数据库保存失败 - 字段: ${getSchemeKey(theory, task)}:`, error);
        // 不抛出错误，避免影响主要功能
    }
} 