import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import ColorDetailContent from "@/app/components/my-schemes/ColorDetailContent";

const prisma = new PrismaClient();

type ColorDetailPageProps = {
    params: Promise<{
        hex: string;
        locale: string;
    }>;
};

export default async function ColorDetailPage({ params }: ColorDetailPageProps) {
    const { hex, locale } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect(`/${locale}/login`);
    }

    const decodedHex = decodeURIComponent(hex);

    const colorData = await prisma.aiColor.findFirst({
        where: {
            userId: session.user.id,
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