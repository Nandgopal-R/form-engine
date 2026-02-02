import { prisma } from "../../db/prisma"
import { logger } from "../../logger/"
import { FormResponseContext, ResumeResponseContext } from "../../types/form-response"

export async function submitResponse({ params, body, user, set }: FormResponseContext) {
  const form = await prisma.form.findUnique({
    where: {
      id: params.formId,
    },
  })

  if (!form) {
    logger.warn(`Form with ID ${params.formId} not found`)
    set.status = 404
    return {
      success: false,
      message: "Form not found",
    }
  }

  if (!form.isPublished) {
    logger.warn(`Form with ID ${params.formId} is not published`)
    set.status = 403
    return {
      success: false,
      message: "Form is not published",
    }
  }

  const response = await prisma.formResponse.create({
    data: {
      formId: params.formId,
      respondentId: user.id,
      answers: body.answers
    }
  })
  logger.info(`User ${user.id} submitted response ${response.id} for form ${params.formId}`)
  return {
    success: true,
    message: "Response submitted successfully",
    data: response
  }
}

export async function resumeResponse({ params, body, user }: ResumeResponseContext) {
  const response = await prisma.formResponse.updateMany({
    where: {
      id: params.responseId,
      respondentId: user.id,
    },
    data: {
      answers: body.answers
    }
  })

  if (response.count === 0) {
    logger.warn(`No response found with ID ${params.responseId} to update`)
    return {
      success: false,
      message: "No response found to update",
    }
  }

  logger.info(`Response ${params.responseId} updated successfully`)
  return {
    success: true,
    message: "Response updated successfully",
    data: response
  }
}

