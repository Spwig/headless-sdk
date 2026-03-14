/**
 * Webhook utilities and management API.
 *
 * Includes signature verification for incoming webhooks and CRUD
 * management for webhook endpoints and deliveries.
 *
 * @example
 * ```typescript
 * import { verifyWebhookSignature } from '@spwig/sdk/webhooks';
 *
 * // In your webhook handler (e.g. Next.js API route)
 * export async function POST(req: Request) {
 *   const body = await req.text();
 *   const signature = req.headers.get('X-Spwig-Signature')!;
 *
 *   if (!verifyWebhookSignature(body, signature, process.env.WEBHOOK_SECRET!)) {
 *     return new Response('Invalid signature', { status: 401 });
 *   }
 *
 *   const event = JSON.parse(body);
 *   // Handle event...
 * }
 * ```
 */

import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

// --- Webhook Management Types ---

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  description: string;
  max_retries: number;
  timeout_seconds: number;
  consecutive_failures: number;
  is_disabled_by_failures: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
  /** Only returned once on creation. */
  secret?: string;
  [key: string]: unknown;
}

export interface CreateEndpointInput {
  name: string;
  url: string;
  events: string[];
  description?: string;
  is_active?: boolean;
  max_retries?: number;
  timeout_seconds?: number;
}

export interface UpdateEndpointInput {
  name?: string;
  url?: string;
  events?: string[];
  description?: string;
  is_active?: boolean;
  max_retries?: number;
  timeout_seconds?: number;
}

export interface WebhookDelivery {
  id: string;
  endpoint_id: string;
  endpoint_name: string;
  event_type: string;
  status: string;
  response_status_code: number | null;
  response_time_ms: number | null;
  attempt_count: number;
  created_at: string;
  delivered_at: string | null;
  /** Detail-only fields. */
  payload?: Record<string, unknown>;
  response_body?: string | null;
  response_headers?: Record<string, unknown> | null;
  error_message?: string | null;
  next_retry_at?: string | null;
  [key: string]: unknown;
}

export interface WebhookEventType {
  event: string;
  description: string;
  category: string;
}

export interface WebhookEndpointStats {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
  [key: string]: unknown;
}

/** Webhook management API: CRUD for endpoints and delivery tracking. */
export class WebhooksModule {
  constructor(private http: HttpClient) {}

  // --- Endpoint management ---

