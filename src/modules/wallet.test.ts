import { describe, it, expect } from 'vitest';
import { WalletModule } from './wallet.js';
import { LoyaltyModule } from './loyalty.js';
import { createMockHttp } from '../test-utils/mock-http.js';

describe('WalletModule — store credit (1.7.0)', () => {
  it('getBalance GETs /api/wallet/balance/', async () => {
    const mock = createMockHttp({ balance: '10.00' });
    await new WalletModule(mock.http).getBalance();
    expect(mock.only()).toMatchObject({ method: 'get', path: '/api/wallet/balance/' });
  });

  it('listTransactions forwards pagination + filter params', async () => {
    const mock = createMockHttp({ results: [] });
    await new WalletModule(mock.http).listTransactions({ limit: 10, offset: 20, type: 'credit' });
    expect(mock.only()).toMatchObject({
      method: 'get',
      path: '/api/wallet/transactions/',
      params: { limit: 10, offset: 20, type: 'credit' },
    });
  });
});

describe('LoyaltyModule.redeemReward — 2.0.0 signature', () => {
  it('POSTs to /api/loyalty/rewards/<uuid>/redeem/ (the uuid, not a numeric id)', async () => {
    const mock = createMockHttp({ id: 1 });
    await new LoyaltyModule(mock.http).redeemReward('a1b2-uuid');
    expect(mock.only()).toEqual({ method: 'post', path: '/api/loyalty/rewards/a1b2-uuid/redeem/', body: undefined });
  });

  it('URL-encodes the reward uuid', async () => {
    const mock = createMockHttp({ id: 1 });
    await new LoyaltyModule(mock.http).redeemReward('a/b c');
    expect(mock.only().path).toBe('/api/loyalty/rewards/a%2Fb%20c/redeem/');
  });

  it('listRewards GETs /api/loyalty/rewards/', async () => {
    const mock = createMockHttp([]);
    await new LoyaltyModule(mock.http).listRewards();
    expect(mock.only()).toMatchObject({ method: 'get', path: '/api/loyalty/rewards/' });
  });
});
