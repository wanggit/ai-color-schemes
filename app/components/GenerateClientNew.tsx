"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import GradientBackground from "@/app/components/GradientBackground";
import ColorInputPanel from "@/app/components/ColorInputPanel";
import TabNavigation from "@/app/components/TabNavigation";
import ColorAnalysisTab from "@/app/components/ColorAnalysisTab";
import SchemeInfoPanel from "@/app/components/SchemeInfoPanel";
import SchemePreviewPanel from "@/app/components/SchemePreviewPanel";
import CodeSnippet from "@/app/components/CodeSnippet";

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

type GenerationStatus = {
    theory: string;
    example: 'pending' | 'generating' | 'completed' | 'error';
    tailwind: 'pending' | 'generating' | 'completed' | 'error';
    bootstrap: 'pending' | 'generating' | 'completed' | 'error';
};

type AILogMessage = {
    type: 'info' | 'success' | 'error' | 'progress' | 'stream_content' | 'retry';
    message: string;
    timestamp: Date;
    theory?: string;
    task?: string;
    content?: string;
    attempt?: number;
    maxAttempts?: number;
    error?: string;
    rawResponse?: string;
};

// 新的客户端组件，处理分步骤的流式生成
export default function GenerateClientNew() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const locale = params.locale as string;
    const { checkAuth } = useAuth();
    const t = useTranslations('generatePage');

    // 基础状态管理
    const [colorHex, setColorHex] = useState("#132c33");
    const [lastGeneratedHex, setLastGeneratedHex] = useState("#132c33");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const [aiResponse, setAiResponse] = useState<ColorAnalysis | null>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // 页签相关状态
    const [activeTab, setActiveTab] = useState("analysis");
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
    const [exampleUrls, setExampleUrls] = useState<{ [key: string]: string }>({});
    const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string }>({});
    const [isGeneratingExamples, setIsGeneratingExamples] = useState<{ [key: string]: boolean }>({});
    const [generatedStatus, setGeneratedStatus] = useState<{ [theory: string]: boolean }>({});

    // 新的状态管理
    const [generationStatus, setGenerationStatus] = useState<{ [key: string]: GenerationStatus }>({});
    const [aiLogs, setAiLogs] = useState<AILogMessage[]>([]);
    const [currentStep, setCurrentStep] = useState<'basic' | 'schemes' | 'complete'>('basic');
    const [isError, setIsError] = useState(false);
    const [showUpgradeButton, setShowUpgradeButton] = useState(false);
    const [isJsonFormatError, setIsJsonFormatError] = useState(false);

    // 流式内容状态
    const [streamingContent, setStreamingContent] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);

    // 配色方案顺序
    const schemeOrder = ['Complementary', 'Analogous', 'Triadic', 'Monochromatic', 'Split-Complementary'];
    const taskOrder = ['example', 'tailwind', 'bootstrap'];

    // AI日志滚动控制
    const aiLogsRef = useRef<HTMLDivElement>(null);
    const streamingContentRef = useRef<HTMLDivElement>(null);

    // 获取配色方案键名
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

    // 获取配色方案名称
    const getSchemeName = (theory: string): string => {
        const key = `mySchemes.table.${theory.toLowerCase().replace(/\s+/g, '')}`;
        const name = t(key);
        // 如果翻译不存在，返回原始theory
        return name === key ? theory : name;
    };

    // 重新生成示例
    const regenerateExample = async (scheme: ColorScheme) => {
        const key = getSchemeKey(scheme.theory);
        console.log(`🔄 开始重新生成配色示例 - 配色方案: ${scheme.theory}, 键: ${key}, 颜色: ${lastGeneratedHex}`);

        setIsGeneratingExamples(prev => ({ ...prev, [key]: true }));
        try {
            const requestData = {
                hex: lastGeneratedHex,
                scheme: scheme,
                locale: locale,
                regenerate: true
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
                const url = data.url || data.exampleUrl;
                const previewUrl = data.previewUrl;

                if (url) {
                    console.log(`✅ 成功获取URL: ${url}`);
                    setExampleUrls(prev => ({ ...prev, [key]: url }));
                    setGeneratedStatus(prev => ({ ...prev, [scheme.theory]: true }));

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

    // 重新生成配置
    const regenerateConfig = async (scheme: ColorScheme, configType: 'tailwind' | 'bootstrap') => {
        try {
            const response = await fetch('/api/colors/regenerate-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    hex: lastGeneratedHex,
                    configType: configType,
                    theory: scheme.theory
                }),
            });

            const data = await response.json();

            if (data.success) {
                // 更新aiResponse中的配色方案数据
                setAiResponse(prev => {
                    if (!prev) return prev;
                    const newResponse = { ...prev };
                    const schemeIndex = newResponse.colorAnalysis.colorSchemes.findIndex(
                        s => s.theory === scheme.theory
                    );
                    if (schemeIndex !== -1) {
                        newResponse.colorAnalysis.colorSchemes[schemeIndex] = {
                            ...newResponse.colorAnalysis.colorSchemes[schemeIndex],
                            [configType === 'tailwind' ? 'tailwindConfig' : 'bootstrap5CustomVariables']: data.config
                        };
                    }
                    return newResponse;
                });
            } else {
                console.error('重新生成配置失败:', data.error);
                alert('重新生成配置失败，请稍后重试');
            }
        } catch (error) {
            console.error('重新生成配置请求失败:', error);
            alert('重新生成配置失败，请稍后重试');
        }
    };

    // 添加配色方案生成函数
    const generateColorSchemes = async (analysisData: ColorAnalysis) => {
        if (!analysisData || !analysisData.colorAnalysis || !analysisData.colorAnalysis.colorSchemes) {
            addAILog({ type: 'error', message: t('aiLogs.error.invalidBaseData') });
            setIsError(true);
            return;
        }
        const hexColor = analysisData.colorAnalysis.hexValue;

        // 步骤2: 配色方案生成
        setCurrentStep('schemes');
        addAILog({ type: 'info', message: t('aiLogs.step2.title', { hexColor }) });
        addAILog({ type: 'info', message: t('aiLogs.step2.schemeOrder', { order: schemeOrder.join(' → ') }) });

        addAILog({ type: 'info', message: t('aiLogs.step2.validatingData', { count: analysisData.colorAnalysis.colorSchemes.length }) });

        // 初始化生成状态
        const initialStatus: { [key: string]: GenerationStatus } = {};
        schemeOrder.forEach(theory => {
            initialStatus[theory] = {
                theory,
                example: 'pending',
                tailwind: 'pending',
                bootstrap: 'pending'
            };
        });
        setGenerationStatus(initialStatus);
        addAILog({ type: 'info', message: t('aiLogs.step2.initializedStatus') });

        // 按顺序生成每个配色方案
        for (let i = 0; i < schemeOrder.length; i++) {
            const theory = schemeOrder[i];
            addAILog({ type: 'info', message: t('aiLogs.step2.processingScheme', { current: i + 1, total: schemeOrder.length, theory }), theory });

            const scheme = analysisData.colorAnalysis.colorSchemes.find((s: ColorScheme) => s.theory === theory);
            if (!scheme) {
                addAILog({ type: 'error', message: t('aiLogs.error.schemeNotFound', { theory }), theory });
                continue;
            }

            addAILog({ type: 'info', message: t('aiLogs.step2.foundSchemeData', { theory }), theory });

            // 为每个配色方案生成示例、Tailwind配置和Bootstrap变量
            for (let j = 0; j < taskOrder.length; j++) {
                const task = taskOrder[j];
                addAILog({ type: 'info', message: t('aiLogs.step2.generatingTask', { schemeIndex: i + 1, taskIndex: j + 1, task, theory }), theory, task });

                try {
                    setGenerationStatus(prev => ({
                        ...prev,
                        [theory]: {
                            ...prev[theory],
                            [task]: 'generating'
                        }
                    }));

                    addAILog({ type: 'progress', message: t('aiLogs.step2.generatingTaskProgress', { task, theory }), theory, task });

                    // 添加延迟确保顺序执行
                    if (i > 0 || j > 0) {
                        addAILog({ type: 'info', message: t('aiLogs.step2.waitingForPreviousTask'), theory, task });
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    const startTime = Date.now();
                    const schemeResponse = await fetch("/api/colors/scheme-generation", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept-Language": locale,
                        },
                        body: JSON.stringify({
                            hex: hexColor,
                            theory,
                            task,
                            colorScheme: scheme
                        }),
                    });
                    const endTime = Date.now();
                    addAILog({ type: 'info', message: t('aiLogs.step2.apiRequestDuration', { duration: endTime - startTime }), theory, task });
                    if (schemeResponse.ok) {
                        const results = await schemeResponse.json();
                        addAILog({ type: 'info', message: t('aiLogs.step2.apiResponseSuccess', { theory, task }), theory, task });
                        console.log("scheme-generation-result: ", results);
                        const resultObj = results[0];
                        const resultTask: string = resultObj.task;
                        const result = resultObj.result;
                        // 更新配色方案数据
                        if (resultTask === 'example' && result.url) {
                            scheme.exampleUrl = result.url;
                            setExampleUrls(prev => ({ ...prev, [getSchemeKey(theory)]: result.url }));
                            setGeneratedStatus(prev => ({ ...prev, [theory]: true }));
                            addAILog({ type: 'info', message: t('aiLogs.step2.setExampleUrl', { url: result.url }), theory, task });
                        } else if (resultTask === 'tailwind' && result.config) {
                            scheme.tailwindConfig = result.config;
                            addAILog({ type: 'info', message: t('aiLogs.step2.setTailwindConfig'), theory, task });
                        } else if (resultTask === 'bootstrap' && result.config) {
                            scheme.bootstrap5CustomVariables = result.config;
                            addAILog({ type: 'info', message: t('aiLogs.step2.setBootstrapConfig'), theory, task });
                        }

                        setGenerationStatus(prev => ({
                            ...prev,
                            [theory]: {
                                ...prev[theory],
                                [task]: 'completed'
                            }
                        }));

                        addAILog({ type: 'success', message: t('aiLogs.step2.taskCompleted', { task, theory }), theory, task });
                    } else {
                        const errorData = await schemeResponse.json();
                        setGenerationStatus(prev => ({
                            ...prev,
                            [theory]: {
                                ...prev[theory],
                                [task]: 'error'
                            }
                        }));
                        addAILog({ type: 'error', message: t('aiLogs.step2.taskFailed', { task, theory, error: errorData.error }), theory, task });
                    }
                } catch (error: any) {
                    setGenerationStatus(prev => ({
                        ...prev,
                        [theory]: {
                            ...prev[theory],
                            [task]: 'error'
                        }
                    }));
                    addAILog({ type: 'error', message: t('aiLogs.step2.taskError', { task, theory, error: error.message }), theory, task });
                }
            }

            addAILog({ type: 'info', message: t('aiLogs.step2.schemeCompleted', { theory }), theory });
        }

        // 步骤3: 完成
        setCurrentStep('complete');
        addAILog({ type: 'info', message: t('aiLogs.step3.title') });
        addAILog({ type: 'success', message: t('aiLogs.step3.allSchemesCompleted') });
        setIsGenerated(true);
    };

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

    const addAILog = (message: Omit<AILogMessage, 'timestamp'>) => {
        setAiLogs(prev => [...prev, { ...message, timestamp: new Date() }]);
    };

    // 自动滚动到AI日志底部
    useEffect(() => {
        if (aiLogsRef.current) {
            aiLogsRef.current.scrollTop = aiLogsRef.current.scrollHeight;
        }
    }, [aiLogs]);

    // 自动滚动到流式内容底部
    useEffect(() => {
        if (streamingContentRef.current) {
            streamingContentRef.current.scrollTop = streamingContentRef.current.scrollHeight;
        }
    }, [streamingContent]);

    const handleGenerate = async (hexToGenerate?: any, forceRegenerate?: boolean) => {
        const authCheck = await checkAuth();
        if (!authCheck.success) {
            return;
        }

        const colorToGenerate = typeof hexToGenerate === 'string' ? hexToGenerate : colorHex;

        // 重置状态
        setIsGenerating(true);
        setIsGenerated(false);
        setCurrentStep('basic');
        setIsError(false);
        setIsJsonFormatError(false);
        setAiResponse(null);
        setGenerationStatus({});
        setAiLogs([]);
        setShowUpgradeButton(false);
        setShowColorPicker(false);
        setLastGeneratedHex(colorToGenerate);
        setStreamingContent("");
        setIsStreaming(false);
        setExampleUrls({});
        setPreviewUrls({});
        setIsGeneratingExamples({});
        setGeneratedStatus({});
        setActiveTab("analysis");

        try {
            // 步骤1: 基础颜色分析（流式）
            addAILog({ type: 'info', message: t('aiLogs.step1.title') });
            addAILog({ type: 'info', message: t('aiLogs.step1.analyzingColor', { color: colorToGenerate }) });
            setCurrentStep('basic');
            setIsStreaming(true);

            const basicResponse = await fetch("/api/colors/basic-analysis", {
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

            if (!basicResponse.ok) {
                const errorData = await basicResponse.json();
                const errorMessage = errorData.error || '生成失败';

                if (basicResponse.status === 403) {
                    const lowerMessage = errorMessage.toLowerCase();
                    if (errorMessage.includes('积分') || lowerMessage.includes('credit') || lowerMessage.includes('insufficient') || errorMessage.includes('クレジット') || errorMessage.includes('크레딧')) {
                        setShowUpgradeButton(true);
                    }
                }
                setIsError(true);
                addAILog({ type: 'error', message: errorMessage });
                setIsStreaming(false);
                return;
            }

            // 处理流式响应
            const reader = basicResponse.body?.getReader();
            if (!reader) {
                throw new Error('Cannot read response stream');
            }

            let buffer = "";
            const decoder = new TextDecoder();

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
                        handleStreamUpdate(parsed);
                    } catch (e) {
                        console.error("JSON parsing error:", e, "on line:", line);
                    }
                }
            }

            setIsStreaming(false);
            addAILog({ type: 'info', message: t('aiLogs.step1.analysisComplete') });

        } catch (error: any) {
            setIsError(true);
            addAILog({ type: 'error', message: t('aiLogs.error.generationProcess') });
            addAILog({ type: 'error', message: t('aiLogs.error.errorType', { type: error.name || 'Unknown' }) });
            addAILog({ type: 'error', message: t('aiLogs.error.errorMessage', { message: error.message }) });
            if (error.stack) {
                addAILog({ type: 'error', message: t('aiLogs.error.errorStack', { stack: error.stack }) });
            }
            setIsStreaming(false);
        } finally {
            setIsGenerating(false);
            addAILog({ type: 'info', message: t('aiLogs.generationEnded') });
        }
    };

    const handleStreamUpdate = (update: any) => {
        if (update.type === 'progress') {
            addAILog({ type: 'progress', message: update.message });
        } else if (update.type === 'stream_content') {
            setStreamingContent(prev => prev + (update.content || ''));
            // 减少流式内容的日志频率，避免日志过多
            if (update.content && update.content.length > 50) {
                addAILog({ type: 'stream_content', message: t('aiLogs.stream.generatingContent'), content: update.content.substring(0, 50) + '...' });
            }
        } else if (update.type === 'retry') {
            addAILog({
                type: 'retry',
                message: update.message,
                attempt: update.attempt,
                maxAttempts: update.maxAttempts
            });
        } else if (update.type === 'complete' && update.data) {
            // 立即更新aiResponse状态
            setAiResponse(update.data);
            addAILog({ type: 'success', message: t('aiLogs.stream.baseDataReceived') });

            // 调试：显示数据结构
            addAILog({
                type: 'info', message: `${JSON.stringify({
                    hasData: !!update.data,
                    hasColorAnalysis: !!update.data.colorAnalysis,
                    hasColorSchemes: !!(update.data.colorAnalysis && update.data.colorAnalysis.colorSchemes),
                    schemesCount: update.data.colorAnalysis?.colorSchemes?.length || 0
                })}`
            });

            if (update.data.colorAnalysis && update.data.colorAnalysis.colorSchemes) {
                addAILog({ type: 'info', message: t('aiLogs.stream.foundSchemes', { count: update.data.colorAnalysis.colorSchemes.length }) });

                // 立即开始配色方案生成，不等待状态更新
                setTimeout(() => {
                    generateColorSchemes(update.data);
                }, 100);
            } else {
                addAILog({ type: 'error', message: t('aiLogs.error.baseDataFormat') });
                setIsError(true);
            }
        } else if (update.type === 'error') {
            setIsError(true);

            // 检测是否是JSON格式错误
            const isJsonError = update.message && (
                update.message.includes('JSON') ||
                update.message.includes('parse') ||
                update.message.includes('format')
            );

            if (isJsonError) {
                setIsJsonFormatError(true);
                addAILog({ type: 'error', message: t('aiLogs.error.jsonFormat') });
            }

            addAILog({
                type: 'error',
                message: update.message,
                error: update.error,
                rawResponse: update.rawResponse
            });
        }
    };

    const retryTask = async (theory: string, task: string) => {
        if (!aiResponse || !aiResponse.colorAnalysis || !aiResponse.colorAnalysis.colorSchemes) {
            addAILog({ type: 'error', message: t('aiLogs.retry.fail.noData') });
            return;
        }

        const scheme = aiResponse.colorAnalysis.colorSchemes.find(s => s.theory === theory);
        if (!scheme) {
            addAILog({ type: 'error', message: t('aiLogs.retry.fail.schemeNotFound', { theory }) });
            return;
        }

        addAILog({ type: 'info', message: t('aiLogs.retry.start', { theory, task }), theory, task });

        setGenerationStatus(prev => ({
            ...prev,
            [theory]: {
                ...prev[theory],
                [task]: 'generating'
            }
        }));

        addAILog({ type: 'progress', message: t('aiLogs.retry.progress', { task, theory }), theory, task });

        try {
            const response = await fetch("/api/colors/scheme-generation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept-Language": locale,
                },
                body: JSON.stringify({
                    hex: lastGeneratedHex,
                    theory,
                    task,
                    colorScheme: scheme
                }),
            });

            if (response.ok) {
                const result = await response.json();
                addAILog({ type: 'info', message: t('aiLogs.retry.apiSuccess', { theory, task }), theory, task });

                if (task === 'example' && result.url) {
                    scheme.exampleUrl = result.url;
                    setExampleUrls(prev => ({ ...prev, [getSchemeKey(theory)]: result.url }));
                    setGeneratedStatus(prev => ({ ...prev, [theory]: true }));
                    addAILog({ type: 'info', message: t('aiLogs.retry.setExampleUrl', { url: result.url }), theory, task });
                } else if (task === 'tailwind' && result.config) {
                    scheme.tailwindConfig = result.config;
                    addAILog({ type: 'info', message: t('aiLogs.retry.setTailwindConfig'), theory, task });
                } else if (task === 'bootstrap' && result.config) {
                    scheme.bootstrap5CustomVariables = result.config;
                    addAILog({ type: 'info', message: t('aiLogs.retry.setBootstrapConfig'), theory, task });
                }

                setGenerationStatus(prev => ({
                    ...prev,
                    [theory]: {
                        ...prev[theory],
                        [task]: 'completed'
                    }
                }));

                addAILog({ type: 'success', message: t('aiLogs.retry.success', { theory, task }), theory, task });
            } else {
                const errorData = await response.json();
                setGenerationStatus(prev => ({
                    ...prev,
                    [theory]: {
                        ...prev[theory],
                        [task]: 'error'
                    }
                }));
                addAILog({ type: 'error', message: t('aiLogs.retry.fail.apiError', { theory, task, error: errorData.error }), theory, task });
            }
        } catch (error: any) {
            setGenerationStatus(prev => ({
                ...prev,
                [theory]: {
                    ...prev[theory],
                    [task]: 'error'
                }
            }));
            addAILog({ type: 'error', message: t('aiLogs.retry.fail.exception', { theory, task, error: error.message }), theory, task });
        }
    };

    return (
        <Suspense fallback={<div>{t('client.loading')}</div>}>
            <div className="relative isolate px-6 lg:px-8">
                <GradientBackground />
                <div className="mx-auto max-w-7xl">
                    {/* 颜色输入面板 */}
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

                    {/* 流式内容显示区域 */}
                    <AnimatePresence>
                        {isStreaming && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-8"
                            >
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                                    <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                                        {t('client.analyzingColorTitle')}
                                    </h2>
                                    <div ref={streamingContentRef} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                                        <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                                            {streamingContent || t('client.waitingForAI')}
                                        </pre>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 主要内容区域 - 始终显示，不会消失 */}
                    <AnimatePresence>
                        {(isGenerated || aiResponse) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-12 relative"
                            >
                                {/* 左侧：页签内容区域 - 占满全宽 */}
                                <div className="w-full">
                                    {/* 页签导航 */}
                                    {aiResponse && (
                                        <TabNavigation
                                            activeTab={activeTab}
                                            setActiveTab={setActiveTab}
                                            aiResponse={aiResponse}
                                            getSchemeName={getSchemeName}
                                            generatedStatus={generatedStatus}
                                        />
                                    )}

                                    {/* 页签内容 */}
                                    <div className="mt-8">
                                        {activeTab === 'analysis' && aiResponse && (
                                            <ColorAnalysisTab colorAnalysis={aiResponse} />
                                        )}
                                        {(() => {
                                            // 检查是否是颜色方案页签
                                            const currentScheme = aiResponse?.colorAnalysis?.colorSchemes?.find(
                                                scheme => scheme.theory === activeTab
                                            );
                                            if (currentScheme) {
                                                return (
                                                    <div className="flex flex-col gap-8">
                                                        <div>
                                                            <SchemeInfoPanel scheme={currentScheme} />
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
                                </div>

                                {/* 右侧：AI信息显示窗口 - 绝对定位在屏幕最右侧 */}
                                {!(isGenerated && currentStep === 'complete') && (
                                    <div className="fixed right-0 top-12 h-screen w-1/5 p-4 z-10">
                                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-full flex flex-col">
                                            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                    {t('client.aiLogTitle')}
                                                </h3>
                                                {aiLogs.length > 0 && (
                                                    <button
                                                        onClick={() => setAiLogs([])}
                                                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                        title={t('client.clearLogs')}
                                                    >
                                                        {t('client.clearLogs')}
                                                    </button>
                                                )}
                                            </div>

                                            {/* 生成状态概览 */}
                                            <div className="mb-4 flex-shrink-0">
                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {t('client.currentStepLabel')} {currentStep === 'basic' ? t('client.stepBasic') : currentStep === 'schemes' ? t('client.stepSchemes') : t('client.stepComplete')}
                                                </div>

                                                {/* 进度条 */}
                                                {currentStep === 'schemes' && Object.keys(generationStatus).length > 0 && (
                                                    <div className="mb-3">
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                            {t('client.schemeGenerationProgress')}
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                            {(() => {
                                                                const totalTasks = Object.keys(generationStatus).length * 3;
                                                                const completedTasks = Object.values(generationStatus).reduce((acc, status) => {
                                                                    return acc + (status.example === 'completed' ? 1 : 0) +
                                                                        (status.tailwind === 'completed' ? 1 : 0) +
                                                                        (status.bootstrap === 'completed' ? 1 : 0);
                                                                }, 0);
                                                                const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                                                                return (
                                                                    <div
                                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                                        style={{ width: `${progress}%` }}
                                                                    />
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {(() => {
                                                                const totalTasks = Object.keys(generationStatus).length * 3;
                                                                const completedTasks = Object.values(generationStatus).reduce((acc, status) => {
                                                                    return acc + (status.example === 'completed' ? 1 : 0) +
                                                                        (status.tailwind === 'completed' ? 1 : 0) +
                                                                        (status.bootstrap === 'completed' ? 1 : 0);
                                                                }, 0);
                                                                return t('client.tasksCompleted', { completedTasks, totalTasks });
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}

                                                {Object.entries(generationStatus).map(([theory, status]) => (
                                                    <div key={theory} className="mb-2">
                                                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                            {theory}
                                                        </div>
                                                        <div className="flex gap-2 mt-1">
                                                            {(['example', 'tailwind', 'bootstrap'] as const).map(task => (
                                                                <button
                                                                    key={task}
                                                                    onClick={() => status[task] === 'error' && retryTask(theory, task)}
                                                                    disabled={status[task] !== 'error'}
                                                                    className={`px-2 py-1 text-xs rounded ${status[task] === 'completed'
                                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                        : status[task] === 'generating'
                                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                            : status[task] === 'error'
                                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 cursor-pointer hover:bg-red-200 dark:hover:bg-red-800'
                                                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                                        }`}
                                                                    title={`${task}: ${status[task]}`}
                                                                >
                                                                    {status[task] === 'completed' ? '✓' :
                                                                        status[task] === 'generating' ? '⟳' :
                                                                            status[task] === 'error' ? '✗' : '○'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* AI日志列表 */}
                                            <div ref={aiLogsRef} className="flex-1 overflow-y-auto space-y-2">
                                                {aiLogs.length > 0 ? (
                                                    aiLogs.map((log, index) => (
                                                        <div
                                                            key={index}
                                                            className={`text-sm p-2 rounded ${log.type === 'success'
                                                                ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200 border-l-4 border-green-400'
                                                                : log.type === 'error'
                                                                    ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 border-l-4 border-red-400'
                                                                    : log.type === 'progress'
                                                                        ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 border-l-4 border-blue-400'
                                                                        : log.type === 'stream_content'
                                                                            ? 'bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200 border-l-4 border-purple-400'
                                                                            : log.type === 'retry'
                                                                                ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 border-l-4 border-yellow-400'
                                                                                : log.message.includes('===')
                                                                                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200 border-l-4 border-gray-400 font-semibold'
                                                                                    : 'bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <span className="flex-1">{log.message}</span>
                                                                <span className="text-xs opacity-70 ml-2">
                                                                    {log.timestamp.toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                            {log.theory && (
                                                                <div className="text-xs opacity-70 mt-1">
                                                                    <span className="font-medium">{log.theory}</span> {log.task && <span>- {log.task}</span>}
                                                                </div>
                                                            )}
                                                            {log.content && (
                                                                <div className="text-xs opacity-70 mt-1 font-mono">
                                                                    {log.content}
                                                                </div>
                                                            )}
                                                            {log.attempt && log.maxAttempts && (
                                                                <div className="text-xs opacity-70 mt-1">
                                                                    重试进度: {log.attempt}/{log.maxAttempts}
                                                                </div>
                                                            )}
                                                            {log.error && (
                                                                <div className="text-xs opacity-70 mt-1 font-mono bg-red-100 dark:bg-red-900/30 p-1 rounded">
                                                                    <div className="font-semibold">错误详情:</div>
                                                                    <div className="break-all">{log.error}</div>
                                                                </div>
                                                            )}
                                                            {log.rawResponse && (
                                                                <details className="text-xs opacity-70 mt-1">
                                                                    <summary className="cursor-pointer font-semibold">查看原始响应</summary>
                                                                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 font-mono break-all max-h-32 overflow-y-auto">
                                                                        {log.rawResponse}
                                                                    </div>
                                                                </details>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                                        {t('client.noLogs')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 错误处理 */}
                    <AnimatePresence>
                        {isError && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8"
                            >
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <div className="text-red-800 dark:text-red-200 mb-4">
                                        <h3 className="text-lg font-semibold mb-2">
                                            {isJsonFormatError ? t('client.jsonFormatErrorTitle') : t('client.generationFailedTitle')}
                                        </h3>
                                        <p>{aiLogs[aiLogs.length - 1]?.message || '未知错误'}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleGenerate(lastGeneratedHex, true)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                                        >
                                            {t('client.regenerate')}
                                        </button>
                                        {showUpgradeButton && (
                                            <button
                                                onClick={() => router.push('/pricing')}
                                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                                            >
                                                {t('generatePage.upgradeButton')}
                                            </button>
                                        )}
                                    </div>

                                    {/* 显示详细错误信息 */}
                                    {aiLogs[aiLogs.length - 1]?.error && (
                                        <details className="mt-4">
                                            <summary className="cursor-pointer text-sm font-medium text-red-700 dark:text-red-300">
                                                {t('client.viewErrorDetails')}
                                            </summary>
                                            <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded text-sm font-mono break-all">
                                                {aiLogs[aiLogs.length - 1]?.error}
                                            </div>
                                        </details>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </Suspense>
    );
} 