import { prisma } from "../../db/prisma";
import { logger } from "../../logger/";
import type {
  Context,
  CreateFormContext,
  GetFormByIdContext,
  GetPublicFormByIdContext,
  UpdateFormContext,
} from "../../types/forms";

export async function getAllForms({ user }: Context) {
  const forms = await prisma.form.findMany({
    select: {
      id: true,
      title: true,
      isPublished: true,
      createdAt: true,
      _count: {
        select: {
          formResponses: {
            where: { isSubmitted: true },
          },
        },
      },
    },
    where: { ownerId: user.id },
  });

  if (forms.length === 0) {
    logger.info("No forms found for user", { userId: user.id });
    return {
      success: true,
      message: "No forms found",
      data: [],
    };
  }

  // Transform to include responseCount
  const formsWithCount = forms.map((form) => ({
    id: form.id,
    title: form.title,
    isPublished: form.isPublished,
    createdAt: form.createdAt,
    responseCount: form._count.formResponses,
  }));

  logger.info("Fetched all forms for user", {
    userId: user.id,
    formCount: forms.length,
  });
  return {
    success: true,
    message: "All forms fetched successfully",
    data: formsWithCount,
  };
}

export async function createForm({ user, body }: CreateFormContext) {
  const form = await prisma.form.create({
    data: {
      title: body.title,
      description: body.description,
      ownerId: user.id,
    },
  });
  logger.info("Created new form for user", {
    userId: user.id,
    formId: form.id,
  });
  return {
    success: true,
    message: "Form created successfully",
    data: form,
  };
}

export async function getFormById({ user, params, set }: GetFormByIdContext) {
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

<<<<<<< HEAD
=======
  const fields = await prisma.formFields.findMany({
    where: { formId: params.formId },
  });

  if (fields.length === 0) {
    logger.info(`No fields found for formId: ${params.formId}`);
    return {
      success: true,
      message: "Form fetched successfully (no fields)",
      data: { ...form, fields: [] },
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

>>>>>>> 1e9d4e8 (fix: fix getFormById and form-responses for integration)
  logger.info("Fetched form for user", { userId: user.id, formId: form.id });
  return {
    success: true,
    message: "Form fetched successfully",
<<<<<<< HEAD
    data: form,
=======
    data: { ...form, fields: ordered },
>>>>>>> 1e9d4e8 (fix: fix getFormById and form-responses for integration)
  };
}

export async function updateForm({
  user,
  params,
  body,
  set,
}: UpdateFormContext) {
  // We use findFirst first to ensure ownership and existence before updating,
  // as prisma.update throws if not found.
  const existing = await prisma.form.findFirst({
    where: {
      id: params.formId,
      ownerId: user.id,
    },
  });

  if (!existing) {
    set.status = 404;
    return {
      success: false,
      message: "Form not found",
    };
  }

  const form = await prisma.form.update({
    where: {
      id: params.formId,
    },
    data: {
      title: body.title,
      description: body.description,
    },
  });

  logger.info("Updated form for user", { userId: user.id, formId: form.id });
  return {
    success: true,
    message: "Form updated successfully",
    data: form,
  };
}

export async function deleteForm({ user, params, set }: GetFormByIdContext) {
  const form = await prisma.form.deleteMany({
    where: {
      id: params.formId,
      ownerId: user.id,
    },
  });

  if (form.count === 0) {
    logger.warn("Attempted to delete non-existent form", {
      userId: user.id,
      formId: params.formId,
    });
    set.status = 404;
    return {
      success: false,
      message: "Form not found",
    };
  }

  logger.info("Deleted form for user", {
    userId: user.id,
    formId: params.formId,
  });
  return {
    success: true,
    message: "Form deleted successfully",
  };
}

export async function publishForm({ user, params, set }: GetFormByIdContext) {
  const existing = await prisma.form.findFirst({
    where: {
      id: params.formId,
      ownerId: user.id,
    },
  });

  if (!existing) {
    set.status = 404;
    return {
      success: false,
      message: "Form not found",
    };
  }

  const form = await prisma.form.update({
    where: {
      id: params.formId,
    },
    data: {
      isPublished: true,
    },
  });

  logger.info("Published form for user", { userId: user.id, formId: form.id });
  return {
    success: true,
    message: "Form published successfully",
    data: form,
  };
}

export async function unPublishForm({ user, params, set }: GetFormByIdContext) {
  const existing = await prisma.form.findFirst({
    where: {
      id: params.formId,
      ownerId: user.id,
    },
  });

  if (!existing) {
    logger.warn("Attempted to unpublish non-existent form", {
      userId: user.id,
      formId: params.formId,
    });
    set.status = 404;
    return {
      success: false,
      message: "Form not found",
    };
  }

  const form = await prisma.form.update({
    where: {
      id: params.formId,
    },
    data: {
      isPublished: false,
    },
  });

  logger.info("Unpublished form for user", {
    userId: user.id,
    formId: form.id,
  });
  return {
    success: true,
    message: "Form unpublished successfully",
    data: form,
  };
}

// Public endpoint - any authenticated user can access published forms
export async function getPublicFormById({
  params,
  set,
}: GetPublicFormByIdContext) {
  const form = await prisma.form.findFirst({
    where: {
      id: params.formId,
      isPublished: true, // Only allow access to published forms
    },
    select: {
      id: true,
      title: true,
      description: true,
      isPublished: true,
      createdAt: true,
    },
  });

  if (!form) {
    set.status = 404;
    return {
      success: false,
      message: "Form not found or not published",
    };
  }

  const fields = await prisma.formFields.findMany({
    where: { formId: params.formId },
  });

  if (fields.length === 0) {
    logger.info(`No fields found for public formId: ${params.formId}`);
    return {
      success: true,
      message: "Form fetched successfully (no fields)",
      data: { ...form, fields: [] },
    };
  }

  // Order fields by linked list structure
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

  logger.info("Fetched public form", { formId: form.id });
  return {
    success: true,
    message: "Form fetched successfully",
    data: { ...form, fields: ordered },
  };
}
