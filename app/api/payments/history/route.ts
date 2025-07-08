import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit

    try {
        const userId = session.user.id
        const payments = await prisma.payment.findMany({
            where: {
                userId: userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip: skip,
            take: limit,
        })

        const totalPayments = await prisma.payment.count({
            where: {
                userId: userId,
            },
        })

        return NextResponse.json({
            payments,
            totalPages: Math.ceil(totalPayments / limit),
            currentPage: page,
        })
    } catch (error) {
        console.error('Error fetching payment history:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
} 