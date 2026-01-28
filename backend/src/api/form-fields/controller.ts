import { prisma } from "../../db/prisma"
import { logger } from "../../logger/"
import { GetAllFieldsContext } from "../../types/form-fields"

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
