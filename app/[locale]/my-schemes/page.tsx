"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import GradientBackground2 from "@/app/components/GradientBackground2";
import { AiColor } from "@prisma/client";

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
                    {t('table.viewExample')}
                </Link>
            );
        }
        return <span className="text-gray-400">{t('table.notGenerated')}</span>;
    };

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
                                            <th scope="col" className="py-3 px-6">{t('table.updateTime')}</th>
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
                                                <td className="py-4 px-6">{renderLink(color.exampleComp, t('table.viewExample'))}</td>
                                                <td className="py-4 px-6">{renderLink(color.exampleAnal, t('table.viewExample'))}</td>
                                                <td className="py-4 px-6">{renderLink(color.exampleTria, t('table.viewExample'))}</td>
                                                <td className="py-4 px-6">{renderLink(color.exampleMono, t('table.viewExample'))}</td>
                                                <td className="py-4 px-6">{renderLink(color.exampleSpCo, t('table.viewExample'))}</td>
                                                <td className="py-4 px-6">{new Date(color.updatedAt).toLocaleString()}</td>
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
        </div>
    );
} 