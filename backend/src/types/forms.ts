import { uuid } from "better-auth/*";
import { t, type Static } from "elysia";

export interface Context {
  user: { id: string };
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
    id: t.String({
      format: "uuid"
    }),
  }),
};

export interface GetFormByIdContext extends Context {
  params: Static<typeof getFormByIdDTO.params>;
}

export const updateFormDTO = {
  params: t.Object({
    id: t.String({
      format: "uuid"
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
