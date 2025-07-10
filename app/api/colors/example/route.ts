import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { ApiI18nHandler } from "@/lib/api-i18n";
import { requestAiColorScheme } from "../utils/ai";
import { put } from "@vercel/blob";
import { authenticateAndValidateUser } from "../utils/auth";
import { decrementUserCredits } from "../utils/db";


const prisma = new PrismaClient();

type ColorScheme = {
  theory: string;
  colors: string[];
  description: string;
  uiApplication: string;
  strengths: string;
  recommendedRatio: string;
  bestFor: string;
  exampleUrl?: string;
};

export async function POST(request: NextRequest) {
  try {
    // 创建国际化处理器
    const i18n = await ApiI18nHandler.create(request);

    // 验证用户并检查余额
    const authResult = await authenticateAndValidateUser(prisma, i18n);
    if (authResult.error) {
      return authResult.error;
    }
    const { userId } = authResult;

    // 获取请求参数
    const { scheme, hex, regenerate = false } = await request.json();
    console.log(`🎨 收到生成示例请求 - 用户: ${userId}, 颜色: ${hex}, 配色方案: ${scheme?.theory}, 重新生成: ${regenerate}`);

    if (!scheme || !hex) {
      console.error('❌ 缺少必要参数:', { scheme: !!scheme, hex: !!hex });
      return NextResponse.json({ error: i18n.error("missingParameters") }, { status: 400 });
    }

    const token = process.env.OPENAI_API_KEY;
    const schemeKey = getSchemeKey(scheme.theory);
    console.log(`🔑 配色方案键: ${schemeKey}`);

    // 检查是否已有示例HTML，且不是请求重新生成
    if (!regenerate) {
      console.log('🔍 检查现有示例...');
      const existingColor = await prisma.aiColor.findFirst({
        where: {
          hex: hex.toLowerCase(),
          userId
        }
      });

      if (existingColor && existingColor[schemeKey as keyof typeof existingColor]) {
        const existingUrl = existingColor[schemeKey as keyof typeof existingColor] as string;
        console.log(`✅ 找到现有示例，直接返回: ${existingUrl}`);
        // 如果已存在此配色方案的示例，直接返回
        return NextResponse.json({
          url: existingUrl
        });
      } else {
        console.log('🚫 未找到现有示例，需要生成新的');
      }
    } else {
      console.log('🔄 强制重新生成示例');
    }

    // 生成HTML示例
    console.log('🤖 开始生成HTML示例...');
    const html = await generateHtmlExample(scheme, token, i18n);
    if (html === "error") {
      console.error('❌ HTML生成失败');
      return NextResponse.json({ error: i18n.error("generateFailed") }, { status: 500 });
    }
    console.log(`✅ HTML生成成功，长度: ${html.length} 字符`);

    // 上传HTML到存储
    const cleanHex = hex.startsWith('#') ? hex.substring(1) : hex;
    const theoryFileName = scheme.theory.toLowerCase().replace(/ /g, '-');
    const timestamp = Date.now();
    const htmlFilename = `${theoryFileName}-${userId}-${timestamp}.html`;
    const htmlPath = `${cleanHex}/${htmlFilename}`;
    console.log(`📁 HTML上传路径: ${htmlPath}`);
    console.log('☁️ 开始上传HTML到云存储...');
    console.log(`☁️ 开始上传到云存储 - 路径: ai-colors-examples/${htmlPath}`);
    const { url } = await put(
      `ai-colors-examples/${htmlPath}`,
      html,
      {
        access: 'public',
        contentType: 'text/html; charset=utf-8',
        addRandomSuffix: false,
        allowOverwrite: true
      }
    );
    console.log(`✅ HTML上传成功，URL: ${url}`);



    // 更新数据库
    console.log('💾 开始更新数据库...');
    try {
      // 先查找是否存在记录
      const existingRecord = await prisma.aiColor.findFirst({
        where: {
          hex: hex.toLowerCase(),
          userId
        }
      });

      if (existingRecord) {
        console.log(`📝 更新现有记录 ID: ${existingRecord.id}`);

        // 解析现有的aiJson数据
        let existingAiJson;
        try {
          existingAiJson = JSON.parse(existingRecord.aiJson);
        } catch (error) {
          console.error('❌ 解析现有aiJson失败:', error);
          // 如果解析失败，创建一个基本的结构
          existingAiJson = {
            colorAnalysis: {
              hexValue: hex,
              colorSchemes: []
            }
          };
        }

        // 找到要更新的配色方案，如果不存在则添加
        const schemes = existingAiJson.colorAnalysis.colorSchemes || [];
        const existingSchemeIndex = schemes.findIndex((s: ColorScheme) => s.theory === scheme.theory);

        if (existingSchemeIndex >= 0) {
          // 更新现有配色方案的所有信息
          schemes[existingSchemeIndex] = {
            ...schemes[existingSchemeIndex],
            ...scheme,
            // 确保保留原有的exampleUrl（如果有的话）
            exampleUrl: url
          };
          console.log(`🔄 更新现有配色方案: ${scheme.theory}`);
        } else {
          // 添加新的配色方案
          schemes.push({
            ...scheme,
            exampleUrl: url
          });
          console.log(`➕ 添加新的配色方案: ${scheme.theory}`);
        }

        // 更新aiJson数据
        existingAiJson.colorAnalysis.colorSchemes = schemes;
        const updatedAiJsonString = JSON.stringify(existingAiJson);

        // 更新数据库记录，包括aiJson和示例URL
        await prisma.aiColor.update({
          where: { id: existingRecord.id },
          data: {
            [schemeKey]: url,
            aiJson: updatedAiJsonString,
            updatedAt: new Date()
          }
        });
        console.log('✅ 数据库记录更新成功，包括aiJson和示例URL');
      } else {
        console.log('📝 创建新的数据库记录');
        // 如果不存在记录，创建一个新的(只包含这个示例URL的记录)
        const aiJsonContent = JSON.stringify({
          colorAnalysis: {
            hexValue: hex,
            colorSchemes: [scheme]
          }
        });

        const newRecord = await prisma.aiColor.create({
          data: {
            hex: hex.toLowerCase(),
            userId,
            aiJson: aiJsonContent,
            [schemeKey]: url
          }
        });
        console.log(`✅ 新记录创建成功 ID: ${newRecord.id}`);
      }
    } catch (error) {
      console.error('❌ 数据库更新失败:', error);
      console.error(i18n.log("updateFailed"), error);
      throw error;
    }

    console.log('💳 扣除用户积分...');
    await decrementUserCredits(prisma, userId);
    console.log('✅ 积分扣除成功');

    console.log(`🎉 示例生成完成，返回URL: ${url}`);
    return NextResponse.json({ url });
  } catch (error) {
    // 创建默认的国际化处理器以处理错误情况
    const fallbackI18n = new (await import("@/lib/api-i18n")).ApiI18nHandler('en');
    console.error(fallbackI18n.log("generateColorFailed"), error);
    return NextResponse.json(
      { error: fallbackI18n.error("internalServerError") },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 1;

    const whereClause = {
      OR: [
        { exampleComp: { not: null } },
        { exampleAnal: { not: null } },
        { exampleTria: { not: null } },
        { exampleMono: { not: null } },
        { exampleSpCo: { not: null } },
      ],
    };

    const colors = await prisma.aiColor.findMany({
      where: whereClause,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        updatedAt: "desc",
      },
    });

    const total = await prisma.aiColor.count({
      where: whereClause,
    });

    if (colors.length === 0) {
      return NextResponse.json({ data: null, total, schemes: [] });
    }

    const color = colors[0];
    const aiJson = JSON.parse(color.aiJson);

    // Get all schemes from aiJson and attach the corresponding URL and preview URL
    const schemes = (aiJson.colorAnalysis.colorSchemes || [])
      .map((s: ColorScheme) => {
        const key = getSchemeKey(s.theory) as keyof typeof color;
        const previewKey = getPreviewKey(s.theory) as keyof typeof color;
        const url = color[key];
        const previewUrl = color[previewKey];
        return { ...s, url, previewUrl };
      })
      .filter((s: { url: any; }) => s.url); // Only return schemes that have a URL

    const responseData = {
      id: color.id,
      hex: color.hex,
      schemes,
      total,
      currentPage: page,
    };

    return NextResponse.json(responseData);

  } catch (error) {
    const i18n = await ApiI18nHandler.create(request);
    console.error(i18n.log("fetchColorFailed"), error);
    return NextResponse.json(
      { error: i18n.error("internalServerError") },
      { status: 500 }
    );
  }
}

