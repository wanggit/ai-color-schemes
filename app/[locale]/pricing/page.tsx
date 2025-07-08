"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import GradientBackground2 from '@/app/components/GradientBackground2';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PaymentProcessor from '../../components/PaymentProcessor';

// It's good practice to define shared types. 
// This could be moved to a types/ folder if used elsewhere.
interface Plan {
    name: string;
    id: 'monthly' | 'annually' | 'credits';
    price: string;
    originalPrice?: string;
    discount?: string;
    features: string[];
    buttonText: string;
    priceValue: number;
}

const PricingPage = () => {
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [creditAmount, setCreditAmount] = useState<number>(1);
    const { data: session, status } = useSession();
    const router = useRouter();
    const t = useTranslations('pricing');
    const tCommon = useTranslations('common');
    const params = useParams();
    const locale = params.locale as string;

    const plans: Plan[] = [
        {
            name: t('monthly.name'),
            id: 'monthly',
            price: `$${process.env.NEXT_PUBLIC_MONTHLY_AMOUNT}${t('monthly.price')}`,
            features: t.raw('monthly.features') as string[],
            buttonText: t('monthly.button'),
            priceValue: Number(process.env.NEXT_PUBLIC_MONTHLY_AMOUNT),
        },
        {
            name: t('annually.name'),
            id: 'annually',
            price: `$${(Number(process.env.NEXT_PUBLIC_ANNUAL_AMOUNT) / 12).toFixed(2)}${t('annually.price')}`,
            originalPrice: `$${process.env.NEXT_PUBLIC_ANNUAL_AMOUNT}${t('annually.originalPrice')}`,
            discount: t('annually.discount'),
            features: t.raw('annually.features') as string[],
            buttonText: t('annually.button'),
            priceValue: Number(process.env.NEXT_PUBLIC_ANNUAL_AMOUNT),
        },
    ];

    const handleSelectPlan = (plan: Plan) => {
        if (status === 'unauthenticated') {
            router.push(`/${locale}/login?callbackUrl=/${locale}/pricing`);
            return;
        }
        setSelectedPlan(plan);
    };

    const handlePurchaseCredits = () => {
        if (status === 'unauthenticated') {
            router.push(`/${locale}/login?callbackUrl=/${locale}/pricing`);
            return;
        }

        if (creditAmount > 0) {
            const creditPlan: Plan = {
                name: t('credits.title'),
                id: 'credits',
                price: `$${creditAmount}`,
                features: [t('credits.purchaseText', { times: creditAmount * (Number(process.env.NEXT_PUBLIC_TIMES_PER_ONE || '30')) })],
                buttonText: t('credits.button'),
                priceValue: creditAmount
            };
            setSelectedPlan(creditPlan);
        }
    };

    const resetSelection = () => {
        setSelectedPlan(null);
    }

    if (selectedPlan) {
        return (
            <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
                <GradientBackground2 />
                {/* <UserAvatar /> */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative bg-white rounded-2xl shadow-lg p-8 max-w-md w-full z-10"
                >
                    <button onClick={resetSelection} className="absolute top-4 left-4 text-gray-500 hover:text-gray-800">
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <PaymentProcessor
                        plan={selectedPlan}
                        onPaymentSuccess={resetSelection}
                        onPaymentError={resetSelection}
                        onPaymentCancel={resetSelection}
                    />
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden pt-8">
            <GradientBackground2 />
            {/* <UserAvatar /> */}

            <div className="container mx-auto px-4 py-16 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">{t('title')}</h1>
                    <p className="mt-4 text-lg text-gray-600">{t('subtitle')}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex justify-center items-center"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative bg-white rounded-2xl shadow-lg p-8 transform transition-transform duration-300 hover:scale-105 ${plan.id === 'annually' ? 'border-4 border-blue-500 shadow-blue-200' : 'border'
                                    }`}
                            >
                                {plan.id === 'annually' && (
                                    <div className="absolute top-0 -translate-y-1/2 bg-blue-500 text-white font-semibold px-4 py-1 rounded-full shadow-md">
                                        {plan.discount}
                                    </div>
                                )}
                                <h2 className="text-2xl font-bold text-gray-800">{plan.name}</h2>
                                <div className="mt-4">
                                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                                    {plan.originalPrice && <span className="text-gray-500 ml-2">{plan.originalPrice}</span>}
                                </div>
                                <p className="mt-2 text-sm text-gray-500">{t('note', { count: Number(process.env.NEXT_PUBLIC_TIMES_PER_ONE || '30') })}</p>
                                <ul className="mt-8 space-y-4">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-center">
                                            <CheckCircleIcon className="h-6 w-6 text-blue-500 mr-3" />
                                            <span className="text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => handleSelectPlan(plan)}
                                    disabled={status === 'loading'}
                                    className={`mt-8 w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors duration-300 ${plan.id === 'annually' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-800 hover:bg-gray-900'
                                        } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                                >
                                    {status === 'loading' ? tCommon('loading') : plan.buttonText}
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-center mt-12"
                >
                    <div className="inline-block bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-800">{t('credits.title')}</h2>
                        <p className="mt-2 text-gray-600">
                            {t('credits.description', { count: Number(process.env.NEXT_PUBLIC_TIMES_PER_ONE || '30') })}
                        </p>
                        <div className="mt-4 flex items-center">
                            <span className="text-gray-500 mr-2">$</span>
                            <input
                                type="number"
                                min="1"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(Number(e.target.value))}
                                placeholder={t('credits.placeholder')}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <button
                            onClick={handlePurchaseCredits}
                            disabled={status === 'loading' || creditAmount <= 0}
                            className="mt-4 w-full py-3 px-6 rounded-lg font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? tCommon('loading') : t('credits.buyNow')}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PricingPage; 