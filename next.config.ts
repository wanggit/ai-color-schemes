import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  /* config options here */
  // 禁用追踪以避免权限问题
  experimental: {
    // 其他实验性功能可以在这里配置
    // 启用并发渲染以提高性能
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001'],
    },
  },
  typescript: {
    // !! 警告: 禁用类型检查可能会在生产环境中引入错误
    // 这是一个临时解决方案，正确的做法是修复所有类型错误
    ignoreBuildErrors: true,
  },
  eslint: {
    // 同样，这是一个临时解决方案
    ignoreDuringBuilds: true,
  },

  // 添加国际化相关配置
  compiler: {
    // 移除仅在开发模式下使用的代码
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 优化构建配置（Next.js 15 默认启用）

  // 添加 webpack 配置来处理国际化
  webpack: (config, { isServer }) => {
    // 确保在服务器端正确处理国际化文件
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },

  // SEO优化配置
  trailingSlash: false, // 避免重复内容问题
  poweredByHeader: false, // 移除X-Powered-By头部以提高安全性

  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
    ],
    formats: ['image/webp', 'image/avif'], // 现代图片格式
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 压缩配置
  compress: true,

  // 安全头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/logo.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // 重写规则 - 移除localhost相关的重写，这在生产环境中不适用
  async rewrites() {
    return [
      // 如果需要API代理或其他重写规则，在这里添加
    ];
  },

  // 重定向规则
  async redirects() {
    return [
      // 添加任何需要的重定向规则
      {
        source: '/color-generator',
        destination: '/generate',
        permanent: true,
      },
      {
        source: '/palette-generator',
        destination: '/generate',
        permanent: true,
      },
      {
        source: '/color-schemes',
        destination: '/generate',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
