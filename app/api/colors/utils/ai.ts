import { put } from "@vercel/blob";
import { ApiI18nHandler } from "@/lib/api-i18n";
import { COLOR_ANALYSIS_SYSTEM_PROMPT, COLOR_SCHEME_BOOTSTRAP5_CUSTOM, COLOR_SCHEME_SYSTEM_PROMPT, COLOR_SCHEME_TAILWINDCSS_CUSTOM } from "../constants";

export const createAiColorExample = async (hex: string, colorScheme: any, token: string | undefined, userId: string, i18n: ApiI18nHandler) => {
    try {
        // 验证参数
        if (!hex || !colorScheme || !colorScheme.theory || !userId) {
            console.error(i18n.log("createExampleFailed"), { hex, colorScheme, userId });
            throw new Error(i18n.log("createExampleFailed"));
        }

        // 请求生成HTML
        let colorSchemeHtml = await requestAiColorScheme(colorScheme, token || '');
        if (colorSchemeHtml === "error") {
            console.log(i18n.log("schemeRetry", { theory: colorScheme.theory }));
            // 重试一次
            colorSchemeHtml = await requestAiColorScheme(colorScheme, token || '');
            if (colorSchemeHtml === "error") {
                console.log("Failed to create AI color example after retry:", colorScheme.theory);
                throw new Error(i18n.log("createExampleGeneralFailed", { theory: colorScheme.theory }));
            }
        }

        // 生成文件名和保存文件
        const cleanHex = hex.startsWith('#') ? hex.substring(1) : hex;
        const fileName = `${colorScheme.theory.toLowerCase().replace(/ /g, '-')}-${userId}-${Date.now()}.html`;

        try {
            const { url } = await put(
                `ai-colors-examples/${cleanHex}/${fileName}`,
                colorSchemeHtml,
                {
                    access: 'public',
                    contentType: 'text/html; charset=utf-8',
                    addRandomSuffix: false,
                    allowOverwrite: true
                }
            );

            // 更新配色方案对象
            colorScheme.exampleTitle = `${colorScheme.theory} Example`;
            colorScheme.h2Id = fileName;
            colorScheme.exampleUrl = url;
            console.log("colorScheme.exampleUrl: ", url);

            return url;
        } catch (error: unknown) {
            console.error(i18n.log("uploadExampleFailed", { theory: colorScheme.theory }), error);
            throw new Error(i18n.log("uploadExampleFailed", { theory: colorScheme.theory }) + ": " + (error instanceof Error ? error.message : i18n.log("unknownError")));
        }
    } catch (error) {
        console.error(i18n.log("createExampleGeneralFailed", { theory: colorScheme?.theory || 'unknown' }), error);
        throw error;
    }
}

export const createTailwindConfig = async (colorScheme: any, token: string | undefined, userId: string, i18n: ApiI18nHandler) => {
    try {
        if (!colorScheme || !colorScheme.theory || !userId) {
            console.error(i18n.log("createTailwindConfigFailed"), { colorScheme, userId });
            throw new Error(i18n.log("createTailwindConfigFailed"));
        }

        let tailwindConfig = await requestAiCode(colorScheme, token || '', COLOR_SCHEME_TAILWINDCSS_CUSTOM, 'javascript');
        if (tailwindConfig === "error") {
            console.log(i18n.log("tailwindRetry", { theory: colorScheme.theory }));
            tailwindConfig = await requestAiCode(colorScheme, token || '', COLOR_SCHEME_TAILWINDCSS_CUSTOM, 'javascript');
            if (tailwindConfig === "error") {
                console.log("Failed to create Tailwind config after retry:", colorScheme.theory);
                throw new Error(i18n.log("createTailwindConfigGeneralFailed", { theory: colorScheme.theory }));
            }
        }
        colorScheme.tailwindConfig = tailwindConfig;
        return tailwindConfig;

    } catch (error) {
        console.error(i18n.log("createTailwindConfigGeneralFailed", { theory: colorScheme?.theory || 'unknown' }), error);
        throw error;
    }
}

export const createBootstrap5CustomVariables = async (colorScheme: any, token: string | undefined, userId: string, i18n: ApiI18nHandler) => {
    try {
        if (!colorScheme || !colorScheme.theory || !userId) {
            console.error(i18n.log("createBootstrap5CustomVariablesFailed"), { colorScheme, userId });
            throw new Error(i18n.log("createBootstrap5CustomVariablesFailed"));
        }
        let bootstrap5CustomVariables = await requestAiCode(colorScheme, token || '', COLOR_SCHEME_BOOTSTRAP5_CUSTOM, 'scss');
        if (bootstrap5CustomVariables === "error") {
            console.log(i18n.log("bootstrap5Retry", { theory: colorScheme.theory }));
            bootstrap5CustomVariables = await requestAiCode(colorScheme, token || '', COLOR_SCHEME_BOOTSTRAP5_CUSTOM, 'scss');
            if (bootstrap5CustomVariables === "error") {
                console.log("Failed to create Bootstrap 5 custom variables after retry:", colorScheme.theory);
                throw new Error(i18n.log("createBootstrap5CustomVariablesGeneralFailed", { theory: colorScheme.theory }));
            }
        }
        colorScheme.bootstrap5CustomVariables = bootstrap5CustomVariables;
        return bootstrap5CustomVariables;

    } catch (error) {
        console.error(i18n.log("createBootstrap5CustomVariablesGeneralFailed", { theory: colorScheme?.theory || 'unknown' }), error);
        throw error;
    }
}

