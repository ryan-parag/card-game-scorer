// Minimal types for Vercel's Node.js function signature, so we don't need
// @vercel/node just for its types.
export interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): ApiResponse;
  json(body: unknown): void;
  send(body: string): void;
}

export const header = (req: ApiRequest, name: string): string | undefined => {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

export const queryParam = (req: ApiRequest, name: string): string | null => {
  const value = req.query[name];
  return (Array.isArray(value) ? value[0] : value) ?? null;
};
