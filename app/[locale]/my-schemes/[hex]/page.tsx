import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import ColorDetailContent from "@/app/components/my-schemes/ColorDetailContent";

const prisma = new PrismaClient();

type ColorDetailPageProps = {
    params: Promise<{
        hex: string;
        locale: string;
    }>;
};

export default async function ColorDetailPage({ params }: ColorDetailPageProps) {
    const { hex } = await params;
    const decodedHex = decodeURIComponent(hex);

    const colorData = await prisma.aiColor.findFirst({
        where: {
            hex: decodedHex,
        },
    });

    if (!colorData) {
        notFound();
    }

    return (
        <ColorDetailContent
            colorData={JSON.stringify(colorData)}
            translations={{}}
        />
    );
} 