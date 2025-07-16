import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ApiI18nHandler } from "@/lib/api-i18n";

const prisma = new PrismaClient();
const PAGE_SIZE = 14;

export async function GET(request: NextRequest) {
    // 创建国际化处理器
    const i18n = await ApiI18nHandler.create(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const hex = searchParams.get("hex");

    // 如果提供了hex参数，查询特定的颜色记录
    if (hex) {
        try {
            const colors = await prisma.aiColor.findMany({
                where: {
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
        const skip = (page - 1) * PAGE_SIZE;

        const [colors, total] = await prisma.$transaction([
            prisma.aiColor.findMany({
                orderBy: {
                    updatedAt: "desc",
                },
                take: PAGE_SIZE,
                skip: skip,
            }),
            prisma.aiColor.count(),
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