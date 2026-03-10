import { beforeEach, describe, expect, it } from "bun:test";
import {
  app,
  jsonBody,
  OTHER_USER,
  prismaMock,
  request,
  resetAllMocks,
  setAuthenticatedUser,
  TEST_USER,
} from "./helpers";

const UUID = "00000000-0000-0000-0000-000000000001";
const UUID2 = "00000000-0000-0000-0000-000000000002";
const FIELD_ID1 = "00000000-0000-0000-0000-000000000010";
const FIELD_ID2 = "00000000-0000-0000-0000-000000000011";

describe("Form Fields Integration Tests", () => {
  beforeEach(() => {
    resetAllMocks();
    setAuthenticatedUser(TEST_USER);
  });

  // ─────────────────────────────────────────────
  // GET /fields/public/:formId (NO AUTH)
  // ─────────────────────────────────────────────

  describe("GET /fields/public/:formId", () => {
    it("returns fields for a published form without auth", async () => {
      setAuthenticatedUser(null);
      prismaMock.form.count.mockResolvedValue(1);
      prismaMock.formFields.findMany.mockResolvedValue([
        {
          id: FIELD_ID1,
          fieldName: "name",
          fieldType: "text",
          prevFieldId: null,
        },
      ]);

      const res = await app.handle(request(`/fields/public/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it("returns 404 for unpublished or non-existent form", async () => {
      setAuthenticatedUser(null);
      prismaMock.form.count.mockResolvedValue(0);

      const res = await app.handle(request(`/fields/public/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it("returns empty array when form has no fields", async () => {
      setAuthenticatedUser(null);
      prismaMock.form.count.mockResolvedValue(1);
      prismaMock.formFields.findMany.mockResolvedValue([]);

      const res = await app.handle(request(`/fields/public/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────
  // GET /fields/:formId
  // ─────────────────────────────────────────────

  describe("GET /fields/:formId", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(request(`/fields/${UUID}`));
      expect(res.status).toBe(401);
    });

    it("returns ordered fields for form", async () => {
      prismaMock.form.count.mockResolvedValue(1);
      prismaMock.formFields.findMany.mockResolvedValue([
        { id: FIELD_ID2, prevFieldId: FIELD_ID1, fieldName: "email" },
        { id: FIELD_ID1, prevFieldId: null, fieldName: "name" },
      ]);

      const res = await app.handle(request(`/fields/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].fieldName).toBe("name");
      expect(body.data[1].fieldName).toBe("email");
    });

    it("returns 404 for non-existent form", async () => {
      prismaMock.form.count.mockResolvedValue(0);

      const res = await app.handle(request(`/fields/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it("returns empty data when no fields exist", async () => {
      prismaMock.form.count.mockResolvedValue(1);
      prismaMock.formFields.findMany.mockResolvedValue([]);

      const res = await app.handle(request(`/fields/${UUID}`));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────
  // POST /fields/:formId
  // ─────────────────────────────────────────────

  describe("POST /fields/:formId", () => {
    const fieldPayload = {
      fieldName: "fullName",
      fieldValueType: "string",
      fieldType: "text",
      label: "Full Name",
    };

    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request(`/fields/${UUID}`, {
          method: "POST",
          body: jsonBody(fieldPayload),
        }),
      );
      expect(res.status).toBe(401);
    });

    it("creates field at head successfully", async () => {
      prismaMock.form.findFirst.mockResolvedValue({
        id: UUID,
        ownerId: TEST_USER.id,
      });
      const createdField = {
        id: FIELD_ID1,
        ...fieldPayload,
        prevFieldId: null,
      };
      prismaMock.$transaction.mockImplementation(
        async (fn: (arg: unknown) => unknown) => {
          return fn({
            formFields: {
              findFirst: async () => null,
              create: async () => createdField,
            },
          });
        },
      );

      const res = await app.handle(
        request(`/fields/${UUID}`, {
          method: "POST",
          body: jsonBody(fieldPayload),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.fieldName).toBe("fullName");
    });

    it("returns 404 for non-owned form", async () => {
      prismaMock.form.findFirst.mockResolvedValue(null);

      const res = await app.handle(
        request(`/fields/${UUID}`, {
          method: "POST",
          body: jsonBody(fieldPayload),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it("returns 400 for missing required fields", async () => {
      const res = await app.handle(
        request(`/fields/${UUID}`, {
          method: "POST",
          body: jsonBody({ fieldName: "test" }),
        }),
      );

      expect(res.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────
  // PUT /fields/:id
  // ─────────────────────────────────────────────

  describe("PUT /fields/:id", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request(`/fields/${FIELD_ID1}`, {
          method: "PUT",
          body: jsonBody({ fieldName: "updated" }),
        }),
      );
      expect(res.status).toBe(401);
    });

    it("updates field successfully", async () => {
      prismaMock.formFields.findUnique.mockResolvedValue({
        id: FIELD_ID1,
        fieldName: "old",
        form: { ownerId: TEST_USER.id },
      });
      prismaMock.formFields.update.mockResolvedValue({
        id: FIELD_ID1,
        fieldName: "updated",
      });

      const res = await app.handle(
        request(`/fields/${FIELD_ID1}`, {
          method: "PUT",
          body: jsonBody({ fieldName: "updated" }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.fieldName).toBe("updated");
    });

    it("returns 404 for non-existent field", async () => {
      prismaMock.formFields.findUnique.mockResolvedValue(null);

      const res = await app.handle(
        request(`/fields/${FIELD_ID1}`, {
          method: "PUT",
          body: jsonBody({ fieldName: "updated" }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it("returns 403 for non-owned field", async () => {
      prismaMock.formFields.findUnique.mockResolvedValue({
        id: FIELD_ID1,
        fieldName: "old",
        form: { ownerId: OTHER_USER.id },
      });

      const res = await app.handle(
        request(`/fields/${FIELD_ID1}`, {
          method: "PUT",
          body: jsonBody({ fieldName: "hacked" }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // DELETE /fields/:id
  // ─────────────────────────────────────────────

  describe("DELETE /fields/:id", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request(`/fields/${FIELD_ID1}`, { method: "DELETE" }),
      );
      expect(res.status).toBe(401);
    });

    it("deletes field and relinks chain", async () => {
      prismaMock.formFields.findUnique.mockResolvedValue({
        id: FIELD_ID1,
        prevFieldId: null,
        formId: UUID,
        form: { ownerId: TEST_USER.id },
      });
      prismaMock.$transaction.mockImplementation(
        async (fn: (arg: unknown) => unknown) => {
          return fn({
            formFields: {
              findFirst: async () => null,
              delete: async () => ({}),
            },
          });
        },
      );

      const res = await app.handle(
        request(`/fields/${FIELD_ID1}`, { method: "DELETE" }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("returns 404 for non-existent field", async () => {
      prismaMock.formFields.findUnique.mockResolvedValue(null);

      const res = await app.handle(
        request(`/fields/${FIELD_ID1}`, { method: "DELETE" }),
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it("returns 403 for non-owned field", async () => {
      prismaMock.formFields.findUnique.mockResolvedValue({
        id: FIELD_ID1,
        form: { ownerId: OTHER_USER.id },
      });

      const res = await app.handle(
        request(`/fields/${FIELD_ID1}`, { method: "DELETE" }),
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // POST /fields/swap
  // ─────────────────────────────────────────────

  describe("POST /fields/swap", () => {
    it("returns 401 without authentication", async () => {
      setAuthenticatedUser(null);
      const res = await app.handle(
        request("/fields/swap", {
          method: "POST",
          body: jsonBody({ firstFieldId: FIELD_ID1, secondFieldId: FIELD_ID2 }),
        }),
      );
      expect(res.status).toBe(401);
    });

    it("swaps two fields successfully", async () => {
      prismaMock.formFields.findMany.mockResolvedValue([
        {
          id: FIELD_ID1,
          formId: UUID,
          prevFieldId: null,
          form: { ownerId: TEST_USER.id },
        },
        {
          id: FIELD_ID2,
          formId: UUID,
          prevFieldId: FIELD_ID1,
          form: { ownerId: TEST_USER.id },
        },
      ]);
      prismaMock.$transaction.mockImplementation(
        async (fn: (arg: unknown) => unknown) => {
          return fn({
            formFields: {
              findMany: async () => [
                { id: FIELD_ID1, prevFieldId: null },
                { id: FIELD_ID2, prevFieldId: FIELD_ID1 },
              ],
              update: async () => ({}),
            },
          });
        },
      );

      const res = await app.handle(
        request("/fields/swap", {
          method: "POST",
          body: jsonBody({ firstFieldId: FIELD_ID1, secondFieldId: FIELD_ID2 }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("returns 404 when a field is not found", async () => {
      prismaMock.formFields.findMany.mockResolvedValue([
        { id: FIELD_ID1, formId: UUID, form: { ownerId: TEST_USER.id } },
      ]);

      const res = await app.handle(
        request("/fields/swap", {
          method: "POST",
          body: jsonBody({ firstFieldId: FIELD_ID1, secondFieldId: FIELD_ID2 }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it("returns 403 when user does not own the fields", async () => {
      prismaMock.formFields.findMany.mockResolvedValue([
        { id: FIELD_ID1, formId: UUID, form: { ownerId: OTHER_USER.id } },
        { id: FIELD_ID2, formId: UUID, form: { ownerId: OTHER_USER.id } },
      ]);

      const res = await app.handle(
        request("/fields/swap", {
          method: "POST",
          body: jsonBody({ firstFieldId: FIELD_ID1, secondFieldId: FIELD_ID2 }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it("returns 400 when fields belong to different forms", async () => {
      prismaMock.formFields.findMany.mockResolvedValue([
        { id: FIELD_ID1, formId: UUID, form: { ownerId: TEST_USER.id } },
        { id: FIELD_ID2, formId: UUID2, form: { ownerId: TEST_USER.id } },
      ]);

      const res = await app.handle(
        request("/fields/swap", {
          method: "POST",
          body: jsonBody({ firstFieldId: FIELD_ID1, secondFieldId: FIELD_ID2 }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
    });

    it("returns success for same field (no-op)", async () => {
      prismaMock.formFields.findMany.mockResolvedValue([
        { id: FIELD_ID1, formId: UUID, form: { ownerId: TEST_USER.id } },
        { id: FIELD_ID1, formId: UUID, form: { ownerId: TEST_USER.id } },
      ]);

      const res = await app.handle(
        request("/fields/swap", {
          method: "POST",
          body: jsonBody({ firstFieldId: FIELD_ID1, secondFieldId: FIELD_ID1 }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("returns 400 for missing field IDs", async () => {
      const res = await app.handle(
        request("/fields/swap", {
          method: "POST",
          body: jsonBody({}),
        }),
      );

      expect(res.status).toBe(400);
    });
  });
});
