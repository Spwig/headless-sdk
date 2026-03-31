import type { HttpClient } from '../../utils/fetch.js';
import type { RequestOptions } from '../../utils/types.js';

/** POS shift data. */
export interface PosShift {
  id: number;
  terminal_name: string;
  cashier_name: string;
  started_at: string;
  ended_at: string | null;
  is_open: boolean;
  opening_cash: string;
  total_sales: string;
  total_refunds: string;
  total_transactions: number;
  net_sales: string;
  cash_total: string | null;
  card_total: string | null;
  gift_card_total: string | null;
}

/** Cash movement (cash in/out during shift). */
export interface PosCashMovement {
  movement_type: 'in' | 'out';
  amount: string;
  reason: string;
}

/** Daily POS report. */
export interface PosDailyReport {
  date: string;
  total_sales: string;
  total_refunds: string;
  net_sales: string;
  total_transactions: number;
  average_transaction: string;
  payment_breakdown: Record<string, string>;
  [key: string]: unknown;
}

/** Top product in POS reports. */
export interface PosTopProduct {
  product_id: number;
  product_name: string;
  units_sold: number;
  revenue: string;
}

/** POS Shifts & Reports API: shift management, cash movements, daily reports. */
export class PosShiftsModule {
  constructor(private http: HttpClient) {}

  /** Get the current open shift (if any). */
  async getCurrent(opts?: RequestOptions): Promise<PosShift | null> {
    return this.http.get('/api/pos/shifts/current/', undefined, opts);
  }

  /** Open a new shift. */
  async open(openingCash?: string, opts?: RequestOptions): Promise<PosShift> {
    return this.http.post('/api/pos/shifts/open/', { opening_cash: openingCash ?? '0' }, opts);
  }

  /** Close the current shift. */
  async close(closingCash: string, notes?: string, opts?: RequestOptions): Promise<PosShift> {
    return this.http.post('/api/pos/shifts/close/', { closing_cash: closingCash, notes }, opts);
  }

  /** Record a cash movement (cash in or out). */
  async cashMovement(data: PosCashMovement, opts?: RequestOptions): Promise<void> {
    return this.http.post('/api/pos/shifts/cash-movement/', data, opts);
  }

  /** Reports sub-module. */
  readonly reports = {
    /** Get daily sales report. */
    daily: (params?: { date?: string }, opts?: RequestOptions): Promise<PosDailyReport> =>
      this.http.get('/api/pos/reports/daily/', params as Record<string, unknown>, opts),

    /** Get top-selling products. */
    topProducts: (params?: { period?: string; limit?: number }, opts?: RequestOptions): Promise<PosTopProduct[]> =>
      this.http.get('/api/pos/reports/top-products/', params as Record<string, unknown>, opts),
  };
}
