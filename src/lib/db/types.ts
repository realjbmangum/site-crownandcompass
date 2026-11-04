/** Minimal bindings used by the blog. Pages injects the real objects at runtime. */

export interface D1Result<T = Record<string, unknown>> {
  results?: T[];
  success: boolean;
  meta?: { changes?: number; last_row_id?: number };
}

export interface D1Prepared {
  bind(...values: unknown[]): D1Prepared;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(sql: string): D1Prepared;
  batch<T = Record<string, unknown>>(statements: D1Prepared[]): Promise<D1Result<T>[]>;
}

export interface R2ObjectBody {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
}

export interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | string,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  list(options?: { prefix?: string; limit?: number }): Promise<{ objects: { key: string }[] }>;
}

export interface AssetFetcher {
  fetch(input: Request | string): Promise<Response>;
}

export interface BlogEnv {
  DB?: D1Database;
  MEDIA?: R2Bucket;
  ASSETS?: AssetFetcher;
  DAVID_API_KEY?: string;
  PULPIT_API_KEY?: string;
  BARNABAS_API_KEY?: string;
  BRIAN_ADMIN_KEY?: string;
}

export function blogEnv(locals: unknown): BlogEnv {
  const runtime = (locals as { runtime?: { env?: BlogEnv } } | null | undefined)?.runtime;
  return runtime?.env ?? {};
}
