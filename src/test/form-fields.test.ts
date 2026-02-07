import { beforeEach, describe, expect, it, mock } from "bun:test";

// ---------------- MOCK PRISMA ----------------

const formCountMock = mock();
const formFindFirstMock = mock();

const fieldsFindManyMock = mock();
const fieldsFindFirstMock = mock();
const fieldsCreateMock = mock();
const fieldsUpdateMock = mock();
const fieldsDeleteMock = mock();
const fieldsFindUniqueMock = mock();

const transactionMock = mock(async (cb: any) =>
  cb({
    formFields: {
      findFirst: fieldsFindFirstMock,
      create: fieldsCreateMock,
      update: fieldsUpdateMock,
      delete: fieldsDeleteMock,
    },
  }),
);

mock.module("../db/prisma", () => ({
  prisma: {
    form: {
      count: formCountMock,
      findFirst: formFindFirstMock,
    },
    formFields: {
      findMany: fieldsFindManyMock,
      findUnique: fieldsFindUniqueMock,
      update: fieldsUpdateMock,
    },
    $transaction: transactionMock,
  },
}));

// ---------------- MOCK LOGGER ----------------

const mockInfo = mock();
const mockWarn = mock();

mock.module("../logger", () => ({
  logger: {
    info: mockInfo,
    warn: mockWarn,
    error: mock(),
  },
}));

// IMPORT AFTER MOCKS
const { getAllFields, createField, updateField, deleteField } = await import(
  "../api/form-fields/controller"
);

describe("Form Fields Controller Tests", () => {
  beforeEach(() => {
    formCountMock.mockReset();
    formFindFirstMock.mockReset();
    fieldsFindManyMock.mockReset();
    fieldsFindFirstMock.mockReset();
    fieldsCreateMock.mockReset();
    fieldsUpdateMock.mockReset();
    fieldsDeleteMock.mockReset();
    fieldsFindUniqueMock.mockReset();
    mockInfo.mockReset();
    mockWarn.mockReset();
  });

  const user = { id: "user1" };

  // =====================================================
  // getAllFields
  // =====================================================

  it("getAllFields → form not found", async () => {
    formCountMock.mockResolvedValue(0);

    const set: any = {};
    const res = await getAllFields({
      params: { formId: "f1" },
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });

  it("getAllFields → empty fields", async () => {
    formCountMock.mockResolvedValue(1);
    fieldsFindManyMock.mockResolvedValue([]);

    const set: any = {};
    const res = await getAllFields({
      params: { formId: "f1" },
      set,
    } as any);

    expect(res.success).toBe(true);
    expect(res.data!.length).toBe(0);
  });

  it("getAllFields → success ordered", async () => {
    formCountMock.mockResolvedValue(1);

    fieldsFindManyMock.mockResolvedValue([
      { id: "1", prevFieldId: null },
      { id: "2", prevFieldId: "1" },
    ]);

    const set: any = {};
    const res = await getAllFields({
      params: { formId: "f1" },
      set,
    } as any);

    expect(res.success).toBe(true);
    expect(res.data!.length).toBe(2);
  });

  // =====================================================
  // createField
  // =====================================================

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

  it("createField → success", async () => {
    formFindFirstMock.mockResolvedValue({ id: "f1" });

    fieldsCreateMock.mockResolvedValue({ id: "newField" });

    const set: any = {};
    const res = await createField({
      params: { formId: "f1" },
      body: {
        fieldName: "Name",
        label: "Name",
        fieldType: "text",
        fieldValueType: "string",
      },
      set,
      user,
    } as any);

    expect(res.success).toBe(true);
  });

  // =====================================================
  // updateField
  // =====================================================

  it("updateField → not found", async () => {
    fieldsFindUniqueMock.mockResolvedValue(null);

    const set: any = {};
    const res = await updateField({
      params: { id: "x" },
      body: {},
      set,
      user,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });

  it("updateField → unauthorized", async () => {
    fieldsFindUniqueMock.mockResolvedValue({
      form: { ownerId: "other" },
    });

    const set: any = {};
    const res = await updateField({
      params: { id: "x" },
      body: {},
      set,
      user,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(403);
  });

  it("updateField → success", async () => {
    fieldsFindUniqueMock.mockResolvedValue({
      form: { ownerId: user.id },
    });

    fieldsUpdateMock.mockResolvedValue({ id: "1" });

    const set: any = {};
    const res = await updateField({
      params: { id: "1" },
      body: {},
      set,
      user,
    } as any);

    expect(res.success).toBe(true);
  });

  // =====================================================
  // deleteField
  // =====================================================

  it("deleteField → not found", async () => {
    fieldsFindUniqueMock.mockResolvedValue(null);

    const set: any = {};
    const res = await deleteField({
      params: { id: "x" },
      set,
      user,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });

  it("deleteField → unauthorized", async () => {
    fieldsFindUniqueMock.mockResolvedValue({
      form: { ownerId: "other" },
    });

    const set: any = {};
    const res = await deleteField({
      params: { id: "x" },
      set,
      user,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(403);
  });

  it("deleteField → success", async () => {
    fieldsFindUniqueMock.mockResolvedValue({
      id: "1",
      formId: "f1",
      prevFieldId: null,
      form: { ownerId: user.id },
    });

    const set: any = {};
    const res = await deleteField({
      params: { id: "1" },
      set,
      user,
    } as any);

    expect(res.success).toBe(true);
  });
});
