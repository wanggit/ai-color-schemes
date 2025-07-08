import Link from 'next/link';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
    // 获取请求头来确定用户偏好的语言
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language') || '';

    // 简单的语言检测
    let preferredLocale = 'zh'; // 默认中文
    if (acceptLanguage.includes('en')) {
        preferredLocale = 'en';
    } else if (acceptLanguage.includes('ja')) {
        preferredLocale = 'ja';
    } else if (acceptLanguage.includes('ko')) {
        preferredLocale = 'ko';
    } else if (acceptLanguage.includes('de')) {
        preferredLocale = 'de';
    }

    const t = await getTranslations({ locale: preferredLocale, namespace: 'pages.notFound' });

    return (
        <html lang={preferredLocale}>
            <head>
                <title>{t('title')}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body>
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                            {t('heading')}
                        </h2>
                        <p className="text-gray-600 mb-8">
                            {t('message')}
                        </p>
                        <Link
                            href={`/${preferredLocale}`}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {t('backHome')}
                        </Link>
                    </div>
                </div>
            </body>
        </html>
    );
} 