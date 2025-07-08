import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import Analytics from "../components/Analytics";
import Header from '../components/Header';
import "../globals.css";
import { Providers } from "../providers";
import { Suspense } from 'react';

// A utility function to pick properties from an object
function pick(obj: any, keys: string[]) {
    return keys.reduce((acc, key) => {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            acc[key] = obj[key];
        }
        return acc;
    }, {} as any);
}

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

interface GenerateMetadataProps {
    params: Promise<{ locale: string }>;
}

// 动态生成元数据的函数
export async function generateMetadata({ params }: GenerateMetadataProps): Promise<Metadata> {
    const { locale } = await params;
    const messages = await getMessages({ locale });
    const seoMessages = messages.seo as { title: string, description: string };

    return {
        metadataBase: new URL('https://aicolors.im'),
        title: {
            default: seoMessages.title,
            template: `%s | AI Colors`
        },
        description: seoMessages.description,
        keywords: [
            "ai color", "ai colors", "ai color schemes", "color palette generator",
            "color scheme generator", "ai color palette", "color generator", "design tools",
            "ui color schemes", "web design colors", "AI配色", "AI颜色生成器",
            "AI配色方案生成器", "配色板生成器", "设计工具", "网页设计配色"
        ],
        authors: [{ name: "AI Colors" }],
        creator: "AI Colors",
        publisher: "AI Colors",
        formatDetection: {
            email: false,
            address: false,
            telephone: false,
        },
        openGraph: {
            type: "website",
            locale: locale === 'zh' ? 'zh_CN' : (locale === 'zh-TW' ? 'zh_TW' : `${locale}_${locale.toUpperCase()}`),
            alternateLocale: locales.filter(l => l !== locale).map(l => l === 'zh' ? 'zh_CN' : (l === 'zh-TW' ? 'zh_TW' : `${l}_${l.toUpperCase()}`)),
            url: "https://aicolors.im",
            siteName: "AI Colors",
            title: seoMessages.title,
            description: seoMessages.description,
            images: [
                {
                    url: "/logo-512.png",
                    width: 512,
                    height: 512,
                    alt: "AI Colors Logo",
                },
                {
                    url: "/logo-with-text.png",
                    width: 1200,
                    height: 630,
                    alt: "AI Colors - Create stunning color palettes with AI",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            site: "@aicolors",
            creator: "@aicolors",
            title: seoMessages.title,
            description: seoMessages.description,
            images: ["/logo-with-text.png"],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        verification: {
            google: "G-CCSHGGWTQ2",
        },
        category: "Design Tools",
        classification: "Design and Development Tools",
        icons: {
            icon: [
                { url: '/favicon.svg', type: 'image/svg+xml' },
                { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
                { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
            ],
            shortcut: '/favicon.svg',
            apple: [
                { url: '/favicon-64.png', sizes: '64x64', type: 'image/png' },
            ],
        },
        manifest: '/manifest.webmanifest',
        other: {
            'msapplication-TileImage': '/favicon-64.png',
            'msapplication-TileColor': '#132c33',
            'theme-color': '#132c33',
        },
    };
}

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    // 验证语言是否支持
    if (!locales.includes(locale as any)) {
        notFound();
    }

    // 获取对应语言的消息
    const messages = await getMessages({ locale });

    // 结构化数据
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "AI Color Scheme Generator",
        "alternateName": "AI配色方案生成器",
        "description": "Professional AI-powered color palette generator for designers and developers. Create stunning color schemes instantly.",
        "url": "https://aicolors.im",
        "applicationCategory": "DesignApplication",
        "operatingSystem": "Web Browser",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
        },
        "creator": {
            "@type": "Organization",
            "name": "AI Color Scheme Generator"
        },
        "featureList": [
            "AI-powered color generation",
            "Multiple color scheme types",
            "Professional design tools",
            "CSS and HTML export",
            "Real-time preview"
        ],
        "screenshot": "https://aicolors.im/logo-with-text.png",
        "softwareVersion": "1.0.0",
        "datePublished": "2024-01-01",
        "dateModified": new Date().toISOString(),
        "inLanguage": ["en", "zh-CN"],
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "150"
        }
    };

    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                {/* 结构化数据 */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(structuredData),
                    }}
                />

                {/* Additional SEO Meta Tags */}
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="AI Colors" />

                {/* Language alternatives */}
                <link rel="alternate" hrefLang="en" href="https://aicolors.im/en" />
                <link rel="alternate" hrefLang="zh" href="https://aicolors.im/zh" />
                <link rel="alternate" hrefLang="zh-TW" href="https://aicolors.im/zh-tw" />
                <link rel="alternate" hrefLang="ja" href="https://aicolors.im/ja" />
                <link rel="alternate" hrefLang="ko" href="https://aicolors.im/ko" />
                <link rel="alternate" hrefLang="de" href="https://aicolors.im/de" />
                <link rel="alternate" hrefLang="x-default" href="https://aicolors.im/zh" />

                {/* Preconnect to external domains */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

                {/* Canonical URL */}
                <link rel="canonical" href="https://aicolors.im" />

                {/* Favicon and Icons */}
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
                <link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png" />
                <link rel="apple-touch-icon" href="/favicon-64.png" />

                {/* DNS Prefetch for better performance */}
                <link rel="dns-prefetch" href="//fonts.googleapis.com" />
                <link rel="dns-prefetch" href="//www.google-analytics.com" />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <NextIntlClientProvider messages={pick(messages, ['HomePage', 'generatePage', 'examplePage', 'common', 'header', 'auth', 'components', 'login', 'pricing', 'mySchemes', 'schemeInfo', 'pages'])}>
                    <Suspense fallback={null}>
                        <Analytics />
                    </Suspense>
                    <Providers>
                        <Header />
                        <main className="min-h-screen overflow-hidden">
                            {children}
                        </main>
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
} 