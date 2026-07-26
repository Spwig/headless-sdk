import { describe, it, expect } from 'vitest';
import { AdminAnalyticsModule } from './analytics.js';
import { createMockHttp } from '../../test-utils/mock-http.js';

describe('AdminAnalyticsModule', () => {
  it('getDashboard GETs the dashboard route', async () => {
    const mock = createMockHttp({});
    await new AdminAnalyticsModule(mock.http).getDashboard();
    expect(mock.only()).toMatchObject({ method: 'get', path: '/api/admin/analytics/dashboard/' });
  });

  it('getSalesKpi forwards the period as a query param', async () => {
    const mock = createMockHttp({});
    await new AdminAnalyticsModule(mock.http).getSalesKpi('30_days');
    expect(mock.only()).toMatchObject({
      method: 'get',
      path: '/api/admin/analytics/sales-kpi/',
      params: { period: '30_days' },
    });
  });

  it('exportReport requests a blob with the report params', async () => {
    const mock = createMockHttp({});
    const params = { report_type: 'products' as const, format: 'csv' as const, start_date: '2026-01-01', end_date: '2026-01-31' };
    await new AdminAnalyticsModule(mock.http).exportReport(params);
    expect(mock.only()).toMatchObject({ method: 'fetchBlob', path: '/api/admin/analytics/export/', params });
  });
});

describe('AdminAnalyticsModule.getTraffic — 2.1.0', () => {
  it('GETs /api/admin/analytics/traffic/ and unwraps the { success, data } envelope', async () => {
    const data = {
      period: '30_days',
      start: 's',
      end: 'e',
      overview: { total_views: 10, human_views: 8, unique_visitors: 5, bot_views: 2, bounce_rate: 0.1, avg_pages_per_session: 2 },
      traffic_trends: { labels: [], views: [], visitors: [], bot_views: [] },
      top_pages: [],
      geographic_distribution: [],
      referrer_stats: [],
    };
    const mock = createMockHttp({ success: true, data });
    const res = await new AdminAnalyticsModule(mock.http).getTraffic({ period: '30_days' });
    // Regression guard: the module must return the inner payload, not the envelope.
    expect(res).toBe(data);
    expect(mock.only()).toMatchObject({
      method: 'get',
      path: '/api/admin/analytics/traffic/',
      params: { period: '30_days' },
    });
  });

  it('forwards a custom date range', async () => {
    const mock = createMockHttp({ success: true, data: {} });
    await new AdminAnalyticsModule(mock.http).getTraffic({ period: 'custom', start_date: '2026-01-01', end_date: '2026-01-31' });
    expect(mock.only().params).toEqual({ period: 'custom', start_date: '2026-01-01', end_date: '2026-01-31' });
  });
});
