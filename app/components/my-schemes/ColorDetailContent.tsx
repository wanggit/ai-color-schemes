"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from 'next-intl';
import GradientBackground from "@/app/components/GradientBackground";
import ColorAnalysisTab from "@/app/components/ColorAnalysisTab";
import SchemeInfoPanel from "@/app/components/SchemeInfoPanel";
import SchemePreviewPanel from "@/app/components/SchemePreviewPanel";
import TabNavigation from "@/app/components/TabNavigation";
import ColorPaletteDisplay from "@/app/components/ColorPaletteDisplay";

// Types from prisma and generate page
type ColorScheme = {
    theory: string;
    colors: string[];
    description: string;
    uiApplication: string;
    strengths: string;
    recommendedRatio: string;
    bestFor: string;
    exampleUrl?: string;
    tailwindConfig?: string;
    bootstrap5CustomVariables?: string;
};

type ColorAnalysisData = {
    colorAnalysis: {
        hexValue: string;
        colorSystem: any;
        meaningAndEmotion: any;
        colorSchemes: ColorScheme[];
    };
};

type AiColor = {
    id: string;
    hex: string;
    aiJson: string;
    exampleComp?: string | null;
    exampleAnal?: string | null;
    exampleTria?: string | null;
    exampleMono?: string | null;
    exampleSpCo?: string | null;
    // 添加预览图片字段
    previewComp?: string | null;
    previewAnal?: string | null;
    previewTria?: string | null;
    previewMono?: string | null;
    previewSpCo?: string | null;
    // 添加 Tailwind 和 Bootstrap 配置字段
    tailwindComp?: string | null;
    tailwindAnal?: string | null;
    tailwindTria?: string | null;
    tailwindMono?: string | null;
    tailwindSpCo?: string | null;
    bootstrapComp?: string | null;
    bootstrapAnal?: string | null;
    bootstrapTria?: string | null;
    bootstrapMono?: string | null;
    bootstrapSpCo?: string | null;
    userId: string;
    createdAt: string;
    updatedAt: string;
};

type ColorDetailContentProps = {
    colorData: string;
    translations: {
        [key: string]: string;
    };
};

