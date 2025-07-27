"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import GradientBackground from '@/app/components/GradientBackground';

// Define types for the data
type Scheme = {
    theory: string;
    colors: string[];
    description: string;
    uiApplication: string;
    strengths: string;
    recommendedRatio: string;
    bestFor: string;
    url: string;
};

type ColorData = {
    id: string;
    hex: string;
    schemes: Scheme[];
    total: number;
    currentPage: number;
};

export default function ExamplePage() {
    const t = useTranslations('examplePage');
    const [colorData, setColorData] = useState<ColorData | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [schemeIndex, setSchemeIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [likes, setLikes] = useState(0);
    const [likedSchemes, setLikedSchemes] = useState<Record<string, boolean>>({});
    const [iframeHeight, setIframeHeight] = useState(900); // 默认高度
    const [iframeLoading, setIframeLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/colors/example?page=${page}`);
                if (!response.ok) {
                    throw new Error(t('fetchError'));
                }
                const data = await response.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                setColorData(data);
                setSchemeIndex(0);
            } catch (err: any) {
                setError(err.message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [page]);

    const currentScheme = colorData?.schemes[schemeIndex];

    // 当方案变化时重置iframe高度和加载状态
    useEffect(() => {
        setIframeHeight(900); // 重置为默认高度
        setIframeLoading(true); // 重置加载状态
    }, [currentScheme?.url]);

    useEffect(() => {
        if (currentScheme?.url) {
            const fetchLikes = async () => {
                try {
                    const response = await fetch(`/api/likes?url=${encodeURIComponent(currentScheme.url)}`);
                    if (response.ok) {
                        const data = await response.json();
                        setLikes(data.likes);
                    }
                } catch (err) {
                    console.error('Failed to fetch likes', err);
                }
            };
            fetchLikes();
        }
    }, [currentScheme]);

    const handleNextColor = () => {
        if (colorData && colorData.total > 0) {
            const nextPage = page >= colorData.total ? 1 : page + 1;
            setPage(nextPage);
        }
    };

    const handleNextScheme = () => {
        if (colorData && schemeIndex < colorData.schemes.length - 1) {
            setSchemeIndex(prevIndex => prevIndex + 1);
        } else {
            handleNextColor();
        }
    };

    const handlePrevScheme = () => {
        if (schemeIndex > 0) {
            setSchemeIndex(prevIndex => prevIndex - 1);
        }
    };

    const handleLike = async () => {
        if (!currentScheme?.url || likedSchemes[currentScheme.url]) {
            return;
        }

        setLikedSchemes(prev => ({ ...prev, [currentScheme.url]: true }));
        setLikes(prev => prev + 1);

        try {
            await fetch('/api/likes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: currentScheme.url }),
            });
        } catch (err) {
            console.error('Failed to like scheme', err);
            // Revert optimistic update on error
            setLikedSchemes(prev => {
                const newState = { ...prev };
                delete newState[currentScheme.url];
                return newState;
            });
            setLikes(prev => prev - 1);
        }
    };

    const handleIframeLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
        const iframe = event.currentTarget;
        try {
            // 等待iframe完全加载后再获取高度
            setTimeout(() => {
                try {
                    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDocument) {
                        // 获取文档的实际高度
                        const height = Math.max(
                            iframeDocument.body?.scrollHeight || 0,
                            iframeDocument.body?.offsetHeight || 0,
                            iframeDocument.documentElement?.clientHeight || 0,
                            iframeDocument.documentElement?.scrollHeight || 0,
                            iframeDocument.documentElement?.offsetHeight || 0
                        );

                        // 设置最小高度为900px，最大高度为2600px
                        const minHeight = 900;
                        const maxHeight = 2600;
                        const finalHeight = Math.min(Math.max(height, minHeight), maxHeight);

                        setIframeHeight(finalHeight);
                    }
                } catch (error) {
                    console.log('无法访问iframe内容，使用默认高度');
                    setIframeHeight(900); // 如果无法访问，使用较大的默认高度
                }

                // 设置加载完成
                setIframeLoading(false);
            }, 800); // 增加延迟到800ms，确保内容完全渲染
        } catch (error) {
            console.log('iframe加载错误，使用默认高度');
            setIframeHeight(900);
            setIframeLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 text-white">
            <GradientBackground />
            <div className="relative z-10 w-full container mx-auto px-4 py-8">
                <h1 className="text-3xl sm:text-5xl font-bold my-8 text-center text-gray-800">{t('title')}</h1>

                {loading && (
                    <div className="flex justify-center items-center h-96">
                        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                )}

                {error && <p className="text-red-500 text-center">{error}</p>}

                {!loading && !error && colorData && colorData.schemes.length > 0 && currentScheme && (
                    <div className="w-full">
                        <div className="relative bg-black/20 p-4 sm:p-6 rounded-2xl shadow-2xl backdrop-blur-lg border border-white/10">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                                <div className="flex items-center gap-4 mb-2 sm:mb-0">
                                    <h2 className="text-2xl font-semibold">{currentScheme.theory} ({t('basedOn')} {colorData.hex})</h2>
                                    <button
                                        onClick={handleLike}
                                        disabled={likedSchemes[currentScheme.url]}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white transition-colors disabled:cursor-not-allowed bg-pink-500/20 hover:bg-pink-500/40 disabled:bg-pink-500/50"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${likedSchemes[currentScheme.url] ? 'text-pink-900 fill-current' : 'text-white'}`} viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                        </svg>
                                        <span>{likes}</span>
                                    </button>
                                </div>
                                {colorData.schemes.length > 1 && (
                                    <div className="flex items-center space-x-2">
                                        <button onClick={handlePrevScheme} disabled={schemeIndex === 0} className="px-4 py-2 bg-purple-600 rounded-md disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors hover:bg-purple-700">
                                            {t('prevButton')}
                                        </button>
                                        <span>{schemeIndex + 1} / {colorData.schemes.length}</span>
                                        <button onClick={handleNextScheme} disabled={!colorData || (page >= colorData.total && schemeIndex === colorData.schemes.length - 1)} className="px-4 py-2 bg-purple-600 rounded-md disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors hover:bg-purple-700">
                                            {t('nextButton')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div
                                className="w-full rounded-lg overflow-hidden border border-white/20 bg-black transition-all duration-500 ease-in-out relative"
                                style={{ height: `${iframeHeight}px` }}
                            >
                                {iframeLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                                            <span className="text-white text-sm">正在加载预览...</span>
                                        </div>
                                    </div>
                                )}
                                <iframe
                                    src={`/api/colors/preview?url=${encodeURIComponent(currentScheme.url)}`}
                                    title={currentScheme.theory}
                                    className="w-full h-full border-0"
                                    sandbox="allow-scripts allow-same-origin"
                                    onLoad={handleIframeLoad}
                                    style={{ height: `${iframeHeight}px` }}
                                />
                            </div>

                            <div className="mt-4 text-left p-2 space-y-2">
                                <p><strong className="font-semibold ">{t('description')}:</strong> {currentScheme.description}</p>
                                <p><strong className="font-semibold ">{t('uiApplication')}:</strong> {currentScheme.uiApplication}</p>
                                <p><strong className="font-semibold ">{t('strengths')}:</strong> {currentScheme.strengths}</p>
                                <p><strong className="font-semibold ">{t('recommendedRatio')}:</strong> {currentScheme.recommendedRatio}</p>
                                <p><strong className="font-semibold ">{t('bestFor')}:</strong> {currentScheme.bestFor}</p>
                            </div>
                            <button
                                onClick={handleNextColor}
                                disabled={!colorData || colorData.total <= 1}
                                className="absolute bottom-4 right-4 px-8 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 disabled:bg-gray-600/50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {t('nextColorButton')}
                            </button>
                        </div>


                    </div>
                )}

                {!loading && !error && (!colorData || colorData.schemes.length === 0) && (
                    <p className="text-center text-xl mt-10">{t('noExamples')}</p>
                )}
            </div>
        </div>
    );
} 