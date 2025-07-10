# AI Colors - AI配色方案生成器

## 🌐 国际化路由

本应用支持多语言访问，URL结构如下：

### 访问方式
- **中文（默认）**: `http://localhost:3000/zh/`
- **英文**: `http://localhost:3000/en/`
- **日文**: `http://localhost:3000/ja/`
- **韩文**: `http://localhost:3000/ko/`
- **德文**: `http://localhost:3000/de/`

### 主要页面
- **主页**: `/zh/`
- **配色生成**: `/zh/generate`
- **价格方案**: `/zh/pricing`
- **我的方案**: `/zh/my-schemes`
- **账单历史**: `/zh/billing`
- **登录**: `/zh/login`

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问应用
# 浏览器打开: http://localhost:3000/zh/
```

## 📝 注意事项

1. **路由变更**: 从单语言路由升级为国际化路由
2. **URL格式**: 所有页面现在都需要语言前缀
3. **默认语言**: 中文(zh)作为默认语言
4. **自动重定向**: 访问根路径会自动跳转到`/zh/`

## 🛠️ 开发

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 功能

- 根据用户选择的基础颜色，生成多种配色方案
- 为每种配色方案生成HTML示例
- 支持在线预览和下载HTML示例
- 用户管理系统，支持社交媒体登录
- 会员系统，限制非会员用户的使用次数

## 技术栈

- **前端**: Next.js, React, TypeScript, TailwindCSS, HeroUI
- **后端**: Next.js API Routes, Prisma ORM
- **数据库**: PostgreSQL
- **认证**: NextAuth.js
- **其他**: Vercel OSS (存储HTML示例)

## 安装

1. 克隆仓库
```bash
git clone <repository-url>
cd ai-colors
```

2. 安装依赖
```bash
npm install
```

3. 创建`.env`文件，参考`.env.example`添加必要的环境变量
```
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/aicolors?schema=public"

# NextAuth配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-nextauth-secret"

# OAuth提供商配置
# Google
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Facebook
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# Twitter/X
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"

```

4. 设置数据库
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. 启动开发服务器
```bash
npm run dev
```

## 部署

本应用可部署到Vercel平台：

1. 创建Vercel账号
2. 配置必要的环境变量
3. 部署项目

## 后台管理

- 访问 `/admin/users` 页面进行用户管理（仅管理员可访问）
- 默认管理员账号: wanggyxfmail@gmail.com

## 环境变量配置

### OAuth配置指南

#### Google OAuth设置
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目并配置OAuth凭证
3. 添加授权重定向URI: `http://localhost:3000/api/auth/callback/google`（开发环境）

#### Facebook OAuth设置
1. 访问 [Facebook for Developers](https://developers.facebook.com/)
2. 创建应用并配置OAuth凭证
3. 添加有效的OAuth重定向URI: `http://localhost:3000/api/auth/callback/facebook`

#### Twitter/X OAuth设置
1. 访问 [Twitter Developer Portal](https://developer.twitter.com/)
2. 创建应用并配置OAuth 2.0凭证
3. 添加回调URL: `http://localhost:3000/api/auth/callback/twitter`

## 新功能：预览图片生成

### 功能说明
系统现在支持将每个配色方案的HTML示例自动生成为预览图片，并保存到云存储中。

### 启用步骤

1. **安装依赖**
```bash
npm install playwright
```

2. **启用功能**
编辑 `app/api/colors/example/route.ts` 文件：
- 取消注释 `import { chromium } from 'playwright';` 这一行
- 将 `generatePreviewImage` 函数中的注释代码块取消注释

3. **Vercel部署注意事项**
在 `vercel.json` 中添加 Playwright 支持：
```json
{
  "functions": {
    "app/api/colors/example/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### 技术细节

- **截图尺寸**: 1200x800px (标准桌面分辨率)
- **图片格式**: PNG
- **存储路径**: `ai-colors-previews/{hex}/{theory}-{userId}-{timestamp}.png`
- **数据库字段**: `previewComp`, `previewAnal`, `previewTria`, `previewMono`, `previewSpCo`

### 性能优化建议

1. **缓存机制**: 如果HTML内容未变化，可跳过重新生成图片
2. **异步处理**: 图片生成可以在后台异步进行
3. **压缩优化**: 可以添加图片压缩以减少存储成本
4. **多分辨率**: 可以生成多种尺寸的预览图

### 成本考虑

- 每次生成配色方案都会产生额外的图片存储成本
- Playwright 会增加函数执行时间，可能影响 Vercel 的计费
- 建议添加配置开关来控制是否启用此功能

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## paypal sandbox
### user account
- mail: sb-9bad544143555@personal.example.com
- password: NSL)La9n
### boss account
- mail: sb-zgwfm33091965@business.example.com
- password: 0+^nSQ@z

