import { beforeEach, describe, expect, it } from "bun:test";
import {
  app,
  mockFetch,
  OTHER_USER,
  prismaMock,
  request,
  resetAllMocks,
  setAuthenticatedUser,
  TEST_USER,
} from "./helpers";

const UUID = "00000000-0000-0000-0000-000000000001";

const MOCK_ANALYTICS_REPORT = {
  totalResponsesAnalyzed: 3,
  executiveSummary: "Overall positive sentiment across responses.",
  quantitativeInsights: [{ question: "Rating", metric: "Average", value: 4.2 }],
  qualitativeThemes: [
    {
      theme: "Satisfaction",
      description: "Users are generally satisfied.",
      frequency: "80% of responses",
    },
  ],
};

function mockGroqSuccess() {
  mockFetch.mockResolvedValue(
    new Response(
      JSON.stringify({
        choices: [
          { message: { content: JSON.stringify(MOCK_ANALYTICS_REPORT) } },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
}

function mockGroqFailure() {
  mockFetch.mockResolvedValue(
    new Response("Internal Server Error", { status: 500 }),
  );
}

describe("Form Analytics Integration Tests", () => {
  beforeEach(() => {
    resetAllMocks();
    setAuthenticatedUser(TEST_USER);
  });

  // ─────────────────────────────────────────────
  // POST /forms/:formId/analytics
  // ─────────────────────────────────────────────

  describe("POST /forms/:formId/analytics", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request(`/forms/${UUID}/analytics`, { method: "POST" }),
      );
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid formId format", async () => {
      const res = await app.handle(
        request("/forms/not-a-uuid/analytics", { method: "POST" }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 for non-existent form", async () => {
      prismaMock.form.findUnique.mockResolvedValue(null);

      const res = await app.handle(
        request(`/forms/${UUID}/analytics`, { method: "POST" }),
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toContain("Form not found");
    });

    it("returns 403 when user is not the form owner", async () => {
      prismaMock.form.findUnique.mockResolvedValue({
        id: UUID,
        title: "Someone's Form",
        ownerId: OTHER_USER.id,
      });

      const res = await app.handle(
        request(`/forms/${UUID}/analytics`, { method: "POST" }),
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.message).toContain("Forbidden");
    });

    it("returns 404 when no submitted responses exist", async () => {
      prismaMock.form.findUnique.mockResolvedValue({
        id: UUID,
        title: "My Form",
        ownerId: TEST_USER.id,
      });
      prismaMock.formResponse.findMany.mockResolvedValue([]);

      const res = await app.handle(
        request(`/forms/${UUID}/analytics`, { method: "POST" }),
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toContain("No submitted responses");
    });

    it("returns analytics JSON report successfully", async () => {
      prismaMock.form.findUnique.mockResolvedValue({
        id: UUID,
        title: "Survey Form",
        ownerId: TEST_USER.id,
      });
      prismaMock.formResponse.findMany.mockResolvedValue([
        { id: "r1", answers: { f1: "Good" }, submittedAt: new Date() },
        { id: "r2", answers: { f1: "Great" }, submittedAt: new Date() },
        { id: "r3", answers: { f1: "OK" }, submittedAt: new Date() },
      ]);
      prismaMock.formFields.findMany.mockResolvedValue([
        { id: "f1", fieldName: "feedback", label: "Your Feedback" },
      ]);
      mockGroqSuccess();

      const res = await app.handle(
        request(`/forms/${UUID}/analytics`, { method: "POST" }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.totalResponsesAnalyzed).toBe(3);
      expect(body.data.executiveSummary).toBeDefined();
      expect(body.data.quantitativeInsights).toBeArray();
      expect(body.data.qualitativeThemes).toBeArray();
    });

    it("returns 502 when Groq API fails", async () => {
      prismaMock.form.findUnique.mockResolvedValue({
        id: UUID,
        title: "Survey Form",
        ownerId: TEST_USER.id,
      });
      prismaMock.formResponse.findMany.mockResolvedValue([
        { id: "r1", answers: { f1: "data" }, submittedAt: new Date() },
      ]);
      prismaMock.formFields.findMany.mockResolvedValue([
        { id: "f1", fieldName: "feedback", label: "Feedback" },
      ]);
      mockGroqFailure();

      const res = await app.handle(
        request(`/forms/${UUID}/analytics`, { method: "POST" }),
      );
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.success).toBe(false);
      expect(body.message).toContain("Failed to generate");
    });

    it("transforms fieldIds to labels before calling AI", async () => {
      prismaMock.form.findUnique.mockResolvedValue({
        id: UUID,
        title: "Survey",
        ownerId: TEST_USER.id,
      });
      prismaMock.formResponse.findMany.mockResolvedValue([
        {
          id: "r1",
          answers: { "field-uuid-1": "Yes" },
          submittedAt: new Date(),
        },
      ]);
      prismaMock.formFields.findMany.mockResolvedValue([
        {
          id: "field-uuid-1",
          fieldName: "interested",
          label: "Are you interested?",
        },
      ]);
      mockGroqSuccess();

      const res = await app.handle(
        request(`/forms/${UUID}/analytics`, { method: "POST" }),
      );

      expect(res.status).toBe(200);

      // Verify the Groq API was called with transformed labels (not raw field IDs)
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body as string);
      const userMessage = requestBody.messages[1].content;
      expect(userMessage).toContain("Are you interested?");
      expect(userMessage).not.toContain("field-uuid-1");
    });
  });

  // ─────────────────────────────────────────────
  // POST /forms/:formId/analytics?format=pdf
  // ─────────────────────────────────────────────

  describe("POST /forms/:formId/analytics?format=pdf", () => {
    it("returns a PDF file with correct headers", async () => {
      prismaMock.form.findUnique.mockResolvedValue({
        id: UUID,
        title: "PDF Test Form",
        ownerId: TEST_USER.id,
      });
      prismaMock.formResponse.findMany.mockResolvedValue([
        { id: "r1", answers: { f1: "Answer" }, submittedAt: new Date() },
      ]);
      prismaMock.formFields.findMany.mockResolvedValue([
        { id: "f1", fieldName: "question", label: "Question 1" },
      ]);
      mockGroqSuccess();

      const res = await app.handle(
        request(`/forms/${UUID}/analytics?format=pdf`, { method: "POST" }),
      );

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
      expect(res.headers.get("content-disposition")).toContain(
        "analytics-report.pdf",
      );

      // Verify it's a valid PDF (starts with %PDF)
      const buffer = await res.arrayBuffer();
      const header = new TextDecoder().decode(
        new Uint8Array(buffer).slice(0, 5),
      );
      expect(header).toBe("%PDF-");
    });

    it("returns JSON when format is not pdf", async () => {
      prismaMock.form.findUnique.mockResolvedValue({
        id: UUID,
        title: "JSON Form",
        ownerId: TEST_USER.id,
      });
      prismaMock.formResponse.findMany.mockResolvedValue([
        { id: "r1", answers: { f1: "data" }, submittedAt: new Date() },
      ]);
      prismaMock.formFields.findMany.mockResolvedValue([
        { id: "f1", fieldName: "q", label: "Q" },
      ]);
      mockGroqSuccess();

      const res = await app.handle(
        request(`/forms/${UUID}/analytics?format=json`, { method: "POST" }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
    });
  });
});