// 获取配色方案对应的字段名
function getSchemeKey(theory: string): string {
  switch (theory) {
    case "Complementary": return "exampleComp";
    case "Analogous": return "exampleAnal";
    case "Triadic": return "exampleTria";
    case "Monochromatic": return "exampleMono";
    case "Split-Complementary": return "exampleSpCo";
    default: return `example${theory.replace(/[^a-zA-Z0-9]/g, "")}`;
  }
}

// 获取预览图片对应的字段名
function getPreviewKey(theory: string): string {
  switch (theory) {
    case "Complementary": return "previewComp";
    case "Analogous": return "previewAnal";
    case "Triadic": return "previewTria";
    case "Monochromatic": return "previewMono";
    case "Split-Complementary": return "previewSpCo";
    default: return `preview${theory.replace(/[^a-zA-Z0-9]/g, "")}`;
  }
}

// 生成HTML示例
async function generateHtmlExample(scheme: ColorScheme, token: string | undefined, i18n: ApiI18nHandler): Promise<string> {
  // 这里模拟调用AI生成HTML
  // 实际应用中，这里应该调用真实的AI服务，使用提示词生成HTML
  try {
    console.log(`🤖 调用AI生成HTML - 配色方案: ${scheme.theory}`);
    console.log(`🎨 配色方案详情:`, {
      colors: scheme.colors,
      description: scheme.description?.substring(0, 100) + '...'
    });

    let colorSchemeHtml = await requestAiColorScheme(scheme, token || '');
    if (colorSchemeHtml === "error") {
      console.log(`⚠️ 第一次生成失败，重试 - 配色方案: ${scheme.theory}`);
      console.log(i18n.log("schemeRetry", { theory: scheme.theory }));
      // 重试一次
      colorSchemeHtml = await requestAiColorScheme(scheme, token || '');
      if (colorSchemeHtml === "error") {
        console.error(`❌ 重试后仍然失败 - 配色方案: ${scheme.theory}`);
        console.log("Failed to create AI color example after retry:", scheme.theory);
        throw new Error(i18n.log("createExampleGeneralFailed", { theory: scheme.theory }));
      } else {
        console.log(`✅ 重试成功 - 配色方案: ${scheme.theory}`);
      }
    } else {
      console.log(`✅ 第一次生成成功 - 配色方案: ${scheme.theory}, HTML长度: ${colorSchemeHtml.length}`);
    }
    return colorSchemeHtml;
  } catch (error) {
    console.error(`❌ HTML生成异常 - 配色方案: ${scheme?.theory || 'unknown'}:`, error);
    console.error(i18n.log("createExampleGeneralFailed", { theory: scheme?.theory || 'unknown' }), error);
    return "error";
  }
}

// End of file. 