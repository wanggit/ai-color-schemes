"use client";

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import GradientBackground from '@/app/components/GradientBackground';
import CodeModal from '@/app/components/my-schemes/CodeModal';
import html2canvas from 'html2canvas';

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

type ColorDetail = {
    id: string;
    hex: string;
    [key: string]: any; // for other properties like tailwindComp, bootstrapAnal etc.
};

type ColorData = {
    id: string;
    hex: string;
    schemes: Scheme[];
    total: number;
    currentPage: number;
    color: ColorDetail;
};

export default function ExamplePage() {
    const t = useTranslations('examplePage');
    const tMySchemes = useTranslations('mySchemes');
    const [colorData, setColorData] = useState<ColorData | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [schemeIndex, setSchemeIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [likes, setLikes] = useState(0);
    const [likedSchemes, setLikedSchemes] = useState<Record<string, boolean>>({});
    const [iframeHeight, setIframeHeight] = useState(900); // 默认高度
    const [iframeLoading, setIframeLoading] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [modalTitle, setModalTitle] = useState('');
    const [modalLanguage, setModalLanguage] = useState('');
    const iframeRef = useRef<HTMLIFrameElement>(null);

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
                console.log("example Data", data);
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

    const handleShare = async () => {
        if (!iframeRef.current || !currentScheme) {
            console.error('Iframe or current scheme is not available.');
            return;
        }

        setIsSharing(true);

        try {
            const iframeDocument = iframeRef.current.contentDocument;
            if (!iframeDocument) {
                throw new Error('Could not access iframe content.');
            }

            const body = iframeDocument.body;

            // Temporarily set body width to ensure full capture
            const originalWidth = body.style.width;
            body.style.width = '100vw';

            const canvas = await html2canvas(body, {
                useCORS: true,
                allowTaint: true,
                scale: 2, // Increase scale for better quality
                height: body.scrollHeight, // Ensure full height is captured
                windowHeight: body.scrollHeight,
                scrollY: -window.scrollY,
            });

            // Restore original width
            body.style.width = originalWidth;

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    throw new Error('Failed to create blob from canvas.');
                }

                const filename = `color-scheme-${Date.now()}.png`;
                const response = await fetch(`/api/colors/upload-image?filename=${filename}`, {
                    method: 'POST',
                    body: blob,
                });

                if (!response.ok) {
                    throw new Error('Failed to upload image.');
                }

                const newBlob = await response.json();
                const imageUrl = newBlob.url;

                const pinterestUrl = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(
                    window.location.href
                )}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(
                    currentScheme.description || 'Check out this amazing color scheme!'
                )}`;

                window.open(pinterestUrl, '_blank', 'noopener,noreferrer');
                setIsSharing(false);
            }, 'image/png');

        } catch (error) {
            console.error('Sharing failed:', error);
            alert('Failed to share image. Please try again.');
            setIsSharing(false);
        }
    };

    const handleShowCode = async (type: 'tailwind' | 'bootstrap') => {
        if (!currentScheme || !colorData?.color) return;

        const theoryMap: { [key: string]: string } = {
            'Complementary': 'Comp',
            'Analogous': 'Anal',
            'Triadic': 'Tria',
            'Monochromatic': 'Mono',
            'Split-Complementary': 'SpCo'
        };

        const theoryAbbr = theoryMap[currentScheme.theory];
        if (!theoryAbbr) {
            console.error(`Unknown theory: ${currentScheme.theory}`);
            return;
        };

        const key = `${type}${theoryAbbr}`;
        const url = colorData.color[key];

        if (!url) {
            console.error(`No URL found for key: ${key}`);
            return;
        }

        setIsModalOpen(true);
        setIsModalLoading(true);
        setModalContent('');
        setModalTitle(type === 'tailwind' ? 'Tailwind CSS' : 'Bootstrap');
        setModalLanguage(type === 'tailwind' ? 'javascript' : 'scss');

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch code');
            }
            const code = await response.text();
            setModalContent(code);
        } catch (error) {
            console.error('Failed to load code:', error);
            setModalContent(t('loadError'));
        } finally {
            setIsModalLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
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

    const theoryMap: { [key: string]: string } = {
        'Complementary': 'Comp',
        'Analogous': 'Anal',
        'Triadic': 'Tria',
        'Monochromatic': 'Mono',
        'Split-Complementary': 'SpCo'
    };
    const theoryAbbr = currentScheme ? theoryMap[currentScheme.theory] : undefined;
    const tailwindUrlKey = theoryAbbr ? `tailwind${theoryAbbr}` : undefined;
    const bootstrapUrlKey = theoryAbbr ? `bootstrap${theoryAbbr}` : undefined;
    const hasTailwindUrl = tailwindUrlKey && colorData?.color?.[tailwindUrlKey];
    const hasBootstrapUrl = bootstrapUrlKey && colorData?.color?.[bootstrapUrlKey];


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
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleShowCode('tailwind')} disabled={!hasTailwindUrl} className="px-4 py-2 bg-sky-600 text-white rounded-md disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors hover:bg-sky-700 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 35 24">
                                            <path d="M17.183 0C12.6 0 9.737 2.291 8.59 6.873c1.719-2.29 3.723-3.15 6.014-2.577 1.307.326 2.242 1.274 3.275 2.324 1.685 1.71 3.635 3.689 7.894 3.689 4.582 0 7.445-2.291 8.591-6.872-1.718 2.29-3.723 3.15-6.013 2.576-1.308-.326-2.243-1.274-3.276-2.324C23.39 1.98 21.44 0 17.183 0ZM8.59 10.309C4.01 10.309 1.145 12.6 0 17.182c1.718-2.291 3.723-3.15 6.013-2.577 1.308.326 2.243 1.274 3.276 2.324 1.685 1.71 3.635 3.689 7.894 3.689 4.582 0 7.445-2.29 8.59-6.872-1.718 2.29-3.722 3.15-6.013 2.577-1.307-.327-2.242-1.276-3.276-2.325-1.684-1.71-3.634-3.689-7.893-3.689Z"></path>
                                        </svg>
                                        <span>TailwindCSS</span>
                                    </button>
                                    <button onClick={() => handleShowCode('bootstrap')} disabled={!hasBootstrapUrl} className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors hover:bg-purple-700 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118 94"
                                            role="img" className="w-5 h-5">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M24.509 0c-6.733 0-11.715 5.893-11.492 12.284.214 6.14-.064 14.092-2.066 20.577C8.943 39.365 5.547 43.485 0 44.014v5.972c5.547.529 8.943 4.649 10.951 11.153 2.002 6.485 2.28 14.437 2.066 20.577C12.794 88.106 17.776 94 24.51 94H93.5c6.733 0 11.714-5.893 11.491-12.284-.214-6.14.064-14.092 2.066-20.577 2.009-6.504 5.396-10.624 10.943-11.153v-5.972c-5.547-.529-8.934-4.649-10.943-11.153-2.002-6.484-2.28-14.437-2.066-20.577C105.214 5.894 100.233 0 93.5 0H24.508zM80 57.863C80 66.663 73.436 72 62.543 72H44a2 2 0 01-2-2V24a2 2 0 012-2h18.437c9.083 0 15.044 4.92 15.044 12.474 0 5.302-4.01 10.049-9.119 10.88v.277C75.317 46.394 80 51.21 80 57.863zM60.521 28.34H49.948v14.934h8.905c6.884 0 10.68-2.772 10.68-7.727 0-4.643-3.264-7.207-9.012-7.207zM49.948 49.2v16.458H60.91c7.167 0 10.964-2.876 10.964-8.281 0-5.406-3.903-8.178-11.425-8.178H49.948z" fill="currentColor"></path>
                                        </svg>
                                        <span>Bootstrap</span>
                                    </button>
                                    <button onClick={handlePrevScheme} disabled={schemeIndex === 0} className="px-4 py-2 bg-purple-600 rounded-md disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors hover:bg-purple-700">
                                        {t('prevButton')}
                                    </button>
                                    <span>{schemeIndex + 1} / {colorData.schemes.length}</span>
                                    <button onClick={handleNextScheme} disabled={!colorData || (page >= colorData.total && schemeIndex === colorData.schemes.length - 1)} className="px-4 py-2 bg-purple-600 rounded-md disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors hover:bg-purple-700">
                                        {t('nextButton')}
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        disabled={isSharing || iframeLoading}
                                        className="px-4 py-2 bg-white text-gray-700 font-semibold border border-gray-300 rounded-md disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors hover:bg-gray-100 flex items-center"
                                    >
                                        {isSharing ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {t('sharing')}
                                            </>
                                        ) : (
                                            <>
                                                <img src="/pinterest-social-media-svgrepo-com.png" alt="Pinterest" width="20" height="20" className="mr-2" />
                                                Share to Pinterest
                                            </>
                                        )}
                                    </button>
                                </div>
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
                                    ref={iframeRef}
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
            {isModalOpen && (
                <CodeModal
                    onClose={handleCloseModal}
                    title={modalTitle}
                    language={modalLanguage}
                    content={modalContent}
                    isLoading={isModalLoading}
                    t={tMySchemes}
                />
            )}
        </div>
    );
} 