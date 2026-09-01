import { describe, it, expect } from 'vitest';
import { AdminWalletsModule } from './wallets.js';
import { createMockHttp } from '../../test-utils/mock-http.js';

describe('AdminWalletsModule.adjust — 2.4.0 (Spwig 1.8.0)', () => {
  it('POSTs a signed balance adjustment to the wallet adjust route', async () => {
    const mock = createMockHttp({});
    const input = {
      amount: '10.00',
      direction: 'increase' as const,
      description: 'goodwill credit',
    };
    await new AdminWalletsModule(mock.http).adjust(42, input);
    expect(mock.only()).toMatchObject({
      method: 'post',
      path: '/api/wallet/wallets/42/adjust/',
      body: input,
    });
  });

  it('supports a decrease with currency and reference id', async () => {
    const mock = createMockHttp({});
    const input = {
      amount: '5.00',
      direction: 'decrease' as const,
      currency: 'USD',
      description: 'chargeback clawback',
      reference_id: 'CB-123',
    };
    await new AdminWalletsModule(mock.http).adjust(7, input);
    expect(mock.only()).toMatchObject({
      method: 'post',
      path: '/api/wallet/wallets/7/adjust/',
      body: input,
    });
  });
});
