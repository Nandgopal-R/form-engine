import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Deleting all users...')
    try {
        await prisma.user.deleteMany({})
        console.log('All users deleted.')
    } catch (e) {
        console.error('Error deleting users:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
