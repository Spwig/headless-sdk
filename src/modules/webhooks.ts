/**
 * Webhook signature verification utility.
 *
 * Use this in your webhook handler to verify that incoming requests
 * are genuinely from your Spwig backend.
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
  // Parse the signature header: "t=<timestamp>,v1=<signature>"
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

  // Check timestamp tolerance (replay attack protection)
  const webhookTime = parseInt(timestamp, 10);
  if (isNaN(webhookTime)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - webhookTime) > toleranceSeconds) {
    return false;
  }

  // Compute expected signature: HMAC-SHA256(secret, "<timestamp>.<payload>")
  const signaturePayload = `${timestamp}.${payload}`;
  const expectedSignature = await hmacSha256Hex(secret, signaturePayload);

  // Constant-time comparison
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
  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_FULFILLED: 'order.fulfilled',
  ORDER_PARTIALLY_FULFILLED: 'order.partially_fulfilled',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  ORDER_NOTE_ADDED: 'order.note_added',

  // Payment events
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_PENDING: 'payment.pending',

  // Refund events
  REFUND_CREATED: 'refund.created',
  REFUND_COMPLETED: 'refund.completed',
  REFUND_FAILED: 'refund.failed',

  // Product events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',

  // Customer events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',

  // Inventory events
  INVENTORY_LOW_STOCK: 'inventory.low_stock',

  // Subscription events
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_ACTIVATED: 'subscription.activated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',

  // Test
  TEST: 'test.webhook',
} as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];

// --- Internal crypto helpers ---

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  // Use Web Crypto API (works in browser, Node 18+, Deno, edge runtimes)
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
