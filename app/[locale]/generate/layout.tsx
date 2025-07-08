import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Color Generator | Create Perfect Color Schemes Instantly",
  description: "Generate stunning AI-powered color schemes and palettes. Professional color generator for designers and developers. Create complementary, triadic, analogous and custom color schemes with AI. Free online color palette generator tool.",
  keywords: [
    "ai color generator",
    "color scheme generator",
    "color palette creator",
    "ai color picker",
    "color harmony generator",
    "complementary colors",
    "triadic colors",
    "analogous colors",
    "web design colors",
    "ui color schemes",
    "design color tools",
    "color theory",
    "hex color generator",
    "professional color palette",
    "AI配色生成器",
    "配色方案生成器",
    "颜色搭配工具"
  ],
  openGraph: {
    title: "AI Color Generator | Create Perfect Color Schemes Instantly",
    description: "Generate stunning AI-powered color schemes and palettes. Professional color generator for designers and developers.",
    url: "https://aicolors.im/generate",
    images: [
      {
        url: "/logo-with-text.png",
        width: 1200,
        height: 630,
        alt: "AI Color Generator - Create perfect color schemes with AI",
      },
    ],
  },
  twitter: {
    title: "AI Color Generator | Create Perfect Color Schemes Instantly",
    description: "Generate stunning AI-powered color schemes and palettes. Professional color generator for designers and developers.",
    images: ["/logo-with-text.png"],
  },
  alternates: {
    canonical: "https://aicolors.im/generate",
    languages: {
      'en': 'https://aicolors.im/generate',
      'zh-CN': 'https://aicolors.im/zh/generate',
      'zh-TW': 'https://aicolors.im/zh-tw/generate',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// 为generate页面添加结构化数据
const generatePageStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "AI Color Scheme Generator",
  "description": "Professional AI-powered color palette generator for creating stunning color schemes instantly",
  "url": "https://aicolors.im/generate",
  "applicationCategory": "DesignApplication",
  "operatingSystem": "Web Browser",
  "potentialAction": {
    "@type": "CreateAction",
    "target": "https://aicolors.im/generate",
    "object": {
      "@type": "CreativeWork",
      "name": "Color Scheme"
    }
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "mainEntity": {
    "@type": "SoftwareApplication",
    "name": "AI Color Generator",
    "applicationCategory": "DesignApplication",
    "downloadUrl": "https://aicolors.im/generate",
    "operatingSystem": "Web Browser",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "200",
      "bestRating": "5"
    }
  }
};

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generatePageStructuredData),
        }}
      />
      {children}
    </>
  );
} 