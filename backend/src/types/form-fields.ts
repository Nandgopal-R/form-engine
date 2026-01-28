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

export const createFieldDTO = {
  params: t.Object({
    formId: t.String({
      format: "uuid",
    }),
  }),
  body: t.Object({
    fieldName: t.String(),
    label: t.Optional(t.String()),
    fieldValueType: t.String(),
    fieldType: t.String(),
    validation: t.Optional(t.Any()),
    prevFieldId: t.Optional(t.String({
      format: "uuid",
    })),
  }),
};

export interface CreateFieldContext extends Context {
  params: Static<typeof createFieldDTO.params>;
  body: Static<typeof createFieldDTO.body>;
}
