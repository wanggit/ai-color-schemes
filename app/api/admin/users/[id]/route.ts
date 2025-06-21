import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // 检查管理员权限
    const session = await getServerSession();
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 获取用户ID和请求体
    const { id } = context.params;
    const body = await request.json();

    // 验证请求体
    if (body.isDisabled === undefined) {
      return NextResponse.json(
        { error: "Missing isDisabled field" },
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
        { error: "Cannot modify admin user" },
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
    console.error("更新用户状态失败:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 