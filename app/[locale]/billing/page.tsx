import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import BillingHistory from '@/app/components/BillingHistory';
import GradientBackground from '@/app/components/GradientBackground';
import { Suspense } from 'react';

type Props = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'pages.billing' });

    return {
        title: `${t('title')} - AI Colors`,
        description: '查看您的账单和支付历史记录。',
    };
}

export default async function BillingPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'pages.billing' });

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50 pt-14">
            <GradientBackground />
            {/* <UserAvatar /> */}
            <div className="container mx-auto py-10 px-4 relative z-10">
                <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">{t('title')}</h1>
                <Suspense fallback={<div className="text-center">Loading...</div>}>
                    <BillingHistory />
                </Suspense>
            </div>
        </div>
    );
} 