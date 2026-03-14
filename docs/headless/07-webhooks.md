# Webhooks

Webhooks let your headless frontend's server-side code (or any external system) receive real-time notifications when events happen in the Spwig backend. Instead of polling for changes, Spwig pushes data to your endpoints via HTTP POST.

---

## Why Webhooks Matter for Headless

In a headless architecture, your frontend and backend are decoupled. Webhooks bridge that gap by notifying your server when:

- An order is placed, paid, or shipped
- A payment succeeds or fails
- Inventory drops below threshold
- A customer registers
- A subscription is renewed or cancelled

Common use cases:
- Send transactional emails from your own email service
- Update a search index when products change
- Sync orders to an ERP or fulfillment system
- Trigger a static site rebuild when content changes
- Update real-time dashboards

---

## Setting Up Webhook Endpoints

### Create an Endpoint via API

```
POST /api/webhooks/endpoints/
Authorization: Token <admin_token>
Content-Type: application/json

{
  "name": "My Order Handler",
  "url": "https://myapp.example.com/api/webhooks/spwig",
  "events": ["order.created", "order.paid", "order.fulfilled"],
  "description": "Handles order lifecycle events"
}
```

**Response:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "My Order Handler",
  "url": "https://myapp.example.com/api/webhooks/spwig",
  "secret": "a4f8e2c9b1d3e5f7...",
  "events": ["order.created", "order.paid", "order.fulfilled"],
  "is_active": true,
  "max_retries": 5,
  "timeout_seconds": 30,
  "created_at": "2026-01-15T10:00:00Z"
}
```

Save the `secret` -- you will need it to verify incoming webhook signatures.

### Manage Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/webhooks/endpoints/` | List all endpoints |
| POST | `/api/webhooks/endpoints/` | Create new endpoint |
| GET | `/api/webhooks/endpoints/{id}/` | Get endpoint details |
| PUT | `/api/webhooks/endpoints/{id}/` | Update endpoint |
| DELETE | `/api/webhooks/endpoints/{id}/` | Delete endpoint |
| POST | `/api/webhooks/endpoints/{id}/test/` | Send a test webhook |
| POST | `/api/webhooks/endpoints/{id}/rotate-secret/` | Rotate the signing secret |
| POST | `/api/webhooks/endpoints/{id}/reset-failures/` | Reset failure counter |
| GET | `/api/webhooks/endpoints/{id}/stats/` | Get delivery statistics |

### Subscribe to All Events

Use the wildcard `*` to receive every event:

```json
{
  "name": "Catch-All",
  "url": "https://myapp.example.com/webhooks",
  "events": ["*"]
}
```

---

## Available Event Types

### Order Events

| Event | Description |
|-------|-------------|
| `order.created` | A new order is placed |
| `order.paid` | Payment for an order is confirmed |
| `order.cancelled` | An order is cancelled |
| `order.fulfilled` | All items in an order are shipped |
| `order.partially_fulfilled` | Some items in an order are shipped |
| `order.status_changed` | Order status changes (any transition) |
| `order.note_added` | A note is added to an order |

### Payment Events

| Event | Description |
|-------|-------------|
| `payment.received` | A payment is received |
| `payment.failed` | A payment attempt fails |
| `payment.pending` | A payment is pending confirmation |

### Refund Events

| Event | Description |
|-------|-------------|
| `refund.created` | A refund is initiated |
| `refund.completed` | A refund is completed |
| `refund.failed` | A refund fails |

### Shipment Events

| Event | Description |
|-------|-------------|
| `shipment.created` | A shipment is created |
| `shipment.shipped` | A shipment is dispatched |
| `shipment.in_transit` | A shipment is in transit |
| `shipment.out_for_delivery` | A shipment is out for delivery |
| `shipment.delivered` | A shipment is delivered |
| `shipment.failed` | A shipment delivery fails |
| `shipment.returned` | A shipment is returned |
| `shipment.tracking_updated` | Tracking information is updated |

### Inventory Events

| Event | Description |
|-------|-------------|
| `inventory.low_stock` | Product stock falls below threshold |
| `inventory.out_of_stock` | A product goes out of stock |
| `inventory.restocked` | A product is restocked |
| `inventory.adjusted` | Inventory is manually adjusted |

### Product Events

| Event | Description |
|-------|-------------|
| `product.created` | A new product is created |
| `product.updated` | Product details are updated |
| `product.deleted` | A product is deleted |
| `product.published` | A product is published |
| `product.unpublished` | A product is unpublished |

### Customer Events

| Event | Description |
|-------|-------------|
| `customer.created` | A new customer registers |
| `customer.updated` | Customer profile is updated |
| `customer.deleted` | A customer account is deleted |