  /** List all webhook endpoints. */
  async listEndpoints(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<WebhookEndpoint>> {
    return this.http.get('/api/webhooks/endpoints/', params as Record<string, unknown>, opts);
  }

  /** Create a new webhook endpoint. */
  async createEndpoint(data: CreateEndpointInput, opts?: RequestOptions): Promise<WebhookEndpoint> {
    return this.http.post('/api/webhooks/endpoints/', data, opts);
  }

  /** Get a webhook endpoint by ID (UUID). */
  async getEndpoint(id: string, opts?: RequestOptions): Promise<WebhookEndpoint> {
    return this.http.get(`/api/webhooks/endpoints/${id}/`, undefined, opts);
  }

  /** Update a webhook endpoint. */
  async updateEndpoint(id: string, data: UpdateEndpointInput, opts?: RequestOptions): Promise<WebhookEndpoint> {
    return this.http.patch(`/api/webhooks/endpoints/${id}/`, data, opts);
  }

  /** Delete a webhook endpoint. */
  async deleteEndpoint(id: string, opts?: RequestOptions): Promise<void> {
    await this.http.delete(`/api/webhooks/endpoints/${id}/`, opts);
  }

  /** Send a test event to a webhook endpoint. */
  async testEndpoint(id: string, opts?: RequestOptions): Promise<{ success: boolean; status_code: number }> {
    return this.http.post(`/api/webhooks/endpoints/${id}/test/`, undefined, opts);
  }

  /** Rotate the signing secret for an endpoint. */
  async rotateSecret(id: string, opts?: RequestOptions): Promise<{ secret: string }> {
    return this.http.post(`/api/webhooks/endpoints/${id}/rotate-secret/`, undefined, opts);
  }

  /** Reset the failure count for an endpoint. */
  async resetFailures(id: string, opts?: RequestOptions): Promise<void> {
    await this.http.post(`/api/webhooks/endpoints/${id}/reset-failures/`, undefined, opts);
  }

  /** Get delivery statistics for an endpoint. */
  async getEndpointStats(id: string, opts?: RequestOptions): Promise<WebhookEndpointStats> {
    return this.http.get(`/api/webhooks/endpoints/${id}/stats/`, undefined, opts);
  }

  // --- Delivery tracking ---

  /** List webhook deliveries. */
  async listDeliveries(params?: PaginationParams & { endpoint?: string; status?: string }, opts?: RequestOptions): Promise<PaginatedResponse<WebhookDelivery>> {
    return this.http.get('/api/webhooks/deliveries/', params as Record<string, unknown>, opts);
  }

  /** Get a webhook delivery by ID (UUID). */
  async getDelivery(id: string, opts?: RequestOptions): Promise<WebhookDelivery> {
    return this.http.get(`/api/webhooks/deliveries/${id}/`, undefined, opts);
  }

  /** Retry a failed delivery. */
  async retryDelivery(id: string, opts?: RequestOptions): Promise<WebhookDelivery> {
    return this.http.post(`/api/webhooks/deliveries/${id}/retry/`, undefined, opts);
  }

  // --- Event types ---

  /** List all available webhook event types. */
  async listEvents(opts?: RequestOptions): Promise<WebhookEventType[]> {
    return this.http.get('/api/webhooks/events/', undefined, opts);
  }

  /** Get webhook API documentation. */
  async getDocs(opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get('/api/webhooks/docs/', undefined, opts);
  }
}

// --- Signature verification (standalone, no HttpClient needed) ---

/**
 * Verify a Spwig webhook signature.
 *
 * Spwig signs webhook payloads using HMAC-SHA256 with the format:
 *   X-Spwig-Signature: t=<unix_timestamp>,v1=<hmac_hex>
 *
 * The HMAC is computed as: HMAC-SHA256(secret, "<timestamp>.<payload>")
 *
 * @param payload   - The raw request body string (JSON)
 * @param signature - The value of the X-Spwig-Signature header
 * @param secret    - Your webhook endpoint's secret key
 * @param toleranceSeconds - Maximum age of the webhook in seconds (default: 300 = 5 min)
 * @returns true if the signature is valid and not expired
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  toleranceSeconds: number = 300,
): Promise<boolean> {
  const parts: Record<string, string> = {};
  for (const pair of signature.split(',')) {
    const [key, value] = pair.split('=', 2);
    if (key && value) {
      parts[key] = value;
    }
  }

  const timestamp = parts['t'];
  const v1 = parts['v1'];

  if (!timestamp || !v1) {
    return false;
  }

  const webhookTime = parseInt(timestamp, 10);
  if (isNaN(webhookTime)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - webhookTime) > toleranceSeconds) {
    return false;
  }

  const signaturePayload = `${timestamp}.${payload}`;
  const expectedSignature = await hmacSha256Hex(secret, signaturePayload);

  return timingSafeEqual(v1, expectedSignature);
}

/**
 * Parse webhook headers into a structured object.
 */
export function parseWebhookHeaders(headers: Record<string, string | undefined>): {
  signature: string | undefined;
  event: string | undefined;
  deliveryId: string | undefined;
  timestamp: string | undefined;
  isTest: boolean;
} {
  return {
    signature: headers['x-spwig-signature'] ?? headers['X-Spwig-Signature'],
    event: headers['x-spwig-event'] ?? headers['X-Spwig-Event'],
    deliveryId: headers['x-spwig-delivery-id'] ?? headers['X-Spwig-Delivery-Id'],
    timestamp: headers['x-spwig-timestamp'] ?? headers['X-Spwig-Timestamp'],
    isTest: (headers['x-spwig-test'] ?? headers['X-Spwig-Test']) === 'true',
  };
}

/** Known webhook event types. */
export const WEBHOOK_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_FULFILLED: 'order.fulfilled',
  ORDER_PARTIALLY_FULFILLED: 'order.partially_fulfilled',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  ORDER_NOTE_ADDED: 'order.note_added',
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_PENDING: 'payment.pending',
  REFUND_CREATED: 'refund.created',
  REFUND_COMPLETED: 'refund.completed',
  REFUND_FAILED: 'refund.failed',
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  INVENTORY_LOW_STOCK: 'inventory.low_stock',
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_ACTIVATED: 'subscription.activated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  TEST: 'test.webhook',
} as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];

// --- Internal crypto helpers ---

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
