import { MetadataRoute } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://aicolors.im' // 确认这是您的实际域名
  const lastModified = new Date()

  // 1. 获取所有被点赞的配色方案URL
  const likedSchemes = await prisma.schemeLike.findMany({
    select: {
      url: true, // 只选择URL字段
    },
  })

  const likedSchemeUrls = likedSchemes.map((scheme: { url: string }) => ({
    url: `${baseUrl}${scheme.url}`, // 假设 scheme.url 已经是 '/my-schemes/...' 的格式
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // 2. 定义核心静态页面
  const staticPages = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 1.0,
      alternates: {
        languages: {
          'en': `${baseUrl}/en`,
          'zh': `${baseUrl}/zh`,
          'zh-TW': `${baseUrl}/zh-tw`,
          'de': `${baseUrl}/de`,
          'ja': `${baseUrl}/ja`,
          'ko': `${baseUrl}/ko`,
        },
      },
    },
    {
      url: `${baseUrl}/generate`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.9,
      alternates: {
        languages: {
          'en': `${baseUrl}/en/generate`,
          'zh': `${baseUrl}/zh/generate`,
          'zh-TW': `${baseUrl}/zh-tw/generate`,
          'de': `${baseUrl}/de/generate`,
          'ja': `${baseUrl}/ja/generate`,
          'ko': `${baseUrl}/ko/generate`,
        },
      },
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified,
      changeFrequency: 'monthly' as const, // 价格页不常变
      priority: 0.8,
      alternates: {
        languages: {
          'en': `${baseUrl}/en/pricing`,
          'zh': `${baseUrl}/zh/pricing`,
          'zh-TW': `${baseUrl}/zh-tw/pricing`,
          'de': `${baseUrl}/de/pricing`,
          'ja': `${baseUrl}/ja/pricing`,
          'ko': `${baseUrl}/ko/pricing`,
        },
      },
    },
    {
      url: `${baseUrl}/my-schemes`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.7, // 用户页面，更新可能频繁
      alternates: {
        languages: {
          'en': `${baseUrl}/en/my-schemes`,
          'zh': `${baseUrl}/zh/my-schemes`,
          'zh-TW': `${baseUrl}/zh-tw/my-schemes`,
          'de': `${baseUrl}/de/my-schemes`,
          'ja': `${baseUrl}/ja/my-schemes`,
          'ko': `${baseUrl}/ko/my-schemes`,
        },
      },
    },
  ]

  // 3. 合并静态页面和动态生成的点赞页面
  return [...staticPages, ...likedSchemeUrls]
} 