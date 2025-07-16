"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import UserAvatar from "./UserAvatar";
import LanguageSwitcher from "./LanguageSwitcher";
import UserCredits from './UserCredits';

export default function Header() {
    const { data: session } = useSession();
    const t = useTranslations('header');
    const params = useParams();
    const locale = params.locale as string;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/20 backdrop-blur-md border-b border-white/20 shadow-lg shadow-black/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* 左侧 Logo 和标题 */}
                    <div className="flex items-center space-x-3">
                        <Link href={`/${locale}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                            {/* 使用新的AI Color Schemes logo */}
                            <div className="w-10 h-10 flex items-center justify-center">
                                <Image
                                    src="/logo.svg"
                                    alt="AI Color Schemes Logo"
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-contain"
                                    priority
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">{t('title')}</h1>
                                <p className="text-xs text-gray-600 hidden sm:block">{t('subtitle')}</p>
                            </div>
                        </Link>
                    </div>

                    {/* 中间导航菜单 (可选) */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link href={`/${locale}/generate`} className="text-gray-600 hover:text-gray-900 transition-colors">
                            {t('nav.generate')}
                        </Link>
                        <Link href={`/${locale}/example`} className="text-gray-600 hover:text-gray-900 transition-colors">
                            {t('nav.example')}
                        </Link>
                        <Link href={`/${locale}/pricing`} className="text-gray-600 hover:text-gray-900 transition-colors">
                            {t('nav.pricing')}
                        </Link>
                        <Link href={`/${locale}/my-schemes`} className="text-gray-600 hover:text-gray-900 transition-colors">
                            {t('nav.mySchemes')}
                        </Link>
                    </nav>

                    {/* 右侧语言切换、Discord图标和用户头像 */}
                    <div className="flex items-center space-x-3">
                        {/* 语言切换器 */}
                        <LanguageSwitcher />

                        <UserCredits />

                        {/* Discord 图标 */}
                        <a
                            href="https://discord.gg/4EuEexjEWF"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-9 h-9 bg-[#5865F2] hover:bg-[#4752C4] rounded-lg transition-colors shadow-md hover:shadow-lg"
                            title={t('discord')}
                        >
                            <svg
                                className="w-5 h-5 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                        </a>
                        <UserAvatar />
                    </div>
                </div>
            </div>
        </header>
    );
} 