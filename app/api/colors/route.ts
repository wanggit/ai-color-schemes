import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { Readable } from "stream";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // 获取会话信息
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // 检查用户是否被禁用
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isDisabled: true, isMember: true, usageCount: true, memberExpireDate: true }
    });

    if (user?.isDisabled) {
      return NextResponse.json({ error: "账号已被禁用" }, { status: 403 });
    }

    // 检查非会员用户使用次数是否超过5次
    const isMember = user?.isMember || false;
    const memberExpireDate = user?.memberExpireDate;
    const currentDate = new Date();
    const isValidMember = isMember && memberExpireDate && new Date(memberExpireDate) > currentDate;

    if (!isValidMember && (user?.usageCount || 0) >= 5) {
      return NextResponse.json({ error: "已达到免费使用次数上限" }, { status: 403 });
    }

    // 获取请求参数
    const { hex } = await request.json();
    if (!hex || typeof hex !== "string") {
      return NextResponse.json({ error: "无效的颜色值" }, { status: 400 });
    }

    // 检查hex格式
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(hex)) {
      return NextResponse.json({ error: "颜色值格式不正确" }, { status: 400 });
    }

    // 检查颜色是否已存在
    const existingColor = await prisma.aiColor.findFirst({
      where: { hex: hex.toLowerCase() }
    });

    if (existingColor) {
      // 更新使用次数
      if (!isValidMember) {
        await prisma.user.update({
          where: { id: userId },
          data: { usageCount: { increment: 1 } }
        });
      }

      // 返回已有的颜色分析
      return NextResponse.json(JSON.parse(existingColor.aiJson));
    }

    // 准备流式响应
    const encoder = new TextEncoder();
    let responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();

    // 发送请求到AI服务
    const aiPrompt = `You need to answer questions from the perspective of a professional UI designer, with expertise in color matching. You should always understand the meanings of colors in different cultural contexts and be able to create excellent color schemes based on colors.

For example, if I provide a color's Hex value, you should answer the following questions:

1.What color family does this color belong to? Is it a cool tone or a warm tone?
2.What meanings and emotions does this color convey?
3.Based on different color theory principles, what colors pair well with it? Provide a detailed explanation for each pairing suggestion.
---
Response Requirements:

1.The answer must be returned in the JSON data format as shown in the example.
2.You must carefully consider the reasonableness of your answers.
3.All responses must be in English.
---
Question: ${hex}`;

    // 模拟AI响应（实际应用中，这里应该调用真实的AI服务）
    // 这里示例一个延迟响应来模拟流式返回
    const mockAiResponse = {
      colorAnalysis: {
        hexValue: hex,
        colorSystem: {
          hueFamily: "示例色系",
          toneCategory: "示例色调",
          alternativeNames: ["示例名称1", "示例名称2"],
          complementaryColor: [hex, "#" + (parseInt(hex.slice(1), 16) ^ 0xFFFFFF).toString(16).padStart(6, "0")]
        },
        meaningAndEmotion: {
          generalInterpretation: [
            "示例含义1",
            "示例含义2",
            "示例含义3"
          ],
          culturalContext: {
            western: "西方文化中的含义示例",
            eastern: "东方文化中的含义示例",
            uiApplications: "UI应用示例",
            cautions: [
              "使用注意事项1",
              "使用注意事项2"
            ]
          },
          emotionalSummary: "情感概述示例"
        },
        colorSchemes: [
          {
            theory: "Complementary",
            colors: [hex, "#" + (parseInt(hex.slice(1), 16) ^ 0xFFFFFF).toString(16).padStart(6, "0")],
            description: "互补色方案描述",
            uiApplication: "互补色UI应用",
            strengths: "互补色优势",
            recommendedRatio: "互补色推荐比例",
            bestFor: "互补色最佳应用场景"
          },
          {
            theory: "Analogous",
            colors: [hex, shiftHue(hex, 30), shiftHue(hex, -30)],
            description: "类似色方案描述",
            uiApplication: "类似色UI应用",
            strengths: "类似色优势",
            recommendedRatio: "类似色推荐比例",
            bestFor: "类似色最佳应用场景"
          },
          {
            theory: "Triadic",
            colors: [hex, shiftHue(hex, 120), shiftHue(hex, 240)],
            description: "三元色方案描述",
            uiApplication: "三元色UI应用",
            strengths: "三元色优势",
            recommendedRatio: "三元色推荐比例",
            bestFor: "三元色最佳应用场景"
          },
          {
            theory: "Monochromatic",
            colors: [darken(hex, 0.3), hex, lighten(hex, 0.3)],
            description: "单色调方案描述",
            uiApplication: "单色调UI应用",
            strengths: "单色调优势",
            recommendedRatio: "单色调推荐比例",
            bestFor: "单色调最佳应用场景"
          },
          {
            theory: "Split-Complementary",
            colors: [hex, shiftHue(complement(hex), 30), shiftHue(complement(hex), -30)],
            description: "分裂互补色方案描述",
            uiApplication: "分裂互补色UI应用",
            strengths: "分裂互补色优势",
            recommendedRatio: "分裂互补色推荐比例",
            bestFor: "分裂互补色最佳应用场景"
          }
        ]
      }
    };

    // 将响应分块发送
    const mockResponseStr = JSON.stringify(mockAiResponse);
    const chunks = mockResponseStr.match(/.{1,100}/g) || [];

    // 模拟流式返回
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await writer.write(encoder.encode(chunk));
    }

    // 将AI响应保存到数据库
    await prisma.aiColor.create({
      data: {
        hex: hex.toLowerCase(),
        aiJson: mockResponseStr,
        userId
      }
    });

    // 更新用户使用次数
    if (!isValidMember) {
      await prisma.user.update({
        where: { id: userId },
        data: { usageCount: { increment: 1 } }
      });
    }

    await writer.close();
    return new Response(responseStream.readable);
  } catch (error) {
    console.error("生成配色方案失败:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

// 辅助函数: 转换颜色
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, (h / 360 + 1/3) % 1);
    g = hue2rgb(p, q, h / 360);
    b = hue2rgb(p, q, (h / 360 - 1/3) % 1);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// 颜色操作函数
function shiftHue(hex: string, degrees: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.h = (hsl.h + degrees) % 360;
  if (hsl.h < 0) hsl.h += 360;

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

function lighten(hex: string, amount: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.min(1, hsl.l + amount);

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

function darken(hex: string, amount: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.max(0, hsl.l - amount);

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

function complement(hex: string) {
  return shiftHue(hex, 180);
} 