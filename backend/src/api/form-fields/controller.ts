import { prisma } from "../../db/prisma"
import { logger } from "../../logger/"
import { GetAllFieldsContext, CreateFieldContext, UpdateFieldContext, DeleteFieldContext } from "../../types/form-fields"

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

  const ordered: typeof fields = []

  let current = fields.find(
    (f): f is typeof fields[number] => f.prevFieldId === null
  )

  while (current) {
    ordered.push(current)

    current = fields.find(
      (f): f is typeof fields[number] =>
        f.prevFieldId === current!.id
    )
  }

  return { success: true, data: ordered }
}

export async function createField({ params, body, set, user }: CreateFieldContext) {
  const form = await prisma.form.findFirst({
    where: {
      id: params.formId,
      ownerId: user.id
    }
  })

  if (!form) {
    set.status = 404
    return { success: false, message: "Form not found" }
  }

  const createdField = await prisma.$transaction(async (tx) => {

    /**
     * INSERT AT HEAD
     */
    if (!body.prevFieldId) {
      const currentHead = await tx.formFields.findFirst({
        where: {
          formId: params.formId,
          prevFieldId: null
        }
      })

      const created = await tx.formFields.create({
        data: {
          fieldName: body.fieldName,
          label: body.label,
          fieldValueType: body.fieldValueType,
          fieldType: body.fieldType,
          validation: body.validation ?? undefined,
          formId: params.formId,
          prevFieldId: null
        }
      })

      if (currentHead) {
        await tx.formFields.update({
          where: { id: currentHead.id },
          data: { prevFieldId: created.id }
        })
      }

      return created
    }

    /**
     * INSERT AFTER A FIELD
     */
    const prevField = await tx.formFields.findFirst({
      where: {
        id: body.prevFieldId,
        formId: params.formId
      }
    })

    if (!prevField) {
      // ❗ This will automatically rollback the transaction
      throw new Error("Previous field not found in the specified form")
    }

    const nextField = await tx.formFields.findFirst({
      where: {
        formId: params.formId,
        prevFieldId: prevField.id
      }
    })

    const created = await tx.formFields.create({
      data: {
        fieldName: body.fieldName,
        label: body.label,
        fieldValueType: body.fieldValueType,
        fieldType: body.fieldType,
        validation: body.validation ?? undefined,
        formId: params.formId,
        prevFieldId: prevField.id
      }
    })

    if (nextField) {
      await tx.formFields.update({
        where: { id: nextField.id },
        data: { prevFieldId: created.id }
      })
    }

    return created
  })

  logger.info(`Created field ${createdField.id} in form ${params.formId}`)

  return {
    success: true,
    message: "Field created successfully",
    data: createdField
  }
}


export async function updateField({ params, body, set, user }: UpdateFieldContext) {
  const field = await prisma.formFields.findUnique({
    where: { id: params.id },
    include: { form: true }
  })

  if (!field) {
    set.status = 404
    return { success: false, message: "Field not found" }
  }

  if (field.form.ownerId !== user.id) {
    set.status = 403
    return { success: false, message: "Unauthorized" }
  }

  const updatedField = await prisma.formFields.update({
    where: { id: params.id },
    data: {
      fieldName: body.fieldName,
      label: body.label,
      fieldValueType: body.fieldValueType,
      fieldType: body.fieldType,
      validation: body.validation ?? undefined,
    }
  })

  logger.info(`Updated field ${updatedField.id}`)

  return {
    success: true,
    message: "Field updated successfully",
    data: updatedField
  }
}

export async function deleteField({ params, set, user }: DeleteFieldContext) {
  const field = await prisma.formFields.findUnique({
    where: { id: params.id },
    include: { form: true }
  })

  if (!field) {
    set.status = 404
    return { success: false, message: "Field not found" }
  }

  if (field.form.ownerId !== user.id) {
    set.status = 403
    return { success: false, message: "Unauthorized" }
  }

  await prisma.$transaction(async (tx) => {
    const nextField = await tx.formFields.findFirst({
      where: {
        formId: field.formId,
        prevFieldId: field.id
      }
    })

    // relink previous → next
    if (nextField) {
      await tx.formFields.update({
        where: { id: nextField.id },
        data: { prevFieldId: field.prevFieldId }
      })
    }

    await tx.formFields.delete({
      where: { id: field.id }
    })
  })

  logger.info(`Deleted field ${params.id}`)
  return { success: true, message: "Field deleted successfully" }
}
