import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ApiI18nHandler } from "@/lib/api-i18n";
import { getUser } from "./db";

export async function authenticateAndValidateUser(
    prisma: PrismaClient,
    i18n: ApiI18nHandler
) {
    const session = await getServerSession();
    if (!session?.user) {
        return { error: NextResponse.json({ error: i18n.error("unauthorized") }, { status: 401 }) };
    }

    const userId = (session.user as any).id;
    const userEmail = (session.user as any).email;

    if (!userId && !userEmail) {
        return { error: NextResponse.json({ error: i18n.error("invalidUser") }, { status: 400 }) };
    }

    const user = await getUser(prisma, userId, userEmail);

    if (!user) {
        return { error: NextResponse.json({ error: i18n.error("userNotFound") }, { status: 404 }) };
    }

    if (user.isDisabled) {
        return { error: NextResponse.json({ error: i18n.error("accountDisabled") }, { status: 403 }) };
    }

    if ((user.credits || 0) <= 0) {
        return { error: NextResponse.json({ error: i18n.error("insufficientCredits") }, { status: 403 }) };
    }

    const actualUserId = user.id || userId;
    if (!actualUserId) {
        // This case should ideally not be reached if validation is correct
        return { error: NextResponse.json({ error: i18n.error("invalidUser") }, { status: 400 }) };
    }


    return { user, userId: actualUserId };
} 