import { beforeEach, describe, expect, it, mock } from "bun:test";

// ---------------- MOCK PRISMA ----------------

const formFindUniqueMock = mock();
const formResponseFindUniqueMock = mock();
const formResponseUpsertMock = mock();
const formResponseFindManyMock = mock();
const formResponseFindFirstMock = mock();
const formFieldsFindManyMock = mock();

mock.module("../db/prisma", () => ({
  prisma: {
    form: {
      findUnique: formFindUniqueMock,
    },
    formResponse: {
      findUnique: formResponseFindUniqueMock,
      upsert: formResponseUpsertMock,
      findMany: formResponseFindManyMock,
      findFirst: formResponseFindFirstMock,
    },
    formFields: {
      findMany: formFieldsFindManyMock,
    },
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
const {
  submitResponse,
  saveDraftResponse,
  getResponseForFormOwner,
  getSubmittedResponse,
  getDraftResponse,
} = await import("../api/form-response/controller");

describe("Form Response Controller Tests", () => {
  beforeEach(() => {
    formFindUniqueMock.mockReset();
    formResponseFindUniqueMock.mockReset();
    formResponseUpsertMock.mockReset();
    formResponseFindManyMock.mockReset();
    formResponseFindFirstMock.mockReset();
    formFieldsFindManyMock.mockReset();
    mockInfo.mockReset();
    mockWarn.mockReset();
  });

  const user = { id: "user1" };

  // =====================================================
  // submitResponse
  // =====================================================

  it("submitResponse → success", async () => {
    formFindUniqueMock.mockResolvedValue({
      id: "f1",
      isPublished: true,
    });

    formResponseFindUniqueMock.mockResolvedValue(null);

    formResponseUpsertMock.mockResolvedValue({ id: "r1" });

    const set: any = {};

    const res = await submitResponse({
      params: { formId: "f1" },
      body: { answers: {} },
      user,
      set,
    } as any);

    expect(res.success).toBe(true);
  });

  it("submitResponse → form not found", async () => {
    formFindUniqueMock.mockResolvedValue(null);

    const set: any = {};

    const res = await submitResponse({
      params: { formId: "x" },
      body: { answers: {} },
      user,
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });

  it("submitResponse → not published", async () => {
    formFindUniqueMock.mockResolvedValue({
      id: "f1",
      isPublished: false,
    });

    const set: any = {};

    const res = await submitResponse({
      params: { formId: "f1" },
      body: { answers: {} },
      user,
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(403);
  });

  it("submitResponse → already submitted", async () => {
    formFindUniqueMock.mockResolvedValue({
      id: "f1",
      isPublished: true,
    });

    formResponseFindUniqueMock.mockResolvedValue({
      isSubmitted: true,
    });

    const set: any = {};

    const res = await submitResponse({
      params: { formId: "f1" },
      body: { answers: {} },
      user,
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(400);
  });

  // =====================================================
  // saveDraftResponse
  // =====================================================

  it("saveDraftResponse → success", async () => {
    formFindUniqueMock.mockResolvedValue({ id: "f1" });
    formResponseFindUniqueMock.mockResolvedValue(null);
    formResponseUpsertMock.mockResolvedValue({ id: "r1" });

    const set: any = {};

    const res = await saveDraftResponse({
      params: { formId: "f1" },
      body: { answers: {} },
      user,
      set,
    } as any);

    expect(res.success).toBe(true);
  });

  it("saveDraftResponse → already submitted", async () => {
    formFindUniqueMock.mockResolvedValue({ id: "f1" });

    formResponseFindUniqueMock.mockResolvedValue({
      isSubmitted: true,
    });

    const set: any = {};

    const res = await saveDraftResponse({
      params: { formId: "f1" },
      body: { answers: {} },
      user,
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(400);
  });

  // =====================================================
  // getResponseForFormOwner
  // =====================================================

  it("getResponseForFormOwner → success", async () => {
    formFindUniqueMock.mockResolvedValue({
      id: "f1",
      ownerId: user.id,
    });

    formResponseFindManyMock.mockResolvedValue([
      {
        id: "r1",
        formId: "f1",
        answers: { field1: "A" },
        form: { title: "Form A" },
      },
    ]);

    formFieldsFindManyMock.mockResolvedValue([
      { id: "field1", fieldName: "Name" },
    ]);

    const set: any = {};

    const res = await getResponseForFormOwner({
      params: { formId: "f1" },
      user,
      set,
    } as any);

    expect(res.success).toBe(true);
    expect(res.data!.length).toBe(1);
  });

  // =====================================================
  // getSubmittedResponse
  // =====================================================

  it("getSubmittedResponse → success", async () => {
    formResponseFindManyMock.mockResolvedValue([
      {
        id: "r1",
        formId: "f1",
        answers: { field1: "A" },
        form: { title: "Form A" },
      },
    ]);

    formFieldsFindManyMock.mockResolvedValue([
      { id: "field1", fieldName: "Name" },
    ]);

    const set: any = {};

    const res = await getSubmittedResponse({
      params: { formId: "f1" },
      user,
      set,
    } as any);

    expect(res.success).toBe(true);
    expect(res.data!.length).toBe(1);
  });

  // =====================================================
  // getDraftResponse
  // =====================================================

  it("getDraftResponse → success", async () => {
    formResponseFindFirstMock.mockResolvedValue({
      id: "r1",
      formId: "f1",
      answers: { field1: "A" },
      form: { title: "Form A" },
    });

    formFieldsFindManyMock.mockResolvedValue([
      { id: "field1", fieldName: "Name" },
    ]);

    const set: any = {};

    const res = await getDraftResponse({
      params: { formId: "f1" },
      user,
      set,
    } as any);

    expect(res.success).toBe(true);
    expect(res.data!.id).toBe("r1");
  });

  it("getDraftResponse → not found", async () => {
    formResponseFindFirstMock.mockResolvedValue(null);

    const set: any = {};

    const res = await getDraftResponse({
      params: { formId: "f1" },
      user,
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });
});
