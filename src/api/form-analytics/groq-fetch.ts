// Thin wrapper around globalThis.fetch for testability.
// In integration tests this module is replaced via mock.module().
export function groqFetch(
  url: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  return fetch(url, init);
}
