import { type Static, t } from "elysia";

export interface Context {
  user: { id: string };
  set: { status?: number | string };
}

export const aiGenerateFormDTO = {
  body: t.Object({
    prompt: t.String({ minLength: 1 }),
  }),
};

export interface AiGenerateFormContext extends Context {
  body: Static<typeof aiGenerateFormDTO.body>;
}

/** Shape the AI must return */
export interface AIFormResponse {
  title: string;
  description: string;
  fields: AIFormField[];
}

export interface AIFormField {
  fieldName: string;
  label: string;
  fieldType: string;
  fieldValueType: string;
  validation: Record<string, unknown>;
  options?: string[];
}
