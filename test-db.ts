import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const count = await prisma.user.count()
        console.log(`Connected to database. User count: ${count}`)
    } catch (error) {
        console.error('Failed to connect to database:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
