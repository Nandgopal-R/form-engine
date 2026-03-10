import PDFDocument from "pdfkit";
import { prisma } from "../../db/prisma";
import { logger } from "../../logger/";
import type {
  AnalyticsReport,
  FormAnalyticsContext,
} from "../../types/form-analytics";
import { groqFetch } from "./groq-fetch";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const ANALYTICS_SYSTEM_PROMPT = `You are an analytics engine for a form-response platform called FormEngine.
You will receive a JSON array of form responses (each containing answers as key-value pairs).
Analyze all responses and produce ONLY valid JSON matching this exact schema — no markdown, no explanation:

{
  "totalResponsesAnalyzed": <number>,
  "executiveSummary": "<A high-level paragraph summarizing overall sentiment, trends, and key takeaways from the responses>",
  "quantitativeInsights": [
    {
      "question": "<the form field/question label>",
      "metric": "<what is being measured, e.g. 'Average', 'Most Common', 'Distribution'>",
      "value": "<computed value — string or number>"
    }
  ],
  "qualitativeThemes": [
    {
      "theme": "<short theme name>",
      "description": "<description of this theme found across responses>",
      "frequency": "<how often this theme appears, e.g. '65% of responses', '12 out of 20'>"
    }
  ]
}

RULES:
1. Respond with ONLY the JSON object. No markdown fences, no explanation.
2. totalResponsesAnalyzed must equal the number of responses provided.
3. Provide at least 1 quantitativeInsight and 1 qualitativeTheme.
4. For numeric fields, compute averages, min, max, or distributions where applicable.
5. For text/choice fields, identify common themes, most popular choices, and sentiment.
6. The executiveSummary should be a well-written paragraph of 3-5 sentences.`;

async function callGroqForAnalytics(
  responsesJson: string,
): Promise<AnalyticsReport> {
  const response = await groqFetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: ANALYTICS_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze the following form responses:\n${responsesJson}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
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

  return JSON.parse(content) as AnalyticsReport;
}

function generatePdfBuffer(
  report: AnalyticsReport,
  formTitle: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Uint8Array[] = [];

    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Title
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(formTitle, { align: "center" });
    doc.moveDown(0.3);
    doc
      .fontSize(12)
      .font("Helvetica")
      .text("Analytics Report", { align: "center" });
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .fillColor("#666666")
      .text(`Generated on ${new Date().toLocaleDateString()}`, {
        align: "center",
      });
    doc.fillColor("#000000");
    doc.moveDown(1);

    // Divider
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke("#cccccc");
    doc.moveDown(1);

    // Executive Summary
    doc.fontSize(16).font("Helvetica-Bold").text("Executive Summary");
    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(report.executiveSummary, { lineGap: 4 });
    doc.moveDown(1);

    // Total Responses
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(`Total Responses Analyzed: ${report.totalResponsesAnalyzed}`);
    doc.moveDown(1);

    // Quantitative Insights
    doc.fontSize(16).font("Helvetica-Bold").text("Quantitative Insights");
    doc.moveDown(0.5);

    for (const insight of report.quantitativeInsights) {
      doc.fontSize(12).font("Helvetica-Bold").text(insight.question);
      doc
        .fontSize(11)
        .font("Helvetica")
        .text(`${insight.metric}: ${insight.value}`);
      doc.moveDown(0.5);
    }

    doc.moveDown(0.5);

    // Qualitative Themes
    doc.fontSize(16).font("Helvetica-Bold").text("Qualitative Themes");
    doc.moveDown(0.5);

    for (const theme of report.qualitativeThemes) {
      doc.fontSize(12).font("Helvetica-Bold").text(theme.theme);
      doc
        .fontSize(11)
        .font("Helvetica")
        .text(theme.description, { lineGap: 3 });
      doc
        .fontSize(10)
        .fillColor("#666666")
        .text(`Frequency: ${theme.frequency}`);
      doc.fillColor("#000000");
      doc.moveDown(0.5);
    }

    doc.end();
  });
}

export async function getFormAnalytics({
  user,
  params,
  query,
  set,
}: FormAnalyticsContext) {
  // 1. Verify the form exists and the user is the owner
  const form = await prisma.form.findUnique({
    where: { id: params.formId },
    select: {
      id: true,
      title: true,
      ownerId: true,
    },
  });

  if (!form) {
    set.status = 404;
    return { success: false, message: "Form not found" };
  }

  if (form.ownerId !== user.id) {
    set.status = 403;
    return {
      success: false,
      message: "Forbidden: you are not the owner of this form",
    };
  }

  // 2. Fetch all submitted responses
  const responses = await prisma.formResponse.findMany({
    where: {
      formId: params.formId,
      isSubmitted: true,
    },
    select: {
      id: true,
      answers: true,
      submittedAt: true,
    },
  });

  if (responses.length === 0) {
    set.status = 404;
    return {
      success: false,
      message: "No submitted responses found for this form",
    };
  }

  // 3. Map fieldIds in answers to fieldNames for better AI context
  const fields = await prisma.formFields.findMany({
    where: { formId: params.formId },
    select: { id: true, fieldName: true, label: true },
  });

  const fieldIdToLabel = Object.fromEntries(
    fields.map((f) => [f.id, f.label || f.fieldName]),
  );

  const transformedResponses = responses.map((r) => {
    const answers = r.answers as Record<string, unknown>;
    const labeled: Record<string, unknown> = {};
    for (const [fieldId, value] of Object.entries(answers)) {
      const label = fieldIdToLabel[fieldId] ?? fieldId;
      labeled[label] = value;
    }
    return labeled;
  });

  // 4. Call Groq for AI analytics
  if (!GROQ_API_KEY) {
    set.status = 503;
    return { success: false, message: "AI service is not configured" };
  }

  let report: AnalyticsReport;
  try {
    report = await callGroqForAnalytics(JSON.stringify(transformedResponses));
  } catch (err) {
    logger.error("Analytics AI call failed", err);
    set.status = 502;
    return {
      success: false,
      message: "Failed to generate analytics report. Please try again.",
    };
  }

  logger.info("Generated analytics report", {
    userId: user.id,
    formId: params.formId,
    responseCount: responses.length,
  });

  // 5. Return JSON or PDF based on format query param
  if (query.format === "pdf") {
    const pdfBuffer = await generatePdfBuffer(report, form.title);

    set.headers["Content-Type"] = "application/pdf";
    set.headers["Content-Disposition"] =
      'attachment; filename="analytics-report.pdf"';

    return new Response(new Uint8Array(pdfBuffer));
  }

  return {
    success: true,
    message: "Analytics report generated successfully",
    data: report,
  };
}
