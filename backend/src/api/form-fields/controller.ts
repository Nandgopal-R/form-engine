import { prisma } from "../../db/prisma"
import { logger } from "../../logger/"
import { GetAllFieldsContext, CreateFieldContext } from "../../types/form-fields"

export async function getAllFields({ params, set }: GetAllFieldsContext) {
  const formExists = await prisma.form.count({
    where: { id: params.formId }
  });

  if (formExists === 0) {
    set.status = 404;
    logger.warn(`Form not found for formId: ${params.formId}`);
    return {
      success: false,
      message: "Form not found",
      data: []
    };
  }

  const fields = await prisma.formFields.findMany({
    select: {
      id: true,
      fieldName: true,
      label: true,
      fieldValueType: true,
      fieldType: true,
      validation: true,
      prevFieldId: true,
      nextField: true
    },
    where: { formId: params.formId }
  })


  if (fields.length === 0) {
    logger.info(`No fields found for formId: ${params.formId}`)
    return {
      success: true,
      message: "No forms fields found",
      data: []
    }
  }
  logger.info(`Fetched all fields for formId: ${params.formId}, fieldCount: ${fields.length}`)
  return {
    success: true,
    message: "All form fields fetched successfully",
    data: fields
  }
}

export async function createField({ params, body, set, user }: CreateFieldContext) {

  return prisma.$transaction(async (tx) => {
    const form = await tx.form.findFirst({
      where: {
        id: params.formId,
        ownerId: user.id
      }
    })

    if (!form) {
      set.status = 404
      return {
        success: false,
        message: "Form not found"
      }
    }

    const field = await tx.formFields.create({
      data: {
        fieldName: body.fieldName,
        label: body.label,
        fieldValueType: body.fieldValueType,
        fieldType: body.fieldType,
        validation: body.validation ?? undefined,
        prevFieldId: body.prevFieldId,
        formId: params.formId
      }
    })

    if (body.prevFieldId) {
      await tx.formFields.update({
        where: { id: body.prevFieldId },
        data: { nextField: field.id }
      })
    }

    logger.info("Created new field for form", { formId: params.formId, fieldId: field.id, userId: user.id })
    return {
      success: true,
      message: "Field created successfully",
      data: field
    }
  })

}
