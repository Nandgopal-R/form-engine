import { beforeEach, describe, expect, it } from "bun:test";
import {
  app,
  prismaMock,
  request,
  resetAllMocks,
  setAuthenticatedUser,
  TEST_USER,
} from "./helpers";

const UUID = "00000000-0000-0000-0000-000000000001";

describe("Auth Middleware Integration Tests", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ─────────────────────────────────────────────
  // Authentication enforcement
  // ─────────────────────────────────────────────

  describe("Protected routes reject unauthenticated requests", () => {
    it("GET /forms returns 401", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(request("/forms"));
      expect(res.status).toBe(401);
    });

    it("POST /forms returns 401", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request("/forms", {
          method: "POST",
          body: JSON.stringify({ title: "X" }),
        }),
      );
      expect(res.status).toBe(401);
    });

    it("GET /forms/:id returns 401", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(request(`/forms/${UUID}`));
      expect(res.status).toBe(401);
    });

    it("PUT /forms/:id returns 401", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request(`/forms/${UUID}`, {
          method: "PUT",
          body: JSON.stringify({ title: "X" }),
        }),
      );
      expect(res.status).toBe(401);
    });

    it("DELETE /forms/:id returns 401", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request(`/forms/${UUID}`, { method: "DELETE" }),
      );
      expect(res.status).toBe(401);
    });

    it("POST /forms/publish/:id returns 401", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request(`/forms/publish/${UUID}`, { method: "POST" }),
      );
      expect(res.status).toBe(401);
    });

    it("POST /forms/unpublish/:id returns 401", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request(`/forms/unpublish/${UUID}`, { method: "POST" }),
      );
      expect(res.status).toBe(401);
    });

    it("GET /fields/:formId returns 401", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(request(`/fields/${UUID}`));
      expect(res.status).toBe(401);
    });

    it("POST /fields/:formId returns 401", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request(`/fields/${UUID}`, {
          method: "POST",
          body: JSON.stringify({
            fieldName: "x",
            fieldValueType: "string",
            fieldType: "text",
          }),
        }),
      );
      expect(res.status).toBe(401);
    });

    it("GET /responses/:formId returns 401", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(request(`/responses/${UUID}`));
      expect(res.status).toBe(401);
    });

    it("GET /responses/my returns 401", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(request("/responses/my"));
      expect(res.status).toBe(401);
    });

    it("POST /forms/:id/analytics returns 401", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request(`/forms/${UUID}/analytics`, { method: "POST" }),
      );
      expect(res.status).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // Public routes allow unauthenticated access
  // ─────────────────────────────────────────────

  describe("Public routes allow unauthenticated access", () => {
    it("GET /forms/public/:formId works without auth", async () => {
      setAuthenticatedUser(null);
      prismaMock.form.findFirst.mockResolvedValue({
        id: UUID,
        title: "Public Form",
        description: "Open",
        isPublished: true,
        createdAt: new Date(),
      });
      prismaMock.formFields.findMany.mockResolvedValue([]);

      const res = await app.handle(request(`/forms/public/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("GET /fields/public/:formId works without auth", async () => {
      setAuthenticatedUser(null);
      prismaMock.form.count.mockResolvedValue(1);
      prismaMock.formFields.findMany.mockResolvedValue([]);

      const res = await app.handle(request(`/fields/public/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // Authenticated requests pass user context
  // ─────────────────────────────────────────────

  describe("Authenticated requests pass user context", () => {
    it("user.id is available in protected controllers", async () => {
      setAuthenticatedUser(TEST_USER);
      prismaMock.form.findMany.mockResolvedValue([]);

      const res = await app.handle(request("/forms"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});
