import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { logger } from "../../logger/";
import type {
  AIFormResponse,
  AiGenerateFormContext,
} from "../../types/ai-generate";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

if (!GROQ_API_KEY) {
  logger.warn("GROQ_API_KEY is not set – AI form generation will fail");
}

const SYSTEM_PROMPT = `You are a form builder AI for an application called FormEngine.
Given a user prompt, generate a form definition with appropriate fields.
You MUST respond with ONLY valid JSON matching this exact schema — no markdown, no explanation:

{
  "title": "string",
  "description": "string",
  "fields": [
    {
      "fieldName": "string (camelCase, no spaces)",
      "label": "string (human-readable label)",
      "fieldType": "string (one of the allowed types below)",
      "fieldValueType": "string (one of: string, number, boolean, array)",
      "validation": { "required": true },
      "options": ["only", "for", "choice", "fields"]
    }
  ]
}

FIELD TYPE REFERENCE (use only these values for fieldType):
- text         → single-line text input (fieldValueType: string)
- textarea     → multi-line text input (fieldValueType: string)
- number       → numeric input (fieldValueType: number)
- email        → email address input (fieldValueType: string)
- phone        → phone number input (fieldValueType: string)
- url          → URL input (fieldValueType: string)
- select       → dropdown select – MUST include "options" array (fieldValueType: string)
- radio        → radio button group – MUST include "options" array (fieldValueType: string)
- checkbox     → checkbox group – MUST include "options" array (fieldValueType: array)
- slider       → range slider (fieldValueType: number)
- date         → date picker (fieldValueType: string)
- time         → time picker (fieldValueType: string)
- cgpa         → CGPA input with 0-10 range (fieldValueType: number)

VALIDATION RULES (use as keys in the "validation" object):
- required   : boolean – whether the field is mandatory
- minLength  : number  – minimum character length (for text/textarea)
- maxLength  : number  – maximum character length (for text/textarea)
- min        : number  – minimum numeric value (for number/slider/cgpa)
- max        : number  – maximum numeric value (for number/slider/cgpa)
- pattern    : string  – regex pattern for custom validation

IMPORTANT RULES:
1. fieldName must be camelCase with no spaces.
2. Always provide sensible default validation (at minimum "required": true for mandatory fields).
3. For select, radio, and checkbox types you MUST provide an "options" array with at least 2 items.
4. Do NOT include "options" for non-choice field types.
5. The "validation" value must be a JSON object (not a string), e.g. {"required":true}.
6. Generate between 3 and 20 fields depending on the complexity of the prompt.
7. Order the fields logically (e.g. name before email, personal info before academic info).
8. Respond with ONLY the JSON object. No markdown fences, no explanation.`;

async function callGroq(prompt: string): Promise<AIFormResponse> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Groq API error ${response.status}: ${errorBody.slice(0, 300)}`,
    );
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned empty response");
  }

  return JSON.parse(content) as AIFormResponse;
}

export async function aiGenerateForm({
  user,
  body,
  set,
}: AiGenerateFormContext) {
  if (!GROQ_API_KEY) {
    set.status = 503;
    return {
      success: false,
      message: "AI service is not configured",
    };
  }

  // Call Groq
  let parsed: AIFormResponse;
  try {
    parsed = await callGroq(body.prompt);
  } catch (err) {
    logger.error("AI API call or JSON parse failed", err);
    set.status = 502;
    return {
      success: false,
      message: "Failed to generate form from AI. Please try again.",
    };
  }

  // Basic sanity check on the parsed response
  if (
    !parsed.title ||
    !parsed.description ||
    !Array.isArray(parsed.fields) ||
    parsed.fields.length === 0
  ) {
    logger.error("Gemini returned incomplete form data", { parsed });
    set.status = 502;
    return {
      success: false,
      message: "AI returned an incomplete form. Please try a different prompt.",
    };
  }

  // Persist form + fields in a single transaction with linked-list ordering
  try {
    const form = await prisma.$transaction(async (tx) => {
      const createdForm = await tx.form.create({
        data: {
          title: parsed.title,
          description: parsed.description,
          ownerId: user.id,
        },
      });

      let prevFieldId: string | null = null;

      for (const field of parsed.fields) {
        // Parse validation – may be a JSON object or JSON-encoded string
        let validationObj: Prisma.InputJsonValue | undefined;
        try {
          validationObj =
            typeof field.validation === "string"
              ? JSON.parse(field.validation)
              : (field.validation as Prisma.InputJsonValue | undefined);
        } catch {
          validationObj = { required: true } as Prisma.InputJsonValue;
        }

        const createdField = await tx.formFields.create({
          data: {
            fieldName: field.fieldName,
            label: field.label,
            fieldType: field.fieldType,
            fieldValueType: field.fieldValueType,
            validation: validationObj ?? undefined,
            options: field.options ?? undefined,
            formId: createdForm.id,
            prevFieldId,
          },
        });

        prevFieldId = createdField.id;
      }

      // Return the full form with ordered fields
      return tx.form.findUniqueOrThrow({
        where: { id: createdForm.id },
        include: { formFields: true },
      });
    });

    // Order the fields by the linked list for the response
    const orderedFields: typeof form.formFields = [];
    let current = form.formFields.find((f) => f.prevFieldId === null);
    while (current) {
      orderedFields.push(current);
      const currentId = current.id;
      current = form.formFields.find((f) => f.prevFieldId === currentId);
    }

    logger.info("AI generated form created", {
      userId: user.id,
      formId: form.id,
      fieldCount: orderedFields.length,
    });

    return {
      success: true,
      message: "Form generated successfully",
      data: {
        id: form.id,
        title: form.title,
        description: form.description,
        isPublished: form.isPublished,
        createdAt: form.createdAt,
        fields: orderedFields,
      },
    };
  } catch (err) {
    logger.error("Failed to save AI-generated form to database", err);
    set.status = 500;
    return {
      success: false,
      message: "Failed to save the generated form",
    };
  }
}
