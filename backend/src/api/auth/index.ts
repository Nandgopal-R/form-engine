import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../../db/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),

  user: {
    modelName: "user",
  },
  account: {
    modelName: "account",
  },
  session: {
    modelName: "session",
  },

  emailAndPassword: {
    enabled: true,
  },
  //TODO Need to add google oauth
});
