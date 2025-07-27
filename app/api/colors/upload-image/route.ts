import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename || !request.body) {
        return NextResponse.json({ message: 'No filename or image data provided.' }, { status: 400 });
    }

    try {
        const blob = await put(filename, request.body, {
            access: 'public',
            // Add a cache control header to ensure the image is cached for a reasonable time
            cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 year
        });

        return NextResponse.json(blob);
    } catch (error: any) {
        console.error('Error uploading to Vercel Blob:', error);
        return NextResponse.json({ message: 'Failed to upload image', error: error.message }, { status: 500 });
    }
} 