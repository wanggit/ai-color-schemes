"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import GradientBackground2 from "@/app/components/GradientBackground2";
import { AiColor } from "@prisma/client";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const TailwindIcon = () => (
    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 35 24">
        <path className="fill-sky-400" d="M17.183 0C12.6 0 9.737 2.291 8.59 6.873c1.719-2.29 3.723-3.15 6.014-2.577 1.307.326 2.242 1.274 3.275 2.324 1.685 1.71 3.635 3.689 7.894 3.689 4.582 0 7.445-2.291 8.591-6.872-1.718 2.29-3.723 3.15-6.013 2.576-1.308-.326-2.243-1.274-3.276-2.324C23.39 1.98 21.44 0 17.183 0ZM8.59 10.309C4.01 10.309 1.145 12.6 0 17.182c1.718-2.291 3.723-3.15 6.013-2.577 1.308.326 2.243 1.274 3.276 2.324 1.685 1.71 3.635 3.689 7.894 3.689 4.582 0 7.445-2.29 8.59-6.872-1.718 2.29-3.722 3.15-6.013 2.577-1.307-.327-2.242-1.276-3.276-2.325-1.684-1.71-3.634-3.689-7.893-3.689Z"></path>
    </svg>
);

const BootstrapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118 94" role="img" className="d-block my-1 w-2.5 h-2.5">
        <path fillRule="evenodd" clipRule="evenodd" d="M24.509 0c-6.733 0-11.715 5.893-11.492 12.284.214 6.14-.064 14.092-2.066 20.577C8.943 39.365 5.547 43.485 0 44.014v5.972c5.547.529 8.943 4.649 10.951 11.153 2.002 6.485 2.28 14.437 2.066 20.577C12.794 88.106 17.776 94 24.51 94H93.5c6.733 0 11.714-5.893 11.491-12.284-.214-6.14.064-14.092 2.066-20.577 2.009-6.504 5.396-10.624 10.943-11.153v-5.972c-5.547-.529-8.934-4.649-10.943-11.153-2.002-6.484-2.28-14.437-2.066-20.577C105.214 5.894 100.233 0 93.5 0H24.508zM80 57.863C80 66.663 73.436 72 62.543 72H44a2 2 0 01-2-2V24a2 2 0 012-2h18.437c9.083 0 15.044 4.92 15.044 12.474 0 5.302-4.01 10.049-9.119 10.88v.277C75.317 46.394 80 51.21 80 57.863zM60.521 28.34H49.948v14.934h8.905c6.884 0 10.68-2.772 10.68-7.727 0-4.643-3.264-7.207-9.012-7.207zM49.948 49.2v16.458H60.91c7.167 0 10.964-2.876 10.964-8.281 0-5.406-3.903-8.178-11.425-8.178H49.948z" fill="currentColor"></path>
    </svg>
);

