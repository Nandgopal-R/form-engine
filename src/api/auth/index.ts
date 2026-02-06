import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import nodemailer from "nodemailer";
import { prisma } from "../../db/prisma";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
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

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await transporter.sendMail({
        from: `"My App" <${process.env.FROM_EMAIL}>`,

        to: user.email,
        subject: "Verify your email address",
        html: `
          <h1>Welcome, ${user.name}!</h1>
          <p>Click the link below to verify your email:</p>
          <a href="${url}">Verify Email</a>
        `,
      });
      console.log(`Verification email sent to ${user.email}`);
    },
  },

  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",").map((o) =>
    o.trim(),
  ),
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
