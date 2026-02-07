import { beforeEach, describe, expect, it, mock } from "bun:test";

// ---------- MOCK PRISMA ----------
const findManyMock = mock();
const createMock = mock();
const findFirstMock = mock();
const updateMock = mock();
const deleteManyMock = mock();

mock.module("../db/prisma", () => ({
  prisma: {
    form: {
      findMany: findManyMock,
      create: createMock,
      findFirst: findFirstMock,
      update: updateMock,
      deleteMany: deleteManyMock,
    },
  },
}));

// ---------- MOCK LOGGER ----------
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
  getAllForms,
  createForm,
  getFormById,
  updateForm,
  deleteForm,
  publishForm,
  unPublishForm,
} = await import("../api/forms/controller");

describe("Forms Controller Tests", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    createMock.mockReset();
    findFirstMock.mockReset();
    updateMock.mockReset();
    deleteManyMock.mockReset();
    mockInfo.mockReset();
    mockWarn.mockReset();
  });

  const user = { id: "user1" };

  // ==============================
  // getAllForms
  // ==============================

  it("getAllForms → success", async () => {
    findManyMock.mockResolvedValue([
      { id: "1", title: "A", isPublished: true, createdAt: new Date() },
    ]);

    const res = await getAllForms({ user } as any);

    expect(res.success).toBe(true);
    expect(res.data!.length).toBe(1);
  });

  it("getAllForms → empty", async () => {
    findManyMock.mockResolvedValue([]);

    const res = await getAllForms({ user } as any);

    expect(res.message).toBe("No forms found");
    expect(res.data).toEqual([]);
  });

  // ==============================
  // createForm
  // ==============================

  it("createForm → success", async () => {
    createMock.mockResolvedValue({ id: "1", title: "New" });

    const res = await createForm({
      user,
      body: { title: "New", description: "desc" },
    } as any);

    expect(res.success).toBe(true);
  });

  // ==============================
  // getFormById
  // ==============================

  it("getFormById → found", async () => {
    findFirstMock.mockResolvedValue({ id: "1" });

    const set: any = {};
    const res = await getFormById({
      user,
      params: { formId: "1" },
      set,
    } as any);

    expect(res.success).toBe(true);
  });

  it("getFormById → not found", async () => {
    findFirstMock.mockResolvedValue(null);

    const set: any = {};
    const res = await getFormById({
      user,
      params: { formId: "2" },
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });

  // ==============================
  // updateForm
  // ==============================

  it("updateForm → success", async () => {
    findFirstMock.mockResolvedValue({ id: "1" });
    updateMock.mockResolvedValue({ id: "1" });

    const set: any = {};

    const res = await updateForm({
      user,
      params: { formId: "1" },
      body: { title: "Updated", description: "D" },
      set,
    } as any);

    expect(res.success).toBe(true);
  });

  it("updateForm → not found", async () => {
    findFirstMock.mockResolvedValue(null);

    const set: any = {};

    const res = await updateForm({
      user,
      params: { formId: "1" },
      body: { title: "T", description: "D" },
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });

  // ==============================
  // deleteForm
  // ==============================

  it("deleteForm → success", async () => {
    deleteManyMock.mockResolvedValue({ count: 1 });

    const set: any = {};

    const res = await deleteForm({
      user,
      params: { formId: "1" },
      set,
    } as any);

    expect(res.success).toBe(true);
  });

  it("deleteForm → not found", async () => {
    deleteManyMock.mockResolvedValue({ count: 0 });

    const set: any = {};

    const res = await deleteForm({
      user,
      params: { formId: "1" },
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });

  // ==============================
  // publishForm
  // ==============================

  it("publishForm → success", async () => {
    findFirstMock.mockResolvedValue({ id: "1" });
    updateMock.mockResolvedValue({ id: "1", isPublished: true });

    const set: any = {};

    const res = await publishForm({
      user,
      params: { formId: "1" },
      set,
    } as any);

    expect(res.success).toBe(true);
  });

  it("publishForm → not found", async () => {
    findFirstMock.mockResolvedValue(null);

    const set: any = {};

    const res = await publishForm({
      user,
      params: { formId: "1" },
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });

  // ==============================
  // unPublishForm
  // ==============================

  it("unPublishForm → success", async () => {
    findFirstMock.mockResolvedValue({ id: "1" });
    updateMock.mockResolvedValue({ id: "1", isPublished: false });

    const set: any = {};

    const res = await unPublishForm({
      user,
      params: { formId: "1" },
      set,
    } as any);

    expect(res.success).toBe(true);
  });

  it("unPublishForm → not found", async () => {
    findFirstMock.mockResolvedValue(null);

    const set: any = {};

    const res = await unPublishForm({
      user,
      params: { formId: "1" },
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });
});
