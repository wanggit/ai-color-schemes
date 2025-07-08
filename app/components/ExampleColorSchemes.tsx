'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useSafeTranslations } from '@/hooks/useSafeTranslations';

import ColorPaletteDisplay from './ColorPaletteDisplay';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type Scheme = {
    theory: string;
    colors: string[];
    description: string;
    url: string;
};

type ExampleData = {
    id: string;
    hex: string;
    schemes: Scheme[];
    total: number;
};

export function ExampleColorSchemes() {
    const params = useParams();
    const locale = params.locale as string;
    const t = useSafeTranslations('components.exampleColorSchemes');

    const { data, error, isLoading, mutate } = useSWR<ExampleData>('/api/colors/example', fetcher, {
        revalidateOnFocus: false,
    });

    if (isLoading) {
        return <div className="text-center text-gray-400">{t('loading')}</div>;
    }

    if (error || !data || !data.schemes || data.schemes.length === 0) {
        return <div className="text-center text-red-400">{t('error')}</div>;
    }

    const { hex, schemes } = data;

    return (
        <div className="space-y-8">
            <div className="text-center">
                <Link href={`/${locale}/example`}>
                    <button className="inline-flex items-center gap-x-2 rounded-md bg-rose-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500">
                        <ArrowPathIcon className="h-5 w-5" />
                        {t('tryAnother')}
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                {schemes.map((scheme) => (
                    <div key={scheme.theory} className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">{scheme.theory}</h3>
                        <Link href={`/${locale}/my-schemes/${encodeURIComponent(hex)}`}>
                            <div className="cursor-pointer transition-transform hover:scale-105">
                                <ColorPaletteDisplay colors={scheme.colors} />
                            </div>
                        </Link>
                        <p className="text-sm text-gray-400">{scheme.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
} 