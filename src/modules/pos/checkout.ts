import type { HttpClient } from '../../utils/fetch.js';
import type { RequestOptions } from '../../utils/types.js';

/** POS payment detail in a completed order. */
export interface PosPaymentDetail {
  method: string;
  method_display: string;
  amount: string;
  amount_tendered: string | null;
  change_given: string | null;
  card_last_four: string | null;
}

/** POS completed order result. */
export interface PosCheckoutResult {
  order_id: number;
  order_number: string;
  total: string;
  currency: string;
  change_given: string | null;
  payments: PosPaymentDetail[];
  receipt_url: string | null;
  [key: string]: unknown;
}

/** Cash payment input. */
export interface PosCashPaymentInput {
  amount_tendered: string;
}

/** Card payment input. */
export interface PosCardPaymentInput {
  card_last_four: string;
  card_reference?: string;
}

/** Gift card payment input. */
export interface PosGiftCardPaymentInput {
  gift_card_code: string;
  amount?: string;
}

/** Split tender payment item. */
export interface PosSplitTenderItem {
  method: 'cash' | 'card' | 'terminal_card' | 'gift_card';
  amount: string;
  amount_tendered?: string;
  card_last_four?: string;
  card_reference?: string;
  gift_card_code?: string;
}

/** Terminal provider configuration. */
export interface TerminalProviderConfig {
  provider: string;
  is_configured: boolean;
  supports_cloud_payment: boolean;
  [key: string]: unknown;
}

/** Card reader device. */
export interface CardReader {
  id: string;
  label: string;
  status: string;
  device_type: string;
  [key: string]: unknown;
}

/** POS Checkout API: cash, card, terminal card, gift card, split tender payments. */
export class PosCheckoutModule {
  constructor(private http: HttpClient) {}

  /** Complete checkout with cash payment. */
  async cash(data: PosCashPaymentInput, opts?: RequestOptions): Promise<PosCheckoutResult> {
    return this.http.post('/api/pos/checkout/cash/', data, opts);
  }

  /** Complete checkout with manual card entry. */
  async card(data: PosCardPaymentInput, opts?: RequestOptions): Promise<PosCheckoutResult> {
    return this.http.post('/api/pos/checkout/card/', data, opts);
  }

  /** Complete checkout via integrated card terminal. */
  async terminalCard(opts?: RequestOptions): Promise<PosCheckoutResult> {
    return this.http.post('/api/pos/checkout/terminal-card/', undefined, opts);
  }

  /** Complete checkout with a gift card. */
  async giftCard(data: PosGiftCardPaymentInput, opts?: RequestOptions): Promise<PosCheckoutResult> {
    return this.http.post('/api/pos/checkout/gift-card/', data, opts);
  }

  /** Check a gift card balance. */
  async checkGiftCardBalance(code: string, opts?: RequestOptions): Promise<{ balance: string; currency: string }> {
    return this.http.get('/api/pos/checkout/gift-card/balance/', { code } as Record<string, unknown>, opts);
  }

  /** Complete checkout with split tender (multiple payment methods). */
  async splitTender(payments: PosSplitTenderItem[], opts?: RequestOptions): Promise<PosCheckoutResult> {
    return this.http.post('/api/pos/checkout/split/', { payments }, opts);
  }

  /** Integrated terminal provider sub-module. */
  readonly terminal = {
    /** Get terminal provider configuration. */
    getConfig: (opts?: RequestOptions): Promise<TerminalProviderConfig> =>
      this.http.get('/api/pos/terminal-provider/config/', undefined, opts),

    /** Get a connection token for the terminal SDK. */
    getConnectionToken: (opts?: RequestOptions): Promise<{ secret: string }> =>
      this.http.post('/api/pos/terminal-provider/connection-token/', undefined, opts),

    /** List connected card readers. */
    listReaders: (opts?: RequestOptions): Promise<CardReader[]> =>
      this.http.get('/api/pos/terminal-provider/readers/', undefined, opts),

    /** Create a payment intent for terminal processing. */
    createPaymentIntent: (data: { amount: string; currency?: string }, opts?: RequestOptions): Promise<{ client_secret: string; payment_intent_id: string }> =>
      this.http.post('/api/pos/terminal-provider/create-payment-intent/', data, opts),

    /** Capture a terminal payment. */
    capture: (paymentIntentId: string, opts?: RequestOptions): Promise<{ status: string }> =>
      this.http.post('/api/pos/terminal-provider/capture/', { payment_intent_id: paymentIntentId }, opts),

    /** Cancel a terminal payment. */
    cancel: (paymentIntentId: string, opts?: RequestOptions): Promise<{ status: string }> =>
      this.http.post('/api/pos/terminal-provider/cancel/', { payment_intent_id: paymentIntentId }, opts),

    /** Initiate a cloud-based card payment (server-driven). */
    initiateCloudPayment: (data: { reader_id: string; amount: string }, opts?: RequestOptions): Promise<{ transaction_id: string }> =>
      this.http.post('/api/pos/terminal-provider/initiate-cloud-payment/', data, opts),

    /** Get the status of a terminal payment. */
    getPaymentStatus: (transactionId: string, opts?: RequestOptions): Promise<{ status: string; details?: Record<string, unknown> }> =>
      this.http.get(`/api/pos/terminal-provider/payment-status/${transactionId}/`, undefined, opts),

    /** Cancel a cloud payment in progress. */
    cancelCloudPayment: (transactionId: string, opts?: RequestOptions): Promise<{ status: string }> =>
      this.http.post('/api/pos/terminal-provider/cancel-cloud-payment/', { transaction_id: transactionId }, opts),
  };
}
