import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { ApiI18nHandler } from "@/lib/api-i18n";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // 创建国际化处理器
    const i18n = await ApiI18nHandler.create(request);

    // 检查管理员权限
    const session = await getServerSession();
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: i18n.error("unauthorized") }, { status: 401 });
    }

    // 获取用户ID和请求体
    const { id } = context.params;
    const body = await request.json();

    // 验证请求体
    if (body.isDisabled === undefined) {
      return NextResponse.json(
        { error: i18n.error("missingField") },
        { status: 400 }
      );
    }

    // 检查是否在修改管理员账户
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { isAdmin: true },
    });

    if (targetUser?.isAdmin) {
      return NextResponse.json(
        { error: i18n.error("cannotModifyAdmin") },
        { status: 403 }
      );
    }

    // 更新用户状态
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isDisabled: body.isDisabled },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    // 创建默认的国际化处理器以处理错误情况
    const fallbackI18n = new (await import("@/lib/api-i18n")).ApiI18nHandler('en');
    console.error(fallbackI18n.log("updateUserStatusFailed"), error);
    return NextResponse.json(
      { error: fallbackI18n.error("internalServerError") },
      { status: 500 }
    );
  }
} 