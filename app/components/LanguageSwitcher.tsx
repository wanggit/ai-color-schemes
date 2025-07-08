"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

// 语言配置
const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '简体中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
] as const;

export default function LanguageSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentLocale, setCurrentLocale] = useState('en');
    const router = useRouter();
    const pathname = usePathname();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 从路径中提取当前语言
    useEffect(() => {
        const segments = pathname.split('/');
        const locale = segments[1];
        if (languages.some(lang => lang.code === locale)) {
            setCurrentLocale(locale);
        } else {
            setCurrentLocale('en'); // 默认语言改为英文
        }
    }, [pathname]);

    // 点击外部关闭下拉菜单
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLanguageChange = (langCode: string) => {
        // 构造新的路径
        const segments = pathname.split('/');

        // 如果当前路径已经包含语言代码，替换它
        if (languages.some(lang => lang.code === segments[1])) {
            segments[1] = langCode;
        } else {
            // 如果没有语言代码，在开头添加
            segments.splice(1, 0, langCode);
        }

        const newPath = segments.join('/');
        router.push(newPath);
        setIsOpen(false);
    };

    const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200 border border-white/20"
                aria-label="选择语言"
            >
                <GlobeAltIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {currentLanguage.flag} {currentLanguage.name}
                </span>
                <span className="text-sm font-medium text-gray-700 sm:hidden">
                    {currentLanguage.flag}
                </span>
                <ChevronDownIcon
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    >
                        {languages.map((language) => (
                            <button
                                key={language.code}
                                onClick={() => handleLanguageChange(language.code)}
                                className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors duration-150 ${currentLocale === language.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                    }`}
                            >
                                <span className="text-lg">{language.flag}</span>
                                <span className="text-sm font-medium">{language.name}</span>
                                {currentLocale === language.code && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="ml-auto w-2 h-2 bg-blue-500 rounded-full"
                                    />
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 