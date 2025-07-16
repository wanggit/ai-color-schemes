import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Color Schemes Gallery | AI Generated Palettes - Discover Your Colors",
  description: "Explore a gallery of AI-generated color schemes. Discover professional color palettes for your projects. Find inspiration from a vast collection of color combinations.",
  keywords: [
    "color scheme gallery",
    "color palettes",
    "ai color schemes",
    "color palette discovery",
    "ai colors",
    "public color library",
    "color scheme inspiration",
    "design color collection",
    "color palette ideas",
  ],
  openGraph: {
    title: "Color Schemes Gallery | AI Generated Palettes",
    description: "Explore a gallery of AI-generated color schemes. Discover professional color palettes for your projects.",
    url: "https://aicolors.im/my-schemes",
    images: [
      {
        url: "/logo-with-text.png",
        width: 1200,
        height: 630,
        alt: "Color Schemes Gallery - Discover AI-generated color palettes",
      },
    ],
  },
  twitter: {
    title: "Color Schemes Gallery | AI Generated Palettes",
    description: "Explore a gallery of AI-generated color schemes. Discover professional color palettes for your projects.",
    images: ["/logo-with-text.png"],
  },
  alternates: {
    canonical: "https://aicolors.im/my-schemes",
    languages: {
      'en': 'https://aicolors.im/my-schemes',
      'zh-CN': 'https://aicolors.im/zh/my-schemes',
      'zh-TW': 'https://aicolors.im/zh-tw/my-schemes',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

// 为my-schemes页面添加结构化数据
const mySchemesPageStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Color Schemes Gallery",
  "description": "Public collection of AI-generated color schemes and palettes",
  "url": "https://aicolors.im/my-schemes",
  "mainEntity": {
    "@type": "ItemList",
    "name": "Color Schemes",
    "description": "A gallery of AI-generated color palettes"
  },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://aicolors.im"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Color Schemes Gallery",
        "item": "https://aicolors.im/my-schemes"
      }
    ]
  }
};

export default function MySchemesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(mySchemesPageStructuredData),
        }}
      />
      {children}
    </>
  );
} 