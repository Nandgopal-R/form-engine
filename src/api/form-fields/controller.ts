import { prisma } from "../../db/prisma";
import { logger } from "../../logger/";
import type {
  CreateFieldContext,
  DeleteFieldContext,
  GetAllFieldsContext,
  SwapFieldsContext,
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

  const ordered: typeof fields = [];

  let current = fields.find(
    (f): f is (typeof fields)[number] => f.prevFieldId === null,
  );

  while (current) {
    ordered.push(current);

    current = fields.find(
      (f): f is (typeof fields)[number] => f.prevFieldId === current!.id,
    );
  }

  return { success: true, data: ordered };
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
    return { success: false, message: "Form not found" };
  }

  const createdField = await prisma.$transaction(async (tx) => {
    /**
     * INSERT AT HEAD
     */
    if (!body.prevFieldId) {
      const currentHead = await tx.formFields.findFirst({
        where: {
          formId: params.formId,
          prevFieldId: null,
        },
      });

      const created = await tx.formFields.create({
        data: {
          fieldName: body.fieldName,
          label: body.label,
          fieldValueType: body.fieldValueType,
          fieldType: body.fieldType,
          validation: body.validation ?? undefined,
          formId: params.formId,
          prevFieldId: null,
        },
      });

      if (currentHead) {
        await tx.formFields.update({
          where: { id: currentHead.id },
          data: { prevFieldId: created.id },
        });
      }

      return created;
    }

    /**
     * INSERT AFTER A FIELD
     */
    const prevField = await tx.formFields.findFirst({
      where: {
        id: body.prevFieldId,
        formId: params.formId,
      },
    });

    if (!prevField) {
      // ❗ This will automatically rollback the transaction
      set.status = 400;
      return {
        success: false,
        message: "Previous field not found in the specified form",
      };
    }

    const nextField = await tx.formFields.findFirst({
      where: {
        formId: params.formId,
        prevFieldId: prevField.id,
      },
    });

    const created = await tx.formFields.create({
      data: {
        fieldName: body.fieldName,
        label: body.label,
        fieldValueType: body.fieldValueType,
        fieldType: body.fieldType,
        validation: body.validation ?? undefined,
        formId: params.formId,
        prevFieldId: prevField.id,
      },
    });

    if (nextField) {
      await tx.formFields.update({
        where: { id: nextField.id },
        data: { prevFieldId: created.id },
      });
    }

    return created;
  });

  logger.info(`Created field createdField in form ${params.formId}`);

  return {
    success: true,
    message: "Field created successfully",
    data: createdField,
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
    const nextField = await tx.formFields.findFirst({
      where: {
        formId: field.formId,
        prevFieldId: field.id,
      },
    });

    // relink previous → next
    if (nextField) {
      await tx.formFields.update({
        where: { id: nextField.id },
        data: { prevFieldId: field.prevFieldId },
      });
    }

    await tx.formFields.delete({
      where: { id: field.id },
    });
  });

  logger.info(`Deleted field ${params.id}`);
  return { success: true, message: "Field deleted successfully" };
}

export async function swapFields({ body, set, user }: SwapFieldsContext) {
  const { firstFieldId, secondFieldId } = body;

  // 1. Fetch both fields
  const fields = await prisma.formFields.findMany({
    where: { id: { in: [firstFieldId, secondFieldId] } },
    include: { form: true },
  });

  const firstField = fields.find((f) => f.id === firstFieldId);
  const secondField = fields.find((f) => f.id === secondFieldId);

  if (!firstField || !secondField) {
    set.status = 404;
    return { success: false, message: "One or both fields not found" };
  }

  // 2. Authorization
  if (
    firstField.form.ownerId !== user.id ||
    secondField.form.ownerId !== user.id
  ) {
    set.status = 403;
    return { success: false, message: "Unauthorized" };
  }

  // 3. Same-form guard
  if (firstField.formId !== secondField.formId) {
    set.status = 400;
    return { success: false, message: "Fields must belong to the same form" };
  }

  // 4. No-op guard
  if (firstFieldId === secondFieldId) {
    return { success: true, message: "Fields are the same, no swap needed" };
  }

  // 5. Transaction: rebuild order safely
  await prisma.$transaction(async (tx) => {
    // Fetch ALL fields of the form
    const allFields = await tx.formFields.findMany({
      where: { formId: firstField.formId },
    });

    // Reconstruct current order
    const byPrev = new Map<string | null, (typeof allFields)[number]>();

    for (const field of allFields) {
      // if corruption exists, last one wins — still deterministic
      byPrev.set(field.prevFieldId ?? null, field);
    }

    const ordered: typeof allFields = [];
    let current = byPrev.get(null);

    while (current) {
      ordered.push(current);
      current = byPrev.get(current.id);
    }

    if (ordered.length !== allFields.length) {
      set.status = 500;
      return {
        success: false,
        message: "Form fields list is corrupted",
      };
    }

    // Swap positions
    const i = ordered.findIndex((f) => f.id === firstFieldId);
    const j = ordered.findIndex((f) => f.id === secondFieldId);

    if (i === -1 || j === -1) {
      set.status = 500;
      return {
        success: false,
        message: "Form fields list is corrupted",
      };
    }

    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];

    // Rewrite prevFieldId
    for (let k = 0; k < ordered.length; k++) {
      await tx.formFields.update({
        where: { id: ordered[k].id },
        data: {
          prevFieldId: k === 0 ? null : ordered[k - 1].id,
        },
      });
    }
  });

  logger.info(`Swapped fields ${firstFieldId} and ${secondFieldId}`);
  return { success: true, message: "Fields swapped successfully" };
}
