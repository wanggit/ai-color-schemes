import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ApiI18nHandler } from "@/lib/api-i18n";
import { authenticateAndValidateUser } from "./utils/auth";
import { findExistingColor, saveColorGeneration, decrementUserCredits } from "./utils/db";
import { generateColorResponseWithProgress } from "./utils/stream";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const i18n = await ApiI18nHandler.create(request);

    const authResult = await authenticateAndValidateUser(prisma, i18n);
    if (authResult.error) {
      return authResult.error;
    }
    const { userId } = authResult;

    const { hex, regenerate } = await request.json();
    console.log(i18n.log("startGenerating", {
      hex,
      regenerate: regenerate ? i18n.log("forceRegenerate") : ""
    }));

    if (!hex || typeof hex !== "string") {
      return NextResponse.json({ error: i18n.error("invalidColorValue") }, { status: 400 });
    }

    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(hex)) {
      return NextResponse.json({ error: i18n.error("invalidColorFormat") }, { status: 400 });
    }

    if (!regenerate) {
      const existingColor = await findExistingColor(prisma, hex, userId);
      if (existingColor) {
        // await decrementUserCredits(prisma, userId);
        return NextResponse.json(JSON.parse(existingColor.aiJson));
      }
    }

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    generateColorResponseWithProgress(hex, writer, userId, i18n, prisma)
      .then(async (responseData) => {
        try {
          if (responseData) {
            await saveColorGeneration(prisma, hex, userId, responseData);
          }
        } catch (dbError) {
          console.error(i18n.log("savingToDatabase"), dbError);
        }
      })
      .catch(error => {
        console.error(i18n.log("generateColorFailed"), error);
      });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    const fallbackI18n = new (await import("@/lib/api-i18n")).ApiI18nHandler('en');
    console.error(fallbackI18n.log("generateColorFailed"), error);
    return NextResponse.json(
      { error: fallbackI18n.error("internalServerError") },
      { status: 500 }
    );
  }
}





