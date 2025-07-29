'use client';

import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeModalProps {
    onClose: () => void;
    title: string;
    language: string;
    content: string;
    isLoading: boolean;
    t: (key: string) => string;
}

const CodeModal: React.FC<CodeModalProps> = ({
    onClose,
    title,
    language,
    content,
    isLoading,
    t
}) => {
    const [copySuccess, setCopySuccess] = useState('');

    const copyToClipboard = () => {
        if (content) {
            navigator.clipboard.writeText(content);
            setCopySuccess(t('copiedSuccess'));
            setTimeout(() => setCopySuccess(''), 2000);
        }
    };

    return (
        <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)'
        }} className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                </div>
                <div className="p-4 overflow-y-auto relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <SyntaxHighlighter
                            language={language}
                            style={tomorrow}
                            wrapLines={true}
                            className="!bg-gray-100 dark:!bg-gray-900 p-4 rounded-md text-sm"
                            customStyle={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                        >
                            {content}
                        </SyntaxHighlighter>
                    )}
                </div>
                <div className="flex justify-end items-center p-4 border-t dark:border-gray-700">
                    <span className="text-sm text-green-500 mr-4">{copySuccess}</span>
                    <button
                        onClick={copyToClipboard}
                        disabled={isLoading || !content}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('copy')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CodeModal; 