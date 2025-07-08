import { useTranslations } from 'next-intl';

// 定义颜色方案类型
type ColorScheme = {
    theory: string;
    colors: string[];
    description: string;
    uiApplication: string;
    strengths: string;
    recommendedRatio: string;
    bestFor: string;
    exampleUrl?: string;
};

// 定义颜色分析类型
type ColorAnalysis = {
    colorAnalysis: {
        hexValue: string;
        colorSystem: {
            hueFamily: string;
            toneCategory: string;
            alternativeNames: string[];
            complementaryColor: string[];
        };
        meaningAndEmotion: {
            generalInterpretation: string[];
            culturalContext: {
                western: string;
                eastern: string;
                uiApplications: string;
                cautions: string[];
            };
            emotionalSummary: string;
        };
        colorSchemes: ColorScheme[];
    };
};

type TabNavigationProps = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    aiResponse: ColorAnalysis | null;
    getSchemeName: (theory: string) => string;
    generatedStatus?: { [theory: string]: boolean };
};

export default function TabNavigation({
    activeTab,
    setActiveTab,
    aiResponse,
    getSchemeName,
    generatedStatus
}: TabNavigationProps) {
    const t = useTranslations('components.tabNavigation');
    return (
        <div className="flex relative overflow-x-auto mb-4 scrollbar-hide">
            <div className="absolute bottom-0 w-full h-[2px] bg-gradient-to-r from-purple-500 via-blue-500 to-teal-400 opacity-30"></div>
            <button
                onClick={() => setActiveTab("analysis")}
                className={`flex-1 py-4 px-6 text-center relative transition-all duration-300 ease-in-out font-medium min-w-[120px] ${activeTab === "analysis"
                    ? "text-blue-700 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-gradient-to-r after:from-purple-500 after:via-blue-500 after:to-teal-400 after:z-10 after:rounded-t-lg after:shadow-[0_-4px_8px_rgba(59,130,246,0.3)]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-blue-50/50"
                    }`}
            >
                {t('colorAnalysis')}
            </button>

            {aiResponse?.colorAnalysis?.colorSchemes?.map((scheme) => (
                <button
                    key={scheme.theory}
                    onClick={() => setActiveTab(scheme.theory)}
                    className={`flex-1 py-4 px-6 text-center relative transition-all duration-300 ease-in-out font-medium min-w-[120px] ${activeTab === scheme.theory
                        ? "text-blue-700 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-gradient-to-r after:from-purple-500 after:via-blue-500 after:to-teal-400 after:z-10 after:rounded-t-lg after:shadow-[0_-4px_8px_rgba(59,130,246,0.3)]"
                        : "text-gray-500 hover:text-gray-700 hover:bg-blue-50/50"
                        }`}
                >
                    <div className="flex items-center justify-center">
                        <span>{getSchemeName(scheme.theory)}</span>
                        {(() => {
                            const isGenerated = generatedStatus && generatedStatus[scheme.theory];
                            console.log(`🔍 TabNavigation - ${scheme.theory}: generatedStatus=`, generatedStatus, `isGenerated=${isGenerated}`);
                            return isGenerated && (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-5 h-5 ml-1.5 text-green-500"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            );
                        })()}
                    </div>
                </button>
            ))}
        </div>
    );
} 