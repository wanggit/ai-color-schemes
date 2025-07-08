import { PrismaClient } from '@prisma/client'

// 在全局范围内声明prisma变量
declare global {
    var prisma: PrismaClient | undefined
}

// 导出prisma客户端实例
// 在开发环境中，我们会将实例赋值给一个全局变量，防止因为热重载导致创建多个PrismaClient实例
// 在生产环境中，每次都会创建一个新的实例
export const prisma =
    global.prisma ||
    new PrismaClient({
        // 可选：在这里添加日志配置，方便调试
        // log: ['query', 'info', 'warn', 'error'],
    })

// 在非生产环境中，将prisma实例赋值给全局变量
if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma
} 