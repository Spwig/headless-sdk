# Spwig Webhook Integration — AI Context

You are integrating Spwig webhooks into a headless storefront's backend.
Webhooks let your server react to events (order placed, payment received, stock changes, etc.).

## Setup: Create a Webhook Endpoint

```
POST /api/webhooks/endpoints/
Authorization: Token <admin_token>
Content-Type: application/json

{
  "url": "https://your-server.com/webhooks/spwig",
  "events": ["order.created", "order.paid", "payment.received"],
  "is_active": true
}

→ 201 { "id": "uuid", "url": "...", "events": [...], "secret": "whsec_...", "is_active": true }
```

Save the `secret` — you need it to verify signatures.

## Available Event Types

**Order**: `order.created`, `order.paid`, `order.cancelled`, `order.fulfilled`, `order.partially_fulfilled`, `order.status_changed`, `order.note_added`
**Payment**: `payment.received`, `payment.failed`, `payment.pending`
**Refund**: `refund.created`, `refund.completed`, `refund.failed`
**Product**: `product.created`, `product.updated`, `product.deleted`
**Customer**: `customer.created`, `customer.updated`
**Inventory**: `inventory.low_stock`
**Subscription**: `subscription.created`, `subscription.activated`, `subscription.cancelled`
**Shipment**: `shipment.created`, `shipment.shipped`, `shipment.in_transit`, `shipment.out_for_delivery`, `shipment.delivered`
**Wildcard**: `*` (subscribe to all events)

## Webhook Payload Format

```json
{
  "event": "order.created",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "id": 123,
    "order_number": "ORD-00123",
    "status": "pending",
    "total": "149.99",
    "currency": "EUR",
    "items": [...]
  }
}
```

## Webhook Headers

```
Content-Type: application/json; charset=utf-8
X-Spwig-Signature: t=1705312200,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
X-Spwig-Event: order.created
X-Spwig-Delivery-Id: 550e8400-e29b-41d4-a716-446655440000
X-Spwig-Timestamp: 1705312200
User-Agent: Spwig-Webhooks/1.0
```

## Signature Verification

Algorithm: `HMAC-SHA256(secret, "<timestamp>.<json_body>")`
Header format: `X-Spwig-Signature: t=<unix_timestamp>,v1=<hex_digest>`

### Using @spwig/sdk (recommended)

```typescript
import { verifyWebhookSignature, parseWebhookHeaders } from '@spwig/sdk/webhooks';

// Next.js App Router API route
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('X-Spwig-Signature')!;

  const isValid = await verifyWebhookSignature(body, signature, process.env.WEBHOOK_SECRET!);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const { event } = parseWebhookHeaders(Object.fromEntries(req.headers));
  const payload = JSON.parse(body);

  switch (event) {
    case 'order.created':
      await handleNewOrder(payload.data);
      break;
    case 'order.paid':
      await handlePaymentConfirmed(payload.data);
      break;
    case 'inventory.low_stock':
      await sendLowStockAlert(payload.data);
      break;
  }

  return new Response('OK', { status: 200 });
}
```

### Manual Verification (Node.js)

```typescript
import crypto from 'node:crypto';

function verifySignature(body: string, signatureHeader: string, secret: string): boolean {
  const parts: Record<string, string> = {};
  for (const pair of signatureHeader.split(',')) {
    const [k, v] = pair.split('=', 2);
    parts[k] = v;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${parts.t}.${body}`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected));
}
```

## Retry Behavior

- **Max retries**: 5
- **Backoff**: Exponential — 1min, 2min, 4min, 8min, 16min (capped at 60min)
- **Timeout**: 30 seconds per delivery attempt
- **Auto-disable**: Endpoint disabled after too many consecutive failures
- Your handler should return 2xx within 30 seconds

## Testing Webhooks

```
POST /api/webhooks/endpoints/{uuid}/test/
Authorization: Token <admin_token>

→ Sends a test.webhook event to your endpoint
```

## Managing Endpoints

```
GET    /api/webhooks/endpoints/                    → list all
PATCH  /api/webhooks/endpoints/{uuid}/             → update (url, events, is_active)
DELETE /api/webhooks/endpoints/{uuid}/             → delete
POST   /api/webhooks/endpoints/{uuid}/rotate-secret/ → new secret
POST   /api/webhooks/endpoints/{uuid}/reset-failures/ → reset failure counter
GET    /api/webhooks/endpoints/{uuid}/stats/       → delivery statistics
GET    /api/webhooks/deliveries/                   → delivery logs
POST   /api/webhooks/deliveries/{uuid}/retry/      → retry failed delivery
```
