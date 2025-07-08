import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { captureOrder } from '@/lib/paypal';
import { PrismaClient, MembershipType } from '@prisma/client';

const prisma = new PrismaClient();
const TIMES_PER_ONE = Number(process.env.TIMES_PER_ONE) || 30;

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { orderID, membershipType, amount: creditAmount } = await req.json() as { orderID: string, membershipType: MembershipType, amount?: number };

        if (!orderID || !membershipType) {
            return NextResponse.json({ error: 'Missing orderID or membershipType' }, { status: 400 });
        }

        if (!Object.values(MembershipType).includes(membershipType)) {
            return NextResponse.json({ error: 'Invalid membership type' }, { status: 400 });
        }

        const captureData = await captureOrder(orderID, session.user.id);

        if (captureData.status === 'COMPLETED') {
            const purchaseUnit = captureData.purchase_units[0];
            const userIdFromOrder = purchaseUnit.custom_id;

            if (!userIdFromOrder) {
                console.error('custom_id (userId) not found in PayPal order capture data');
                return NextResponse.json({ error: 'User ID not found in transaction details.' }, { status: 400 });
            }

            const amount = purchaseUnit.payments.captures[0].amount;

            // Update user and create payment record in a transaction
            await prisma.$transaction(async (tx) => {
                if (membershipType === 'CREDITS') {
                    if (!creditAmount) {
                        throw new Error("Credit amount is required for this purchase type.")
                    }
                    const creditsPurchased = creditAmount * TIMES_PER_ONE;
                    await tx.user.update({
                        where: { id: userIdFromOrder },
                        data: {
                            credits: {
                                increment: creditsPurchased
                            }
                        }
                    });

                    await tx.payment.create({
                        data: {
                            userId: userIdFromOrder,
                            amount: parseFloat(amount.value),
                            currency: amount.currency_code,
                            provider: 'paypal',
                            providerPaymentId: captureData.id,
                            status: captureData.status,
                            purchaseType: 'credits',
                            creditsPurchased: creditsPurchased,
                        },
                    });
                } else {
                    let expiryDate = new Date();
                    let creditsToadd = 0;
                    if (membershipType === MembershipType.MONTHLY) {
                        expiryDate.setMonth(expiryDate.getMonth() + 1);
                        creditsToadd = 300;
                    } else if (membershipType === MembershipType.ANNUAL) {
                        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                        creditsToadd = 300 * 12;
                    }
                    await tx.user.update({
                        where: { id: userIdFromOrder },
                        data: {
                            membershipType: membershipType,
                            membershipExpiresAt: expiryDate,
                            lastUsageResetAt: new Date(),
                            monthlyUsageCount: 0,
                            credits: {
                                increment: creditsToadd
                            }
                        },
                    });

                    await tx.payment.create({
                        data: {
                            userId: userIdFromOrder,
                            amount: parseFloat(amount.value),
                            currency: amount.currency_code,
                            provider: 'paypal',
                            providerPaymentId: captureData.id,
                            status: captureData.status,
                            purchaseType: 'subscription',
                            membershipType: membershipType,
                        },
                    });
                }
            });

            return NextResponse.json({ success: true, message: 'Payment completed successfully.' });
        } else {
            return NextResponse.json({ success: false, message: 'Payment not completed.' }, { status: 400 });
        }

    } catch (error) {
        console.error('Failed to capture PayPal order:', error);
        // @ts-ignore
        const errorMessage = error.message || 'Failed to capture order';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 