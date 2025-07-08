import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        const like = await prisma.schemeLike.findUnique({
            where: { url },
        });
        return NextResponse.json({ likes: like?.likes ?? 0 });
    } catch (error) {
        console.error('Error fetching like count:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required in the request body' }, { status: 400 });
        }

        const updatedLike = await prisma.schemeLike.upsert({
            where: { url },
            update: {
                likes: {
                    increment: 1,
                },
            },
            create: {
                url,
                likes: 1,
            },
        });

        return NextResponse.json({ likes: updatedLike.likes });
    } catch (error) {
        console.error('Error updating like count:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 