### Subscription Events

| Event | Description |
|-------|-------------|
| `subscription.created` | A new subscription is created |
| `subscription.activated` | A subscription is activated |
| `subscription.renewed` | A subscription is renewed |
| `subscription.cancelled` | A subscription is cancelled |
| `subscription.expired` | A subscription expires |
| `subscription.paused` | A subscription is paused |
| `subscription.resumed` | A paused subscription is resumed |
| `subscription.payment_failed` | A subscription payment fails |

### Cart Events

| Event | Description |
|-------|-------------|
| `cart.abandoned` | A cart is abandoned (after configurable delay) |
| `cart.recovered` | An abandoned cart is recovered |

### List Events via API

```
GET /api/webhooks/events/
```

Returns all event types grouped by category.

---

## Signature Verification

Every webhook request is signed using HMAC-SHA256 so you can verify it came from your Spwig backend.

### Signature Header Format

```
X-Spwig-Signature: t=1706000000,v1=5a2f3b4c...
```

Where:
- `t` is the Unix timestamp when the webhook was sent
- `v1` is the HMAC-SHA256 hex digest

### How the Signature is Computed

```
signature = HMAC-SHA256(secret, "<timestamp>.<json_payload>")
```

The message to sign is the timestamp, a literal dot character, and the raw JSON payload body concatenated together.

### Verification with the SDK

The `@spwig/sdk/webhooks` module provides a `verifyWebhookSignature` helper:

```typescript
import { verifyWebhookSignature } from '@spwig/sdk/webhooks';

const isValid = await verifyWebhookSignature(
  rawBody,     // The raw request body string
  signature,   // Value of the X-Spwig-Signature header
  secret,      // Your endpoint's secret key
  300,         // Tolerance in seconds (default: 300 = 5 minutes)
);
```

The tolerance parameter protects against replay attacks. If the timestamp in the signature is older than the tolerance, verification fails even if the HMAC is correct.

### All Webhook Headers

| Header | Description |
|--------|-------------|
| `X-Spwig-Signature` | `t={timestamp},v1={hmac_hex}` -- HMAC-SHA256 signature |
| `X-Spwig-Event` | Event type (e.g., `order.created`) |
| `X-Spwig-Delivery-Id` | Unique ID for this delivery attempt (UUID) |
| `X-Spwig-Timestamp` | Unix timestamp (same as `t` in the signature) |
| `X-Spwig-Test` | `"true"` if this is a test webhook |
| `User-Agent` | `Spwig-Webhooks/1.0` |
| `Content-Type` | `application/json; charset=utf-8` |

---

## Retry Behavior

If your endpoint returns a non-2xx status code or times out, Spwig retries the delivery.

| Attempt | Delay After Failure |
|---------|-------------------|
| 1st retry | ~1 minute |
| 2nd retry | ~2 minutes |
| 3rd retry | ~4 minutes |
| 4th retry | ~8 minutes |
| 5th retry | ~16 minutes |

Retries use exponential backoff with jitter. The maximum delay is capped at 60 minutes. After 5 failed retries, the delivery is marked as permanently failed.

If an endpoint accumulates 10 consecutive failures (across any deliveries), it is automatically disabled. You can re-enable it via the API:

```
POST /api/webhooks/endpoints/{id}/reset-failures/
```

### What Counts as Success

Any HTTP 2xx status code (200, 201, 202, 204, etc.) counts as a successful delivery. Your endpoint must respond within the configured timeout (default: 30 seconds).

---

## Example: Next.js Webhook Handler

Here is a complete webhook handler for a Next.js App Router API route:

