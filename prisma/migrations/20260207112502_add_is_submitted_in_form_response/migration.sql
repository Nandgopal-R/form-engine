-- AlterTable
ALTER TABLE "form_response" ADD COLUMN     "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "submittedAt" DROP NOT NULL,
ALTER COLUMN "submittedAt" DROP DEFAULT;
