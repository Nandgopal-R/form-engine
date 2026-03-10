import { type Static, t } from "elysia";

export const formAnalyticsDTO = {
  params: t.Object({
    formId: t.String({ format: "uuid" }),
  }),
  query: t.Object({
    format: t.Optional(t.String()),
  }),
};

export interface FormAnalyticsContext {
  user: { id: string };
  params: Static<typeof formAnalyticsDTO.params>;
  query: Static<typeof formAnalyticsDTO.query>;
  set: {
    status?: number | string;
    headers: Record<string, string | number>;
  };
}

export interface AnalyticsReport {
  totalResponsesAnalyzed: number;
  executiveSummary: string;
  quantitativeInsights: Array<{
    question: string;
    metric: string;
    value: string | number;
  }>;
  qualitativeThemes: Array<{
    theme: string;
    description: string;
    frequency: string;
  }>;
}
