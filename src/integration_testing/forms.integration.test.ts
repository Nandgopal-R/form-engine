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

describe("Forms Integration Tests", () => {
  beforeEach(() => {
    resetAllMocks();
    setAuthenticatedUser(TEST_USER);
  });

  // ─────────────────────────────────────────────
  // GET /forms
  // ─────────────────────────────────────────────

  describe("GET /forms", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(request("/forms"));
      expect(res.status).toBe(401);
    });

    it("returns all forms for the authenticated user", async () => {
      prismaMock.form.findMany.mockResolvedValue([
        {
          id: UUID,
          title: "Test Form",
          isPublished: true,
          createdAt: new Date(),
          _count: { formResponses: 5 },
        },
      ]);

      const res = await app.handle(request("/forms"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].responseCount).toBe(5);
    });

    it("returns empty array when user has no forms", async () => {
      prismaMock.form.findMany.mockResolvedValue([]);

      const res = await app.handle(request("/forms"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────
  // POST /forms
  // ─────────────────────────────────────────────

  describe("POST /forms", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request("/forms", {
          method: "POST",
          body: jsonBody({ title: "New Form" }),
        }),
      );
      expect(res.status).toBe(401);
    });

    it("creates a new form successfully", async () => {
      const formData = {
        id: UUID,
        title: "New Form",
        description: "A test form",
        ownerId: TEST_USER.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.form.create.mockResolvedValue(formData);

      const res = await app.handle(
        request("/forms", {
          method: "POST",
          body: jsonBody({ title: "New Form", description: "A test form" }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.title).toBe("New Form");
    });

    it("returns 400 for missing title", async () => {
      const res = await app.handle(
        request("/forms", {
          method: "POST",
          body: jsonBody({}),
        }),
      );

      expect(res.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────
  // GET /forms/:formId
  // ─────────────────────────────────────────────

  describe("GET /forms/:formId", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(request(`/forms/${UUID}`));
      expect(res.status).toBe(401);
    });

    it("returns form with ordered fields", async () => {
      prismaMock.form.findFirst.mockResolvedValue({
        id: UUID,
        title: "My Form",
        description: "Desc",
        isPublished: false,
        createdAt: new Date(),
      });
      prismaMock.formFields.findMany.mockResolvedValue([
        { id: "f2", prevFieldId: "f1", fieldName: "email" },
        { id: "f1", prevFieldId: null, fieldName: "name" },
      ]);

      const res = await app.handle(request(`/forms/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.fields).toHaveLength(2);
      expect(body.data.fields[0].fieldName).toBe("name");
      expect(body.data.fields[1].fieldName).toBe("email");
    });

    it("returns form with empty fields array", async () => {
      prismaMock.form.findFirst.mockResolvedValue({
        id: UUID,
        title: "Empty Form",
        description: null,
        isPublished: false,
        createdAt: new Date(),
      });
      prismaMock.formFields.findMany.mockResolvedValue([]);

      const res = await app.handle(request(`/forms/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.fields).toEqual([]);
    });

    it("returns 404 for non-existent or non-owned form", async () => {
      prismaMock.form.findFirst.mockResolvedValue(null);

      const res = await app.handle(request(`/forms/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it("returns 400 for invalid formId format", async () => {
      const res = await app.handle(request("/forms/not-a-uuid"));

      expect(res.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────
  // PUT /forms/:formId
  // ─────────────────────────────────────────────

  describe("PUT /forms/:formId", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request(`/forms/${UUID}`, {
          method: "PUT",
          body: jsonBody({ title: "Updated" }),
        }),
      );
      expect(res.status).toBe(401);
    });

    it("updates form successfully", async () => {
      prismaMock.form.findFirst.mockResolvedValue({
        id: UUID,
        ownerId: TEST_USER.id,
      });
      prismaMock.form.update.mockResolvedValue({
        id: UUID,
        title: "Updated Title",
        description: "Updated Desc",
      });

      const res = await app.handle(
        request(`/forms/${UUID}`, {
          method: "PUT",
          body: jsonBody({
            title: "Updated Title",
            description: "Updated Desc",
          }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.title).toBe("Updated Title");
    });

    it("returns 404 for non-owned form", async () => {
      prismaMock.form.findFirst.mockResolvedValue(null);

      const res = await app.handle(
        request(`/forms/${UUID}`, {
          method: "PUT",
          body: jsonBody({ title: "Hacked" }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // DELETE /forms/:formId
  // ─────────────────────────────────────────────

  describe("DELETE /forms/:formId", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request(`/forms/${UUID}`, { method: "DELETE" }),
      );
      expect(res.status).toBe(401);
    });

    it("deletes form successfully", async () => {
      prismaMock.form.deleteMany.mockResolvedValue({ count: 1 });

      const res = await app.handle(
        request(`/forms/${UUID}`, { method: "DELETE" }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("returns 404 for non-existent form", async () => {
      prismaMock.form.deleteMany.mockResolvedValue({ count: 0 });

      const res = await app.handle(
        request(`/forms/${UUID}`, { method: "DELETE" }),
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // POST /forms/publish/:formId
  // ─────────────────────────────────────────────

  describe("POST /forms/publish/:formId", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request(`/forms/publish/${UUID}`, { method: "POST" }),
      );
      expect(res.status).toBe(401);
    });

    it("publishes form successfully", async () => {
      prismaMock.form.findFirst.mockResolvedValue({
        id: UUID,
        ownerId: TEST_USER.id,
      });
      prismaMock.form.update.mockResolvedValue({
        id: UUID,
        isPublished: true,
      });

      const res = await app.handle(
        request(`/forms/publish/${UUID}`, { method: "POST" }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.isPublished).toBe(true);
    });

    it("returns 404 for non-owned form", async () => {
      prismaMock.form.findFirst.mockResolvedValue(null);

      const res = await app.handle(
        request(`/forms/publish/${UUID}`, { method: "POST" }),
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // POST /forms/unpublish/:formId
  // ─────────────────────────────────────────────

  describe("POST /forms/unpublish/:formId", () => {
    it("unpublishes form successfully", async () => {
      prismaMock.form.findFirst.mockResolvedValue({
        id: UUID,
        ownerId: TEST_USER.id,
      });
      prismaMock.form.update.mockResolvedValue({
        id: UUID,
        isPublished: false,
      });

      const res = await app.handle(
        request(`/forms/unpublish/${UUID}`, { method: "POST" }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.isPublished).toBe(false);
    });

    it("returns 404 for non-existent form", async () => {
      prismaMock.form.findFirst.mockResolvedValue(null);

      const res = await app.handle(
        request(`/forms/unpublish/${UUID}`, { method: "POST" }),
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // GET /forms/public/:formId (NO AUTH)
  // ─────────────────────────────────────────────

  describe("GET /forms/public/:formId", () => {
    it("returns a published form without authentication", async () => {
      setAuthenticatedUser(null);
      prismaMock.form.findFirst.mockResolvedValue({
        id: UUID,
        title: "Public Form",
        description: "Visible",
        isPublished: true,
        createdAt: new Date(),
      });
      prismaMock.formFields.findMany.mockResolvedValue([]);

      const res = await app.handle(request(`/forms/public/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.title).toBe("Public Form");
    });

    it("returns 404 for unpublished form", async () => {
      setAuthenticatedUser(null);
      prismaMock.form.findFirst.mockResolvedValue(null);

      const res = await app.handle(request(`/forms/public/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });
});
