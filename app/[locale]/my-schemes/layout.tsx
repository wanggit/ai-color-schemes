import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Color Schemes | Saved AI Generated Palettes - Manage Your Colors",
  description: "View, manage and organize your saved AI-generated color schemes. Access your personal collection of professional color palettes. Download, share, and organize your favorite color combinations.",
  keywords: [
    "saved color schemes",
    "my color palettes",
    "color scheme collection",
    "color palette manager",
    "saved ai colors",
    "personal color library",
    "color scheme organizer",
    "design color collection",
    "color palette history",

  ],
  openGraph: {
    title: "My Color Schemes | Saved AI Generated Palettes",
    description: "View, manage and organize your saved AI-generated color schemes. Access your personal collection of professional color palettes.",
    url: "https://aicolors.im/my-schemes",
    images: [
      {
        url: "/logo-with-text.png",
        width: 1200,
        height: 630,
        alt: "My Color Schemes - Manage your saved AI-generated color palettes",
      },
    ],
  },
  twitter: {
    title: "My Color Schemes | Saved AI Generated Palettes",
    description: "View, manage and organize your saved AI-generated color schemes. Access your personal collection of professional color palettes.",
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
    index: false, // 个人页面通常不需要被索引
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

// 为my-schemes页面添加结构化数据
const mySchemesPageStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "My Color Schemes",
  "description": "Personal collection of saved AI-generated color schemes and palettes",
  "url": "https://aicolors.im/my-schemes",
  "mainEntity": {
    "@type": "ItemList",
    "name": "Saved Color Schemes",
    "description": "User's personal collection of AI-generated color palettes"
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
        "name": "My Color Schemes",
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