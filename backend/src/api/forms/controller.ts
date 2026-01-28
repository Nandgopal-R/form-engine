import { prisma } from "../../db/prisma"
import { logger } from "../../logger/"
import { Context, CreateFormContext, GetFormByIdContext, UpdateFormContext } from "../../types/forms"

export async function getAllForms({ user, set }: Context) {
  try {
    const forms = await prisma.form.findMany({
      select: {
        id: true,
        title: true,
        isPublished: true,
        createdAt: true
      },
      where: { ownerId: user.id }
    })

    if (forms.length === 0) {
      logger.info("No forms found for user", { userId: user.id })
      return {
        success: true,
        message: "No forms found",
        data: []
      }
    }

    logger.info("Fetched all forms for user", { userId: user.id, formCount: forms.length })
    return {
      success: true,
      message: "All forms fetched successfully",
      data: forms
    }
  }
  catch (e) {
    logger.error("Error fetching forms for user", e, { userId: user.id })
    set.status = 500
    return {
      success: false,
      message: "Error fetching forms",
      error: String(e)
    }
  }
}

export async function createForm({ user, body, set }: CreateFormContext) {
  try {
    const form = await prisma.form.create({
      data: {
        title: body.title,
        description: body.description,
        ownerId: user.id,
      }
    })
    logger.info("Created new form for user", { userId: user.id, formId: form.id })
    return {
      success: true,
      message: "Form created successfully",
      data: form
    }
  }
  catch (e) {
    logger.error("Error creating form for user", e, { userId: user.id })
    set.status = 500
    return {
      success: false,
      message: "Error creating form",
      error: String(e)
    }
  }
}

export async function getFormById({ user, params, set }: GetFormByIdContext) {
  try {
    const form = await prisma.form.findFirst({
      where: {
        id: params.id,
        ownerId: user.id,
      }
    })
    if (!form) {
      set.status = 404
      return {
        success: false,
        message: "Form not found",
      }
    }
    logger.info("Fetched form for user", { userId: user.id, formId: form.id })
    return {
      success: true,
      message: "Form fetched successfully",
      data: form
    }
  }
  catch (e) {
    logger.error("Error fetching form for user", e, { userId: user.id, formId: params.id })
    set.status = 500
    return {
      success: false,
      message: "Error fetching form",
      error: String(e)
    }
  }
}

export async function updateForm({ user, params, body, set }: UpdateFormContext) {
  try {
    const form = await prisma.form.update({
      where: {
        id: params.id,
        ownerId: user.id,
      },
      data: {
        title: body.title,
        description: body.description,
      }
    })
    if (!form) {
      set.status = 404
      return {
        success: false,
        message: "Form not found",
      }
    }
    logger.info("Updated form for user", { userId: user.id, formId: form.id })
    return {
      success: true,
      message: "Form updated successfully",
      data: form
    }
  }
  catch (e) {
    logger.error("Error updating form for user", e, { userId: user.id, formId: params.id })
    set.status = 500
    return {
      success: false,
      message: "Error updating form",
      error: String(e)
    }
  }
}
