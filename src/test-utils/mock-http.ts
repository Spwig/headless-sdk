import type { HttpClient } from '../utils/fetch.js';

/**
 * A call recorded by the mock HTTP client. Modules are thin wrappers over
 * HttpClient, so asserting the recorded (method, path, params, body) is exactly
 * asserting the module builds the right request — no server needed.
 */
export interface RecordedCall {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'fetchBlob';
  path: string;
  params?: Record<string, unknown>;
  body?: unknown;
}

export interface MockHttp {
  http: HttpClient;
  calls: RecordedCall[];
  /** Convenience: the single call, asserting exactly one was made. */
  only(): RecordedCall;
}

/**
 * Build a mock HttpClient that records every call and returns `response`.
 *
 * Pass a function for `response` to vary the payload by call (e.g. to return an
 * envelope from one method and a bare object from another).
 */
export function createMockHttp(
  response: unknown = {},
  init?: { blob?: unknown },
): MockHttp {
  const calls: RecordedCall[] = [];
  const resolve = (call: RecordedCall) =>
    typeof response === 'function' ? (response as (c: RecordedCall) => unknown)(call) : response;

  const http = {
    async get(path: string, params?: Record<string, unknown>) {
      const call: RecordedCall = { method: 'get', path, params };
      calls.push(call);
      return resolve(call);
    },
    async post(path: string, body?: unknown) {
      const call: RecordedCall = { method: 'post', path, body };
      calls.push(call);
      return resolve(call);
    },
    async put(path: string, body?: unknown) {
      const call: RecordedCall = { method: 'put', path, body };
      calls.push(call);
      return resolve(call);
    },
    async patch(path: string, body?: unknown) {
      const call: RecordedCall = { method: 'patch', path, body };
      calls.push(call);
      return resolve(call);
    },
    async delete(path: string) {
      const call: RecordedCall = { method: 'delete', path };
      calls.push(call);
      return resolve(call);
    },
    async fetchBlob(path: string, params?: Record<string, unknown>) {
      const call: RecordedCall = { method: 'fetchBlob', path, params };
      calls.push(call);
      return init?.blob ?? { blob: new Blob([]), filename: null };
    },
  } as unknown as HttpClient;

  return {
    http,
    calls,
    only() {
      if (calls.length !== 1) {
        throw new Error(`expected exactly 1 call, recorded ${calls.length}`);
      }
      return calls[0];
    },
  };
}
