import { prisma } from "../../db/prisma";
import { logger } from "../../logger/";
import type {
  CreateFieldContext,
  DeleteFieldContext,
  GetAllFieldsContext,
  UpdateFieldContext,
} from "../../types/form-fields";

export async function getAllFields({ params, set }: GetAllFieldsContext) {
  const formExists = await prisma.form.count({
    where: { id: params.formId },
  });

  if (formExists === 0) {
    set.status = 404;
    logger.warn(`Form not found for formId: ${params.formId}`);
    return {
      success: false,
      message: "Form not found",
      data: [],
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
      nextField: true,
    },
    where: { formId: params.formId },
  });

  if (fields.length === 0) {
    logger.info(`No fields found for formId: ${params.formId}`);
    return {
      success: true,
      message: "No forms fields found",
      data: [],
    };
  }
  logger.info(
    `Fetched all fields for formId: ${params.formId}, fieldCount: ${fields.length}`,
  );
  return {
    success: true,
    message: "All form fields fetched successfully",
    data: fields,
  };
}

export async function createField({
  params,
  body,
  set,
  user,
}: CreateFieldContext) {
  const form = await prisma.form.findFirst({
    where: {
      id: params.formId,
      ownerId: user.id,
    },
  });

  if (!form) {
    set.status = 404;
    return {
      success: false,
      message: "Form not found",
    };
  }

  const field = await prisma.$transaction(async (tx) => {
    // 1. If we are inserting after a specific field (prevFieldId provided)
    if (body.prevFieldId) {
      // Fetch the previous field to see if it has a next field
      const prevField = await tx.formFields.findUnique({
        where: { id: body.prevFieldId },
      });

      if (!prevField) {
        throw new Error("Previous field not found");
      }

      // 2. Create the new field
      // It points back to prevFieldId
      // It points forward to whatever prevField was pointing to
      const newField = await tx.formFields.create({
        data: {
          fieldName: body.fieldName,
          label: body.label,
          fieldValueType: body.fieldValueType,
          fieldType: body.fieldType,
          validation: body.validation ?? undefined,
          prevFieldId: body.prevFieldId,
          nextField: prevField.nextField, // Inherit the link
          formId: params.formId,
        },
      });

      // 3. Update the previous field to point to the new field
      await tx.formFields.update({
        where: { id: body.prevFieldId },
        data: { nextField: newField.id },
      });

      // 4. If there was a next field, update it to point back to the new field
      if (prevField.nextField) {
        // We can't query by `id` directly if `nextField` is just a string without relation,
        // but typically we can update the row where id matches the string.
        await tx.formFields.update({
          where: { id: prevField.nextField },
          data: { prevFieldId: newField.id },
        });
      }

      return newField;
    }

    // Fallback: If no prevFieldId is provided, we assume it's the first field
    // or simply creating a field without links yet.
    return await tx.formFields.create({
      data: {
        fieldName: body.fieldName,
        label: body.label,
        fieldValueType: body.fieldValueType,
        fieldType: body.fieldType,
        validation: body.validation ?? undefined,
        formId: params.formId,
      },
    });
  });

  logger.info(`Created field ${field.id} for form ${params.formId}`);

  return {
    success: true,
    message: "Field created successfully",
    data: field,
  };
}

export async function updateField({
  params,
  body,
  set,
  user,
}: UpdateFieldContext) {
  const field = await prisma.formFields.findUnique({
    where: { id: params.id },
    include: { form: true },
  });

  if (!field) {
    set.status = 404;
    return { success: false, message: "Field not found" };
  }

  if (field.form.ownerId !== user.id) {
    set.status = 403;
    return { success: false, message: "Unauthorized" };
  }

  const updatedField = await prisma.formFields.update({
    where: { id: params.id },
    data: {
      fieldName: body.fieldName,
      label: body.label,
      fieldValueType: body.fieldValueType,
      fieldType: body.fieldType,
      validation: body.validation ?? undefined,
    },
  });

  logger.info(`Updated field ${updatedField.id}`);

  return {
    success: true,
    message: "Field updated successfully",
    data: updatedField,
  };
}

export async function deleteField({ params, set, user }: DeleteFieldContext) {
  const field = await prisma.formFields.findUnique({
    where: { id: params.id },
    include: { form: true },
  });

  if (!field) {
    set.status = 404;
    return { success: false, message: "Field not found" };
  }

  if (field.form.ownerId !== user.id) {
    set.status = 403;
    return { success: false, message: "Unauthorized" };
  }

  await prisma.$transaction(async (tx) => {
    // 1. Link Previous to Next
    if (field.prevFieldId) {
      await tx.formFields.update({
        where: { id: field.prevFieldId },
        data: { nextField: field.nextField },
      });
    }

    // 2. Link Next to Previous
    if (field.nextField) {
      await tx.formFields.update({
        where: { id: field.nextField },
        data: { prevFieldId: field.prevFieldId },
      });
    }

    // 3. Delete the field
    await tx.formFields.delete({
      where: { id: params.id },
    });
  });

  logger.info(`Deleted field ${params.id}`);
  return { success: true, message: "Field deleted successfully" };
}
