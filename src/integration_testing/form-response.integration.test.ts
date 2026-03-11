import { beforeEach, describe, expect, it } from "bun:test";
import {
  app,
  jsonBody,
  prismaMock,
  request,
  resetAllMocks,
  setAuthenticatedUser,
  TEST_USER,
} from "./helpers";

const UUID = "00000000-0000-0000-0000-000000000001";
const RESPONSE_ID = "00000000-0000-0000-0000-000000000020";

describe("Form Response Integration Tests", () => {
  beforeEach(() => {
    resetAllMocks();
    setAuthenticatedUser(TEST_USER);
  });

  // ─────────────────────────────────────────────
  // POST /responses/submit/:formId
  // ─────────────────────────────────────────────

  describe("POST /responses/submit/:formId", () => {
    const answerPayload = {
      answers: { "field-1": "John Doe", "field-2": 25 },
      isSubmitted: true,
    };

    it("allows submission without authentication", async () => {
      setAuthenticatedUser(null);
      prismaMock.form.findUnique.mockResolvedValue({
        id: UUID,
        isPublished: true,
      });
      prismaMock.formResponse.create.mockResolvedValue({
        id: RESPONSE_ID,
        formId: UUID,
        respondentId: null,
        answers: answerPayload.answers,
        isSubmitted: true,
      });

      const res = await app.handle(
        request(`/responses/submit/${UUID}`, {
          method: "POST",
          body: jsonBody(answerPayload),
        }),
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("submits a response successfully", async () => {
      prismaMock.form.findUnique.mockResolvedValue({
        id: UUID,
        isPublished: true,
      });
      prismaMock.formResponse.create.mockResolvedValue({
        id: RESPONSE_ID,
        formId: UUID,
        respondentId: TEST_USER.id,
        answers: answerPayload.answers,
        isSubmitted: true,
      });

      const res = await app.handle(
        request(`/responses/submit/${UUID}`, {
          method: "POST",
          body: jsonBody(answerPayload),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.isSubmitted).toBe(true);
    });

    it("returns 404 for non-existent form", async () => {
      prismaMock.form.findUnique.mockResolvedValue(null);

      const res = await app.handle(
        request(`/responses/submit/${UUID}`, {
          method: "POST",
          body: jsonBody(answerPayload),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it("returns 403 for unpublished form", async () => {
      prismaMock.form.findUnique.mockResolvedValue({
        id: UUID,
        isPublished: false,
      });

      const res = await app.handle(
        request(`/responses/submit/${UUID}`, {
          method: "POST",
          body: jsonBody(answerPayload),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it("returns 400 for missing answers", async () => {
      const res = await app.handle(
        request(`/responses/submit/${UUID}`, {
          method: "POST",
          body: jsonBody({}),
        }),
      );

      expect(res.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────
  // POST /responses/draft/:formId
  // ─────────────────────────────────────────────

  describe("POST /responses/draft/:formId", () => {
    it("saves a draft response", async () => {
      prismaMock.form.findUnique.mockResolvedValue({
        id: UUID,
        isPublished: true,
      });
      prismaMock.formResponse.create.mockResolvedValue({
        id: RESPONSE_ID,
        formId: UUID,
        respondentId: TEST_USER.id,
        answers: { "field-1": "partial" },
        isSubmitted: false,
      });

      const res = await app.handle(
        request(`/responses/draft/${UUID}`, {
          method: "POST",
          body: jsonBody({
            answers: { "field-1": "partial" },
            isSubmitted: false,
          }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // PUT /responses/resume/:responseId
  // ─────────────────────────────────────────────

  describe("PUT /responses/resume/:responseId", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request(`/responses/resume/${RESPONSE_ID}`, {
          method: "PUT",
          body: jsonBody({
            answers: { "field-1": "updated" },
            isSubmitted: true,
          }),
        }),
      );
      expect(res.status).toBe(401);
    });

    it("resumes and submits a response", async () => {
      prismaMock.formResponse.updateMany.mockResolvedValue({ count: 1 });

      const res = await app.handle(
        request(`/responses/resume/${RESPONSE_ID}`, {
          method: "PUT",
          body: jsonBody({
            answers: { "field-1": "final answer" },
            isSubmitted: true,
          }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toContain("submitted");
    });

    it("saves as draft when isSubmitted is false", async () => {
      prismaMock.formResponse.updateMany.mockResolvedValue({ count: 1 });

      const res = await app.handle(
        request(`/responses/resume/${RESPONSE_ID}`, {
          method: "PUT",
          body: jsonBody({
            answers: { "field-1": "work in progress" },
            isSubmitted: false,
          }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toContain("Draft");
    });

    it("returns failure when response not found", async () => {
      prismaMock.formResponse.updateMany.mockResolvedValue({ count: 0 });

      const res = await app.handle(
        request(`/responses/resume/${RESPONSE_ID}`, {
          method: "PUT",
          body: jsonBody({
            answers: { "field-1": "ghost" },
          }),
        }),
      );
      const body = await res.json();

      expect(body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // GET /responses/:formId (form owner)
  // ─────────────────────────────────────────────

  describe("GET /responses/:formId (form owner)", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(request(`/responses/${UUID}`));
      expect(res.status).toBe(401);
    });

    it("returns transformed responses for form owner", async () => {
      prismaMock.form.findUnique.mockResolvedValue({
        id: UUID,
        ownerId: TEST_USER.id,
      });
      prismaMock.formResponse.findMany.mockResolvedValue([
        {
          id: RESPONSE_ID,
          formId: UUID,
          answers: { "field-id-1": "Alice" },
          form: { title: "Survey" },
        },
      ]);
      prismaMock.formFields.findMany.mockResolvedValue([
        { id: "field-id-1", fieldName: "fullName" },
      ]);

      const res = await app.handle(request(`/responses/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data[0].answers.fullName).toBe("Alice");
    });

    it("returns 404 for non-owned form", async () => {
      prismaMock.form.findUnique.mockResolvedValue(null);

      const res = await app.handle(request(`/responses/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it("returns failure when no responses exist", async () => {
      prismaMock.form.findUnique.mockResolvedValue({
        id: UUID,
        ownerId: TEST_USER.id,
      });
      prismaMock.formResponse.findMany.mockResolvedValue([]);

      const res = await app.handle(request(`/responses/${UUID}`));
      const body = await res.json();

      expect(body.success).toBe(false);
      expect(body.message).toContain("No responses");
    });
  });

  // ─────────────────────────────────────────────
  // GET /responses/user/:formId (respondent)
  // ─────────────────────────────────────────────

  describe("GET /responses/user/:formId", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(request(`/responses/user/${UUID}`));
      expect(res.status).toBe(401);
    });

    it("returns user's own responses with transformed answers", async () => {
      prismaMock.formResponse.findMany.mockResolvedValue([
        {
          id: RESPONSE_ID,
          formId: UUID,
          answers: { "field-id-1": "Bob" },
          form: { title: "Feedback" },
        },
      ]);
      prismaMock.formFields.findMany.mockResolvedValue([
        { id: "field-id-1", fieldName: "name" },
      ]);

      const res = await app.handle(request(`/responses/user/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data[0].answers.name).toBe("Bob");
      expect(body.data[0].rawAnswers).toBeDefined();
    });

    it("returns 404 when user has no response for form", async () => {
      prismaMock.formResponse.findMany.mockResolvedValue([]);

      const res = await app.handle(request(`/responses/user/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // GET /responses/my
  // ─────────────────────────────────────────────

  describe("GET /responses/my", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(request("/responses/my"));
      expect(res.status).toBe(401);
    });

    it("returns all user responses across forms", async () => {
      prismaMock.formResponse.findMany.mockResolvedValue([
        {
          id: RESPONSE_ID,
          formId: UUID,
          answers: { fid: "val" },
          isSubmitted: true,
          submittedAt: new Date(),
          updatedAt: new Date(),
          form: { id: UUID, title: "Form 1", description: "Desc" },
        },
      ]);
      prismaMock.formFields.findMany.mockResolvedValue([
        { id: "fid", fieldName: "answer" },
      ]);

      const res = await app.handle(request("/responses/my"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it("returns empty array when no responses", async () => {
      prismaMock.formResponse.findMany.mockResolvedValue([]);

      const res = await app.handle(request("/responses/my"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });
});
