# Orders

This chapter covers retrieving order history, viewing order details, understanding order statuses, tracking shipments, and creating return requests.

All order endpoints require authentication. The customer can only access their own orders.

---

## List Order History

Fetch a paginated list of the customer's orders, newest first.

```typescript
const orders = await spwig.orders.list({ page: 1, page_size: 10 });

console.log(orders.count);    // 42 (total orders)
console.log(orders.results);  // Order[] (current page)
console.log(orders.next);     // URL to next page, or null
console.log(orders.previous); // URL to previous page, or null
```

### Filtering by Status

```typescript
const pendingOrders = await spwig.orders.list({
  status: 'pending',
  page: 1,
});
```

### Sorting

Use the `ordering` parameter. Prefix with `-` for descending order.

```typescript
// Oldest first
const oldestFirst = await spwig.orders.list({ ordering: 'created_at' });

// Newest first (default)
const newestFirst = await spwig.orders.list({ ordering: '-created_at' });
```

### Pagination Example

```typescript
async function loadAllOrders(): Promise<Order[]> {
  const allOrders: Order[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await spwig.orders.list({ page, page_size: 20 });
    allOrders.push(...response.results);
    hasMore = response.next !== null;
    page++;
  }

  return allOrders;
}
```

---

## Get Order Details

Fetch full details for a single order including items, addresses, and tracking.

```typescript
const order = await spwig.orders.get(orderId);
```

**Response shape:**

```typescript
interface Order {
  id: number;
  order_number: string;
  status: string;
  subtotal: string;
  shipping_cost: string;
  tax: string;
  discount: string;
  total: string;
  currency: string;
  items: OrderItem[];
  shipping_address: OrderAddress | null;
  billing_address: OrderAddress | null;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  variant_name: string | null;
  sku: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

interface OrderAddress {
  name: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}
```

### Example: Order Confirmation Page

```typescript
import { SpwigClient } from '@spwig/sdk';

async function renderOrderConfirmation(orderId: number) {
  const order = await spwig.orders.get(orderId);

  return {
    orderNumber: order.order_number,
    status: order.status,
    items: order.items.map(item => ({
      name: item.product_name,
      variant: item.variant_name,
      quantity: item.quantity,
      price: `${order.currency} ${item.total_price}`,
      image: item.product_image,
      productUrl: `/products/${item.product_slug}`,
    })),
    totals: {
      subtotal: `${order.currency} ${order.subtotal}`,
      shipping: `${order.currency} ${order.shipping_cost}`,
      tax: `${order.currency} ${order.tax}`,
      discount: order.discount !== '0.00' ? `- ${order.currency} ${order.discount}` : null,
      total: `${order.currency} ${order.total}`,
    },
    shippingAddress: order.shipping_address,
    tracking: order.tracking_number ? {
      number: order.tracking_number,
      url: order.tracking_url,
    } : null,
    placedAt: new Date(order.created_at),
  };
}
```

---

## Order Statuses

Orders progress through the following statuses:

| Status | Description |
|--------|-------------|
| `pending` | Order has been placed but not yet processed. This is the initial status after checkout. |
| `processing` | The merchant has acknowledged the order and is preparing it for shipment. |
| `shipped` | The order has been shipped. A tracking number may be available. |
| `delivered` | The order has been delivered to the customer. |
| `cancelled` | The order was cancelled (by the customer or the merchant). |
| `refunded` | The order has been refunded. |

### Status Flow Diagram

```
pending --> processing --> shipped --> delivered
  |             |
  |             v
  +--------> cancelled
                |
                v
             refunded
```

### Displaying Status to Customers

```typescript
function getStatusDisplay(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Order Placed', color: '#f59e0b' },
    processing: { label: 'Processing', color: '#3b82f6' },
    shipped: { label: 'Shipped', color: '#8b5cf6' },
    delivered: { label: 'Delivered', color: '#10b981' },
    cancelled: { label: 'Cancelled', color: '#ef4444' },
    refunded: { label: 'Refunded', color: '#6b7280' },
  };
  return statusMap[status] ?? { label: status, color: '#6b7280' };
}
```

---

## Tracking Information

When an order has been shipped, the `tracking_number` and optionally `tracking_url` fields are populated.

```typescript
const order = await spwig.orders.get(orderId);

if (order.tracking_number) {
  console.log(`Track your order: ${order.tracking_number}`);
  if (order.tracking_url) {
    // Direct link to carrier tracking page
    console.log(`Tracking page: ${order.tracking_url}`);
  }
}
```

### Example: Tracking Component

```typescript
interface TrackingInfo {
  hasTracking: boolean;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;
}

function getTrackingInfo(order: Order): TrackingInfo {
  return {
    hasTracking: !!order.tracking_number,
    trackingNumber: order.tracking_number,
    trackingUrl: order.tracking_url,
    carrier: null, // Carrier name available from the shipping method at checkout
  };
}
```

---

## Return Requests

Customers can create return requests for delivered orders.

### List Return Requests

```typescript
const returns = await spwig.orders.listReturns({ page: 1 });

for (const ret of returns.results) {
  console.log(`Return #${ret.id} for order #${ret.order} - Status: ${ret.status}`);
}
```

### Create a Return Request

```typescript
const returnRequest = await spwig.orders.createReturn({
  order: orderId,
  reason: 'Item arrived damaged',
  items: [
    {
      order_item: itemId,     // ID of the OrderItem
      quantity: 1,            // How many to return
      reason: 'Cracked screen',
    },
  ],
});

console.log(returnRequest.id);     // Return request ID
console.log(returnRequest.status); // "pending"
```

### Get a Return Request

```typescript
const returnRequest = await spwig.orders.getReturn(returnId);
```

**Response shape:**

```typescript
interface ReturnRequest {
  id: number;
  order: number;
  reason: string;
  status: string;
  items: Array<{
    order_item: number;
    quantity: number;
    reason: string;
  }>;
  created_at: string;
}
```

### Example: Return Request Form

```typescript
async function submitReturn(
  orderId: number,
  selectedItems: Array<{ itemId: number; quantity: number; reason: string }>,
  overallReason: string,
) {
  try {
    const returnRequest = await spwig.orders.createReturn({
      order: orderId,
      reason: overallReason,
      items: selectedItems.map(item => ({
        order_item: item.itemId,
        quantity: item.quantity,
        reason: item.reason,
      })),
    });

    return {
      success: true,
      returnId: returnRequest.id,
      message: `Return request #${returnRequest.id} submitted successfully.`,
    };

  } catch (error) {
    if (error instanceof SpwigValidationError) {
      return { success: false, errors: error.fieldErrors };
    }
    throw error;
  }
}
```

---

## Raw API Reference

All endpoints require authentication. Prefix: `/api/` (no language prefix).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/` | List orders (paginated). Params: `page`, `page_size`, `status`, `ordering`, `search` |
| GET | `/api/orders/{id}/` | Get order details |
| GET | `/api/return-requests/` | List return requests (paginated) |
| POST | `/api/return-requests/` | Create a return request |
| GET | `/api/return-requests/{id}/` | Get return request details |
