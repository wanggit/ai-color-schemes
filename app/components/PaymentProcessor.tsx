"use client";

import { PayPalButtons } from "@paypal/react-paypal-js";
import { MembershipType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from 'next-intl';
import toast from "react-hot-toast";

interface Plan {
    name: string;
    id: 'monthly' | 'annually' | 'credits';
    priceValue: number;
}

interface PaymentProcessorProps {
    plan: Plan;
    onPaymentSuccess: () => void;
    onPaymentError: () => void;
    onPaymentCancel: () => void;
}

const PaymentProcessor = ({ plan, onPaymentSuccess, onPaymentError, onPaymentCancel }: PaymentProcessorProps) => {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const t = useTranslations('components.payment');

    const getMembershipType = () => {
        if (plan.id === 'annually') return MembershipType.ANNUAL;
        if (plan.id === 'monthly') return MembershipType.MONTHLY;
        if (plan.id === 'credits') return MembershipType.CREDITS;
        throw new Error("Invalid plan ID");
    }

    const membershipType = getMembershipType();

    const createOrder = async (): Promise<string> => {
        setIsProcessing(true);
        try {
            const payload: any = { membershipType };
            if (membershipType === MembershipType.CREDITS) {
                payload.amount = String(plan.priceValue);
            }

            const res = await fetch('/api/payments/paypal/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const order = await res.json();
            if (!res.ok) {
                throw new Error(order.error || "Failed to create order");
            }
            if (order.id) {
                return order.id;
            }
            throw new Error("Could not get order ID");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || t('createOrderFailed'));
            onPaymentError();
            setIsProcessing(false);
            throw error; // Propagate error to PayPal SDK
        }
    };

    const onApprove = async (data: { orderID: string }): Promise<void> => {
        try {
            const res = await fetch('/api/payments/paypal/capture-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderID: data.orderID,
                    membershipType,
                    amount: plan.id === 'credits' ? plan.priceValue : undefined,
                }),
            });

            const result = await res.json();

            if (res.ok && result.success) {
                toast.success(plan.id === 'credits' ? t('creditsPurchaseSuccess') : t('paymentSuccess'));
                router.refresh(); // Refresh server components to get new user state
                onPaymentSuccess();
            } else {
                throw new Error(result.error || result.message || t('paymentFailed'));
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || t('paymentError'));
            onPaymentError();
        } finally {
            setIsProcessing(false);
        }
    };

    const onError = (err: any) => {
        console.error("PayPal Error:", err);
        toast.error(t('paypalError'));
        onPaymentError();
        setIsProcessing(false);
    };

    const onCancel = () => {
        toast.error(t('paymentCancelled'));
        onPaymentCancel();
        setIsProcessing(false);
    }

    return (
        <div className="mt-8">
            <h3 className="text-xl font-bold text-center text-gray-800">{t('completePayment', { planName: plan.name })}</h3>
            <p className="text-center text-gray-600 mt-2">{t('paymentInstructions')}</p>
            {isProcessing && <div className="text-center p-4">{t('processing')}</div>}
            <div style={{ display: isProcessing ? 'none' : 'block' }} className="mt-4">
                <PayPalButtons
                    style={{ layout: "vertical", label: "pay", shape: 'rect' }}
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onError}
                    onCancel={onCancel}
                    disabled={isProcessing}
                />
            </div>
        </div>
    );
};

export default PaymentProcessor; 