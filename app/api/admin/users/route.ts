import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { ApiI18nHandler } from "@/lib/api-i18n";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // 创建国际化处理器
    const i18n = await ApiI18nHandler.create(request);

    // 检查管理员权限
    const session = await getServerSession();
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: i18n.error("unauthorized") }, { status: 401 });
    }

    // 获取分页参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const skip = (page - 1) * limit;

    // 获取用户列表和总数
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({ users, total });
  } catch (error) {
    // 创建默认的国际化处理器以处理错误情况
    const fallbackI18n = new (await import("@/lib/api-i18n")).ApiI18nHandler('en');
    console.error(fallbackI18n.log("fetchUsersListFailed"), error);
    return NextResponse.json(
      { error: fallbackI18n.error("internalServerError") },
      { status: 500 }
    );
  }
} 