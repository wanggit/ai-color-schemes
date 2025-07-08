import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import zh from '@/messages/zh.json';
import en from '@/messages/en.json';
import de from '@/messages/de.json';
import ja from '@/messages/ja.json';
import ko from '@/messages/ko.json';

// 支持的语言列表
export const SUPPORTED_LOCALES = ['zh', 'en', 'de', 'ja', 'ko'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// 翻译消息映射
const messages = {
    zh,
    en,
    de,
    ja,
    ko,
} as const;

/**
 * 从请求中获取用户的语言偏好
 * 优先级：URL参数 > Accept-Language 头 > 会话语言 > 默认语言
 */
export async function getLocaleFromRequest(request: NextRequest): Promise<SupportedLocale> {
    // 1. 检查URL参数中的语言设置
    const searchParams = new URL(request.url).searchParams;
    const urlLocale = searchParams.get('locale') || searchParams.get('lang');
    if (urlLocale && SUPPORTED_LOCALES.includes(urlLocale as SupportedLocale)) {
        return urlLocale as SupportedLocale;
    }

    // 2. 检查Accept-Language请求头
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
        const preferredLocale = parseAcceptLanguage(acceptLanguage);
        if (preferredLocale) {
            return preferredLocale;
        }
    }

    // 3. 检查用户会话中的语言偏好（如果有的话）
    try {
        const session = await getServerSession();
        if (session?.user && (session.user as any).locale) {
            const sessionLocale = (session.user as any).locale;
            if (SUPPORTED_LOCALES.includes(sessionLocale)) {
                return sessionLocale as SupportedLocale;
            }
        }
    } catch (error) {
        // 忽略会话错误，继续使用默认语言
    }

    // 4. 默认返回英文
    return 'en';
}

/**
 * 解析Accept-Language头，返回最匹配的语言
 */
function parseAcceptLanguage(acceptLanguage: string): SupportedLocale | null {
    const languages = acceptLanguage
        .split(',')
        .map(lang => {
            const [code, quality = '1'] = lang.trim().split(';q=');
            return {
                code: code.toLowerCase(),
                quality: parseFloat(quality)
            };
        })
        .sort((a, b) => b.quality - a.quality);

    for (const { code } of languages) {
        // 完全匹配
        if (SUPPORTED_LOCALES.includes(code as SupportedLocale)) {
            return code as SupportedLocale;
        }

        // 语言代码匹配（如 zh-CN -> zh）
        const mainLang = code.split('-')[0];
        if (SUPPORTED_LOCALES.includes(mainLang as SupportedLocale)) {
            return mainLang as SupportedLocale;
        }
    }

    return null;
}

/**
 * 获取指定路径的翻译文本
 */
export function getApiMessage(locale: SupportedLocale, path: string, variables?: Record<string, any>): string {
    const messageObj = messages[locale] as any;
    const keys = path.split('.');

    let result = messageObj;
    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            // 如果找不到翻译，回退到英文
            if (locale !== 'en') {
                return getApiMessage('en', path, variables);
            }
            // 如果英文也找不到，返回路径本身
            return path;
        }
    }

    if (typeof result !== 'string') {
        return path;
    }

    // 替换变量
    if (variables) {
        return replaceVariables(result, variables);
    }

    return result;
}

/**
 * 替换消息中的变量占位符
 */
function replaceVariables(message: string, variables: Record<string, any>): string {
    return message.replace(/\{(\w+)\}/g, (match, key) => {
        return variables[key] !== undefined ? String(variables[key]) : match;
    });
}

/**
 * API错误消息的便捷函数
 */
export function getApiError(locale: SupportedLocale, errorKey: string, variables?: Record<string, any>): string {
    return getApiMessage(locale, `api.errors.${errorKey}`, variables);
}

/**
 * API日志消息的便捷函数
 */
export function getApiLog(locale: SupportedLocale, logKey: string, variables?: Record<string, any>): string {
    return getApiMessage(locale, `api.logs.${logKey}`, variables);
}

/**
 * API成功消息的便捷函数
 */
export function getApiSuccess(locale: SupportedLocale, successKey: string, variables?: Record<string, any>): string {
    return getApiMessage(locale, `api.success.${successKey}`, variables);
}

/**
 * 创建国际化的API响应处理器
 */
export class ApiI18nHandler {
    private locale: SupportedLocale;

    constructor(locale: SupportedLocale) {
        this.locale = locale;
    }

    /**
     * 创建处理器实例
     */
    static async create(request: NextRequest): Promise<ApiI18nHandler> {
        const locale = await getLocaleFromRequest(request);
        return new ApiI18nHandler(locale);
    }

    /**
     * 获取错误消息
     */
    error(errorKey: string, variables?: Record<string, any>): string {
        return getApiError(this.locale, errorKey, variables);
    }

    /**
     * 获取日志消息
     */
    log(logKey: string, variables?: Record<string, any>): string {
        return getApiLog(this.locale, logKey, variables);
    }

    /**
     * 获取成功消息
     */
    success(successKey: string, variables?: Record<string, any>): string {
        return getApiSuccess(this.locale, successKey, variables);
    }

    /**
     * 获取任意消息
     */
    message(path: string, variables?: Record<string, any>): string {
        return getApiMessage(this.locale, path, variables);
    }

    /**
     * 获取当前语言
     */
    getLocale(): SupportedLocale {
        return this.locale;
    }
}

/**
 * 为其他语言文件添加API翻译的类型定义
 */
export interface ApiMessages {
    api: {
        errors: {
            unauthorized: string;
            invalidUser: string;
            userNotFound: string;
            accountDisabled: string;
            insufficientCredits: string;
            invalidColorValue: string;
            invalidColorFormat: string;
            cannotDetermineUser: string;
            missingParameters: string;
            invalidPageNumber: string;
            internalServerError: string;
            databaseError: string;
            generateFailed: string;
            updateFailed: string;
        };
        logs: {
            startGenerating: string;
            forceRegenerate: string;
            schemeRetry: string;
            startAiRequest: string;
            aiRequestSuccess: string;
            aiResponseValid: string;
            generateHtmlPath: string;
            savingToDatabase: string;
            generateColorFailed: string;
            fetchUsersFailed: string;
        };
        success: {
            schemeGenerated: string;
            exampleGenerated: string;
            dataUpdated: string;
        };
    };
} 