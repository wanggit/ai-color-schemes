"use client";

import React from "react";
import { useTranslations } from 'next-intl';

// 复用原有类型定义
type ColorScheme = {
  theory: string;
  colors: string[];
  description: string;
  uiApplication: string;
  strengths: string;
  recommendedRatio: string;
  bestFor: string;
  exampleUrl?: string;
};

interface SchemeInfoPanelProps {
  scheme: ColorScheme;
}

export default function SchemeInfoPanel({ scheme }: SchemeInfoPanelProps) {
  const t = useTranslations('schemeInfo');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-1">{t('description')}</h3>
        <p className="text-gray-700">{scheme.description}</p>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-1">{t('uiApplication')}</h3>
        <p className="text-gray-700">{scheme.uiApplication}</p>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-1">{t('strengths')}</h3>
        <p className="text-gray-700">{scheme.strengths}</p>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-1">{t('recommendedRatio')}</h3>
        <p className="text-gray-700">{scheme.recommendedRatio}</p>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-1">{t('bestFor')}</h3>
        <p className="text-gray-700">{scheme.bestFor}</p>
      </div>
    </div>
  );
} 