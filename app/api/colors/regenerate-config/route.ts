import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ApiI18nHandler } from "@/lib/api-i18n";
import { authenticateAndValidateUser } from "../utils/auth";
import { findExistingColor, decrementUserCredits } from "../utils/db";
import { createTailwindConfig, createBootstrap5CustomVariables } from "../utils/ai";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const i18n = await ApiI18nHandler.create(request);

        const authResult = await authenticateAndValidateUser(prisma, i18n);
        if (authResult.error) {
            return authResult.error;
        }
        const { userId } = authResult;

        const { hex, configType, theory } = await request.json();

        console.log(i18n.log("startRegeneratingConfig", {
            hex,
            configType,
            theory
        }));

        if (!hex || typeof hex !== "string") {
            return NextResponse.json({ error: i18n.error("invalidColorValue") }, { status: 400 });
        }

        if (!configType || !["tailwind", "bootstrap"].includes(configType)) {
            return NextResponse.json({ error: i18n.error("invalidConfigType") }, { status: 400 });
        }

        if (!theory || typeof theory !== "string") {
            return NextResponse.json({ error: i18n.error("invalidTheory") }, { status: 400 });
        }

        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!hexRegex.test(hex)) {
            return NextResponse.json({ error: i18n.error("invalidColorFormat") }, { status: 400 });
        }

        // 查找现有颜色记录
        const existingColor = await findExistingColor(prisma, hex, userId);
        if (!existingColor) {
            return NextResponse.json({ error: i18n.error("colorNotFound") }, { status: 404 });
        }

        // 扣除用户积分
        await decrementUserCredits(prisma, userId, 1);

        // 解析现有的AI数据
        const aiData = JSON.parse(existingColor.aiJson);
        const schemes = aiData?.colorAnalysis?.colorSchemes || [];

        // 找到对应的配色方案
        const targetScheme = schemes.find((scheme: any) => scheme.theory === theory);
        if (!targetScheme) {
            return NextResponse.json({ error: i18n.error("schemeNotFound") }, { status: 404 });
        }

        const token = process.env.OPENAI_API_KEY;
        let newConfig = "";

        try {
            if (configType === "tailwind") {
                newConfig = await createTailwindConfig(targetScheme, token, userId, i18n);
                targetScheme.tailwindConfig = newConfig;
            } else if (configType === "bootstrap") {
                newConfig = await createBootstrap5CustomVariables(targetScheme, token, userId, i18n);
                targetScheme.bootstrap5CustomVariables = newConfig;
            }

            // 更新数据库中的AI数据
            await prisma.aiColor.update({
                where: { id: existingColor.id },
                data: {
                    aiJson: JSON.stringify(aiData),
                    updatedAt: new Date()
                }
            });

            return NextResponse.json({
                success: true,
                config: newConfig,
                configType
            });

        } catch (error) {
            console.error(i18n.log("regenerateConfigFailed"), error);
            return NextResponse.json(
                { error: i18n.error("regenerateConfigFailed") },
                { status: 500 }
            );
        }

    } catch (error) {
        const fallbackI18n = new (await import("@/lib/api-i18n")).ApiI18nHandler('en');
        console.error(fallbackI18n.log("regenerateConfigFailed"), error);
        return NextResponse.json(
            { error: fallbackI18n.error("internalServerError") },
            { status: 500 }
        );
    }
} 