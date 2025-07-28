import { TbDeviceDesktop, TbDeviceMobile, TbReload, TbDownload } from "react-icons/tb";
import { useMemo, useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import CodeSnippet from './CodeSnippet';

// 定义颜色方案类型
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

// 从 ColorDetailContent 复制 AiColor 类型以确保类型安全
type AiColor = {
    id: string;
    hex: string;
    aiJson: string;
    exampleComp?: string | null;
    exampleAnal?: string | null;
    exampleTria?: string | null;
    exampleMono?: string | null;
    exampleSpCo?: string | null;
    previewComp?: string | null;
    previewAnal?: string | null;
    previewTria?: string | null;
    previewMono?: string | null;
    previewSpCo?: string | null;
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


type SchemePreviewPanelProps = {
    scheme: ColorScheme;
    previewMode: "desktop" | "mobile";
    setPreviewMode: (mode: "desktop" | "mobile") => void;
    exampleUrls: { [key: string]: string };
    previewUrls?: { [key: string]: string }; // 添加预览图片URL
    isGeneratingExamples: { [key: string]: boolean };
    regenerateExample: (scheme: ColorScheme) => void;
    getSchemeKey: (theory: string) => string;
    hex: string;
    colorRecord: AiColor; // 新增属性
    onSchemeUpdate: (updatedScheme: ColorScheme) => void;
};

export default function SchemePreviewPanel({
    scheme,
    previewMode,
    setPreviewMode,
    exampleUrls,
    previewUrls = {},
    isGeneratingExamples,
    regenerateExample,
    getSchemeKey,
    hex,
    colorRecord,
    onSchemeUpdate
}: SchemePreviewPanelProps) {
    const t = useTranslations('components.schemePreview');
    const [regeneratingConfigs, setRegeneratingConfigs] = useState<{
        tailwind: boolean;
        bootstrap: boolean;
    }>({ tailwind: false, bootstrap: false });

    // 默认显示预览图片，如果没有图片则显示iframe
    const [viewMode, setViewMode] = useState<'preview' | 'iframe'>('preview');
    // 跟踪图片加载错误状态
    const [imageLoadError, setImageLoadError] = useState<{ [key: string]: boolean }>({});

    // 用于存储从URL加载的代码
    const [tailwindCode, setTailwindCode] = useState<string | null>(null);
    const [bootstrapCode, setBootstrapCode] = useState<string | null>(null);
    const [isLoadingCode, setIsLoadingCode] = useState(true);

    // 当有新的预览图片URL时，重置图片加载错误状态并切换到预览模式
    useEffect(() => {
        const key = getSchemeKey(scheme.theory);
        if (previewUrls[key] && !imageLoadError[key]) {
            setViewMode('preview');
        }
    }, [previewUrls, scheme.theory, getSchemeKey, imageLoadError]);

    // 从URL加载Tailwind和Bootstrap代码
    useEffect(() => {
        const getCodeKey = (theory: string, type: 'tailwind' | 'bootstrap'): keyof AiColor | null => {
            const keyMap: { [key: string]: keyof AiColor } = {
                "Complementary": type === 'tailwind' ? "tailwindComp" : "bootstrapComp",
                "Analogous": type === 'tailwind' ? "tailwindAnal" : "bootstrapAnal",
                "Triadic": type === 'tailwind' ? "tailwindTria" : "bootstrapTria",
                "Monochromatic": type === 'tailwind' ? "tailwindMono" : "bootstrapMono",
                "Split-Complementary": type === 'tailwind' ? "tailwindSpCo" : "bootstrapSpCo",
            };
            return keyMap[theory] || null;
        }

        const fetchCode = async () => {
            setIsLoadingCode(true);
            const tailwindKey = getCodeKey(scheme.theory, 'tailwind');
            const bootstrapKey = getCodeKey(scheme.theory, 'bootstrap');

            const fetchAndSetCode = async (key: keyof AiColor | null, setCode: (code: string | null) => void) => {
                if (key && colorRecord[key]) {
                    try {
                        const response = await fetch(colorRecord[key] as string);
                        if (response.ok) {
                            setCode(await response.text());
                        } else {
                            setCode(null);
                        }
                    } catch (error) {
                        console.error(`Failed to fetch config for ${key}`, error);
                        setCode(null);
                    }
                } else {
                    setCode(null);
                }
            };

            await Promise.all([
                fetchAndSetCode(tailwindKey, setTailwindCode),
                fetchAndSetCode(bootstrapKey, setBootstrapCode)
            ]);

            setIsLoadingCode(false);
        };

        fetchCode();
    }, [scheme.theory, colorRecord]);


    // 重新生成配置文件的函数
    const regenerateConfig = async (configType: 'tailwind' | 'bootstrap') => {
        setRegeneratingConfigs(prev => ({ ...prev, [configType]: true }));

        try {
            const response = await fetch('/api/colors/regenerate-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    hex: hex,
                    configType: configType,
                    theory: scheme.theory
                }),
            });

            const data = await response.json();

            if (data.success) {
                // 更新scheme数据
                const updatedScheme = { ...scheme };
                if (configType === 'tailwind') {
                    updatedScheme.tailwindConfig = data.config;
                    setTailwindCode(data.config); // 直接更新显示的代码
                } else if (configType === 'bootstrap') {
                    updatedScheme.bootstrap5CustomVariables = data.config;
                    setBootstrapCode(data.config); // 直接更新显示的代码
                }

                // 通知父组件更新scheme
                onSchemeUpdate(updatedScheme);
            } else {
                console.error('重新生成配置失败:', data.error);
                alert('重新生成配置失败，请稍后重试');
            }
        } catch (error) {
            console.error('重新生成配置请求失败:', error);
            alert('重新生成配置失败，请稍后重试');
        } finally {
            setRegeneratingConfigs(prev => ({ ...prev, [configType]: false }));
        }
    };

    // 使用代理URL获取HTML内容
    const proxyUrl = useMemo(() => {
        const key = getSchemeKey(scheme.theory);
        const originalUrl = exampleUrls[key];

        if (!originalUrl) return '';

        // 使用代理API
        return `/api/colors/preview?url=${encodeURIComponent(originalUrl)}`;
    }, [exampleUrls, getSchemeKey, scheme.theory]);

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{t('title')}</h3>
                <div className="flex items-center space-x-2">
                    {/* 视图模式切换 - 只有当有预览图片且没有加载错误时才显示切换按钮 */}
                    {(() => {
                        const currentKey = getSchemeKey(scheme.theory);
                        const currentPreviewUrl = previewUrls[currentKey];
                        const hasImageError = imageLoadError[currentKey];

                        if (currentPreviewUrl && !hasImageError) {
                            const isShowingImage = viewMode !== 'iframe';
                            return (
                                <div className="flex border rounded overflow-hidden">
                                    <button
                                        onClick={() => setViewMode('preview')}
                                        className={`px-3 py-1 text-xs ${isShowingImage ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                        title="预览图片"
                                    >
                                        图片
                                    </button>
                                    <button
                                        onClick={() => setViewMode('iframe')}
                                        className={`px-3 py-1 text-xs ${!isShowingImage ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                        title="交互式预览"
                                    >
                                        实时
                                    </button>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {/* 下载链接 */}
                    {exampleUrls[getSchemeKey(scheme.theory)] && (
                        <a
                            href={`/api/colors/download?url=${encodeURIComponent(exampleUrls[getSchemeKey(scheme.theory)])}&fileName=${encodeURIComponent(`${scheme.theory}-example.html`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded hover:bg-gray-100"
                            title={t('downloadHtml')}
                        >
                            <TbDownload className="w-5 h-5" />
                        </a>
                    )}

                    {/* 桌面/移动端切换（仅在iframe模式下显示） */}
                    {(() => {
                        const currentKey = getSchemeKey(scheme.theory);
                        const currentPreviewUrl = previewUrls[currentKey];
                        const hasImageError = imageLoadError[currentKey];
                        const isShowingIframe = viewMode === 'iframe' || !currentPreviewUrl || hasImageError;

                        if (isShowingIframe) {
                            return (
                                <>
                                    <button
                                        onClick={() => setPreviewMode("desktop")}
                                        className={`p-2 rounded ${previewMode === "desktop" ? "bg-gray-200" : "hover:bg-gray-100"}`}
                                        title={t('desktopView')}
                                    >
                                        <TbDeviceDesktop className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setPreviewMode("mobile")}
                                        className={`p-2 rounded ${previewMode === "mobile" ? "bg-gray-200" : "hover:bg-gray-100"}`}
                                        title={t('mobileView')}
                                    >
                                        <TbDeviceMobile className="w-5 h-5" />
                                    </button>
                                </>
                            );
                        }
                        return null;
                    })()}

                    <button
                        onClick={() => regenerateExample(scheme)}
                        disabled={isGeneratingExamples[getSchemeKey(scheme.theory)]}
                        className="p-2 rounded hover:bg-gray-100"
                        title={t('regenerateExample')}
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
                ) : (() => {
                    const key = getSchemeKey(scheme.theory);
                    const url = exampleUrls[key];
                    const previewUrl = previewUrls[key];
                    const hasImageError = imageLoadError[key];

                    console.log(`🔍 SchemePreviewPanel 显示逻辑 - ${scheme.theory}:`, {
                        key,
                        previewUrl,
                        allPreviewUrls: previewUrls,
                        hasImageError,
                        viewMode,
                        condition: previewUrl && !hasImageError && viewMode !== 'iframe'
                    });

                    if (url) {
                        // 优先显示逻辑：
                        // 1. 如果有预览图片且没有加载错误且不是用户明确选择iframe模式，显示图片
                        // 2. 其他情况显示iframe

                        if (previewUrl && !hasImageError && viewMode !== 'iframe') {
                            // 优先显示预览图片
                            return (
                                <div className="bg-gray-50 p-4">
                                    <img
                                        src={previewUrl}
                                        alt={`${scheme.theory} 预览图`}
                                        className="w-full h-auto rounded shadow-lg"
                                        onError={(e) => {
                                            console.error('预览图片加载失败:', previewUrl);
                                            // 标记此图片加载失败，自动切换到iframe模式
                                            setImageLoadError(prev => ({ ...prev, [key]: true }));
                                        }}
                                        onLoad={() => {
                                            console.log('预览图片加载成功:', previewUrl);
                                            // 图片加载成功时清除错误状态
                                            setImageLoadError(prev => ({ ...prev, [key]: false }));
                                        }}
                                    />
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        配色方案预览图片 - 点击&ldquo;实时&rdquo;查看交互式页面
                                    </p>
                                </div>
                            );
                        } else {
                            // 显示iframe（没有图片、图片加载失败或用户选择实时模式）
                            return (
                                <iframe
                                    src={proxyUrl}
                                    className={`w-full ${previewMode === "mobile" ? "h-[600px]" : "h-[800px]"}`}
                                    title={`${scheme.theory} Example`}
                                    sandbox="allow-scripts allow-same-origin"
                                ></iframe>
                            );
                        }
                    } else {
                        return (
                            <div className="bg-gray-50 h-64 flex items-center justify-center">
                                <p className="text-gray-500">{t('loadFailed')}</p>
                            </div>
                        );
                    }
                })()}
            </div>

            {/* Code Snippets */}
            {isLoadingCode ? (
                <div className="bg-gray-50 h-24 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {tailwindCode && (
                        <CodeSnippet
                            language="javascript"
                            code={tailwindCode}
                            fileName="tailwind.config.js"
                            title="Tailwind CSS Config"
                            onRegenerate={() => regenerateConfig('tailwind')}
                            isRegenerating={regeneratingConfigs.tailwind}
                        />
                    )}

                    {bootstrapCode && (
                        <CodeSnippet
                            language="scss"
                            code={bootstrapCode}
                            fileName="_custom-variables.scss"
                            title="Bootstrap 5 Custom Variables"
                            onRegenerate={() => regenerateConfig('bootstrap')}
                            isRegenerating={regeneratingConfigs.bootstrap}
                        />
                    )}
                </>
            )}

        </div>
    );
} 