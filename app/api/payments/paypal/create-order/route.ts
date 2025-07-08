import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createOrder } from '@/lib/paypal';
import { MembershipType } from '@prisma/client';

export async function POST(req: Request) {
    console.log("Entering /api/payments/paypal/create-order endpoint");
    const session = await getServerSession(authOptions);

    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
        console.error("Unauthorized: No session or user ID found. Session object:", session);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Session validated for user ID: ${userId}`);

    try {
        const { membershipType, amount } = await req.json() as { membershipType: MembershipType, amount?: string };
        console.log(`Request received for membershipType: ${membershipType}`);

        if (!Object.values(MembershipType).includes(membershipType)) {
            console.error(`Invalid membership type: ${membershipType}`);
            return NextResponse.json({ error: 'Invalid membership type' }, { status: 400 });
        }

        if (membershipType === MembershipType.CREDITS && !amount) {
            return NextResponse.json({ error: 'Amount is required for credits purchase' }, { status: 400 });
        }

        console.log("Calling createOrder from lib/paypal");
        const paypalOrder = await createOrder(membershipType, userId, amount);
        console.log("Successfully created PayPal order, sending back to client.");
        return NextResponse.json(paypalOrder);

    } catch (error) {
        console.error('Failed to create PayPal order in route:', error);
        // @ts-ignore
        const errorMessage = error.message || 'Failed to create order';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 