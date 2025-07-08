"use client";

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

// 页面浏览跟踪
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// 事件跟踪
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// SEO相关事件跟踪
export const trackSEOEvent = (eventName: string, params?: any) => {
  event({
    action: eventName,
    category: 'SEO',
    label: params?.page || 'unknown',
    value: params?.value || 1,
  });
};

// 颜色生成事件跟踪
export const trackColorGeneration = (colorHex: string, schemeType?: string) => {
  event({
    action: 'color_generated',
    category: 'User Interaction',
    label: `${colorHex}_${schemeType || 'unknown'}`,
    value: 1,
  });
};

// 付费转化跟踪
export const trackPurchase = (planType: string, amount: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: `${Date.now()}_${planType}`,
      value: amount,
      currency: 'USD',
      items: [{
        item_id: planType,
        item_name: `AI Color Generator ${planType}`,
        category: 'Subscription',
        quantity: 1,
        price: amount,
      }]
    });
  }
};

// 用户注册跟踪
export const trackSignUp = (method: string) => {
  event({
    action: 'sign_up',
    category: 'User Authentication',
    label: method,
    value: 1,
  });
};

// 搜索跟踪
export const trackSearch = (searchTerm: string) => {
  event({
    action: 'search',
    category: 'User Interaction',
    label: searchTerm,
    value: 1,
  });
};

// 页面浏览时间跟踪
export const trackPageTime = (page: string, timeSeconds: number) => {
  event({
    action: 'page_time',
    category: 'User Engagement',
    label: page,
    value: Math.round(timeSeconds),
  });
};

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (GA_TRACKING_ID) {
      const url = pathname + searchParams.toString();
      pageview(url);
    }
  }, [pathname, searchParams]);

  if (!GA_TRACKING_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
              send_page_view: false
            });
          `,
        }}
      />
    </>
  );
}

// 扩展Window对象类型
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
} 