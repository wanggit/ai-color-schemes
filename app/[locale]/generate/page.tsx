import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import GenerateClient from '@/app/components/GenerateClient';

type Props = {
    params: { locale: string };
};

// 为Generate页面生成独立的、国际化的元数据
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'generate_page' });

    return {
        title: t('seo_title'),
        description: t('seo_description'),
    };
}

// 这是服务器组件
export default async function GeneratePage({ params }: Props) {
    const { locale } = await params;

    // 加载翻译
    const t = await getTranslations({ locale, namespace: 'generate_page' });

    return (
        <div className="container mx-auto px-4 py-8 mt-16">
            <h1 className="text-4xl font-bold text-center mb-4 relative z-20 text-gray-900 dark:text-gray-100">{t('h1')}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-2xl mx-auto mb-8 relative z-20">
                {t('intro')}
            </p>
            {/* 渲染负责所有交互的客户端组件 */}
            {/* Suspense用于处理客户端组件的懒加载或数据获取 */}
            <Suspense fallback={<div className="text-center p-8">Loading Interactive UI...</div>}>
                <GenerateClient />
            </Suspense>
        </div>
    );
} 