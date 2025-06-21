# AI Color Scheme

一个AI驱动的配色方案生成工具，可以根据用户输入的颜色自动生成多种配色方案，并提供HTML示例。

## 功能

- 根据用户选择的基础颜色，生成多种配色方案
- 为每种配色方案生成HTML示例页面
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

# Vercel OSS配置
VERCEL_OSS_KEY="your-vercel-oss-key"
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
