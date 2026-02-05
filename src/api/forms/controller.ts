import { prisma } from "../../db/prisma";
import { logger } from "../../logger/";
import type {
  Context,
  CreateFormContext,
  GetFormByIdContext,
  UpdateFormContext,
} from "../../types/forms";

export async function getAllForms({ user }: Context) {
  const forms = await prisma.form.findMany({
    select: {
      id: true,
      title: true,
      isPublished: true,
      createdAt: true,
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

  logger.info("Fetched all forms for user", {
    userId: user.id,
    formCount: forms.length,
  });
  return {
    success: true,
    message: "All forms fetched successfully",
    data: forms,
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

  logger.info("Fetched form for user", { userId: user.id, formId: form.id });
  return {
    success: true,
    message: "Form fetched successfully",
    data: form,
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
