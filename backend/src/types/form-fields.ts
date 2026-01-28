import { t, type Static } from "elysia";

export interface Context {
  user: { id: string };
  set: { status?: number | string };
}

export const getAllFieldsDTO = {
  params: t.Object({
    formId: t.String({
      format: "uuid"
    }),
  }),
};

export interface GetAllFieldsContext extends Context {
  params: Static<typeof getAllFieldsDTO.params>;
}
