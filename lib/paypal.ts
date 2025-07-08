import { MembershipType } from '@prisma/client';

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE, MONTHLY_AMOUNT, ANNUAL_AMOUNT } = process.env;

// 1. Get an access token
async function getAccessToken() {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        throw new Error('PayPal client ID or secret is not configured in .env.local');
    }
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

    console.log("Attempting to get PayPal access token...");
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to get access token. Status:", response.status);
        console.error("Response body:", errorBody);
        throw new Error(`Failed to get PayPal access token. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Successfully obtained PayPal access token.");
    return data.access_token;
}

// 2. Create an order
export async function createOrder(membershipType: MembershipType, userId?: string, amount?: string) {
    console.log(`Creating order for membership: ${membershipType}, User: ${userId || 'Unknown'}`);
    const accessToken = await getAccessToken();

    let orderAmount;
    let description;

    if (membershipType === 'MONTHLY') {
        orderAmount = MONTHLY_AMOUNT;
        description = 'AI Colors - Monthly Membership';
    } else if (membershipType === 'ANNUAL') {
        orderAmount = ANNUAL_AMOUNT;
        description = 'AI Colors - Annual Membership';
    } else if (membershipType === 'CREDITS') {
        if (!amount) {
            throw new Error('Amount is required for CREDITS purchase.');
        }
        orderAmount = amount;
        description = `AI Colors - Purchase Credits`;
    } else {
        throw new Error('Invalid membership type for order creation.');
    }

    const url = `${PAYPAL_API_BASE}/v2/checkout/orders`;
    const payload = {
        intent: 'CAPTURE',
        purchase_units: [
            {
                amount: {
                    currency_code: 'USD',
                    value: orderAmount,
                },
                description: description,
                custom_id: userId,
            },
        ],
        application_context: {
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/generate?payment_success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?payment_canceled=true`,
            brand_name: 'AI Colors',
            user_action: 'PAY_NOW',
        },
    };

    console.log(`Calling PayPal API to create order for User: ${userId || 'Unknown'}`);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'PayPal-Request-Id': `create-order-${userId}-${Date.now()}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("PayPal API Error creating order. Status:", response.status);
        console.error("Response body:", errorBody);
        throw new Error(`Failed to create PayPal order. Status: ${response.status}`);
    }

    console.log(`Successfully initiated order creation for User: ${userId || 'Unknown'}`);
    return response.json();
}

// 3. Capture an order
export async function captureOrder(orderId: string, userId?: string) {
    console.log(`Capturing order: ${orderId} for User: ${userId || 'Unknown'}`);
    const accessToken = await getAccessToken();
    const url = `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'PayPal-Request-Id': `capture-order-${userId}-${Date.now()}`,
            'Prefer': 'return=representation',
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("PayPal API Error capturing order. Status:", response.status);
        console.error("Response body:", errorBody);
        throw new Error(`Failed to capture PayPal order. Status: ${response.status}`);
    }

    console.log(`Successfully captured order: ${orderId} for User: ${userId || 'Unknown'}`);
    return response.json();
} 