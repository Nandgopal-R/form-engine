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
const { getAllForms, createForm, getFormById, updateForm, deleteForm } =
  await import("../api/forms/controller");

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

  // ===== getAllForms =====

  it("getAllForms → success", async () => {
    findManyMock.mockResolvedValue([
      { id: "1", title: "A", isPublished: true, createdAt: new Date() },
    ]);

    const res = await getAllForms({ user } as any);

    expect(res.success).toBe(true);
    expect(res.data.length).toBe(1);
  });

  it("getAllForms → empty", async () => {
    findManyMock.mockResolvedValue([]);

    const res = await getAllForms({ user } as any);

    expect(res.message).toBe("No forms found");
    expect(res.data).toEqual([]);
  });

  it("getAllForms → DB error", async () => {
    findManyMock.mockRejectedValue(new Error("DB fail"));

    expect(getAllForms({ user } as any)).rejects.toThrow();
  });

  // ===== createForm =====

  it("createForm → success", async () => {
    createMock.mockResolvedValue({ id: "1", title: "New" });

    const res = await createForm({
      user,
      body: { title: "New", description: "desc" },
    } as any);

    expect(res.success).toBe(true);
  });

  it("createForm → called", async () => {
    createMock.mockResolvedValue({ id: "1" });

    await createForm({
      user,
      body: { title: "T", description: "D" },
    } as any);

    expect(createMock).toHaveBeenCalled();
  });

  it("createForm → DB error", async () => {
    createMock.mockRejectedValue(new Error("DB crash"));

    expect(
      createForm({
        user,
        body: { title: "X", description: "Y" },
      } as any),
    ).rejects.toThrow();
  });

  // ===== getFormById =====

  it("getFormById → found", async () => {
    findFirstMock.mockResolvedValue({ id: "1" });

    const set: any = {};
    const res = await getFormById({
      user,
      params: { id: "1" },
      set,
    } as any);

    expect(res.success).toBe(true);
  });

  it("getFormById → not found", async () => {
    findFirstMock.mockResolvedValue(null);

    const set: any = {};
    const res = await getFormById({
      user,
      params: { id: "2" },
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });

  it("getFormById → DB error", async () => {
    findFirstMock.mockRejectedValue(new Error("DB error"));

    const set: any = {};

    expect(
      getFormById({
        user,
        params: { id: "1" },
        set,
      } as any),
    ).rejects.toThrow();
  });

  // ===== updateForm =====

  it("updateForm → success", async () => {
    findFirstMock.mockResolvedValue({ id: "1" });

    updateMock.mockResolvedValue({
      id: "1",
      title: "Updated",
    });

    const set: any = {};

    const res = await updateForm({
      user,
      params: { id: "1" },
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
      params: { id: "1" },
      body: { title: "T", description: "D" },
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });

  it("updateForm → DB error", async () => {
    findFirstMock.mockRejectedValue(new Error("DB fail"));

    const set: any = {};

    expect(
      updateForm({
        user,
        params: { id: "1" },
        body: { title: "T", description: "D" },
        set,
      } as any),
    ).rejects.toThrow();
  });

  // ===== deleteForm =====

  it("deleteForm → success", async () => {
    deleteManyMock.mockResolvedValue({ count: 1 });

    const set: any = {};

    const res = await deleteForm({
      user,
      params: { id: "1" },
      set,
    } as any);

    expect(res.success).toBe(true);
  });

  it("deleteForm → not found", async () => {
    deleteManyMock.mockResolvedValue({ count: 0 });

    const set: any = {};

    const res = await deleteForm({
      user,
      params: { id: "1" },
      set,
    } as any);

    expect(res.success).toBe(false);
    expect(set.status).toBe(404);
  });

  it("deleteForm → DB error", async () => {
    deleteManyMock.mockRejectedValue(new Error("DB crash"));

    const set: any = {};

    expect(
      deleteForm({
        user,
        params: { id: "1" },
        set,
      } as any),
    ).rejects.toThrow();
  });
});