```typescript
// app/api/webhooks/spwig/route.ts
import { verifyWebhookSignature, parseWebhookHeaders } from '@spwig/sdk/webhooks';

const WEBHOOK_SECRET = process.env.SPWIG_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  // 1. Read the raw body
  const body = await req.text();

  // 2. Parse headers
  const headers = Object.fromEntries(req.headers.entries());
  const { signature, event, deliveryId, isTest } = parseWebhookHeaders(headers);

  // 3. Verify signature
  if (!signature || !await verifyWebhookSignature(body, signature, WEBHOOK_SECRET)) {
    console.error('Webhook signature verification failed');
    return new Response('Invalid signature', { status: 401 });
  }

  // 4. Parse the payload
  const payload = JSON.parse(body);
  console.log(`Received webhook: ${event} (delivery: ${deliveryId})`);

  // 5. Handle test webhooks
  if (isTest) {
    console.log('Test webhook received successfully');
    return new Response('OK', { status: 200 });
  }

  // 6. Route by event type
  try {
    switch (event) {
      case 'order.created':
        await handleOrderCreated(payload);
        break;
      case 'order.paid':
        await handleOrderPaid(payload);
        break;
      case 'order.fulfilled':
        await handleOrderFulfilled(payload);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      case 'inventory.low_stock':
        await handleLowStock(payload);
        break;
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error(`Error handling webhook ${event}:`, error);
    // Return 500 to trigger a retry
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function handleOrderCreated(payload: any) {
  const order = payload.data;
  // Send order confirmation email, notify fulfillment system, etc.
  console.log(`New order: ${order.order_number} - ${order.total} ${order.currency}`);
}

async function handleOrderPaid(payload: any) {
  const order = payload.data;
  // Trigger fulfillment workflow
  console.log(`Order paid: ${order.order_number}`);
}

async function handleOrderFulfilled(payload: any) {
  const order = payload.data;
  // Send shipping notification to customer
  console.log(`Order fulfilled: ${order.order_number}`);
}

async function handlePaymentFailed(payload: any) {
  // Notify customer about failed payment
  console.log(`Payment failed for order: ${payload.data.order_number}`);
}

async function handleLowStock(payload: any) {
  // Alert the merchandising team
  console.log(`Low stock: ${payload.data.product_name} (${payload.data.current_stock} remaining)`);
}
```

---

## Testing Webhooks

### Send a Test Webhook

```
POST /api/webhooks/endpoints/{id}/test/
Authorization: Token <admin_token>
```

This sends a test payload to your endpoint with the `X-Spwig-Test: true` header. The payload looks like:

```json
{
  "event": "test.webhook",
  "data": {
    "message": "This is a test webhook from Spwig",
    "timestamp": "2026-01-15T10:00:00Z",
    "endpoint_id": "a1b2c3d4-...",
    "endpoint_name": "My Order Handler"
  }
}
```

### View Delivery Logs

```
GET /api/webhooks/deliveries/
```

Returns a paginated list of all delivery attempts with status, response codes, and timing.

```
GET /api/webhooks/deliveries/{id}/
```

Returns full details for a single delivery including the payload, response body, and error messages.

### Retry a Failed Delivery

```
POST /api/webhooks/deliveries/{id}/retry/
```

Manually re-queue a failed delivery for another attempt.

---

## Webhook Payload Structure

All webhook payloads follow this structure:

```json
{
  "event": "order.created",
  "data": {
    // Event-specific data (serialized model)
  },
  "timestamp": "2026-01-15T10:30:00Z"
}
```

The `data` field contains the serialized resource relevant to the event. For example, an `order.created` event includes the full order object with items, addresses, and totals.

All IDs in webhook payloads are UUID strings (not integers).

---

## Webhook Management via SDK

The SDK provides a full `spwig.webhooks` module for programmatic endpoint and delivery management. This requires admin authentication.

### Endpoint CRUD

```typescript
// List endpoints
const endpoints = await spwig.webhooks.listEndpoints();

// Create an endpoint
const endpoint = await spwig.webhooks.createEndpoint({
  name: 'Order Handler',
  url: 'https://myapp.com/webhooks/spwig',
  events: ['order.created', 'order.paid'],
  description: 'Handles order lifecycle',
  max_retries: 5,
  timeout_seconds: 30,
});
// IMPORTANT: endpoint.secret is only returned on creation -- save it now

// Get, update, delete
const detail = await spwig.webhooks.getEndpoint(endpointId);
await spwig.webhooks.updateEndpoint(endpointId, { events: ['*'], is_active: true });
await spwig.webhooks.deleteEndpoint(endpointId);
```

### Endpoint Operations

```typescript
// Send a test event
const result = await spwig.webhooks.testEndpoint(endpointId);

// Rotate signing secret (invalidates the old one)
const { secret } = await spwig.webhooks.rotateSecret(endpointId);

// Reset failure counter (re-enables auto-disabled endpoints)
await spwig.webhooks.resetFailures(endpointId);

// Get delivery statistics
const stats = await spwig.webhooks.getEndpointStats(endpointId);
// { total_deliveries, successful_deliveries, failed_deliveries, success_rate }
```

### Delivery Tracking

```typescript
// List deliveries with optional filters
const deliveries = await spwig.webhooks.listDeliveries({
  endpoint: endpointId,
  status: 'failed',
});

// Get delivery details (includes payload, response body, error messages)
const delivery = await spwig.webhooks.getDelivery(deliveryId);

// Retry a failed delivery
await spwig.webhooks.retryDelivery(deliveryId);
```

### Event Discovery

```typescript
// List all available event types
const events = await spwig.webhooks.listEvents();
// [{ event: 'order.created', description: '...', category: 'order' }, ...]

// Get webhook API documentation
const docs = await spwig.webhooks.getDocs();
```
