/**
 * Builds a fresh JSON {@link Response} for each `fetch` mock call (response bodies are single-use).
 */
export function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}
