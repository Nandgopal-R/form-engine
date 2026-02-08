import { prisma } from "../db/prisma";
import { logger } from "../logger";

async function main() {
  try {
    console.log("Starting database cleanup...");

    // 1. Delete dependent data first
    await prisma.formResponse.deleteMany();
    await prisma.formFields.deleteMany();
    await prisma.form.deleteMany();

    // 2. Delete Auth data
    const deletedSessions = await prisma.session.deleteMany();
    const deletedAccounts = await prisma.account.deleteMany();
    await prisma.verification.deleteMany();

    // 3. Delete Users
    const deletedUsers = await prisma.user.deleteMany();

    console.log(`Deleted ${deletedUsers.count} users.`);
    console.log(`Deleted ${deletedAccounts.count} accounts.`);
    console.log(`Deleted ${deletedSessions.count} sessions.`);

    logger.info(`Database cleared successfully.`);
  } catch (error) {
    console.error("Error deleting users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
