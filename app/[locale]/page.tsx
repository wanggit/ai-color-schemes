'use client';

import {
  CubeTransparentIcon,
  SparklesIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import { ExampleColorSchemes } from '@/app/components/ExampleColorSchemes';
import GradientBackground2 from '@/app/components/GradientBackground2';
import PopularColorPicker from '@/app/components/PopularColorPicker';

export default function HomePage() {
  const t = useTranslations('HomePage');
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();

  const handleColorSelect = (hex: string) => {
    const color = hex.startsWith('#') ? hex.substring(1) : hex;
    router.push(`/${locale}/generate?color=${color}`);
  };

  const features = [
    {
      name: t('features.analyze.name'),
      description: t('features.analyze.description'),
      icon: CubeTransparentIcon,
    },
    {
      name: t('features.generate.name'),
      description: t('features.generate.description'),
      icon: SparklesIcon,
    },
    {
      name: t('features.preview.name'),
      description: t('features.preview.description'),
      icon: DocumentTextIcon,
    },
    {
      name: t('features.export.name'),
      description: t('features.export.description'),
      icon: CodeBracketIcon,
    },
    {
      name: t('features.download.name'),
      description: t('features.download.description'),
      icon: ArrowDownTrayIcon,
    }
  ];

  return (
    <div className="relative isolate">
      <GradientBackground2 />
      <main>
        <div className="relative px-6 lg:px-8">
          <div className="mx-auto max-w-4xl pt-20 pb-32 sm:pt-48 sm:pb-40">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
                {t('title')}
              </h1>
              <p className="mt-6 text-lg leading-8 text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
                {t('subtitle')}
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href={`/${locale}/generate`}
                  className="rounded-md bg-rose-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                >
                  {t('cta')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-rose-400">{t('features.title')}</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t('features.subtitle')}
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                {t('features.description')}
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {features.slice(0, 3).map((feature) => (
                  <div key={feature.name} className="flex flex-col">
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                      <feature.icon className="h-5 w-5 flex-none text-rose-400" aria-hidden="true" />
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2 lg:mt-16">
                {features.slice(3).map((feature) => (
                  <div key={feature.name} className="flex flex-col">
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                      <feature.icon className="h-5 w-5 flex-none text-rose-400" aria-hidden="true" />
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="relative isolate overflow-hidden">
          <GradientBackground2 />
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-x-16 lg:gap-y-6 xl:grid-cols-1 xl:grid-rows-1 xl:gap-x-8">
              <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:col-span-2 xl:col-auto [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
                {t('credits.title')}
              </h2>
              <div className="mt-6 max-w-xl lg:mt-0 xl:col-end-1 xl:row-start-1">
                <p className="text-lg leading-8 text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
                  {t('credits.description')}
                </p>
                <div className="mt-10 flex items-center gap-x-6">
                  <Link
                    href={`/${locale}/pricing`}
                    className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {t('credits.cta')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-rose-400">{t('showcase.title')}</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t('showcase.subtitle')}
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                {t('showcase.description')}
              </p>
            </div>
            <div className="mt-10">
              <ExampleColorSchemes />
            </div>
            <div className="mt-10">
              <PopularColorPicker onColorSelect={handleColorSelect} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
