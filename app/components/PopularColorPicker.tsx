import React from "react";
import { useTranslations } from 'next-intl';

type PopularColor = {
  name: string;
  hex: string;
};

interface PopularColorPickerProps {
  onColorSelect: (hex: string) => void;
  popularColors?: PopularColor[];
}

export default function PopularColorPicker({
  onColorSelect,
  popularColors
}: PopularColorPickerProps) {
  const t = useTranslations('components.popularColors');
  const colors = popularColors || getDefaultPopularColors(t);
  return (
    <div className="mt-6">
      {/* <div className="text-center mb-2 text-sm text-gray-600">流行颜色</div> */}
      <div className="flex flex-wrap justify-center gap-2">
        {colors.map((color) => (
          <div
            key={color.hex}
            className="flex flex-row items-center justify-center text-center cursor-pointer group"
            onClick={() => onColorSelect(color.hex)}
          >
            <div
              className="w-8 h-8 rounded-md transition-transform hover:scale-110 shadow-sm group-hover:shadow-md"
              style={{ backgroundColor: color.hex }}
              title={`${color.name} - ${color.hex}`}
            ></div>
            <div className="ml-2 text-xs mt-1 text-gray-600">{color.hex}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 默认流行颜色列表
const getDefaultPopularColors = (t: any): PopularColor[] => [
  { name: t('coral'), hex: "#FF7F50" },
  { name: t('paleGreen'), hex: "#98FB98" },
  { name: t('navy'), hex: "#000080" },
  { name: t('darkViolet'), hex: "#9400D3" },
  { name: t('darkOliveGreen'), hex: "#556B2F" },
  { name: t('deepBlue'), hex: "#1E3A8A" },
  { name: t('forest'), hex: "#228B22" },
  { name: t('wine'), hex: "#8B0000" },
  { name: t('graphite'), hex: "#333333" },
  { name: t('midnightBlue'), hex: "#191970" }
]; 