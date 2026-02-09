import { type Static, t } from "elysia";

export interface Context {
  user: { id: string };
  set: { status?: number | string };
}

// Public context (no user required)
export interface PublicContext {
  set: { status?: number | string };
}

export const createFormDTO = {
  body: t.Object({
    title: t.String(),
    description: t.Optional(t.String()),
  }),
};

export interface CreateFormContext extends Context {
  body: Static<typeof createFormDTO.body>;
}

export const getFormByIdDTO = {
  params: t.Object({
    formId: t.String({
      format: "uuid",
    }),
  }),
};

export interface GetFormByIdContext extends Context {
  params: Static<typeof getFormByIdDTO.params>;
}

// Public context for fetching published forms (no auth required)
export interface GetPublicFormByIdContext extends PublicContext {
  params: Static<typeof getFormByIdDTO.params>;
}

export const updateFormDTO = {
  params: t.Object({
    formId: t.String({
      format: "uuid",
    }),
  }),
  body: t.Object({
    title: t.Optional(t.String()),
    description: t.Optional(t.String()),
  }),
};

export interface UpdateFormContext extends Context {
  params: Static<typeof updateFormDTO.params>;
  body: Static<typeof updateFormDTO.body>;
}
