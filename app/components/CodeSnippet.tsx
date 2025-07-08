"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { TbCopy, TbDownload, TbCheck, TbReload } from "react-icons/tb";
import { useTranslations } from 'next-intl';

type CodeSnippetProps = {
    language: string;
    code: string;
    fileName: string;
    title: string;
    onRegenerate?: () => void;
    isRegenerating?: boolean;
};

export default function CodeSnippet({
    language,
    code,
    fileName,
    title,
    onRegenerate,
    isRegenerating = false
}: CodeSnippetProps) {
    const t = useTranslations('components.codeSnippet');
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!code) {
        return null;
    }

    return (
        <div className="my-4">
            <h4 className="text-md font-medium mb-2">{title}</h4>
            <div className="relative bg-[#1e1e1e] rounded-lg">
                <div className="flex justify-end p-2 bg-gray-700/50 rounded-t-lg">
                    {onRegenerate && (
                        <button
                            onClick={onRegenerate}
                            disabled={isRegenerating}
                            className="p-2 rounded hover:bg-gray-600 text-white disabled:opacity-50"
                            title={t('regenerate')}
                        >
                            <TbReload className={`w-5 h-5 ${isRegenerating ? "animate-spin" : ""}`} />
                        </button>
                    )}
                    <button
                        onClick={handleCopy}
                        className="p-2 rounded hover:bg-gray-600 text-white"
                        title={t('copy')}
                    >
                        {isCopied ? <TbCheck className="w-5 h-5 text-green-500" /> : <TbCopy className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-2 rounded hover:bg-gray-600 text-white"
                        title={t('download')}
                    >
                        <TbDownload className="w-5 h-5" />
                    </button>
                </div>
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, borderRadius: '0 0 0.5rem 0.5rem', background: '#1e1e1e' }}
                    codeTagProps={{ style: { fontSize: '0.9rem' } }}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
} 