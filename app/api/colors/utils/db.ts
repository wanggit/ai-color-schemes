import { PrismaClient } from "@prisma/client";

export async function getUser(prisma: PrismaClient, userId: string | undefined, userEmail: string | undefined) {
    if (userId) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, isDisabled: true, membershipType: true, monthlyUsageCount: true, membershipExpiresAt: true, credits: true }
        });
    } else if (userEmail) {
        return prisma.user.findUnique({
            where: { email: userEmail },
            select: {
                id: true, // 额外获取ID用于后续操作
                isDisabled: true,
                membershipType: true,
                monthlyUsageCount: true,
                membershipExpiresAt: true,
                credits: true
            }
        });
    }
    return null;
}

export async function findExistingColor(prisma: PrismaClient, hex: string, userId: string) {
    return prisma.aiColor.findFirst({
        where: {
            hex: hex.toLowerCase(),
            userId: userId
        }
    });
}

export async function decrementUserCredits(prisma: PrismaClient, userId: string, count: number = 1) {
    if (userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: count } }
        });
    }
}

export async function saveColorGeneration(prisma: PrismaClient, hex: string, userId: string, responseData: any) {
    const responseDataStr = JSON.stringify(responseData);

    // 根据配色方案理论名称映射到数据库字段
    const exampleUrls: { [key: string]: string | undefined } = {};
    const previewUrls: { [key: string]: string | undefined } = {};
    const schemes = responseData?.colorAnalysis?.colorSchemes || [];

    const theoryToFieldMap: { [key: string]: string } = {
        'Complementary': 'exampleComp',
        'Analogous': 'exampleAnal',
        'Triadic': 'exampleTria',
        'Monochromatic': 'exampleMono',
        'Split-Complementary': 'exampleSpCo'
    };

    const theoryToPreviewFieldMap: { [key: string]: string } = {
        'Complementary': 'previewComp',
        'Analogous': 'previewAnal',
        'Triadic': 'previewTria',
        'Monochromatic': 'previewMono',
        'Split-Complementary': 'previewSpCo'
    };

    schemes.forEach((scheme: any) => {
        if (scheme.theory && theoryToFieldMap[scheme.theory]) {
            const exampleFieldName = theoryToFieldMap[scheme.theory];
            const previewFieldName = theoryToPreviewFieldMap[scheme.theory];

            if (scheme.exampleUrl) {
                exampleUrls[exampleFieldName] = scheme.exampleUrl;
            }

            if (scheme.previewUrl) {
                previewUrls[previewFieldName] = scheme.previewUrl;
            }
        }
    });

    // 再次检查是否存在，可能在生成过程中已经被其他请求创建
    const existingColorCheck = await findExistingColor(prisma, hex, userId);

    if (existingColorCheck) {
        // 如果存在则更新
        await prisma.aiColor.update({
            where: { id: existingColorCheck.id },
            data: {
                aiJson: responseDataStr,
                ...exampleUrls,
                ...previewUrls,
                updatedAt: new Date()
            }
        });
    } else {
        // 不存在则创建新记录
        await prisma.aiColor.create({
            data: {
                hex: hex.toLowerCase(),
                aiJson: responseDataStr,
                userId: userId,
                ...exampleUrls,
                ...previewUrls
            }
        });
    }
}

export async function saveBasicAnalysis(prisma: PrismaClient, hex: string, userId: string, responseData: any) {
    const responseDataStr = JSON.stringify(responseData);

    // 检查是否存在，可能在生成过程中已经被其他请求创建
    const existingColorCheck = await findExistingColor(prisma, hex, userId);

    if (existingColorCheck) {
        // 如果存在则更新基础分析部分
        await prisma.aiColor.update({
            where: { id: existingColorCheck.id },
            data: {
                aiJson: responseDataStr,
                updatedAt: new Date()
            }
        });
    } else {
        // 不存在则创建新记录
        await prisma.aiColor.create({
            data: {
                hex: hex.toLowerCase(),
                aiJson: responseDataStr,
                userId: userId
            }
        });
    }
}

export async function updateSchemeData(prisma: PrismaClient, hex: string, userId: string, updateData: any) {
    // 查找现有记录
    const existingColor = await findExistingColor(prisma, hex, userId);

    if (existingColor) {
        // 如果存在则更新
        await prisma.aiColor.update({
            where: { id: existingColor.id },
            data: {
                ...updateData,
                updatedAt: new Date()
            }
        });
    } else {
        // 如果不存在则创建新记录
        await prisma.aiColor.create({
            data: {
                hex: hex.toLowerCase(),
                userId: userId,
                ...updateData
            }
        });
    }
} 