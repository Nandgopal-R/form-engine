import { describe, it, expect, mock, beforeEach } from "bun:test";

// ---------------- MOCK PRISMA ----------------

const formFindUniqueMock = mock();
const formResponseCreateMock = mock();
const formResponseUpdateManyMock = mock();
const formResponseFindManyMock = mock();
const formFieldsFindManyMock = mock();

mock.module("../db/prisma", () => ({
  prisma: {
    form: {
      findUnique: formFindUniqueMock,
    },
    formResponse: {
      create: formResponseCreateMock,
      updateMany: formResponseUpdateManyMock,
      findMany: formResponseFindManyMock,
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
  resumeResponse,
  getResponseForFormOwner,
  getSubmittedResponse,
} = await import("../api/form-response/controller");

describe("Form Response Controller Tests", () => {

  beforeEach(() => {
    formFindUniqueMock.mockReset();
    formResponseCreateMock.mockReset();
    formResponseUpdateManyMock.mockReset();
    formResponseFindManyMock.mockReset();
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

    formResponseCreateMock.mockResolvedValue({ id: "r1" });

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

  // =====================================================
  // resumeResponse
  // =====================================================

  it("resumeResponse → success", async () => {
    formResponseUpdateManyMock.mockResolvedValue({ count: 1 });

    const res = await resumeResponse({
      params: { responseId: "r1" },
      body: { answers: {} },
      user,
    } as any);

    expect(res.success).toBe(true);
  });

  it("resumeResponse → not found", async () => {
    formResponseUpdateManyMock.mockResolvedValue({ count: 0 });

    const res = await resumeResponse({
      params: { responseId: "r1" },
      body: { answers: {} },
      user,
    } as any);

    expect(res.success).toBe(false);
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
    expect(res.data.length).toBe(1);
  });

  it("getResponseForFormOwner → form not found", async () => {
    formFindUniqueMock.mockResolvedValue(null);

    const set: any = {};

    const res = await getResponseForFormOwner({
      params: { formId: "f1" },
      user,
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
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
  });

  it("getSubmittedResponse → none found", async () => {
    formResponseFindManyMock.mockResolvedValue([]);

    const set: any = {};

    const res = await getSubmittedResponse({
      params: { formId: "f1" },
      user,
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });

});