export default function MySchemesPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const t = useTranslations('mySchemes');

    const [schemes, setSchemes] = useState<AiColor[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState('');
    const [modalLanguage, setModalLanguage] = useState('javascript');
    const [isLoadingModalContent, setIsLoadingModalContent] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');

    const handleShowConfig = async (url: string | null, title: string) => {
        if (!url) return;

        setIsModalOpen(true);
        setModalTitle(title);
        if (title.includes('Tailwind')) {
            setModalLanguage('javascript');
        } else if (title.includes('Bootstrap')) {
            setModalLanguage('scss');
        }
        setIsLoadingModalContent(true);
        setModalContent('');
        setCopySuccess('');

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(t('configFetchError', { status: response.status, text: errorText }));
            }
            const textContent = await response.text();
            setModalContent(textContent);
        } catch (error: any) {
            setModalContent(error.message);
        } finally {
            setIsLoadingModalContent(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(modalContent);
            setCopySuccess(t('copySuccess'));
            setTimeout(() => setCopySuccess(''), 2000);
        } catch (err) {
            setCopySuccess(t('copyError'));
        }
    };

    const fetchSchemes = useCallback(async (page: number) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/colors/public?page=${page}`, {
                headers: {
                    "Accept-Language": locale, // 添加语言信息到请求头
                }
            });
            if (!response.ok) {
                throw new Error(t('fetchError'));
            }
            const data = await response.json();
            setSchemes(data.data);
            setTotalPages(data.pagination.totalPages);
        } catch (err: any) {
            setError(err.message);
            setSchemes([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [locale, t]);

    useEffect(() => {
        fetchSchemes(currentPage);
    }, [currentPage, fetchSchemes]);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const renderLink = (url: string | null, text: string) => {
        if (url) {
            return (
                <Link href={`/api/colors/preview?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {text}
                </Link>
            );
        }
        return <span className="text-gray-400">{t('table.notGenerated')}</span>;
    };

    type ConfigKeys = keyof Pick<AiColor, 'tailwindComp' | 'bootstrapComp' | 'tailwindAnal' | 'bootstrapAnal' | 'tailwindTria' | 'bootstrapTria' | 'tailwindMono' | 'bootstrapMono' | 'tailwindSpCo' | 'bootstrapSpCo'>;

    const renderActionCell = (color: AiColor, exampleKey: keyof AiColor, tailwindKey: ConfigKeys, bootstrapKey: ConfigKeys) => (
        <div className="flex items-center space-x-2">
            {renderLink(color[exampleKey] as string | null, t('table.viewExample'))}
            {color[tailwindKey] && (
                <button onClick={() => handleShowConfig(color[tailwindKey] as string | null, 'Tailwind CSS')} title="View Tailwind Config" className="text-cyan-500 hover:text-cyan-700">
                    <TailwindIcon />
                </button>
            )}
            {color[bootstrapKey] && (
                <button onClick={() => handleShowConfig(color[bootstrapKey] as string | null, 'Bootstrap')} title="View Bootstrap Config" className="text-purple-500 hover:text-purple-700">
                    <BootstrapIcon />
                </button>
            )}
        </div>
    );

    const TableSkeleton = () => (
        <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
            {[...Array(10)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"></div>
            ))}
        </div>
    );

    return (
        <div className="relative min-h-screen w-full overflow-hidden pt-14">
            <GradientBackground2 />
            {/* <UserAvatar /> */}
            <main className="container mx-auto py-10 px-4 relative z-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 text-center mb-6">
                    {t('title')}
                </h1>

                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                    {loading ? (
                        <TableSkeleton />
                    ) : error ? (
                        <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/20 p-4 rounded-md">
                            <p>{error}</p>
                        </div>
                    ) : schemes.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                            <p className="mb-4">{t('noSchemes')}</p>
                            <Link href={`/${locale}/generate`}>
                                <button className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-semibold transition-colors">
                                    {t('goGenerate')}
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* 表格头部 - 标题和操作按钮 */}
                            <div className="mb-6 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                    {t('schemesList')}
                                </h2>
                                <Link href={`/${locale}/generate`}>
                                    <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-semibold transition-colors flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        {t('generateNew')}
                                    </button>
                                </Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th scope="col" className="py-3 px-6">{t('table.color')}</th>
                                            <th scope="col" className="py-3 px-6">{t('table.hex')}</th>
                                            <th scope="col" className="py-3 px-6">{t('table.complementary')}</th>
                                            <th scope="col" className="py-3 px-6">{t('table.analogous')}</th>
                                            <th scope="col" className="py-3 px-6">{t('table.triadic')}</th>
                                            <th scope="col" className="py-3 px-6">{t('table.monochromatic')}</th>
                                            <th scope="col" className="py-3 px-6">{t('table.splitComplementary')}</th>
                                            {/* <th scope="col" className="py-3 px-6">{t('table.updateTime')}</th> */}
                                            <th scope="col" className="py-3 px-6">{t('table.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schemes.map((color) => (
                                            <tr key={color.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                <td className="py-4 px-6">
                                                    <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: color.hex }}></div>
                                                </td>
                                                <td className="py-4 px-6 font-mono">{color.hex}</td>
                                                <td className="py-4 px-6">{renderActionCell(color, 'exampleComp', 'tailwindComp', 'bootstrapComp')}</td>
                                                <td className="py-4 px-6">{renderActionCell(color, 'exampleAnal', 'tailwindAnal', 'bootstrapAnal')}</td>
                                                <td className="py-4 px-6">{renderActionCell(color, 'exampleTria', 'tailwindTria', 'bootstrapTria')}</td>
                                                <td className="py-4 px-6">{renderActionCell(color, 'exampleMono', 'tailwindMono', 'bootstrapMono')}</td>
                                                <td className="py-4 px-6">{renderActionCell(color, 'exampleSpCo', 'tailwindSpCo', 'bootstrapSpCo')}</td>
                                                {/* <td className="py-4 px-6">{new Date(color.updatedAt).toLocaleString()}</td> */}
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center space-x-2">
                                                        <Link href={`/${locale}/generate?color=${encodeURIComponent(color.hex)}&action=regenerate`}>
                                                            <button
                                                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                                title={t('table.regenerate')}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                            </button>
                                                        </Link>
                                                        <Link href={`/${locale}/my-schemes/${encodeURIComponent(color.hex)}`}>
                                                            <button
                                                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors"
                                                                title={t('table.viewDetails')}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                                                </svg>
                                                            </button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex justify-between items-center">
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                                >
                                    {t('pagination.previous')}
                                </button>
                                <span className="text-gray-700 dark:text-gray-300">
                                    {t('pagination.pageInfo', { current: currentPage, total: totalPages })}
                                </span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                                >
                                    {t('pagination.next')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {isModalOpen && (
                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.2)'
                }} className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{modalTitle}</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 dark:hover:bg-gray-600 dark:hover:text-white"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto relative">
                            {isLoadingModalContent ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <SyntaxHighlighter
                                    language={modalLanguage}
                                    style={tomorrow}
                                    wrapLines={true}
                                    className="!bg-gray-100 dark:!bg-gray-900 p-4 rounded-md text-sm"
                                    customStyle={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                                >
                                    {modalContent}
                                </SyntaxHighlighter>
                            )}
                        </div>
                        <div className="flex justify-end items-center p-4 border-t dark:border-gray-700">
                            <span className="text-sm text-green-500 mr-4">{copySuccess}</span>
                            <button
                                onClick={copyToClipboard}
                                disabled={isLoadingModalContent || !modalContent}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('copy')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 