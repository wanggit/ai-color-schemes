import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Plans | AI Color Scheme Generator - Affordable Professional Color Tools",
  description: "Choose the perfect plan for your color design needs. Premium AI color generator with unlimited access, professional features, and export options. Free trial available. Competitive pricing for designers and developers.",
  keywords: [
    "ai color generator pricing",
    "color palette tool pricing",
    "design tool subscription",
    "professional color generator",
    "ai color plans",
    "color scheme pricing",
    "design software pricing",
    "unlimited color generation",
    "premium color tools",

  ],
  openGraph: {
    title: "Pricing Plans | AI Color Scheme Generator",
    description: "Choose the perfect plan for your color design needs. Premium AI color generator with unlimited access and professional features.",
    url: "https://aicolors.im/pricing",
    images: [
      {
        url: "/logo-with-text.png",
        width: 1200,
        height: 630,
        alt: "AI Color Generator Pricing Plans - Professional color tools at affordable prices",
      },
    ],
  },
  twitter: {
    title: "Pricing Plans | AI Color Scheme Generator",
    description: "Choose the perfect plan for your color design needs. Premium AI color generator with unlimited access and professional features.",
    images: ["/logo-with-text.png"],
  },
  alternates: {
    canonical: "https://aicolors.im/pricing",
    languages: {
      'en': 'https://aicolors.im/pricing',
      'zh-CN': 'https://aicolors.im/zh/pricing',
      'zh-TW': 'https://aicolors.im/zh-tw/pricing',
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

// 为pricing页面添加结构化数据
const pricingPageStructuredData = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "AI Color Scheme Generator Premium",
  "description": "Professional AI-powered color palette generator with unlimited access and premium features",
  "brand": {
    "@type": "Brand",
    "name": "AI Color Scheme Generator"
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Monthly Plan",
      "price": process.env.NEXT_PUBLIC_MONTHLY_AMOUNT || "9.99",
      "priceCurrency": "USD",
      "billingDuration": "P1M",
      "availability": "https://schema.org/InStock",
      "url": "https://aicolors.im/pricing",
      "priceValidUntil": "2025-12-31",
      "itemOffered": {
        "@type": "SoftwareApplication",
        "name": "AI Color Generator Monthly",
        "applicationCategory": "DesignApplication"
      }
    },
    {
      "@type": "Offer",
      "name": "Annual Plan",
      "price": process.env.NEXT_PUBLIC_ANNUAL_AMOUNT || "99.99",
      "priceCurrency": "USD",
      "billingDuration": "P1Y",
      "availability": "https://schema.org/InStock",
      "url": "https://aicolors.im/pricing",
      "priceValidUntil": "2025-12-31",
      "itemOffered": {
        "@type": "SoftwareApplication",
        "name": "AI Color Generator Annual",
        "applicationCategory": "DesignApplication"
      }
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "150",
    "bestRating": "5"
  }
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pricingPageStructuredData),
        }}
      />
      {children}
    </>
  );
} 