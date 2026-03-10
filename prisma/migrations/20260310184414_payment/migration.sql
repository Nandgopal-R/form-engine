/*
  Warnings:

  - A unique constraint covering the columns `[paymentId]` on the table `form_response` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "form_response" ADD COLUMN     "paymentId" TEXT;

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "formId" TEXT NOT NULL,
    "formFieldId" TEXT NOT NULL,
    "formResponseId" TEXT,
    "respondentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_stripeSessionId_key" ON "payment"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_stripePaymentId_key" ON "payment"("stripePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_formResponseId_key" ON "payment"("formResponseId");

-- CreateIndex
CREATE INDEX "payment_formId_idx" ON "payment"("formId");

-- CreateIndex
CREATE INDEX "payment_formFieldId_idx" ON "payment"("formFieldId");

-- CreateIndex
CREATE UNIQUE INDEX "form_response_paymentId_key" ON "form_response"("paymentId");

-- AddForeignKey
ALTER TABLE "form_response" ADD CONSTRAINT "form_response_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
