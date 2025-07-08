import { NextRequest, NextResponse } from "next/server";
import { ApiI18nHandler } from "@/lib/api-i18n";

export async function GET(request: NextRequest) {
    try {
        // 创建国际化处理器
        const i18n = await ApiI18nHandler.create(request);

        // 获取URL参数
        const url = request.nextUrl.searchParams.get('url');

        if (!url) {
            return NextResponse.json({ error: i18n.error("missingParameters") }, { status: 400 });
        }

        // 验证URL是否是有效的Vercel Blob URL
        if (!url.includes('vercel-storage.com') && !url.startsWith('https://') && process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: i18n.error("invalidColorValue") }, { status: 400 });
        }

        // 获取HTML内容
        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json(
                { error: i18n.log("aiRequestFailed", { status: response.status, error: "Failed to fetch content" }) },
                { status: response.status }
            );
        }

        // 获取HTML内容
        const html = await response.text();

        // 返回HTML内容，设置正确的Content-Type，并确保不会被作为附件下载
        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': 'inline',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'SAMEORIGIN'
            }
        });
    } catch (error) {
        // 创建默认的国际化处理器以处理错误情况
        const fallbackI18n = new (await import("@/lib/api-i18n")).ApiI18nHandler('en');
        console.error(fallbackI18n.log('previewProxyError'), error);
        return NextResponse.json(
            { error: fallbackI18n.error("internalServerError") },
            { status: 500 }
        );
    }
}

// 设置动态配置，确保边缘函数不缓存结果
export const dynamic = 'force-dynamic'; 