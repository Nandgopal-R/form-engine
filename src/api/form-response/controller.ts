import { prisma } from "../../db/prisma";
import { logger } from "../../logger/";
import type {
  FormResponseContext,
  FormResponseForFormOwnerContext,
  GetSubmittedResponseContext,
  ResumeResponseContext,
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

  const response = await prisma.formResponse.create({
    data: {
      formId: params.formId,
      respondentId: user.id,
      answers: body.answers,
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

export async function resumeResponse({
  params,
  body,
  user,
}: ResumeResponseContext) {
  const response = await prisma.formResponse.updateMany({
    where: {
      id: params.responseId,
      respondentId: user.id,
    },
    data: {
      answers: body.answers,
    },
  });

  if (response.count === 0) {
    logger.warn(`No response found with ID ${params.responseId} to update`);
    return {
      success: false,
      message: "No response found to update",
    };
  }

  logger.info(`Response ${params.responseId} updated successfully`);
  return {
    success: true,
    message: "Response updated successfully",
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
