import { prisma } from "../../db/prisma";
import { logger } from "../../logger/";
import type {
  FormResponseContext,
  FormResponseForFormOwnerContext,
  GetSubmittedResponseContext,
} from "../../types/form-response";

export async function submitResponse({
  params,
  body,
  user,
  set,
}: FormResponseContext) {
  const form = await prisma.form.findUnique({
    where: {
      id: params.formId,
    },
  });

  if (!form) {
    logger.warn(`Form with ID ${params.formId} not found`);
    set.status = 404;
    return {
      success: false,
      message: "Form not found",
    };
  }

  if (!form.isPublished) {
    logger.warn(`Form with ID ${params.formId} is not published`);
    set.status = 403;
    return {
      success: false,
      message: "Form is not published",
    };
  }

  const existing = await prisma.formResponse.findUnique({
    where: {
      formId_respondentId: {
        formId: params.formId,
        respondentId: user.id,
      },
    },
  });

  if (existing?.isSubmitted) {
    set.status = 400;
    return {
      success: false,
      message: "You have already submitted this form",
    };
  }

  const response = await prisma.formResponse.upsert({
    where: {
      formId_respondentId: {
        formId: params.formId,
        respondentId: user.id,
      },
    },
    update: {
      answers: body.answers,
      isSubmitted: true,
      submittedAt: new Date(),
    },
    create: {
      formId: params.formId,
      respondentId: user.id,
      answers: body.answers,
      isSubmitted: true,
      submittedAt: new Date(),
    },
  });
  logger.info(
    `User ${user.id} submitted response ${response.id} for form ${params.formId}`,
  );
  return {
    success: true,
    message: "Response submitted successfully",
    data: response,
  };
}

export async function saveDraftResponse({
  params,
  body,
  user,
  set,
}: FormResponseContext) {
  const form = await prisma.form.findUnique({
    where: {
      id: params.formId,
    },
  });

  if (!form) {
    logger.warn(`Form with ID ${params.formId} not found`);
    set.status = 404;
    return {
      success: false,
      message: "Form not found",
    };
  }

  const existing = await prisma.formResponse.findUnique({
    where: {
      formId_respondentId: {
        formId: params.formId,
        respondentId: user.id,
      },
    },
  });

  if (existing?.isSubmitted) {
    set.status = 400;
    return {
      success: false,
      message: "Response already submitted and cannot be edited",
    };
  }

  const response = await prisma.formResponse.upsert({
    where: {
      formId_respondentId: {
        formId: params.formId,
        respondentId: user.id,
      },
    },
    update: {
      answers: body.answers,
      isSubmitted: false,
    },
    create: {
      formId: params.formId,
      respondentId: user.id,
      answers: body.answers,
    },
  });

  logger.info(`User ${user.id} saved draft response for form ${params.formId}`);
  return {
    success: true,
    message: "Draft response saved successfully",
    data: response,
  };
}

export async function getResponseForFormOwner({
  params,
  user,
  set,
}: FormResponseForFormOwnerContext) {
  const form = await prisma.form.findUnique({
    where: {
      id: params.formId,
      ownerId: user.id,
    },
  });

  if (!form) {
    logger.warn(
      `Form with ID ${params.formId} not found or does not belong to user ${user.id}`,
    );
    set.status = 404;
    return {
      success: false,
      message: "Form not found or access denied",
    };
  }

  const responses = await prisma.formResponse.findMany({
    where: {
      formId: params.formId,
      isSubmitted: true,
    },
    select: {
      id: true,
      formId: true,
      answers: true,
      form: {
        select: {
          title: true,
        },
      },
    },
  });
  if (responses.length === 0) {
    logger.warn(`No responses found for form ID ${params.formId}`);
    return {
      success: false,
      message: "No responses found for this form",
    };
  }

  const fields = await prisma.formFields.findMany({
    where: {
      formId: params.formId,
    },
    select: {
      id: true,
      fieldName: true,
    },
  });

  const fieldIdToNameMap = Object.fromEntries(
    fields.map((f) => [f.id, f.fieldName]),
  );

  const formattedResponses = responses.map((r) => {
    const transformedAnswers: Record<string, any> = {};

    for (const [fieldId, value] of Object.entries(
      r.answers as Record<string, any>,
    )) {
      const fieldName = fieldIdToNameMap[fieldId] ?? fieldId;
      transformedAnswers[fieldName] = value;
    }

    return {
      id: r.id,
      formId: r.formId,
      formTitle: r.form.title,
      answers: transformedAnswers,
    };
  });

  logger.info(`Retrieved responses for form ID ${params.formId}`);
  return {
    success: true,
    message: "Responses retrieved successfully",
    data: formattedResponses,
  };
}

export async function getSubmittedResponse({
  params,
  user,
  set,
}: GetSubmittedResponseContext) {
  const response = await prisma.formResponse.findMany({
    where: {
      respondentId: user.id,
      formId: params.formId,
      isSubmitted: true,
    },
    select: {
      id: true,
      formId: true,
      answers: true,
      form: {
        select: {
          title: true,
        },
      },
    },
  });

  if (response.length === 0) {
    logger.warn(
      `No response found for user ${user.id} on form ${params.formId}`,
    );
    set.status = 404;
    return {
      success: false,
      message: "No response found for this form",
    };
  }

  const fields = await prisma.formFields.findMany({
    where: {
      formId: params.formId,
    },
    select: {
      id: true,
      fieldName: true,
    },
  });

  const fieldIdToNameMap = Object.fromEntries(
    fields.map((f) => [f.id, f.fieldName]),
  );

  const formattedResponses = response.map((r) => {
    const transformedAnswers: Record<string, any> = {};

    for (const [fieldId, value] of Object.entries(
      r.answers as Record<string, any>,
    )) {
      const fieldName = fieldIdToNameMap[fieldId] ?? fieldId;
      transformedAnswers[fieldName] = value;
    }

    return {
      id: r.id,
      formId: r.formId,
      formTitle: r.form.title,
      answers: transformedAnswers,
    };
  });

  logger.info(
    `Retrieved response for user ${user.id} on form ${params.formId}`,
  );
  return {
    success: true,
    message: "Response retrieved successfully",
    data: formattedResponses,
  };
}

export async function getDraftResponse({
  params,
  user,
  set,
}: GetSubmittedResponseContext) {
  const draft = await prisma.formResponse.findFirst({
    where: {
      respondentId: user.id,
      formId: params.formId,
      isSubmitted: false,
    },
    select: {
      id: true,
      formId: true,
      answers: true,
      form: {
        select: { title: true },
      },
    },
  });

  if (!draft) {
    set.status = 404;
    return {
      success: false,
      message: "No draft found",
    };
  }

  const fields = await prisma.formFields.findMany({
    where: { formId: params.formId },
    select: { id: true, fieldName: true },
  });

  const map = Object.fromEntries(fields.map((f) => [f.id, f.fieldName]));

  const transformed: Record<string, any> = {};

  for (const [fieldId, value] of Object.entries(
    draft.answers as Record<string, any>,
  )) {
    transformed[map[fieldId] ?? fieldId] = value;
  }

  return {
    success: true,
    data: {
      id: draft.id,
      formId: draft.formId,
      formTitle: draft.form.title,
      answers: transformed,
    },
  };
}
