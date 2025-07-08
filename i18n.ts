import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// 支持的语言列表
export const locales = ['en', 'zh', 'de', 'ja', 'ko', 'zh-TW'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({ locale }) => {
    const baseLocale = locale || defaultLocale;

    if (!locales.includes(baseLocale as any)) notFound();

    let messages;
    try {
        // 动态导入消息文件，添加错误处理
        messages = (await import(`./messages/${baseLocale}.json`)).default;
    } catch (error) {
        console.error(`Failed to load messages for locale: ${baseLocale}`, error);
        // 如果加载失败，回退到默认语言
        if (baseLocale !== defaultLocale) {
            try {
                messages = (await import(`./messages/${defaultLocale}.json`)).default;
            } catch (fallbackError) {
                console.error(`Failed to load fallback messages for locale: ${defaultLocale}`, fallbackError);
                throw fallbackError;
            }
        } else {
            throw error;
        }
    }

    return {
        locale: baseLocale,
        messages,
        // 添加时区和格式化配置
        timeZone: 'UTC',
        // 添加错误处理配置
        onError: (error) => {
            console.error('Intl error:', error);
        },
        // 添加缺失消息的处理
        getMessageFallback: ({ key, error }) => {
            console.warn(`Missing message for key: ${key}`, error);
            return `Missing: ${key}`;
        }
    };
}); 