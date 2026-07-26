import { describe, it, expect } from 'vitest';
import { CheckoutModule } from './checkout.js';
import { createMockHttp } from '../test-utils/mock-http.js';

describe('CheckoutModule — flow steps', () => {
  it('getSession GETs /api/checkout/', async () => {
    const mock = createMockHttp({ id: 1 });
    await new CheckoutModule(mock.http).getSession();
    expect(mock.only()).toMatchObject({ method: 'get', path: '/api/checkout/' });
  });

  it('setShippingAddress POSTs the address to /api/checkout/shipping-address/', async () => {
    const mock = createMockHttp({ id: 1 });
    const address = { name: 'A', address1: '1 St', city: 'X', state: '', postal_code: '00', country: 'US' };
    await new CheckoutModule(mock.http).setShippingAddress(address);
    expect(mock.only()).toEqual({ method: 'post', path: '/api/checkout/shipping-address/', body: address });
  });

  it('selectShippingMethod sends the id under shipping_method_id', async () => {
    const mock = createMockHttp({ id: 1 });
    await new CheckoutModule(mock.http).selectShippingMethod(42);
    expect(mock.only()).toEqual({
      method: 'post',
      path: '/api/checkout/shipping-method/',
      body: { shipping_method_id: 42 },
    });
  });

  it('selectPaymentMethod sends the slug under provider', async () => {
    const mock = createMockHttp({ id: 1 });
    await new CheckoutModule(mock.http).selectPaymentMethod('stripe');
    expect(mock.only()).toEqual({
      method: 'post',
      path: '/api/checkout/payment-method/',
      body: { provider: 'stripe' },
    });
  });

  it('getShippingMethods unwraps the { shipping_methods } envelope', async () => {
    const rows = [{ id: 1 }, { id: 2 }];
    const mock = createMockHttp({ shipping_methods: rows });
    const res = await new CheckoutModule(mock.http).getShippingMethods();
    expect(res).toBe(rows);
  });

  it('getShippingMethods passes a bare array through unchanged', async () => {
    const rows = [{ id: 1 }];
    const mock = createMockHttp(rows);
    const res = await new CheckoutModule(mock.http).getShippingMethods();
    expect(res).toBe(rows);
  });

  it('getPaymentProviders unwraps the { payment_providers } envelope', async () => {
    const rows = [{ id: 'stripe' }];
    const mock = createMockHttp({ payment_providers: rows });
    const res = await new CheckoutModule(mock.http).getPaymentProviders();
    expect(res).toBe(rows);
  });
});

describe('CheckoutModule.setContact — 2.1.0', () => {
  it('POSTs the contact payload to /api/checkout/contact/', async () => {
    const mock = createMockHttp({ success: true, session: { id: 1 } });
    const contact = { email: 'a@b.com', first_name: 'A', last_name: 'B' };
    await new CheckoutModule(mock.http).setContact(contact);
    expect(mock.only()).toEqual({ method: 'post', path: '/api/checkout/contact/', body: contact });
  });

  it('passes a password through when opting into account creation', async () => {
    const mock = createMockHttp({ success: true, session: { id: 1 } });
    await new CheckoutModule(mock.http).setContact({ email: 'a@b.com', password: 'secret' });
    expect((mock.only().body as { password?: string }).password).toBe('secret');
  });
});

describe('CheckoutModule — tenders (2.0.0)', () => {
  it('listTenders GETs /api/checkout/tenders/', async () => {
    const mock = createMockHttp({ success: true, amount_due: '0.00', tenders: [] });
    await new CheckoutModule(mock.http).listTenders();
    expect(mock.only()).toMatchObject({ method: 'get', path: '/api/checkout/tenders/' });
  });

  it('addGiftCardTender POSTs the code', async () => {
    const mock = createMockHttp({ success: true });
    await new CheckoutModule(mock.http).addGiftCardTender('GC-123');
    expect(mock.only()).toEqual({
      method: 'post',
      path: '/api/checkout/tenders/gift-card/',
      body: { code: 'GC-123' },
    });
  });

  it('addWalletTender POSTs an empty body to the wallet tender route', async () => {
    const mock = createMockHttp({ success: true });
    await new CheckoutModule(mock.http).addWalletTender();
    expect(mock.only()).toEqual({ method: 'post', path: '/api/checkout/tenders/wallet/', body: {} });
  });

  it('removeTender DELETEs the tender by id and URL-encodes it', async () => {
    const mock = createMockHttp({ success: true });
    await new CheckoutModule(mock.http).removeTender('hold/9 1');
    expect(mock.only()).toEqual({ method: 'delete', path: '/api/checkout/tenders/hold%2F9%201/' });
  });
});
