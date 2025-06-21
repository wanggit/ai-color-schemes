import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ColorScheme = {
  theory: string;
  colors: string[];
  description: string;
  uiApplication: string;
  strengths: string;
  recommendedRatio: string;
  bestFor: string;
};

export async function POST(request: NextRequest) {
  try {
    // 获取会话信息
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // 获取请求参数
    const { scheme, hex, regenerate = false } = await request.json();
    
    if (!scheme || !hex) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const schemeKey = getSchemeKey(scheme.theory);
    
    // 检查是否已有示例HTML，且不是请求重新生成
    if (!regenerate) {
      const existingColor = await prisma.aiColor.findFirst({
        where: { 
          hex: hex.toLowerCase(),
          userId 
        }
      });

      if (existingColor && existingColor[schemeKey as keyof typeof existingColor]) {
        // 如果已存在此配色方案的示例，直接返回
        return NextResponse.json({ 
          url: existingColor[schemeKey as keyof typeof existingColor] as string 
        });
      }
    }

    // 生成HTML示例
    const html = await generateHtmlExample(scheme);
    
    // 上传HTML到存储（模拟）
    const timestamp = new Date().getTime();
    const filename = `${scheme.theory}-${timestamp}-${userId}.html`;
    const url = await uploadToStorage(html, filename);
    
    // 更新数据库
    await prisma.aiColor.updateMany({
      where: { 
        hex: hex.toLowerCase(),
        userId
      },
      data: {
        [schemeKey]: url
      }
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("生成HTML示例失败:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
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

// 生成HTML示例
async function generateHtmlExample(scheme: ColorScheme): Promise<string> {
  // 这里模拟调用AI生成HTML
  // 实际应用中，这里应该调用真实的AI服务，使用提示词生成HTML
  
  const aiPrompt = `You are a professional UI designer with expertise in HTML + CSS. Based on color scheme data, you can design HTML pages with precise color coordination.
---
Response Requirements:
1.Based on the JSON data input by the user, understand the color scheme and write the HTML page;
2.Ensure the correctness of HTML and CSS syntax, striving for compatibility with browsers and mobile devices;
3.All content in the response must be in English.
---
User Input:
${JSON.stringify(scheme, null, 2)}
AI Output:`;

  // 生成示例HTML
  const primaryColor = scheme.colors[0];
  const secondaryColor = scheme.colors.length > 1 ? scheme.colors[1] : "#ffffff";
  const accentColor = scheme.colors.length > 2 ? scheme.colors[2] : "#000000";
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${scheme.theory} Color Scheme Example</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    body {
      background-color: ${primaryColor};
      color: ${getContrastColor(primaryColor)};
      line-height: 1.6;
    }
    
    header {
      background-color: ${darken(primaryColor, 0.1)};
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      color: ${getContrastColor(darken(primaryColor, 0.1))};
    }
    
    .nav-links {
      display: flex;
      list-style: none;
    }
    
    .nav-links li {
      margin-left: 2rem;
    }
    
    .nav-links a {
      color: ${getContrastColor(darken(primaryColor, 0.1))};
      text-decoration: none;
      transition: opacity 0.2s;
    }
    
    .nav-links a:hover {
      opacity: 0.8;
    }
    
    main {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    
    .hero {
      background-color: ${secondaryColor};
      color: ${getContrastColor(secondaryColor)};
      padding: 3rem 2rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    
    p {
      margin-bottom: 1.5rem;
      font-size: 1.1rem;
    }
    
    .btn {
      display: inline-block;
      background-color: ${accentColor};
      color: ${getContrastColor(accentColor)};
      padding: 0.7rem 1.5rem;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    
    .btn:hover {
      opacity: 0.9;
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    
    .feature-card {
      background-color: ${lighten(primaryColor, 0.1)};
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .feature-card h3 {
      color: ${accentColor};
      margin-bottom: 1rem;
    }
    
    footer {
      background-color: ${darken(primaryColor, 0.2)};
      color: ${getContrastColor(darken(primaryColor, 0.2))};
      padding: 2rem 1rem;
      text-align: center;
      margin-top: 3rem;
    }
    
    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }
      
      h1 {
        font-size: 2rem;
      }
      
      .features {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <nav>
      <div class="logo">ColorBrand</div>
      <ul class="nav-links">
        <li><a href="#">Home</a></li>
        <li><a href="#">Products</a></li>
        <li><a href="#">Gallery</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <section class="hero">
      <h1>${scheme.theory} Color Scheme</h1>
      <p>${scheme.description}</p>
      <a href="#" class="btn">Learn More</a>
    </section>
    
    <section>
      <h2>Application: ${scheme.bestFor}</h2>
      <p>${scheme.uiApplication}</p>
      
      <div class="features">
        <div class="feature-card">
          <h3>Key Strength</h3>
          <p>${scheme.strengths}</p>
        </div>
        
        <div class="feature-card">
          <h3>Recommended Ratio</h3>
          <p>${scheme.recommendedRatio}</p>
        </div>
        
        <div class="feature-card">
          <h3>Color Codes</h3>
          <p>${scheme.colors.join(', ')}</p>
        </div>
      </div>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2023 AI Color Schemes. This is an example of ${scheme.theory} color scheme.</p>
  </footer>
</body>
</html>`;
}

// 模拟上传到存储服务
async function uploadToStorage(html: string, filename: string): Promise<string> {
  // 这里应该实现真实的存储上传逻辑
  // 比如上传到Vercel OSS或者其他存储服务
  
  // 模拟上传成功，返回URL
  // 实际应用中，这里应该返回真实的文件URL
  return `https://storage.example.com/${filename}`;
}

// 辅助函数: 获取文本对比色
function getContrastColor(hexColor: string): string {
  // 简单的亮度计算，用于判断应当使用浅色还是深色文本
  const rgb = hexToRgb(hexColor);
  if (!rgb) return "#000000";
  
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  
  return brightness > 128 ? "#000000" : "#ffffff";
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

// 辅助函数: 调亮颜色
function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${amount})`;
}

// 辅助函数: 调暗颜色
function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const r = Math.max(0, Math.floor(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.floor(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.floor(rgb.b * (1 - amount)));
  
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
} 