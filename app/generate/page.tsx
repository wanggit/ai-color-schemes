"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sketch } from "@uiw/react-color";
import { motion, AnimatePresence } from "framer-motion";
import { TbDeviceDesktop, TbDeviceMobile, TbReload } from "react-icons/tb";
import { useAuth } from "@/hooks/useAuth";

// 定义颜色方案类型
type ColorScheme = {
    theory: string;
    colors: string[];
    description: string;
    uiApplication: string;
    strengths: string;
    recommendedRatio: string;
    bestFor: string;
};

// 定义颜色分析类型
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

export default function GenerateColorPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const { checkAuth } = useAuth();

    // 状态管理
    const [colorHex, setColorHex] = useState("#132c33");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const [isStreamingData, setIsStreamingData] = useState(false);
    const [aiResponse, setAiResponse] = useState<ColorAnalysis | null>(null);
    const [activeTab, setActiveTab] = useState("analysis");
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
    const [exampleUrls, setExampleUrls] = useState<{ [key: string]: string }>({});
    const [isGeneratingExamples, setIsGeneratingExamples] = useState<{ [key: string]: boolean }>({});
    const streamData = useRef("");

    // 处理生成按钮点击
    const handleGenerate = async () => {
        // 检查用户是否登录以及使用次数是否超限
        const authCheck = await checkAuth();
        if (!authCheck.success) {
            return;
        }

        setIsGenerating(true);
        setIsStreamingData(true);
        streamData.current = "";

        try {
            // 请求API生成配色方案
            const response = await fetch("/api/colors", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ hex: colorHex }),
            });

            if (!response.ok) {
                throw new Error("生成配色方案失败");
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("无法读取响应流");
            }

            // 处理流式响应
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder("utf-8").decode(value);
                streamData.current += chunk;

                try {
                    // 尝试解析JSON
                    const jsonData = JSON.parse(streamData.current) as ColorAnalysis;
                    setAiResponse(jsonData);
                } catch (e) {
                    // JSON不完整，继续等待更多数据
                }
            }

            setIsStreamingData(false);
            setIsGenerated(true);

            // 解析完整JSON
            try {
                const jsonData = JSON.parse(streamData.current) as ColorAnalysis;
                setAiResponse(jsonData);

                // 等待生成示例HTML
                await generateExamples(jsonData);
            } catch (e) {
                console.error("解析JSON失败", e);
            }
        } catch (error) {
            console.error("生成配色方案失败:", error);
            setIsStreamingData(false);
        } finally {
            setIsGenerating(false);
        }
    };

    // 生成配色方案示例HTML
    const generateExamples = async (data: ColorAnalysis) => {
        if (!data?.colorAnalysis?.colorSchemes) return;

        const schemes = data.colorAnalysis.colorSchemes;
        const tempUrls: { [key: string]: string } = {};
        const tempGenerating: { [key: string]: boolean } = {};

        // 初始化生成状态
        schemes.forEach((scheme) => {
            const key = getSchemeKey(scheme.theory);
            tempGenerating[key] = true;
        });

        setIsGeneratingExamples(tempGenerating);

        // 并发生成示例
        await Promise.all(
            schemes.map(async (scheme) => {
                const key = getSchemeKey(scheme.theory);

                try {
                    const response = await fetch("/api/colors/example", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            scheme,
                            hex: colorHex
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`生成${scheme.theory}示例失败`);
                    }

                    const { url } = await response.json();
                    tempUrls[key] = url;
                } catch (error) {
                    console.error(`生成${scheme.theory}示例失败:`, error);
                } finally {
                    tempGenerating[key] = false;
                }
            })
        );

        setExampleUrls(tempUrls);
        setIsGeneratingExamples(tempGenerating);
    };

    // 单独重新生成某个方案的示例
    const regenerateExample = async (scheme: ColorScheme) => {
        if (!scheme) return;

        const key = getSchemeKey(scheme.theory);
        const tempGenerating = { ...isGeneratingExamples };
        tempGenerating[key] = true;

        setIsGeneratingExamples(tempGenerating);

        try {
            const response = await fetch("/api/colors/example", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    scheme,
                    hex: colorHex,
                    regenerate: true
                }),
            });

            if (!response.ok) {
                throw new Error(`重新生成${scheme.theory}示例失败`);
            }

            const { url } = await response.json();

            setExampleUrls({
                ...exampleUrls,
                [key]: url
            });
        } catch (error) {
            console.error(`重新生成${scheme.theory}示例失败:`, error);
        } finally {
            const newGenerating = { ...isGeneratingExamples };
            newGenerating[key] = false;
            setIsGeneratingExamples(newGenerating);
        }
    };

    // 获取方案对应的键名
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

    // 获取方案对应的展示名称
    const getSchemeName = (theory: string): string => {
        switch (theory) {
            case "Complementary": return "互补色";
            case "Analogous": return "类似色";
            case "Triadic": return "三元色";
            case "Monochromatic": return "单色调";
            case "Split-Complementary": return "分裂互补色";
            default: return theory;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <AnimatePresence>
                    {/* 输入区域 */}
                    <motion.div
                        key="input-section"
                        className={`flex flex-col items-center justify-center ${isGenerated ? "mt-4" : "mt-40"}`}
                        initial={isGenerated ? { y: 0 } : { y: 0 }}
                        animate={isGenerated ? { y: 0 } : { y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
                            <h1 className={`text-center ${isGenerated ? "text-2xl" : "text-3xl"} font-bold mb-6`}>
                                AI配色方案生成器
                            </h1>

                            <div className="flex flex-col gap-4">
                                <div className="w-full">
                                    <Sketch
                                        color={colorHex}
                                        onChange={(color) => {
                                            setColorHex(color.hex);
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                                >
                                    {isGenerating ? "生成中..." : "生成"}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* 结果区域 */}
                    {isGenerated && (
                        <motion.div
                            key="result-section"
                            className="mt-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                                {/* 选项卡 */}
                                <div className="flex border-b">
                                    <button
                                        onClick={() => setActiveTab("analysis")}
                                        className={`flex-1 py-4 px-6 text-center border-r ${activeTab === "analysis" ? "bg-blue-50 border-b-2 border-blue-500" : ""
                                            }`}
                                    >
                                        颜色分析
                                    </button>

                                    {aiResponse?.colorAnalysis?.colorSchemes?.map((scheme) => (
                                        <button
                                            key={scheme.theory}
                                            onClick={() => setActiveTab(scheme.theory)}
                                            className={`flex-1 py-4 px-6 text-center border-r ${activeTab === scheme.theory ? "bg-blue-50 border-b-2 border-blue-500" : ""
                                                }`}
                                        >
                                            {getSchemeName(scheme.theory)}
                                        </button>
                                    ))}
                                </div>

                                {/* 选项卡内容 */}
                                <div className="p-6">
                                    {/* 颜色分析选项卡 */}
                                    {activeTab === "analysis" && aiResponse && (
                                        <div className="space-y-6">
                                            <div className="flex items-center space-x-4">
                                                <div
                                                    className="w-16 h-16 rounded-full"
                                                    style={{ backgroundColor: aiResponse.colorAnalysis.hexValue }}
                                                ></div>
                                                <div>
                                                    <h3 className="text-lg font-medium">
                                                        {aiResponse.colorAnalysis.hexValue}
                                                    </h3>
                                                    <p className="text-gray-600">
                                                        {aiResponse.colorAnalysis.colorSystem.hueFamily} - {aiResponse.colorAnalysis.colorSystem.toneCategory}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-medium mb-2">颜色含义</h3>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {aiResponse.colorAnalysis.meaningAndEmotion.generalInterpretation.map((meaning, idx) => (
                                                        <li key={idx}>{meaning}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-medium mb-2">情感概述</h3>
                                                <p>{aiResponse.colorAnalysis.meaningAndEmotion.emotionalSummary}</p>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-medium mb-2">文化背景</h3>
                                                <div className="space-y-2">
                                                    <p><strong>西方:</strong> {aiResponse.colorAnalysis.meaningAndEmotion.culturalContext.western}</p>
                                                    <p><strong>东方:</strong> {aiResponse.colorAnalysis.meaningAndEmotion.culturalContext.eastern}</p>
                                                    <p><strong>UI应用:</strong> {aiResponse.colorAnalysis.meaningAndEmotion.culturalContext.uiApplications}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-medium mb-2">注意事项</h3>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {aiResponse.colorAnalysis.meaningAndEmotion.culturalContext.cautions.map((caution, idx) => (
                                                        <li key={idx}>{caution}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* 配色方案选项卡 */}
                                    {activeTab !== "analysis" && aiResponse?.colorAnalysis?.colorSchemes && (
                                        <div>
                                            {aiResponse.colorAnalysis.colorSchemes
                                                .filter(scheme => scheme.theory === activeTab)
                                                .map(scheme => (
                                                    <div key={scheme.theory} className="space-y-6">
                                                        {/* 颜色展示 */}
                                                        <div className="flex space-x-2">
                                                            {scheme.colors.map((color, idx) => (
                                                                <div key={idx} className="flex-1">
                                                                    <div
                                                                        className="h-20 rounded-md mb-2"
                                                                        style={{ backgroundColor: color }}
                                                                    ></div>
                                                                    <p className="text-xs text-center font-mono">{color}</p>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* 方案信息 */}
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h3 className="text-lg font-medium mb-1">描述</h3>
                                                                <p className="text-gray-700">{scheme.description}</p>
                                                            </div>

                                                            <div>
                                                                <h3 className="text-lg font-medium mb-1">UI应用</h3>
                                                                <p className="text-gray-700">{scheme.uiApplication}</p>
                                                            </div>

                                                            <div>
                                                                <h3 className="text-lg font-medium mb-1">优势</h3>
                                                                <p className="text-gray-700">{scheme.strengths}</p>
                                                            </div>

                                                            <div>
                                                                <h3 className="text-lg font-medium mb-1">推荐比例</h3>
                                                                <p className="text-gray-700">{scheme.recommendedRatio}</p>
                                                            </div>

                                                            <div>
                                                                <h3 className="text-lg font-medium mb-1">最适用于</h3>
                                                                <p className="text-gray-700">{scheme.bestFor}</p>
                                                            </div>
                                                        </div>

                                                        {/* 示例预览 */}
                                                        <div className="mt-6">
                                                            <div className="flex justify-between items-center mb-4">
                                                                <h3 className="text-lg font-medium">示例预览</h3>
                                                                <div className="flex items-center space-x-2">
                                                                    <button
                                                                        onClick={() => setPreviewMode("desktop")}
                                                                        className={`p-2 rounded ${previewMode === "desktop" ? "bg-gray-200" : "hover:bg-gray-100"}`}
                                                                        title="桌面视图"
                                                                    >
                                                                        <TbDeviceDesktop className="w-5 h-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setPreviewMode("mobile")}
                                                                        className={`p-2 rounded ${previewMode === "mobile" ? "bg-gray-200" : "hover:bg-gray-100"}`}
                                                                        title="移动端视图"
                                                                    >
                                                                        <TbDeviceMobile className="w-5 h-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => regenerateExample(scheme)}
                                                                        disabled={isGeneratingExamples[getSchemeKey(scheme.theory)]}
                                                                        className="p-2 rounded hover:bg-gray-100"
                                                                        title="重新生成示例"
                                                                    >
                                                                        <TbReload className={`w-5 h-5 ${isGeneratingExamples[getSchemeKey(scheme.theory)] ? "animate-spin" : ""}`} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* 预览框架 */}
                                                            <div className={`border rounded-lg overflow-hidden ${previewMode === "mobile" ? "max-w-xs mx-auto" : "w-full"}`}>
                                                                <div className="bg-gray-800 text-white text-xs p-2 flex justify-between items-center">
                                                                    <div className="flex space-x-2">
                                                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                                    </div>
                                                                    <div className="font-mono">
                                                                        {previewMode === "mobile" ? "Mobile View" : "Desktop View"}
                                                                    </div>
                                                                </div>

                                                                {isGeneratingExamples[getSchemeKey(scheme.theory)] ? (
                                                                    <div className="bg-gray-50 h-64 flex items-center justify-center">
                                                                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                                                                    </div>
                                                                ) : exampleUrls[getSchemeKey(scheme.theory)] ? (
                                                                    <iframe
                                                                        src={exampleUrls[getSchemeKey(scheme.theory)]}
                                                                        className={`w-full ${previewMode === "mobile" ? "h-[600px]" : "h-[500px]"}`}
                                                                        title={`${scheme.theory} Example`}
                                                                    ></iframe>
                                                                ) : (
                                                                    <div className="bg-gray-50 h-64 flex items-center justify-center">
                                                                        <p className="text-gray-500">示例加载失败</p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* 下载链接 */}
                                                            {exampleUrls[getSchemeKey(scheme.theory)] && (
                                                                <div className="mt-4 text-center">
                                                                    <a
                                                                        href={exampleUrls[getSchemeKey(scheme.theory)]}
                                                                        download={`${scheme.theory}-example.html`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-600 hover:underline"
                                                                    >
                                                                        下载HTML示例
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
} 