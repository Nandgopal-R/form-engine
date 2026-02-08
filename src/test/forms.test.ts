import { beforeEach, describe, expect, it, mock } from "bun:test";

// ---------- MOCK PRISMA ----------
const formFindManyMock = mock();
const formFieldsFindManyMock = mock();
const createMock = mock();
const findFirstMock = mock();
const updateMock = mock();
const deleteManyMock = mock();

mock.module("../db/prisma", () => ({
  prisma: {
    form: {
      findMany: formFindManyMock,
      create: createMock,
      findFirst: findFirstMock,
      update: updateMock,
      deleteMany: deleteManyMock,
    },
    formFields: {
      findMany: formFieldsFindManyMock,
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
    formFindManyMock.mockReset();
    formFieldsFindManyMock.mockReset();
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
    formFindManyMock.mockResolvedValue([
      { id: "1", title: "A", isPublished: true, createdAt: new Date() },
    ]);

    const res = await getAllForms({ user } as any);

    expect(res.success).toBe(true);
    expect(res.data.length).toBe(1);
  });

  it("getAllForms → empty", async () => {
    formFindManyMock.mockResolvedValue([]);

    const res = await getAllForms({ user } as any);

    expect(res.message).toBe("No forms found");
    expect(res.data).toEqual([]);
  });

  it("getAllForms → DB error", async () => {
    formFindManyMock.mockRejectedValue(new Error("DB fail"));

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

  it("getFormById → found with ordered fields", async () => {
    findFirstMock.mockResolvedValue({
      id: "1",
      title: "Test Form",
      description: "Desc",
      isPublished: false,
      createdAt: new Date(),
    });

    formFieldsFindManyMock.mockResolvedValue([
      { id: "f1", formId: "1", prevFieldId: null },
      { id: "f2", formId: "1", prevFieldId: "f1" },
    ]);

    const set: any = {};

    const res = await getFormById({
      user,
      params: { formId: "1" },
      set,
    } as any);

    const result: any = res;

    expect(result.success).toBe(true);
    expect(result.form.id).toBe("1");
    expect(result.fields.length).toBe(2);
    expect(result.fields[0].id).toBe("f1");
    expect(result.fields[1].id).toBe("f2");
  });

  it("getFormById → no fields", async () => {
    findFirstMock.mockResolvedValue({
      id: "1",
      title: "Test Form",
      description: "Desc",
      isPublished: false,
      createdAt: new Date(),
    });

    formFieldsFindManyMock.mockResolvedValue([]);

    const set: any = {};

    const res = await getFormById({
      user,
      params: { formId: "1" },
      set,
    } as any);

    expect(res.success).toBe(true);
    expect(res.data).toEqual([]);
    expect(res.message).toBe("No forms fields found");
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

  it("getFormById → DB error", async () => {
    findFirstMock.mockRejectedValue(new Error("DB error"));

    const set: any = {};

    await expect(
      getFormById({
        user,
        params: { formId: "1" },
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
