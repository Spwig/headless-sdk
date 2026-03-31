import type { HttpClient } from '../../utils/fetch.js';
import type { RequestOptions } from '../../utils/types.js';

/** POS customer record. */
export interface PosCustomer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  total_orders: number;
  total_spent: string;
  loyalty_points: number | null;
  [key: string]: unknown;
}

/** POS customer creation input. */
export interface PosCustomerCreateInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

/** POS loyalty member info. */
export interface PosLoyaltyMember {
  customer_id: number;
  points_balance: number;
  tier: string | null;
  lifetime_points: number;
  [key: string]: unknown;
}

/** POS loyalty preview (points that would be earned). */
export interface PosLoyaltyPreview {
  points_to_earn: number;
  current_balance: number;
  [key: string]: unknown;
}

/** POS Customers API: search, create, loyalty lookup. */
export class PosCustomersModule {
  constructor(private http: HttpClient) {}

  /** Search customers by name, email, or phone. */
  async search(query: string, opts?: RequestOptions): Promise<PosCustomer[]> {
    return this.http.get('/api/pos/customers/search/', { q: query } as Record<string, unknown>, opts);
  }

  /** Create a new customer at the POS. */
  async create(data: PosCustomerCreateInput, opts?: RequestOptions): Promise<PosCustomer> {
    return this.http.post('/api/pos/customers/', data, opts);
  }

  /** Get customer detail. */
  async get(id: number, opts?: RequestOptions): Promise<PosCustomer> {
    return this.http.get(`/api/pos/customers/${id}/`, undefined, opts);
  }

  /** Loyalty sub-module. */
  readonly loyalty = {
    /** Get loyalty member details for a customer. */
    getMember: (customerId: number, opts?: RequestOptions): Promise<PosLoyaltyMember> =>
      this.http.get(`/api/pos/loyalty/member/${customerId}/`, undefined, opts),

    /** Preview points a customer would earn for the current cart. */
    preview: (customerId: number, opts?: RequestOptions): Promise<PosLoyaltyPreview> =>
      this.http.get(`/api/pos/loyalty/preview/${customerId}/`, undefined, opts),
  };
}
