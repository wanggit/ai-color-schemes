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

type ColorAnalysis = {
  colorAnalysis: {
    hexValue: string;
    colorSystem: {
      hueFamily: string;
      toneCategory: string;
      alternativeNames: string[];
      complementaryColor: string[];
    };
    meaningAndEmotion: {
      generalInterpretation: string[];
      culturalContext: {
        western: string;
        eastern: string;
        uiApplications: string;
        cautions: string[];
      };
      emotionalSummary: string;
    };
    colorSchemes: ColorScheme[];
  };
};

interface ColorAnalysisTabProps {
  colorAnalysis: ColorAnalysis;
}

export default function ColorAnalysisTab({ colorAnalysis }: ColorAnalysisTabProps) {
  const t = useTranslations('components.colorAnalysis');

  // 防御性编程：确保 colorAnalysis 和其嵌套属性存在
  if (!colorAnalysis || !colorAnalysis.colorAnalysis) {
    // 可以返回一个加载指示器或 null
    return <div>{t('loading')}</div>;
  }

  return (
    <div className="flex flex-row w-full">
      <div className="space-y-6 pr-6">
        <div className="flex items-center space-x-4">
          <div
            className="w-16 h-16 rounded-full"
            style={{ backgroundColor: colorAnalysis.colorAnalysis.hexValue }}
          ></div>
          <div>
            <h3 className="text-lg font-medium">
              {colorAnalysis.colorAnalysis.hexValue}
            </h3>
            <p className="text-gray-600">
              {colorAnalysis.colorAnalysis.colorSystem.hueFamily} - {colorAnalysis.colorAnalysis.colorSystem.toneCategory}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">{t('colorMeaning')}</h3>
          <ul className="list-disc pl-5 space-y-1">
            {colorAnalysis.colorAnalysis.meaningAndEmotion.generalInterpretation.map((meaning, idx) => (
              <li key={idx}>{meaning}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">{t('emotionalSummary')}</h3>
          <p>{colorAnalysis.colorAnalysis.meaningAndEmotion.emotionalSummary}</p>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">{t('culturalBackground')}</h3>
          <div className="space-y-2">
            <p><strong>{t('western')}:</strong> {colorAnalysis.colorAnalysis.meaningAndEmotion.culturalContext.western}</p>
            <p><strong>{t('eastern')}:</strong> {colorAnalysis.colorAnalysis.meaningAndEmotion.culturalContext.eastern}</p>
            <p><strong>{t('uiApplication')}:</strong> {colorAnalysis.colorAnalysis.meaningAndEmotion.culturalContext.uiApplications}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">{t('cautions')}</h3>
          <ul className="list-disc pl-5 space-y-1">
            {colorAnalysis.colorAnalysis.meaningAndEmotion.culturalContext.cautions.map((caution, idx) => (
              <li key={idx}>{caution}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex-1 text-right pl-6 border-l border-gray-200 dark:border-gray-700">
        <div className="space-y-8">
          {colorAnalysis.colorAnalysis.colorSchemes.map((scheme) => (
            <div key={scheme.theory} className="pt-2.5 pb-2.5">
              <h4 className="text-base font-semibold mb-3">{scheme.theory}</h4>
              <div className="flex gap-1">
                {scheme.colors.map((color) => (
                  <div
                    key={color}
                    className="flex-1 h-12 rounded-lg shadow-md "
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 