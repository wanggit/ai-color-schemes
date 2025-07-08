import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
    locales,
    defaultLocale
});

export const config = {
    // 匹配所有路径，除了api、_next、静态文件等
    matcher: [
        // 匹配所有路径除了特定的排除项
        '/((?!api|_next|_vercel|.*\\..*).*)'
    ]
}; 