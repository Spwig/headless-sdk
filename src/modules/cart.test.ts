import { describe, it, expect, beforeEach } from 'vitest';
import { CartModule, type Cart } from './cart.js';
import type { HttpClient } from '../utils/fetch.js';

interface RecordedCall {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  body?: unknown;
}

function createMockHttp(response: unknown): { http: HttpClient; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const http = {
    async get(path: string) {
      calls.push({ method: 'get', path });
      return response;
    },
    async post(path: string, body?: unknown) {
      calls.push({ method: 'post', path, body });
      return response;
    },
    async put(path: string, body?: unknown) {
      calls.push({ method: 'put', path, body });
      return response;
    },
    async patch(path: string, body?: unknown) {
      calls.push({ method: 'patch', path, body });
      return response;
    },
    async delete(path: string) {
      calls.push({ method: 'delete', path });
      return response;
    },
  } as unknown as HttpClient;
  return { http, calls };
}

const stubCart = { id: 1, items: [] } as unknown as Cart;

describe('CartModule.applyGiftCard', () => {
  let mock: ReturnType<typeof createMockHttp>;
  let cart: CartModule;

  beforeEach(() => {
    mock = createMockHttp(stubCart);
    cart = new CartModule(mock.http);
  });

  it('posts the code to /api/cart/apply-gift-card/', async () => {
    await cart.applyGiftCard('GC-ABCD');
    expect(mock.calls).toEqual([
      { method: 'post', path: '/api/cart/apply-gift-card/', body: { code: 'GC-ABCD' } },
    ]);
  });

  it('returns the cart response', async () => {
    const result = await cart.applyGiftCard('GC-ABCD');
    expect(result).toBe(stubCart);
  });
});

describe('CartModule.removeGiftCard', () => {
  let mock: ReturnType<typeof createMockHttp>;
  let cart: CartModule;

  beforeEach(() => {
    mock = createMockHttp(stubCart);
    cart = new CartModule(mock.http);
  });

  it('deletes /api/cart/remove-gift-card/<code>/', async () => {
    await cart.removeGiftCard('GC-XYZ');
    expect(mock.calls).toEqual([
      { method: 'delete', path: '/api/cart/remove-gift-card/GC-XYZ/' },
    ]);
  });

  it('URL-encodes codes containing reserved characters', async () => {
    await cart.removeGiftCard('a b/c');
    expect(mock.calls[0].path).toBe('/api/cart/remove-gift-card/a%20b%2Fc/');
  });

  it('returns the cart response', async () => {
    const result = await cart.removeGiftCard('GC-XYZ');
    expect(result).toBe(stubCart);
  });
});

describe('CartModule.applyVoucher', () => {
  it('posts the code to /api/cart/apply-voucher/', async () => {
    const mock = createMockHttp(stubCart);
    const cart = new CartModule(mock.http);
    await cart.applyVoucher('WELCOME10');
    expect(mock.calls).toEqual([
      { method: 'post', path: '/api/cart/apply-voucher/', body: { code: 'WELCOME10' } },
    ]);
  });
});

describe('CartModule.removeVoucher', () => {
  it('deletes /api/cart/remove-voucher/<code>/', async () => {
    const mock = createMockHttp(stubCart);
    const cart = new CartModule(mock.http);
    await cart.removeVoucher('WELCOME10');
    expect(mock.calls).toEqual([
      { method: 'delete', path: '/api/cart/remove-voucher/WELCOME10/' },
    ]);
  });

  it('URL-encodes codes containing reserved characters', async () => {
    const mock = createMockHttp(stubCart);
    const cart = new CartModule(mock.http);
    await cart.removeVoucher('a b/c');
    expect(mock.calls[0].path).toBe('/api/cart/remove-voucher/a%20b%2Fc/');
  });
});
