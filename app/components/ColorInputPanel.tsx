import { useRef, useEffect } from "react";
import { Sketch } from "@uiw/react-color";
import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';
import PopularColorPicker from "./PopularColorPicker";

type ColorInputPanelProps = {
    colorHex: string;
    lastGeneratedHex: string; // 添加最后一次生成的颜色
    setColorHex: (hex: string) => void;
    handleGenerate: () => Promise<void>;
    handlePopularColorSelect: (hex: string) => Promise<void>;
    isGenerated: boolean;
    isGenerating: boolean;
    showColorPicker: boolean;
    setShowColorPicker: (show: boolean) => void;
};

export default function ColorInputPanel({
    colorHex,
    lastGeneratedHex,
    setColorHex,
    handleGenerate,
    handlePopularColorSelect,
    isGenerated,
    isGenerating,
    showColorPicker,
    setShowColorPicker
}: ColorInputPanelProps) {
    const t = useTranslations('components.colorInput');
    // 添加引用以便处理点击外部关闭事件
    const colorPickerRef = useRef<HTMLDivElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);

    // 添加点击外部关闭的事件监听
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (colorPickerRef.current &&
                colorInputRef.current &&
                !colorPickerRef.current.contains(event.target as Node) &&
                !colorInputRef.current.contains(event.target as Node)) {
                setShowColorPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [setShowColorPicker]);

    const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || /^[0-9A-Fa-f]{0,6}$/.test(value)) {
            const normalizedColor = value.startsWith('#') ? value : `#${value}`;
            if (/^#[0-9A-Fa-f]{6}$/.test(normalizedColor)) {
                setColorHex(normalizedColor);
            } else {
                e.target.value = value;
            }
        }
    };

    return (
        <motion.div
            key="input-section"
            className={`flex flex-col items-center justify-center ${isGenerated ? "mt-4" : "mt-40"}`}
            initial={isGenerated ? { y: 0 } : { y: 0 }}
            animate={isGenerated ? { y: 0 } : { y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="w-full p-8 bg-white shadow-lg rounded-lg">
                <h1 className={`text-center ${isGenerated ? "text-2xl" : "text-3xl"} font-bold mb-6`}>
                    {t('title')}
                </h1>

                <div className="flex flex-col w-full gap-2">
                    <div className="flex flex-row gap-4 w-full justify-center items-center">
                        <div className="w-full relative">
                            <div className="flex items-center">
                                <div
                                    className={`w-10 h-10 mr-2 rounded-md`}
                                    style={{ backgroundColor: colorHex }}
                                ></div>
                                <input
                                    ref={colorInputRef}
                                    type="text"
                                    value={colorHex}
                                    onChange={handleColorInputChange}
                                    onFocus={() => setShowColorPicker(true)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleGenerate();
                                        }
                                    }}
                                    className="flex-1 p-2 bg-white border-0 rounded-md focus:outline-none shadow-inner
                                    bg-gradient-to-r from-transparent to-transparent
                                    hover:from-blue-50 hover:to-purple-50
                                    transition-all duration-300 ease-in-out
                                    [background-clip:padding-box,border-box] [border:1px_solid_#cdd6e3]
                                    [box-shadow:0_0_10px_rgba(0,0,0,0.15),inset_0_0_0_1px_rgba(255,255,255,0.2)]
                                    focus:[box-shadow:0_0_0_2px_rgba(59,130,246,0.4),inset_0_0_0_1px_rgba(59,130,246,0.4)] 
                                    focus:border-transparent"
                                    placeholder="#000000"
                                />
                            </div>

                            {showColorPicker && (
                                <div
                                    ref={colorPickerRef}
                                    className="absolute z-10 mt-2 shadow-xl rounded-md"
                                >
                                    <Sketch
                                        color={colorHex}
                                        onChange={(color) => {
                                            setColorHex(color.hex);
                                        }}
                                    />
                                    <div className="bg-white p-2 text-xs text-center text-gray-600 border-t border-gray-200">
                                        {t('colorPickerTip')}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={`whitespace-nowrap py-3 px-6 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 bg-blue-600 hover:bg-blue-700`}
                        >
                            {isGenerating ? t('generating') : t('generateScheme')}
                        </button>
                    </div>

                    {/* 流行颜色选择区 */}
                    <PopularColorPicker onColorSelect={handlePopularColorSelect} />
                </div>
            </div>
        </motion.div>
    );
} 