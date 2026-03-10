import { prisma } from "./src/db/prisma";

async function diag() {
    console.log("Starting diagnostic...");
    try {
        await prisma.$connect();
        console.log("Database connection successful!");
        const users = await prisma.user.findMany({ take: 1 });
        console.log("Query successful, users found:", users.length);
    } catch (err) {
        console.error("DIAGNOSTIC CRITICAL ERROR:");
        console.error(err);
        if (err.code) console.log("Error Code:", err.code);
    } finally {
        await prisma.$disconnect();
    }
}

diag();
