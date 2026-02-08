/*
  Warnings:

  - A unique constraint covering the columns `[formId,respondentId]` on the table `form_response` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "form_response_formId_respondentId_key" ON "form_response"("formId", "respondentId");