export const requestAiCode = async (colorScheme: any, token: string | undefined, systemPrompt: string, lang: string) => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        "model": "deepseek-r1",
        "messages": [
            {
                "role": "system",
                "content": systemPrompt
            },
            {
                "role": "user",
                "content": `${JSON.stringify(colorScheme)}`
            }
        ],
        "temperature": 0.5,
        "max_tokens": 16384,
        "stream": false
    });

    const requestOptions: RequestInit = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };
    const openaiUrl = process.env.OPENAI_URL;
    const response = await fetch(`${openaiUrl}/v1/chat/completions`, requestOptions);
    let content = await response.text();
    let contentJson = null;
    try {
        contentJson = JSON.parse(content);
    } catch (error) {
        console.log("Failed to request Ai Color Scheme, Try again:", error);
        const response = await fetch(`${openaiUrl}/v1/chat/completions`, requestOptions);
        content = await response.text();
        try {
            contentJson = JSON.parse(content);
        } catch (error) {
            console.log("Failed to request Ai Color Scheme:", error);
            return "error";
        }
    }
    if (contentJson.error) {
        console.log("contentJson.error has ERROR: ", contentJson.error);
        return "error";
    }
    content = contentJson.choices[0].message.content;
    const startTag: string = "```" + lang;
    const endTag: string = "```";
    let startIndex = content.indexOf(startTag);
    if (startIndex === -1) {
        startIndex = content.indexOf("```");
        if (startIndex !== -1) {
            content = content.substring(startIndex + 3)
        }
    } else {
        content = content.substring(startIndex + startTag.length);
    }
    const endIndex = content.lastIndexOf(endTag);
    if (endIndex !== -1) {
        content = content.substring(0, endIndex)
    }
    content = content.trim()
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
    return content;
}

export const requestAiColorScheme = async (colorScheme: any, token: string | undefined) => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        "model": "deepseek-r1",
        "messages": [
            {
                "role": "system",
                "content": COLOR_SCHEME_SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": `${JSON.stringify(colorScheme)}`
            }
        ],
        "temperature": 0.5,
        "max_tokens": 16384,
        "stream": false
    });

    const requestOptions: RequestInit = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    const openaiUrl = process.env.OPENAI_URL;
    const response = await fetch(`${openaiUrl}/v1/chat/completions`, requestOptions);
    let content = await response.text();
    let contentJson = null;
    try {
        contentJson = JSON.parse(content);
    } catch (error) {
        console.log("Failed to request Ai Color Scheme, Try again:", error);
        const response = await fetch(`${openaiUrl}/v1/chat/completions`, requestOptions);
        content = await response.text();
        try {
            contentJson = JSON.parse(content);
        } catch (error) {
            console.log("Failed to request Ai Color Scheme:", error);
            return "error";
        }
    }
    if (contentJson.error) {
        console.log("contentJson.error has ERROR: ", contentJson.error);
        return "error";
    }
    content = contentJson.choices[0].message.content;
    const startTag: string = "```html";
    const endTag: string = "```";
    const startIndex = content.indexOf(startTag);
    const endIndex = content.indexOf(endTag, startIndex + startTag.length);
    if (startIndex !== -1 && endIndex !== -1) {
        content = content.substring(startIndex + startTag.length, endIndex)
    }
    content = content.trim()
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\u003c/g, '<')
        .replace(/\u003e/g, '>');
    return content;
}

// 请求AI生成颜色分析响应
export async function requestAiColor(hex: string, token: string | undefined, i18n: ApiI18nHandler) {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        "model": "deepseek-r1",
        "messages": [
            {
                "role": "system",
                "content": COLOR_ANALYSIS_SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": `${hex}`
            }
        ],
        "temperature": 0.5,
        "max_tokens": 16384,
        "stream": false
    });

    const requestOptions: RequestInit = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    console.log(i18n.log("startAiRequest"));

    try {
        const openaiUrl = process.env.OPENAI_URL;
        if (!openaiUrl) {
            throw new Error(i18n.log("openaiUrlNotConfigured"));
        }
        const url = `${openaiUrl}/v1/chat/completions`;
        console.log("url: ", url);
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(i18n.log("aiRequestFailed", { status: response.status, error: errorText }));
            throw new Error(i18n.log("aiRequestFailed", { status: response.status, error: errorText }));
        }

        console.log(i18n.log("aiRequestSuccess"));
        const responseText = await response.text();

        // 验证返回的是有效JSON
        try {
            const responseJson = JSON.parse(responseText);
            if (!responseJson.choices || responseJson.choices.length === 0) {
                console.error(i18n.log("aiEmptyChoices"), responseJson);
                throw new Error(i18n.log("aiEmptyChoices"));
            }

            if (!responseJson.choices[0].message || !responseJson.choices[0].message.content) {
                console.error(i18n.log("aiIncorrectFormat"), responseJson.choices[0]);
                throw new Error(i18n.log("aiIncorrectFormat"));
            }

            console.log(i18n.log("aiResponseValid"));
        } catch (error) {
            console.error(i18n.log("aiInvalidJson"), responseText);
            if (responseText.length > 200) {
                console.error(i18n.log("aiResponsePreview"), responseText.substring(0, 200) + "...");
            }
            throw new Error(i18n.log("aiInvalidJson"));
        }

        return responseText;
    } catch (error) {
        console.error(i18n.log("aiRequestError"), error);
        // 返回一个可解析但表示错误的JSON
        return JSON.stringify({
            choices: [{
                message: {
                    content: JSON.stringify({
                        error: true,
                        message: error instanceof Error ? error.message : i18n.log("unknownError")
                    })
                }
            }]
        });
    }
} 