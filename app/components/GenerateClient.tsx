"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import GradientBackground from "@/app/components/GradientBackground";
import ColorAnalysisTab from "@/app/components/ColorAnalysisTab";
import SchemeInfoPanel from "@/app/components/SchemeInfoPanel";
import SchemePreviewPanel from "@/app/components/SchemePreviewPanel";
import TabNavigation from "@/app/components/TabNavigation";
import ColorPaletteDisplay from "@/app/components/ColorPaletteDisplay";
import ColorInputPanel from "@/app/components/ColorInputPanel";

// 定义类型
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

type ProgressUpdate = {
    type: 'progress' | 'partial_data' | 'scheme_complete' | 'scheme_progress' | 'complete' | 'error';
    step?: string;
    message: string;
    progress: number;
    data?: ColorAnalysis;
    theory?: string;
    exampleUrl?: string;
    previewUrl?: string;
    tailwindConfig?: string;
    bootstrap5CustomVariables?: string;
    error?: string;
    task?: 'example' | 'tailwind' | 'bootstrap';
    status?: 'complete' | 'error';
};

// 客户端组件，处理所有交互逻辑
export default function GenerateClient() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const locale = params.locale as string;
    const { checkAuth } = useAuth();
    const t = useTranslations('generatePage');

    // 状态管理
    const [colorHex, setColorHex] = useState("#132c33");
    const [lastGeneratedHex, setLastGeneratedHex] = useState("#132c33");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const [hasPartialData, setHasPartialData] = useState(false);
    const [aiResponse, setAiResponse] = useState<ColorAnalysis | null>(null);
    const [activeTab, setActiveTab] = useState("analysis");
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
    const [exampleUrls, setExampleUrls] = useState<{ [key: string]: string }>({});
    const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string }>({});
    const [isGeneratingExamples, setIsGeneratingExamples] = useState<{ [key: string]: boolean }>({});
    const [generatedStatus, setGeneratedStatus] = useState<{ [theory: string]: boolean }>({});
    const [showColorPicker, setShowColorPicker] = useState(false);

    // 进度相关状态
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState("");
    const [currentStep, setCurrentStep] = useState("");
    const [isError, setIsError] = useState(false);
    const [showUpgradeButton, setShowUpgradeButton] = useState(false);

    useEffect(() => {
        const colorParam = searchParams.get('color');
        const actionParam = searchParams.get('action');

        if (colorParam) {
            const decodedColor = decodeURIComponent(colorParam);
            if (/^#[0-9A-Fa-f]{6}$/.test(decodedColor)) {
                setColorHex(decodedColor);
                const timer = setTimeout(() => {
                    handleGenerate(decodedColor, actionParam === 'regenerate');
                }, 100);
                return () => clearTimeout(timer);
            }
        }
    }, [searchParams]);

    const handlePopularColorSelect = async (hex: string) => {
        setColorHex(hex);
        setShowColorPicker(false);
        await handleGenerate(hex);
    };

    const handleGenerate = async (hexToGenerate?: any, forceRegenerate?: boolean) => {
        const authCheck = await checkAuth();
        if (!authCheck.success) {
            return;
        }

        const colorToGenerate = typeof hexToGenerate === 'string' ? hexToGenerate : colorHex;
        setIsGenerating(true);
        setIsGenerated(false);
        setHasPartialData(false);
        setProgress(0);
        setProgressMessage(t('preparing'));
        setCurrentStep("");
        setIsError(false);
        setExampleUrls({});
        setPreviewUrls({});
        setIsGeneratingExamples({});
        setGeneratedStatus({});
        setAiResponse(null);
        setShowUpgradeButton(false);

        try {
            setShowColorPicker(false);
            setLastGeneratedHex(colorToGenerate);

            const response = await fetch("/api/colors", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept-Language": locale,
                },
                body: JSON.stringify({
                    hex: colorToGenerate,
                    regenerate: forceRegenerate
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error || t('generateFailed', { error: '未知错误' });
                let displayMessage = errorMessage;

                if (response.status === 403) {
                    const lowerMessage = errorMessage.toLowerCase();
                    if (errorMessage.includes('积分') || lowerMessage.includes('credit') || lowerMessage.includes('insufficient') || errorMessage.includes('クレジット') || errorMessage.includes('크레딧')) {
                        setShowUpgradeButton(true);
                    }
                }
                setIsError(true);
                setProgressMessage(displayMessage);
                return;
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                setAiResponse(data);
                if (data.colorAnalysis && data.colorAnalysis.colorSchemes) {
                    const urls: { [key: string]: string } = {};
                    const generating: { [key: string]: boolean } = {};
                    const status: { [theory: string]: boolean } = {};

                    data.colorAnalysis.colorSchemes.forEach((scheme: ColorScheme) => {
                        const key = getSchemeKey(scheme.theory);
                        if (scheme.exampleUrl) {
                            urls[key] = scheme.exampleUrl;
                            generating[key] = false;
                            status[scheme.theory] = true;
                        } else {
                            // 对于没有exampleUrl的scheme，设置为false以便用户可以点击重新生成
                            generating[key] = false;
                            status[scheme.theory] = false;
                        }
                    });
                    setExampleUrls(urls);
                    setIsGeneratingExamples(generating);
                    setGeneratedStatus(status);

                    // 从数据库加载已存在的示例URL
                    loadExistingExampleUrls(hexToGenerate, data.colorAnalysis.colorSchemes);
                }
                setIsGenerated(true);
                setIsGenerating(false);
                setProgress(100);
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error(t('generateFailed', { error: 'Cannot read response stream' }));
            }

            let buffer = "";
            const decoder = new TextDecoder("utf-8");
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop() || "";
                for (const line of lines) {
                    if (line.trim() === "") continue;
                    try {
                        const parsed = JSON.parse(line);
                        handleProgressUpdate(parsed);
                    } catch (e) {
                        console.error("JSON parsing error:", e, "on line:", line);
                    }
                }
            }
        } catch (error: any) {
            setIsError(true);
            setProgressMessage(t('requestError', { error: error.message }));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleProgressUpdate = (update: ProgressUpdate) => {
        if (update.type === 'progress') {
            setProgress(update.progress);
            setProgressMessage(update.message);
            setCurrentStep(update.step || "");
        } else if (update.type === 'partial_data' && update.data) {
            setAiResponse(update.data);
            setHasPartialData(true);
            setProgress(update.progress || 50);
            setProgressMessage(update.message || '基础分析完成');

            if (update.data.colorAnalysis && update.data.colorAnalysis.colorSchemes) {
                const generating: { [key: string]: boolean } = {};
                update.data.colorAnalysis.colorSchemes.forEach((scheme: ColorScheme) => {
                    const key = getSchemeKey(scheme.theory);
                    generating[key] = true;
                });
                setIsGeneratingExamples(generating);
            }
        } else if (update.type === 'scheme_progress' && update.theory) {
            setAiResponse(prev => {
                if (!prev || !update.theory) return null;
                const newSchemes = [...prev.colorAnalysis.colorSchemes];
                let scheme = newSchemes.find(s => s.theory === update.theory);
                if (!scheme) {
                    scheme = { theory: update.theory, colors: [], description: "", uiApplication: "", strengths: "", recommendedRatio: "", bestFor: "" };
                    newSchemes.push(scheme);
                }
                if (update.message) {
                    scheme.description = update.message;
                }
                return { ...prev, colorAnalysis: { ...prev.colorAnalysis, colorSchemes: newSchemes } };
            });

            if (update.task === 'example' && update.status === 'complete' && update.exampleUrl) {
                const key = getSchemeKey(update.theory);
                console.log(`✅ 接收到示例URL更新 - 配色方案: ${update.theory}, 键: ${key}, URL: ${update.exampleUrl}, 预览图: ${update.previewUrl || '无'}`);

                setExampleUrls(prev => {
                    const newUrls = { ...prev, [key]: update.exampleUrl! };
                    console.log('🔍 更新exampleUrls:', newUrls);
                    return newUrls;
                });

                // 如果有预览图片URL，也更新
                if (update.previewUrl) {
                    setPreviewUrls(prev => {
                        const newPreviewUrls = { ...prev, [key]: update.previewUrl! };
                        console.log('🔍 更新previewUrls:', newPreviewUrls);
                        return newPreviewUrls;
                    });
                }

                setIsGeneratingExamples(prev => ({ ...prev, [key]: false }));

                setGeneratedStatus(prev => {
                    const newStatus = { ...prev, [update.theory!]: true };
                    console.log('🔍 更新generatedStatus:', newStatus);
                    return newStatus;
                });

                if (update.progress) {
                    setProgress(update.progress);
                }
            }

            if (update.status === 'complete') {
                const key = getSchemeKey(update.theory);
                if (update.task === 'tailwind' && update.tailwindConfig) {
                    // 更新 tailwindConfig 到相应的配色方案
                    setAiResponse(prev => {
                        if (!prev || !update.theory) return prev;
                        const newSchemes = prev.colorAnalysis.colorSchemes.map(scheme =>
                            scheme.theory === update.theory
                                ? { ...scheme, tailwindConfig: update.tailwindConfig }
                                : scheme
                        );
                        return { ...prev, colorAnalysis: { ...prev.colorAnalysis, colorSchemes: newSchemes } };
                    });
                    if (update.progress) {
                        setProgress(update.progress);
                    }
                } else if (update.task === 'bootstrap' && update.bootstrap5CustomVariables) {
                    // 更新 bootstrap5CustomVariables 到相应的配色方案
                    setAiResponse(prev => {
                        if (!prev || !update.theory) return prev;
                        const newSchemes = prev.colorAnalysis.colorSchemes.map(scheme =>
                            scheme.theory === update.theory
                                ? { ...scheme, bootstrap5CustomVariables: update.bootstrap5CustomVariables }
                                : scheme
                        );
                        return { ...prev, colorAnalysis: { ...prev.colorAnalysis, colorSchemes: newSchemes } };
                    });
                    if (update.progress) {
                        setProgress(update.progress);
                    }
                }
            }
        } else if (update.type === 'scheme_complete' && update.data) {
            setAiResponse(prev => {
                if (!prev) return null;
                const newSchemes = prev.colorAnalysis.colorSchemes.map(s =>
                    s.theory === update.data!.colorAnalysis.colorSchemes[0].theory ? update.data!.colorAnalysis.colorSchemes[0] : s
                );
                // Check if the scheme was new
                if (!prev.colorAnalysis.colorSchemes.some(s => s.theory === update.data!.colorAnalysis.colorSchemes[0].theory)) {
                    newSchemes.push(update.data!.colorAnalysis.colorSchemes[0]);
                }
                const key = getSchemeKey(update.data!.colorAnalysis.colorSchemes[0].theory);
                setIsGeneratingExamples(prev => ({ ...prev, [key]: false }));
                if (update.data!.colorAnalysis.colorSchemes[0].exampleUrl) {
                    setExampleUrls(prev => ({ ...prev, [key]: update.data!.colorAnalysis.colorSchemes[0].exampleUrl! }));
                    setGeneratedStatus(prev => ({ ...prev, [update.data!.colorAnalysis.colorSchemes[0].theory]: true }));
                }
                return { ...prev, colorAnalysis: { ...prev.colorAnalysis, colorSchemes: newSchemes } };
            });
        } else if (update.type === 'complete') {
            setIsGenerated(true);
            setProgress(100);
            setProgressMessage(update.message);
        } else if (update.type === 'error') {
            setIsError(true);
            setProgressMessage(update.message);
            if (update.message.includes('limit')) {
                setShowUpgradeButton(true);
            }
        }
    };

    const loadExistingExampleUrls = async (hex: string, schemes: ColorScheme[]) => {
        try {
            console.log(`🔍 加载现有示例URL - 颜色: ${hex}`);
            const response = await fetch(`/api/user/colors?hex=${hex}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📥 从数据库获取的数据:', data);

                if (data && data.length > 0) {
                    const colorRecord = data[0]; // 取第一条记录
                    console.log('🔍 完整的数据库记录:', colorRecord);
                    console.log('🔍 预览字段检查:', {
                        previewComp: colorRecord.previewComp,
                        previewAnal: colorRecord.previewAnal,
                        previewTria: colorRecord.previewTria,
                        previewMono: colorRecord.previewMono,
                        previewSpCo: colorRecord.previewSpCo
                    });

                    const existingUrls: { [key: string]: string } = {};
                    const existingPreviewUrls: { [key: string]: string } = {};
                    const existingStatus: { [theory: string]: boolean } = {};

                    schemes.forEach(scheme => {
                        const key = getSchemeKey(scheme.theory);
                        const previewKey = getPreviewKey(scheme.theory);

                        console.log(`🔍 处理配色方案 ${scheme.theory}: key=${key}, previewKey=${previewKey}`);

                        if (colorRecord[key]) {
                            existingUrls[key] = colorRecord[key];
                            existingStatus[scheme.theory] = true;
                            console.log(`✅ 找到现有示例 - ${scheme.theory}: ${colorRecord[key]}`);
                        }

                        if (colorRecord[previewKey]) {
                            existingPreviewUrls[key] = colorRecord[previewKey];
                            console.log(`✅ 找到现有预览图片 - ${scheme.theory}: ${colorRecord[previewKey]}`);
                        } else {
                            console.log(`❌ 未找到预览图片 - ${scheme.theory}: ${previewKey}字段为空`);
                        }
                    });

                    if (Object.keys(existingUrls).length > 0) {
                        setExampleUrls(prev => ({ ...prev, ...existingUrls }));
                        setGeneratedStatus(prev => ({ ...prev, ...existingStatus }));
                        console.log(`✅ 成功加载 ${Object.keys(existingUrls).length} 个现有示例URL`);
                    }

                    if (Object.keys(existingPreviewUrls).length > 0) {
                        setPreviewUrls(prev => ({ ...prev, ...existingPreviewUrls }));
                        console.log(`✅ 成功加载 ${Object.keys(existingPreviewUrls).length} 个现有预览图片URL`);
                    }
                }
            }
        } catch (error) {
            console.error('❌ 加载现有示例URL失败:', error);
            // 不抛出错误，因为这不是关键功能
        }
    };

    // 获取预览图片对应的字段名
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

    const regenerateExample = async (scheme: ColorScheme) => {
        const key = getSchemeKey(scheme.theory);
        console.log(`🔄 开始重新生成配色示例 - 配色方案: ${scheme.theory}, 键: ${key}, 颜色: ${lastGeneratedHex}`);

        setIsGeneratingExamples(prev => ({ ...prev, [key]: true }));
        try {
            const requestData = {
                hex: lastGeneratedHex,
                scheme: scheme,
                locale: locale,
                regenerate: true  // 添加重新生成标志
            };
            console.log('📤 发送请求数据:', requestData);

            const response = await fetch('/api/colors/example', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            console.log(`📥 收到响应 - 状态码: ${response.status}`);
            const data = await response.json();
            console.log('📥 响应数据:', data);

            if (response.ok) {
                // 修复字段名称不匹配问题：后端返回url字段，不是exampleUrl
                const url = data.url || data.exampleUrl;
                const previewUrl = data.previewUrl;

                if (url) {
                    console.log(`✅ 成功获取URL: ${url}`);
                    setExampleUrls(prev => ({ ...prev, [key]: url }));
                    setGeneratedStatus(prev => ({ ...prev, [scheme.theory]: true }));

                    // 如果有预览图片URL，也更新
                    if (previewUrl) {
                        console.log(`✅ 成功获取预览图片URL: ${previewUrl}`);
                        setPreviewUrls(prev => ({ ...prev, [key]: previewUrl }));
                    }
                } else {
                    console.error('❌ 响应中缺少URL字段');
                    throw new Error('响应中缺少URL字段');
                }
            } else {
                console.error(`❌ 请求失败: ${data.error || 'Unknown error'}`);
                throw new Error(data.error || 'Failed to regenerate example');
            }
        } catch (error: any) {
            console.error('❌ 重新生成配色示例失败:', error);
        } finally {
            setIsGeneratingExamples(prev => ({ ...prev, [key]: false }));
        }
    };

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

    const getSchemeName = (theory: string): string => {
        const key = `mySchemes.table.${theory.toLowerCase().replace(/\s+/g, '')}`;
        const name = t(key);
        // 如果翻译不存在，返回原始theory
        return name === key ? theory : name;
    };

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="relative isolate px-6 lg:px-8">
                <GradientBackground />
                <div className="mx-auto max-w-7xl ">
                    <ColorInputPanel
                        colorHex={colorHex}
                        lastGeneratedHex={lastGeneratedHex}
                        setColorHex={setColorHex}
                        handleGenerate={handleGenerate}
                        handlePopularColorSelect={handlePopularColorSelect}
                        isGenerated={isGenerated}
                        isGenerating={isGenerating}
                        showColorPicker={showColorPicker}
                        setShowColorPicker={setShowColorPicker}
                    />

                    <AnimatePresence>
                        {isGenerating && !isGenerated && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-8 text-center"
                            >
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{progressMessage}</p>
                                {isError && showUpgradeButton && (
                                    <button onClick={() => router.push('/pricing')} className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                                        {t('upgradeButton')}
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {(hasPartialData || isGenerated) && aiResponse && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-12"
                            >
                                <TabNavigation
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    aiResponse={aiResponse}
                                    getSchemeName={getSchemeName}
                                    generatedStatus={generatedStatus}
                                />
                                <div className="mt-8">
                                    {activeTab === 'analysis' && (
                                        <ColorAnalysisTab colorAnalysis={aiResponse} />
                                    )}
                                    {activeTab === 'schemes' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {aiResponse.colorAnalysis.colorSchemes.map(scheme => (
                                                <ColorPaletteDisplay
                                                    key={getSchemeKey(scheme.theory)}
                                                    colors={scheme.colors}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {(() => {
                                        // 检查是否是颜色方案预览标签页
                                        const currentScheme = aiResponse.colorAnalysis.colorSchemes.find(
                                            scheme => scheme.theory === activeTab
                                        );

                                        if (currentScheme) {
                                            return (
                                                <div className="flex flex-col gap-8">
                                                    <div>
                                                        <SchemeInfoPanel
                                                            scheme={currentScheme}
                                                        />
                                                    </div>
                                                    <div>
                                                        <SchemePreviewPanel
                                                            scheme={currentScheme}
                                                            previewMode={previewMode}
                                                            setPreviewMode={setPreviewMode}
                                                            exampleUrls={exampleUrls}
                                                            previewUrls={previewUrls}
                                                            isGeneratingExamples={isGeneratingExamples}
                                                            regenerateExample={regenerateExample}
                                                            getSchemeKey={getSchemeKey}
                                                            hex={lastGeneratedHex}
                                                            onSchemeUpdate={(updatedScheme) => {
                                                                // 更新aiResponse中的配色方案数据
                                                                setAiResponse(prev => {
                                                                    if (!prev) return prev;
                                                                    const newResponse = { ...prev };
                                                                    const schemeIndex = newResponse.colorAnalysis.colorSchemes.findIndex(
                                                                        s => s.theory === updatedScheme.theory
                                                                    );
                                                                    if (schemeIndex !== -1) {
                                                                        newResponse.colorAnalysis.colorSchemes[schemeIndex] = updatedScheme;
                                                                    }
                                                                    return newResponse;
                                                                });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </Suspense>
    );
} 