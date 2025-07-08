import { TbDeviceDesktop, TbDeviceMobile, TbReload, TbDownload } from "react-icons/tb";
import { useMemo, useState } from "react";
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

type SchemePreviewPanelProps = {
    scheme: ColorScheme;
    previewMode: "desktop" | "mobile";
    setPreviewMode: (mode: "desktop" | "mobile") => void;
    exampleUrls: { [key: string]: string };
    isGeneratingExamples: { [key: string]: boolean };
    regenerateExample: (scheme: ColorScheme) => void;
    getSchemeKey: (theory: string) => string;
    hex: string;
    onSchemeUpdate: (updatedScheme: ColorScheme) => void;
};

export default function SchemePreviewPanel({
    scheme,
    previewMode,
    setPreviewMode,
    exampleUrls,
    isGeneratingExamples,
    regenerateExample,
    getSchemeKey,
    hex,
    onSchemeUpdate
}: SchemePreviewPanelProps) {
    const t = useTranslations('components.schemePreview');
    const [regeneratingConfigs, setRegeneratingConfigs] = useState<{
        tailwind: boolean;
        bootstrap: boolean;
    }>({ tailwind: false, bootstrap: false });

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
                } else if (configType === 'bootstrap') {
                    updatedScheme.bootstrap5CustomVariables = data.config;
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
                    console.log(`🔍 SchemePreviewPanel iframe检查 - ${scheme.theory}, key: ${key}, url: ${url}, proxyUrl: ${proxyUrl}`);

                    if (url) {
                        return (
                            <iframe
                                src={proxyUrl}
                                className={`w-full ${previewMode === "mobile" ? "h-[600px]" : "h-[800px]"}`}
                                title={`${scheme.theory} Example`}
                                sandbox="allow-scripts allow-same-origin"
                            ></iframe>
                        );
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
            {(() => {
                console.log('🔍 调试信息:', {
                    hasTailwindConfig: !!scheme.tailwindConfig,
                    tailwindConfigLength: scheme.tailwindConfig?.length,
                    hasBootstrapConfig: !!scheme.bootstrap5CustomVariables,
                    bootstrapConfigLength: scheme.bootstrap5CustomVariables?.length,
                    schemeTheory: scheme.theory
                });
                return null;
            })()}

            {scheme.tailwindConfig && (
                <CodeSnippet
                    language="javascript"
                    code={scheme.tailwindConfig}
                    fileName="tailwind.config.js"
                    title="Tailwind CSS Config"
                    onRegenerate={() => regenerateConfig('tailwind')}
                    isRegenerating={regeneratingConfigs.tailwind}
                />
            )}

            {scheme.bootstrap5CustomVariables && (
                <CodeSnippet
                    language="scss"
                    code={scheme.bootstrap5CustomVariables}
                    fileName="_custom-variables.scss"
                    title="Bootstrap 5 Custom Variables"
                    onRegenerate={() => regenerateConfig('bootstrap')}
                    isRegenerating={regeneratingConfigs.bootstrap}
                />
            )}

        </div>
    );
} 