export default function ColorDetailContent({ colorData, translations }: ColorDetailContentProps) {
    const t = useTranslations('generatePage');
    const tSchemes = useTranslations('mySchemes.table');
    const tMySchemes = useTranslations('mySchemes');

    const parsedColorData: AiColor = JSON.parse(colorData);
    const [aiResponse, setAiResponse] = useState<ColorAnalysisData>(JSON.parse(parsedColorData.aiJson));

    const [activeTab, setActiveTab] = useState("analysis");
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

    const getSchemeKey = (theory: string): string => {
        switch (theory) {
            case "Complementary": return "exampleComp";
            case "Analogous": return "exampleAnal";
            case "Triadic": return "exampleTria";
            case "Monochromatic": return "exampleMono";
            case "Split-Complementary": return "exampleSpCo";
            default: return `example${theory.replace(/[^a-zA-Z0-9]/g, "")}`;
        }
    };

    // 添加获取预览图片字段名的函数
    const getPreviewKey = (theory: string): string => {
        switch (theory) {
            case "Complementary": return "previewComp";
            case "Analogous": return "previewAnal";
            case "Triadic": return "previewTria";
            case "Monochromatic": return "previewMono";
            case "Split-Complementary": return "previewSpCo";
            default: return `preview${theory.replace(/[^a-zA-Z0-9]/g, "")}`;
        }
    };

    const getSchemeName = (theory: string): string => {
        switch (theory) {
            case "Complementary": return tSchemes('complementary');
            case "Analogous": return tSchemes('analogous');
            case "Triadic": return tSchemes('triadic');
            case "Monochromatic": return tSchemes('monochromatic');
            case "Split-Complementary": return tSchemes('splitComplementary');
            default: return theory;
        }
    };

    const exampleUrls = useMemo(() => {
        const urls: { [key: string]: string } = {};
        if (!aiResponse?.colorAnalysis?.colorSchemes) return urls;

        aiResponse.colorAnalysis.colorSchemes.forEach(scheme => {
            const key = getSchemeKey(scheme.theory);
            const url = parsedColorData[key as keyof AiColor];
            if (url && typeof url === 'string') {
                urls[key] = url;
            }
        });
        return urls;
    }, [parsedColorData, aiResponse]);

    // 添加预览图片URL的构建逻辑
    const previewUrls = useMemo(() => {
        const urls: { [key: string]: string } = {};
        if (!aiResponse?.colorAnalysis?.colorSchemes) return urls;

        aiResponse.colorAnalysis.colorSchemes.forEach(scheme => {
            const key = getSchemeKey(scheme.theory);
            const previewKey = getPreviewKey(scheme.theory);
            const previewUrl = parsedColorData[previewKey as keyof AiColor];
            if (previewUrl && typeof previewUrl === 'string') {
                urls[key] = previewUrl;
            }
        });
        return urls;
    }, [parsedColorData, aiResponse]);

    const generatedStatus = useMemo(() =>
        aiResponse?.colorAnalysis?.colorSchemes.reduce((acc, scheme) => {
            const key = getSchemeKey(scheme.theory);
            acc[scheme.theory] = !!exampleUrls[key];
            return acc;
        }, {} as { [theory: string]: boolean })
        , [exampleUrls, aiResponse]);

    if (!aiResponse) {
        return <div>Loading...</div>; // Or some other placeholder
    }

    const currentScheme = aiResponse.colorAnalysis.colorSchemes.find(s => s.theory === activeTab);

    return (
        <div className="min-h-screen relative overflow-hidden pt-8 text-gray-800 dark:text-white mt-16">
            <GradientBackground />
            <div className="container mx-auto px-4 relative z-10">
                <h2 className="text-2xl font-bold text-center uppercase">
                    {tMySchemes('schemeDetailsTitle', { hexValue: aiResponse.colorAnalysis.hexValue })}
                </h2>
            </div>
            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
                    {/* Tab Navigation */}
                    <TabNavigation
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        aiResponse={aiResponse}
                        getSchemeName={getSchemeName}
                        generatedStatus={generatedStatus}
                    />

                    {/* Tab Content */}
                    <div className="p-4 sm:p-6 lg:p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === "analysis" && (
                                    <ColorAnalysisTab colorAnalysis={aiResponse} />
                                )}

                                {currentScheme && (
                                    <div className="space-y-6">
                                        <ColorPaletteDisplay colors={currentScheme.colors} />
                                        <div className="grid grid-cols-1 gap-8">
                                            <SchemeInfoPanel scheme={currentScheme} />
                                            <SchemePreviewPanel
                                                scheme={currentScheme}
                                                previewMode={previewMode}
                                                setPreviewMode={setPreviewMode}
                                                exampleUrls={exampleUrls}
                                                previewUrls={previewUrls}
                                                isGeneratingExamples={{}} // Not generating on this page
                                                regenerateExample={() => { }} // No regeneration on this page
                                                getSchemeKey={getSchemeKey}
                                                colorRecord={parsedColorData}
                                                hex={parsedColorData.hex}
                                                onSchemeUpdate={async (updatedScheme) => {
                                                    // 更新本地状态
                                                    setAiResponse(prev => {
                                                        const newResponse = { ...prev };
                                                        const schemeIndex = newResponse.colorAnalysis.colorSchemes.findIndex(
                                                            s => s.theory === updatedScheme.theory
                                                        );
                                                        if (schemeIndex !== -1) {
                                                            newResponse.colorAnalysis.colorSchemes[schemeIndex] = updatedScheme;
                                                        }
                                                        return newResponse;
                                                    });

                                                    // 更新数据库中的记录
                                                    try {
                                                        const response = await fetch('/api/user/colors', {
                                                            method: 'PUT',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                            },
                                                            body: JSON.stringify({
                                                                id: parsedColorData.id,
                                                                aiJson: JSON.stringify({
                                                                    ...aiResponse,
                                                                    colorAnalysis: {
                                                                        ...aiResponse.colorAnalysis,
                                                                        colorSchemes: aiResponse.colorAnalysis.colorSchemes.map(
                                                                            s => s.theory === updatedScheme.theory ? updatedScheme : s
                                                                        )
                                                                    }
                                                                })
                                                            }),
                                                        });
                                                        if (!response.ok) {
                                                            console.error('更新数据库失败');
                                                        }
                                                    } catch (error) {
                                                        console.error('更新数据库时出错:', error);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
} 