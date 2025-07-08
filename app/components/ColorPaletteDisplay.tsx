type ColorPaletteDisplayProps = {
    colors: string[];
};

export default function ColorPaletteDisplay({ colors }: ColorPaletteDisplayProps) {
    return (
        <div className="flex space-x-2">
            {colors.map((color, idx) => (
                <div key={idx} className="flex-1">
                    <div
                        className="h-20 rounded-md mb-2"
                        style={{ backgroundColor: color }}
                    ></div>
                    <p className="text-xs text-center font-mono">{color}</p>
                </div>
            ))}
        </div>
    );
} 