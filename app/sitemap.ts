import { MetadataRoute } from 'next'
import { prisma } from '../lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://aicolors.im' // 确认这是您的实际域名
  const lastModified = new Date()

  try {
    // 1. 获取所有有示例页面的配色方案（从AiColor表）
    const colorSchemes = await prisma.aiColor.findMany({
      where: {
        OR: [
          { exampleComp: { not: null } },
          { exampleAnal: { not: null } },
          { exampleTria: { not: null } },
          { exampleMono: { not: null } },
          { exampleSpCo: { not: null } },
        ],
      },
      select: {
        hex: true,
      },
      distinct: ['hex'],
    })

    // 2. 为每个hex生成多语言的配色方案页面URL
    const languages = ['en', 'zh', 'zh-tw', 'de', 'ja', 'ko']
    const schemeUrls = colorSchemes.flatMap((scheme) =>
      languages.map((lang) => ({
        url: `${baseUrl}/${lang}/my-schemes/${scheme.hex.replace('#', '')}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    )

    // 3. 定义核心静态页面
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
      {
        url: `${baseUrl}/example`,
        lastModified,
        changeFrequency: 'daily' as const,
        priority: 0.8,
        alternates: {
          languages: {
            'en': `${baseUrl}/en/example`,
            'zh': `${baseUrl}/zh/example`,
            'zh-TW': `${baseUrl}/zh-tw/example`,
            'de': `${baseUrl}/de/example`,
            'ja': `${baseUrl}/ja/example`,
            'ko': `${baseUrl}/ko/example`,
          },
        },
      },
    ]

    // 4. 合并静态页面和动态配色方案页面
    return [...staticPages, ...schemeUrls]
  } catch (error) {
    console.error('生成sitemap时发生错误:', error)
    // 如果数据库查询失败，至少返回静态页面
    return [
      {
        url: baseUrl,
        lastModified,
        changeFrequency: 'daily' as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/generate`,
        lastModified,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/pricing`,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/my-schemes`,
        lastModified,
        changeFrequency: 'daily' as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/example`,
        lastModified,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
    ]
  }
} 