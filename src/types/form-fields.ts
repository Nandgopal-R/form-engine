import { type Static, t } from "elysia";

export interface Context {
  user: { id: string };
  set: { status?: number | string };
}

export const getAllFieldsDTO = {
  params: t.Object({
    formId: t.String({
      format: "uuid",
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
    prevFieldId: t.Optional(
      t.String({
        format: "uuid",
      }),
    ),
  }),
};

export interface CreateFieldContext extends Context {
  params: Static<typeof createFieldDTO.params>;
  body: Static<typeof createFieldDTO.body>;
}

export const updateFieldDTO = {
  params: t.Object({
    id: t.String({
      format: "uuid",
    }),
  }),
  body: t.Object({
    fieldName: t.Optional(t.String()),
    label: t.Optional(t.String()),
    fieldValueType: t.Optional(t.String()),
    fieldType: t.Optional(t.String()),
    validation: t.Optional(t.Any()),
  }),
};

export interface UpdateFieldContext extends Context {
  params: Static<typeof updateFieldDTO.params>;
  body: Static<typeof updateFieldDTO.body>;
}

export const deleteFieldDTO = {
  params: t.Object({
    id: t.String({
      format: "uuid",
    }),
  }),
};

export interface DeleteFieldContext extends Context {
  params: Static<typeof deleteFieldDTO.params>;
}

export const swapFieldsDTO = {
  body: t.Object({
    firstFieldId: t.String({
      format: "uuid",
    }),
    secondFieldId: t.String({
      format: "uuid",
    }),
  }),
};

export interface SwapFieldsContext extends Context {
  body: Static<typeof swapFieldsDTO.body>;
}
