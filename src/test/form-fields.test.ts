
import { beforeEach, describe, expect, it, mock } from "bun:test";

/* ---------------- MOCKS ---------------- */

const formCountMock = mock();
const formFindFirstMock = mock();

const formFieldsFindManyMock = mock();
const formFieldsFindUniqueMock = mock();
const formFieldsCreateMock = mock();
const formFieldsUpdateMock = mock();
const formFieldsDeleteMock = mock();

const transactionMock = mock();

mock.module("../db/prisma", () => ({
  prisma: {
    form: {
      count: formCountMock,
      findFirst: formFindFirstMock,
    },
    formFields: {
      findMany: formFieldsFindManyMock,
      findUnique: formFieldsFindUniqueMock,
      create: formFieldsCreateMock,
      update: formFieldsUpdateMock,
      delete: formFieldsDeleteMock,
    },
    $transaction: transactionMock,
  },
}));

const mockInfo = mock();
const mockWarn = mock();

mock.module("../logger", () => ({
  logger: {
    info: mockInfo,
    warn: mockWarn,
    error: mock(),
  },
}));

/* ---------------- IMPORT ---------------- */

const {
  getAllFields,
  createField,
  updateField,
  deleteField,
  swapFields,
} = await import("../api/form-fields/controller");

/* ---------------- TESTS ---------------- */

describe("Form Fields Controller", () => {
  beforeEach(() => {
    mock.restore();
  });

  const user = { id: "u1" };

  /* ========= getAllFields ========= */

  it("getAllFields → success ordered", async () => {
    formCountMock.mockResolvedValue(1);

    formFieldsFindManyMock.mockResolvedValue([
      { id: "a", prevFieldId: null },
      { id: "b", prevFieldId: "a" },
    ]);

    const res = await getAllFields({
      params: { formId: "f1" },
      set: {},
    } as any);

    expect(res.success).toBe(true);
    expect(res.data.length).toBe(2);
  });

  it("getAllFields → form not found", async () => {
    formCountMock.mockResolvedValue(0);

    const set: any = {};

    const res = await getAllFields({
      params: { formId: "x" },
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });

  it("getAllFields → no fields", async () => {
    formCountMock.mockResolvedValue(1);
    formFieldsFindManyMock.mockResolvedValue([]);

    const res = await getAllFields({
      params: { formId: "f1" },
      set: {},
    } as any);

    expect(res.success).toBe(true);
    expect(res.data).toEqual([]);
  });

  /* ========= createField ========= */

  it("createField → success", async () => {
    formFindFirstMock.mockResolvedValue({ id: "f1" });

    transactionMock.mockImplementation(async (cb: any) => {
      return cb({
        formFields: {
          findFirst: async () => null,
          create: async () => ({ id: "new" }),
          update: async () => {},
        },
      });
    });

    const res = await createField({
      params: { formId: "f1" },
      body: { fieldName: "name" },
      set: {},
      user,
    } as any);

    expect(res.success).toBe(true);
  });

  it("createField → form not found", async () => {
    formFindFirstMock.mockResolvedValue(null);

    const set: any = {};

    const res = await createField({
      params: { formId: "f1" },
      body: {},
      set,
      user,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });

  /* ========= updateField ========= */

  it("updateField → success", async () => {
    formFieldsFindUniqueMock.mockResolvedValue({
      id: "f1",
      form: { ownerId: "u1" },
    });

    formFieldsUpdateMock.mockResolvedValue({ id: "f1" });

    const res = await updateField({
      params: { id: "f1" },
      body: {},
      set: {},
      user,
    } as any);

    expect(res.success).toBe(true);
  });

  it("updateField → unauthorized", async () => {
    formFieldsFindUniqueMock.mockResolvedValue({
      id: "f1",
      form: { ownerId: "other" },
    });

    const set: any = {};

    const res = await updateField({
      params: { id: "f1" },
      body: {},
      set,
      user,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(403);
  });

  /* ========= deleteField ========= */

  it("deleteField → success", async () => {
    formFieldsFindUniqueMock.mockResolvedValue({
      id: "f1",
      formId: "form1",
      prevFieldId: null,
      form: { ownerId: "u1" },
    });

    transactionMock.mockImplementation(async (cb: any) => {
      return cb({
        formFields: {
          findFirst: async () => null,
          update: async () => {},
          delete: async () => {},
        },
      });
    });

    const res = await deleteField({
      params: { id: "f1" },
      set: {},
      user,
    } as any);

    expect(res.success).toBe(true);
  });

  /* ========= swapFields ========= */

  it("swapFields → success", async () => {
    formFieldsFindManyMock.mockResolvedValueOnce([
      { id: "a", formId: "f1", form: { ownerId: "u1" } },
      { id: "b", formId: "f1", form: { ownerId: "u1" } },
    ]);

    transactionMock.mockImplementation(async (cb: any) => {
      return cb({
        formFields: {
          findMany: async () => [
            { id: "a", prevFieldId: null, formId: "f1" },
            { id: "b", prevFieldId: "a", formId: "f1" },
          ],
          update: async () => {},
        },
      });
    });

    const res = await swapFields({
      body: { firstFieldId: "a", secondFieldId: "b" },
      set: {},
      user,
    } as any);

    expect(res.success).toBe(true);
  });

  it("swapFields → unauthorized", async () => {
    formFieldsFindManyMock.mockResolvedValue([
      { id: "a", formId: "f1", form: { ownerId: "x" } },
      { id: "b", formId: "f1", form: { ownerId: "x" } },
    ]);

    const set: any = {};

    const res = await swapFields({
      body: { firstFieldId: "a", secondFieldId: "b" },
      set,
      user,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(403);
  });

  it("swapFields → same field", async () => {
    formFieldsFindManyMock.mockResolvedValue([
      { id: "a", formId: "f1", form: { ownerId: "u1" } },
      { id: "a", formId: "f1", form: { ownerId: "u1" } },
    ]);

    const res = await swapFields({
      body: { firstFieldId: "a", secondFieldId: "a" },
      set: {},
      user,
    } as any);

    expect(res.success).toBe(true);
  });
});
