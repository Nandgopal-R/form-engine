import { type Static, t } from "elysia";

export interface Context {
  user: { id: string };
  set: { status?: number | string };
}

export const formResponseDTO = {
  params: t.Object({
    formId: t.String({
      format: "uuid",
    }),
  }),
  body: t.Object({
    answers: t.Record(
      t.String(), // Key: The Field ID (UUID or String)
      t.Union([
        // Value: Can be String, Number, Boolean, or Array (for checkboxes)
        t.String(),
        t.Number(),
        t.Boolean(),
        t.Array(t.String()),
        t.Null(),
      ]),
    ),
    isSubmitted: t.Optional(t.Boolean()), // true = final submission, false/undefined = draft
  }),
};

export interface FormResponseContext extends Context {
  params: Static<typeof formResponseDTO.params>;
  body: Static<typeof formResponseDTO.body>;
}

export const resumeResponseDTO = {
  params: t.Object({
    responseId: t.String({
      format: "uuid",
    }),
  }),
  body: t.Object({
    answers: t.Record(
      t.String(), // Key: The Field ID (UUID or String)
      t.Union([
        // Value: Can be String, Number, Boolean, or Array (for checkboxes)
        t.String(),
        t.Number(),
        t.Boolean(),
        t.Array(t.String()),
        t.Null(),
      ]),
    ),
    isSubmitted: t.Optional(t.Boolean()), // true = final submission, false/undefined = draft
  }),
};

export interface ResumeResponseContext extends Context {
  params: Static<typeof resumeResponseDTO.params>;
  body: Static<typeof resumeResponseDTO.body>;
}

export const formResponseForFormOwnerDTO = {
  params: t.Object({
    formId: t.String({
      format: "uuid",
    }),
  }),
};

export interface FormResponseForFormOwnerContext extends Context {
  params: Static<typeof formResponseForFormOwnerDTO.params>;
}

export const getSubmittedResponseDTO = {
  params: t.Object({
    formId: t.String({
      format: "uuid",
    }),
  }),
};

export interface GetSubmittedResponseContext extends Context {
  params: Static<typeof getSubmittedResponseDTO.params>;
}
