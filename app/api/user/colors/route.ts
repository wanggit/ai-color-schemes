import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { ApiI18nHandler } from "@/lib/api-i18n";

const prisma = new PrismaClient();
const PAGE_SIZE = 14;

export async function GET(request: NextRequest) {
    // 创建国际化处理器
    const i18n = await ApiI18nHandler.create(request);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: i18n.error("unauthorized") }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const hex = searchParams.get("hex");

    // 如果提供了hex参数，查询特定的颜色记录
    if (hex) {
        try {
            const userId = session.user.id;
            const colors = await prisma.aiColor.findMany({
                where: {
                    userId,
                    hex: hex.toLowerCase()
                },
                orderBy: {
                    updatedAt: "desc",
                },
            });

            return NextResponse.json(colors);
        } catch (error) {
            console.error(i18n.log("fetchUsersFailed"), error);
            return NextResponse.json(
                { error: i18n.error("internalServerError") },
                { status: 500 }
            );
        }
    }

    if (isNaN(page) || page < 1) {
        return NextResponse.json({ error: i18n.error("invalidPageNumber") }, { status: 400 });
    }

    try {
        const userId = session.user.id;
        const skip = (page - 1) * PAGE_SIZE;

        const [colors, total] = await prisma.$transaction([
            prisma.aiColor.findMany({
                where: { userId },
                orderBy: {
                    updatedAt: "desc",
                },
                take: PAGE_SIZE,
                skip: skip,
            }),
            prisma.aiColor.count({
                where: { userId },
            }),
        ]);

        const totalPages = Math.ceil(total / PAGE_SIZE);

        return NextResponse.json({
            data: colors,
            pagination: {
                page,
                pageSize: PAGE_SIZE,
                total,
                totalPages,
            },
        });
    } catch (error) {
        console.error(i18n.log("fetchUsersFailed"), error);
        return NextResponse.json(
            { error: i18n.error("internalServerError") },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    // 创建国际化处理器
    const i18n = await ApiI18nHandler.create(request);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: i18n.error("unauthorized") }, { status: 401 });
    }

    try {
        const { id, aiJson } = await request.json();

        if (!id || !aiJson) {
            return NextResponse.json({ error: i18n.error("invalidRequestData") }, { status: 400 });
        }

        // 验证记录所有者
        const existingRecord = await prisma.aiColor.findUnique({
            where: { id },
            select: { userId: true }
        });

        if (!existingRecord) {
            return NextResponse.json({ error: i18n.error("recordNotFound") }, { status: 404 });
        }

        if (existingRecord.userId !== session.user.id) {
            return NextResponse.json({ error: i18n.error("unauthorized") }, { status: 403 });
        }

        // 更新记录
        const updatedRecord = await prisma.aiColor.update({
            where: { id },
            data: {
                aiJson,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({ success: true, data: updatedRecord });

    } catch (error) {
        console.error(i18n.log("updateColorRecordFailed"), error);
        return NextResponse.json(
            { error: i18n.error("internalServerError") },
            { status: 500 }
        );
    }
} 