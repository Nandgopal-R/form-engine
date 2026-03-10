import { mock } from "bun:test";

// ──────────────────────────────────────────────────────
// MOCK: Prisma
// ──────────────────────────────────────────────────────

export const prismaMock = {
  form: {
    findMany: mock(),
    findFirst: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    deleteMany: mock(),
    count: mock(),
  },
  formFields: {
    findMany: mock(),
    findFirst: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
  formResponse: {
    findMany: mock(),
    create: mock(),
    updateMany: mock(),
  },
  $transaction: mock(),
};

mock.module("../db/prisma", () => ({
  prisma: prismaMock,
}));

// ──────────────────────────────────────────────────────
// MOCK: Logger (silent in tests)
// ──────────────────────────────────────────────────────

mock.module("../logger/index", () => ({
  logger: {
    info: mock(),
    success: mock(),
    warn: mock(),
    error: mock(),
    child: mock(),
  },
}));

mock.module("../logger/", () => ({
  logger: {
    info: mock(),
    success: mock(),
    warn: mock(),
    error: mock(),
    child: mock(),
  },
}));

// ──────────────────────────────────────────────────────
// MOCK: Auth (better-auth)
// ──────────────────────────────────────────────────────

export const mockGetSession = mock();

mock.module("../api/auth/index", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
    handler: mock(() => new Response("OK")),
  },
}));

// ──────────────────────────────────────────────────────
// MOCK: Groq AI API (fetch)
// ──────────────────────────────────────────────────────

export const originalFetch = globalThis.fetch;
export const mockFetch = mock();

export function enableFetchMock() {
  globalThis.fetch = mockFetch as unknown as typeof fetch;
}

export function restoreFetch() {
  globalThis.fetch = originalFetch;
}

// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────

export const TEST_USER = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
};
export const OTHER_USER = {
  id: "user-2",
  name: "Other User",
  email: "other@example.com",
};

export function setAuthenticatedUser(
  user: { id: string; name?: string; email?: string } | null,
) {
  if (user) {
    mockGetSession.mockResolvedValue({ user, session: { id: "session-1" } });
  } else {
    mockGetSession.mockResolvedValue(null);
  }
}

export function resetAllMocks() {
  for (const model of Object.values(prismaMock)) {
    if (typeof model === "function") {
      (model as ReturnType<typeof mock>).mockReset();
    } else {
      for (const fn of Object.values(model)) {
        (fn as ReturnType<typeof mock>).mockReset();
      }
    }
  }
  mockGetSession.mockReset();
  mockFetch.mockReset();
}

const BASE = "http://localhost";

export function request(path: string, options?: RequestInit) {
  return new Request(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Cookie: "test-session=abc",
      ...(options?.headers || {}),
    },
  });
}

export function jsonBody(data: unknown) {
  return JSON.stringify(data);
}
