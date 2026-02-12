# Nuxt 3 Example

Complete examples for building a headless Spwig storefront with Nuxt 3.

## Setup

```bash
npx nuxi@latest init my-store && cd my-store
npm install @spwig/sdk @nuxt/image @stripe/stripe-js nuxt-simple-sitemap
```

## Environment Variables

```bash
# .env
NUXT_PUBLIC_SPWIG_URL=https://example.com
NUXT_SPWIG_URL=https://example.com          # Internal URL for server-side
WEBHOOK_SECRET=your-webhook-secret
NUXT_PUBLIC_STRIPE_KEY=pk_live_xxxx
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    spwigUrl: process.env.NUXT_SPWIG_URL || 'https://example.com',
    webhookSecret: process.env.WEBHOOK_SECRET || '',
    public: {
      spwigUrl: process.env.NUXT_PUBLIC_SPWIG_URL || 'https://example.com',
      stripeKey: process.env.NUXT_PUBLIC_STRIPE_KEY || '',
    },
  },
});
```

## SDK Composable

```typescript
// composables/useSpwig.ts
import { SpwigClient } from '@spwig/sdk';
let clientInstance: SpwigClient | null = null;

export function useSpwig(): SpwigClient {
  const config = useRuntimeConfig();
  if (import.meta.server) {
    const token = useCookie('spwig_token').value ?? undefined;
    return new SpwigClient({ baseUrl: config.spwigUrl as string, token });
  }
  if (!clientInstance) {
    const token = useCookie('spwig_token').value ?? undefined;
    clientInstance = new SpwigClient({
      baseUrl: config.public.spwigUrl, token,
      onUnauthorized: () => { useCookie('spwig_token').value = null; navigateTo('/login'); },
    });
  }
  return clientInstance;
}
```

## Product Listing Page

```vue
<!-- pages/products/index.vue -->
<script setup lang="ts">
const route = useRoute();
const spwig = useSpwig();
const page = computed(() => Number(route.query.page) || 1);
const category = computed(() => route.query.category as string | undefined);
const { data: products, status } = await useAsyncData(
  `products-${page.value}-${category.value}`,
  () => spwig.catalog.products.list({ page: page.value, category: category.value }),
  { watch: [page, category] },
);
</script>
<template>
  <div>
    <h1>Products</h1>
    <div v-if="status === 'pending'" class="grid grid-cols-3 gap-4">
      <ProductCardSkeleton v-for="i in 9" :key="i" />
    </div>
    <div v-else class="grid grid-cols-3 gap-4">
      <NuxtLink v-for="product in products?.results" :key="product.id"
        :to="`/products/${product.slug}`" class="border rounded p-4">
        <ProductImage v-if="product.images?.[0]" :image="product.images[0]" />
        <h2>{{ product.name }}</h2>
        <p>{{ product.currency }} {{ product.price }}</p>
      </NuxtLink>
    </div>
    <div class="flex gap-2 mt-4">
      <NuxtLink v-if="products?.previous" :to="{ query: { ...route.query, page: page - 1 } }">Previous</NuxtLink>
      <NuxtLink v-if="products?.next" :to="{ query: { ...route.query, page: page + 1 } }">Next</NuxtLink>
    </div>
  </div>
</template>
```

## Product Detail Page

```vue
<!-- pages/products/[slug].vue -->
<script setup lang="ts">
import { SpwigValidationError } from '@spwig/sdk';
const route = useRoute();
const config = useRuntimeConfig();
const spwig = useSpwig();
const { data: product } = await useAsyncData(
  `product-${route.params.slug}`,
  () => spwig.catalog.products.get(route.params.slug as string),
);
useSeoMeta({
  title: () => product.value?.name ?? 'Product',
  description: () => product.value?.description?.replace(/<[^>]+>/g, '').slice(0, 160) ?? '',
  ogTitle: () => product.value?.name ?? '',
  ogImage: () => product.value?.images?.[0]?.image ?? '',
  ogType: 'product', twitterCard: 'summary_large_image',
});
useHead({ link: [{ rel: 'canonical', href: `${config.public.spwigUrl}/products/${route.params.slug}` }] });

const loading = ref(false);
const error = ref<string>();
const added = ref(false);
async function addToCart() {
  if (!product.value) return;
  loading.value = true; error.value = undefined;
  try {
    await spwig.cart.add({ product_id: product.value.id, quantity: 1 });
    added.value = true; setTimeout(() => (added.value = false), 3000);
  } catch (err) {
    error.value = err instanceof SpwigValidationError
      ? Object.values(err.fieldErrors).flat().join(', ') : 'Failed to add to cart';
  } finally { loading.value = false; }
}
</script>
<template>
  <ProductJsonLd v-if="product" :product="product">
    <ProductGallery v-if="product.images?.length" :images="product.images" />
    <h1>{{ product.name }}</h1>
    <p class="text-2xl">{{ product.currency }} {{ product.price }}</p>
    <div v-html="product.description" />
    <button @click="addToCart" :disabled="loading">
      {{ loading ? 'Adding...' : added ? 'Added!' : 'Add to Cart' }}
    </button>
    <p v-if="error" class="text-red-500">{{ error }}</p>
  </ProductJsonLd>
</template>
```

## SEO Metadata

### JSON-LD Structured Data

```vue
<!-- components/ProductJsonLd.vue -->
<script setup lang="ts">
import type { Product } from '@spwig/sdk';
const props = defineProps<{ product: Product }>();
const config = useRuntimeConfig();
useHead({ script: [{ type: 'application/ld+json', innerHTML: computed(() => JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Product',
  name: props.product.name,
  description: props.product.description?.replace(/<[^>]+>/g, ''),
  image: props.product.images?.map(img => img.image) ?? [],
  sku: props.product.sku,
  brand: props.product.brand ? { '@type': 'Brand', name: props.product.brand.name } : undefined,
  offers: { '@type': 'Offer',
    url: `${config.public.spwigUrl}/products/${props.product.slug}`,
    priceCurrency: props.product.currency, price: props.product.price,
    availability: props.product.is_available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
  },
}))}] });
</script>
<template><slot /></template>
```

### Sitemap Generation

```typescript
// server/api/__sitemap__/urls.ts
import { SpwigClient } from '@spwig/sdk';
import { defineSitemapEventHandler } from '#imports';

export default defineSitemapEventHandler(async () => {
  const spwig = new SpwigClient({ baseUrl: useRuntimeConfig().spwigUrl as string });
  const urls: Array<{ loc: string; priority?: number }> = [];
  let page = 1; let hasNext = true;
  while (hasNext) {
    const r = await spwig.catalog.products.list({ page });
    for (const p of r.results) urls.push({ loc: `/products/${p.slug}`, priority: 0.8 });
    hasNext = !!r.next; page++;
  }
  const cats = await spwig.catalog.categories.list();
  for (const c of cats.results) urls.push({ loc: `/categories/${c.slug}`, priority: 0.6 });
  return urls;
});
```

## Image Optimization

```typescript
// nuxt.config.ts (merge into existing config)
export default defineNuxtConfig({
  modules: ['@nuxt/image'],
  image: {
    domains: ['example.com'],  // your Spwig domain
    provider: 'ipx',
    screens: { xs: 320, sm: 640, md: 768, lg: 1024, xl: 1280 },
  },
});
```

```vue
<!-- components/ProductImage.vue -->
<script setup lang="ts">
import type { ProductImage as ProductImageType } from '@spwig/sdk';
withDefaults(defineProps<{
  image: ProductImageType; sizes?: string; loading?: 'lazy' | 'eager';
}>(), { sizes: 'xs:100vw sm:50vw md:33vw lg:25vw', loading: 'lazy' });
</script>
<template>
  <NuxtImg :src="image.image" :alt="image.alt_text || 'Product image'"
    :sizes="sizes" :loading="loading" quality="80" format="webp" placeholder />
</template>
```

```vue
<!-- components/ProductGallery.vue -->
<script setup lang="ts">
import type { ProductImage } from '@spwig/sdk';
const props = defineProps<{ images: ProductImage[] }>();
const idx = ref(0);
const active = computed(() => props.images[idx.value] ?? props.images[0]);
</script>
<template>
  <div class="flex flex-col gap-4">
    <NuxtImg :src="active.image" :alt="active.alt_text || 'Product'" sizes="md:100vw lg:50vw"
      loading="eager" quality="85" format="webp" placeholder class="w-full rounded-lg" />
    <div class="flex gap-2 overflow-x-auto">
      <button v-for="(img, i) in images" :key="img.id" @click="idx = i"
        :class="['border-2 rounded', i === idx ? 'border-black' : 'border-transparent']">
        <NuxtImg :src="img.image" :alt="img.alt_text" width="80" height="80"
          loading="lazy" quality="60" format="webp" class="w-20 h-20 object-cover rounded" />
      </button>
    </div>
  </div>
</template>
```

## Cart Page

```vue
<!-- pages/cart.vue -->
<script setup lang="ts">
const { cart, updateQuantity, removeItem, fetchCart } = useCart();
onMounted(fetchCart);
</script>
<template>
  <div>
    <h1>Shopping Cart</h1>
    <p v-if="!cart">Loading...</p>
    <p v-else-if="cart.items.length === 0">Your cart is empty.</p>
    <div v-else>
      <div v-for="item in cart.items" :key="item.id" class="flex justify-between py-3 border-b">
        <div>
          <p class="font-semibold">{{ item.product_name }}</p>
          <p>{{ item.currency }} {{ item.unit_price }} x {{ item.quantity }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="updateQuantity(item.id, item.quantity - 1)">-</button>
          <span>{{ item.quantity }}</span>
          <button @click="updateQuantity(item.id, item.quantity + 1)">+</button>
          <button @click="removeItem(item.id)" class="text-red-500">Remove</button>
        </div>
      </div>
      <p class="mt-4 text-xl font-bold">Total: {{ cart.currency }} {{ cart.total }}</p>
      <NuxtLink to="/checkout" class="mt-4 inline-block bg-black text-white px-6 py-2 rounded">Checkout</NuxtLink>
    </div>
  </div>
</template>
```

## Loading States

```vue
<!-- app.vue -->
<template>
  <NuxtLoadingIndicator color="#000" :height="3" :throttle="200" />
  <NuxtLayout><NuxtPage /></NuxtLayout>
</template>
```

```vue
<!-- components/ProductCardSkeleton.vue -->
<template>
  <div class="border rounded p-4 animate-pulse">
    <div class="bg-gray-200 rounded-lg w-full aspect-square mb-4" />
    <div class="bg-gray-200 h-5 rounded w-3/4 mb-2" />
    <div class="bg-gray-200 h-4 rounded w-1/4" />
  </div>
</template>
```

### Optimistic Cart Composable

```typescript
// composables/useCart.ts
import type { Cart } from '@spwig/sdk';
export function useCart() {
  const spwig = useSpwig();
  const cart = useState<Cart | null>('cart', () => null);
  const updating = ref(false);
  async function fetchCart() { cart.value = await spwig.cart.get(); }
  async function addItem(productId: number, qty = 1) {
    updating.value = true;
    try { cart.value = await spwig.cart.add({ product_id: productId, quantity: qty }); }
    finally { updating.value = false; }
  }
  async function updateQuantity(itemId: number, qty: number) {
    if (!cart.value || qty < 1) return;
    const prev = { ...cart.value, items: [...cart.value.items] };
    const i = cart.value.items.findIndex(x => x.id === itemId);
    if (i >= 0) cart.value.items[i] = { ...cart.value.items[i], quantity: qty };
    try { cart.value = await spwig.cart.updateItem(itemId, { quantity: qty }); }
    catch { cart.value = prev; }
  }
  async function removeItem(itemId: number) {
    if (!cart.value) return;
    const prev = { ...cart.value, items: [...cart.value.items] };
    cart.value.items = cart.value.items.filter(x => x.id !== itemId);
    try { cart.value = await spwig.cart.removeItem(itemId); }
    catch { cart.value = prev; }
  }
  return { cart, updating, fetchCart, addItem, updateQuantity, removeItem };
}
```

## Error Handling

### Global Error Page

```vue
<!-- error.vue -->
<script setup lang="ts">
import type { NuxtError } from '#app';
const props = defineProps<{ error: NuxtError }>();
</script>
<template>
  <div class="min-h-screen flex items-center justify-center text-center">
    <div class="max-w-md px-4">
      <p class="text-6xl font-bold text-gray-300 mb-4">{{ error.statusCode }}</p>
      <h1 class="text-2xl font-bold mb-2">
        {{ error.statusCode === 404 ? 'Page Not Found' : 'Something Went Wrong' }}
      </h1>
      <p class="text-gray-600 mb-6">{{ error.message || 'An unexpected error occurred.' }}</p>
      <button @click="clearError({ redirect: '/' })" class="bg-black text-white px-6 py-2 rounded">Homepage</button>
    </div>
  </div>
</template>
```

### Error Boundaries and SDK Error Utility

```vue
<!-- Wrap unreliable sections to isolate failures -->
<NuxtErrorBoundary>
  <ProductGrid />
  <template #error="{ error }">
    <p>Failed to load: {{ error.message }}</p>
    <button @click="refreshNuxtData()">Retry</button>
  </template>
</NuxtErrorBoundary>
```

```typescript
// composables/useSpwigError.ts
import { SpwigAuthError, SpwigValidationError, SpwigNetworkError, SpwigTimeoutError, SpwigApiError } from '@spwig/sdk';
export function useSpwigError() {
  function handleError(err: unknown): string {
    if (err instanceof SpwigAuthError) { navigateTo('/login'); return 'Please log in.'; }
    if (err instanceof SpwigValidationError) return Object.values(err.fieldErrors).flat().join('. ') || 'Check your input.';
    if (err instanceof SpwigNetworkError) return 'Network error. Check your connection.';
    if (err instanceof SpwigTimeoutError) return 'Request timed out. Try again.';
    if (err instanceof SpwigApiError && err.status === 404) { showError({ statusCode: 404 }); return 'Not found.'; }
    return 'Something went wrong.';
  }
  return { handleError };
}
```

## Authentication

```vue
<!-- pages/login.vue -->
<script setup lang="ts">
import { SpwigClient, SpwigAuthError, SpwigValidationError } from '@spwig/sdk';
const config = useRuntimeConfig();
const router = useRouter();
const tokenCookie = useCookie('spwig_token', { maxAge: 60 * 60 * 24 * 30 });
const form = reactive({ username: '', password: '' });
const error = ref<string>();
const fieldErrors = ref<Record<string, string[]>>({});
const pending = ref(false);

async function handleLogin() {
  pending.value = true; error.value = undefined; fieldErrors.value = {};
  try {
    const spwig = new SpwigClient({ baseUrl: config.public.spwigUrl });
    const { token } = await spwig.auth.login(form);
    tokenCookie.value = token; router.push('/account');
  } catch (err) {
    if (err instanceof SpwigAuthError) error.value = 'Invalid username or password.';
    else if (err instanceof SpwigValidationError) fieldErrors.value = err.fieldErrors;
    else error.value = 'Something went wrong.';
  } finally { pending.value = false; }
}
</script>
<template>
  <form @submit.prevent="handleLogin">
    <h1>Login</h1>
    <p v-if="error" class="text-red-500">{{ error }}</p>
    <input v-model="form.username" placeholder="Username" required />
    <p v-if="fieldErrors.username" class="text-red-500">{{ fieldErrors.username[0] }}</p>
    <input v-model="form.password" type="password" placeholder="Password" required />
    <p v-if="fieldErrors.password" class="text-red-500">{{ fieldErrors.password[0] }}</p>
    <button type="submit" :disabled="pending">{{ pending ? 'Logging in...' : 'Login' }}</button>
  </form>
</template>
```

## Search with Autocomplete

```vue
<!-- components/SearchBar.vue -->
<script setup lang="ts">
import type { AutocompleteSuggestion } from '@spwig/sdk';
const spwig = useSpwig();
const router = useRouter();
const query = ref('');
const suggestions = ref<AutocompleteSuggestion[]>([]);
let timer: ReturnType<typeof setTimeout>;
watch(query, (val) => {
  clearTimeout(timer);
  if (val.length < 2) { suggestions.value = []; return; }
  timer = setTimeout(async () => { suggestions.value = await spwig.search.autocomplete(val); }, 300);
});
</script>
<template>
  <div class="relative">
    <input v-model="query" @keydown.enter="router.push(`/search?q=${query}`)" placeholder="Search products..." />
    <ul v-if="suggestions.length" class="absolute top-full bg-white border shadow-lg w-full">
      <li v-for="(s, i) in suggestions" :key="i" @click="router.push(`/products/${s.slug}`)"
        class="p-2 hover:bg-gray-100 cursor-pointer">{{ s.name }}</li>
    </ul>
  </div>
</template>
```

## Checkout Flow

```vue
<!-- pages/checkout.vue -->
<script setup lang="ts">
import type { CheckoutSession, ShippingMethod, PaymentProvider, PaymentIntent } from '@spwig/sdk';
const spwig = useSpwig();
const step = ref<'address' | 'shipping' | 'payment' | 'review'>('address');
const session = ref<CheckoutSession | null>(null);
const shippingMethods = ref<ShippingMethod[]>([]);
const paymentProviders = ref<PaymentProvider[]>([]);
const paymentIntent = ref<PaymentIntent | null>(null);
const error = ref<string>();
const address = reactive({ name: '', address1: '', city: '', state: '', postal_code: '', country: '' });

onMounted(async () => { session.value = await spwig.checkout.getSession(); });
async function submitAddress() {
  session.value = await spwig.checkout.setShippingAddress(address);
  shippingMethods.value = await spwig.checkout.getShippingMethods();
  step.value = 'shipping';
}
async function selectShipping(id: number) {
  session.value = await spwig.checkout.selectShippingMethod(id);
  paymentProviders.value = await spwig.checkout.getPaymentProviders();
  step.value = 'payment';
}
async function selectPayment(slug: string) {
  session.value = await spwig.checkout.selectPaymentMethod(slug);
  if (slug === 'stripe' && session.value)
    paymentIntent.value = await spwig.payments.createIntent({
      amount: session.value.total, currency: session.value.currency, provider: 'stripe' });
  step.value = 'review';
}
async function completeOrder(extra?: Record<string, unknown>) {
  const order = await spwig.checkout.complete(extra);
  navigateTo(`/order-confirmation/${order.order_number}`);
}
</script>
<template>
  <div>
    <h1>Checkout</h1>
    <form v-if="step === 'address'" @submit.prevent="submitAddress">
      <input v-model="address.name" placeholder="Full name" required />
      <input v-model="address.address1" placeholder="Address" required />
      <input v-model="address.city" placeholder="City" required />
      <input v-model="address.state" placeholder="State" required />
      <input v-model="address.postal_code" placeholder="Postal code" required />
      <input v-model="address.country" placeholder="Country (US, GB...)" required />
      <button type="submit">Continue to shipping</button>
    </form>
    <div v-if="step === 'shipping'">
      <h2>Select shipping method</h2>
      <button v-for="m in shippingMethods" :key="m.id" @click="selectShipping(m.id)">
        {{ m.name }} -- {{ session?.currency }} {{ m.price }}</button>
    </div>
    <div v-if="step === 'payment'">
      <h2>Select payment method</h2>
      <button v-for="p in paymentProviders" :key="p.id" @click="selectPayment(p.slug)">{{ p.name }}</button>
    </div>
    <div v-if="step === 'review' && session">
      <h2>Review order</h2>
      <p>Subtotal: {{ session.currency }} {{ session.subtotal }}</p>
      <p>Shipping: {{ session.currency }} {{ session.shipping_cost }}</p>
      <p>Tax: {{ session.currency }} {{ session.tax }}</p>
      <p><strong>Total: {{ session.currency }} {{ session.total }}</strong></p>
      <StripePayment v-if="paymentIntent?.client_secret" :client-secret="paymentIntent.client_secret"
        @success="completeOrder({ payment_intent_id: paymentIntent?.id })"
        @error="(msg: string) => (error = msg)" />
      <button v-else @click="completeOrder()">Place order</button>
      <p v-if="error" class="text-red-500">{{ error }}</p>
    </div>
  </div>
</template>
```

### Stripe Payment Integration

```typescript
// plugins/stripe.client.ts
import { loadStripe } from '@stripe/stripe-js';
export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig();
  return { provide: { stripe: await loadStripe(config.public.stripeKey) } };
});
```

```vue
<!-- components/StripePayment.vue -->
<script setup lang="ts">
import type { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
const props = defineProps<{ clientSecret: string }>();
const emit = defineEmits<{ success: []; error: [message: string] }>();
const { $stripe } = useNuxtApp();
const stripe = $stripe as Stripe;
const elRef = ref<HTMLDivElement>();
const processing = ref(false);
const errorMsg = ref<string>();
let elements: StripeElements; let pe: StripePaymentElement;

onMounted(() => {
  if (!stripe || !elRef.value) return;
  elements = stripe.elements({ clientSecret: props.clientSecret, appearance: { theme: 'stripe' } });
  pe = elements.create('payment'); pe.mount(elRef.value);
});
onUnmounted(() => pe?.destroy());

async function handleSubmit() {
  if (!stripe || !elements) return;
  processing.value = true; errorMsg.value = undefined;
  const { error } = await stripe.confirmPayment({
    elements, confirmParams: { return_url: `${window.location.origin}/order-confirmation` },
    redirect: 'if_required',
  });
  if (error) { errorMsg.value = error.message ?? 'Payment failed.'; emit('error', errorMsg.value); processing.value = false; }
  else { emit('success'); }
}
</script>
<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div ref="elRef" />
    <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>
    <button type="submit" :disabled="processing" class="w-full bg-black text-white py-3 rounded disabled:opacity-50">
      {{ processing ? 'Processing...' : 'Pay now' }}</button>
  </form>
</template>
```

### Handling 3D Secure Redirects

After a 3DS redirect Stripe appends `payment_intent_client_secret` to the return URL:

```vue
<!-- pages/order-confirmation.vue -->
<script setup lang="ts">
import type { Stripe } from '@stripe/stripe-js';
const route = useRoute(); const { $stripe } = useNuxtApp(); const spwig = useSpwig();
const status = ref<'loading' | 'success' | 'error'>('loading');
const orderNumber = ref<string>();

onMounted(async () => {
  const secret = route.query.payment_intent_client_secret as string | undefined;
  if (secret && $stripe) {
    const { paymentIntent, error } = await ($stripe as Stripe).retrievePaymentIntent(secret);
    if (error || paymentIntent?.status !== 'succeeded') { status.value = 'error'; return; }
    const order = await spwig.checkout.complete({ payment_intent_id: paymentIntent.id });
    orderNumber.value = order.order_number;
  } else { orderNumber.value = route.params.orderId as string; }
  status.value = 'success';
});
</script>
<template>
  <div class="min-h-screen flex items-center justify-center text-center">
    <p v-if="status === 'loading'">Verifying payment...</p>
    <div v-else-if="status === 'success'">
      <h1 class="text-2xl font-bold mb-2">Thank you!</h1>
      <p>Order <strong>{{ orderNumber }}</strong> confirmed.</p>
    </div>
    <div v-else>
      <h1 class="text-2xl font-bold text-red-600 mb-2">Payment Failed</h1>
      <NuxtLink to="/checkout" class="underline">Return to checkout</NuxtLink>
    </div>
  </div>
</template>
```

## Webhook Handler (Server Route)

```typescript
// server/api/webhooks/spwig.post.ts
import { verifyWebhookSignature, WEBHOOK_EVENTS } from '@spwig/sdk/webhooks';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readRawBody(event);
  if (!body) throw createError({ statusCode: 400, message: 'Empty body' });
  const signature = getHeader(event, 'X-Spwig-Signature');
  if (!signature) throw createError({ statusCode: 400, message: 'Missing signature' });
  if (!await verifyWebhookSignature(body, signature, config.webhookSecret))
    throw createError({ statusCode: 401, message: 'Invalid signature' });
  const payload = JSON.parse(body);
  switch (payload.event) {
    case WEBHOOK_EVENTS.ORDER_CREATED: console.log('New order:', payload.data.order_number); break;
    case WEBHOOK_EVENTS.ORDER_PAID:    console.log('Payment received:', payload.data.order_number); break;
  }
  return { received: true };
});
```

## Auth Middleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  if (!useCookie('spwig_token').value) return navigateTo(`/login?redirect=${to.fullPath}`);
});
```

Apply to protected pages: `definePageMeta({ middleware: 'auth' })`.

## Currency Switcher

```vue
<!-- components/CurrencySwitcher.vue -->
<script setup lang="ts">
import type { Currency } from '@spwig/sdk';
const spwig = useSpwig();
const currencies = ref<Currency[]>([]);
const current = ref('');
onMounted(async () => {
  currencies.value = await spwig.store.listActiveCurrencies();
  current.value = localStorage.getItem('preferred_currency') ?? currencies.value[0]?.code ?? 'EUR';
  spwig.setCurrency(current.value);
});
function switchCurrency(code: string) {
  current.value = code; spwig.setCurrency(code);
  localStorage.setItem('preferred_currency', code); refreshNuxtData();
}
</script>
<template>
  <select :value="current" @change="switchCurrency(($event.target as HTMLSelectElement).value)">
    <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.symbol }} {{ c.code }}</option>
  </select>
</template>
```

## Deployment Notes

### Vercel / Netlify

Run `npm run build`. Nuxt auto-detects the platform and outputs a Nitro server bundle to `.output/`. To be explicit: `nitro: { preset: 'vercel' }`.

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./ && RUN npm ci
COPY . . && RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output .output
ENV HOST=0.0.0.0 PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

### SSR vs Static

| Mode | Command | Best For |
|------|---------|----------|
| SSR (default) | `nuxt build` | Dynamic stores, real-time stock, personalisation |
| Static (SSG) | `nuxt generate` | Small catalogs, full CDN caching |
| Hybrid | `nuxt build` + `routeRules` | Static marketing pages + dynamic product pages |

**SSR is recommended** for most storefronts -- pricing, stock, and cart must be fresh.

### Full Production `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  modules: ['@nuxt/image', 'nuxt-simple-sitemap'],
  site: { url: process.env.NUXT_PUBLIC_SPWIG_URL || 'https://example.com' },
  runtimeConfig: {
    spwigUrl: process.env.NUXT_SPWIG_URL || 'https://example.com',
    webhookSecret: process.env.WEBHOOK_SECRET || '',
    public: { spwigUrl: process.env.NUXT_PUBLIC_SPWIG_URL || 'https://example.com', stripeKey: process.env.NUXT_PUBLIC_STRIPE_KEY || '' },
  },
  image: { domains: [new URL(process.env.NUXT_PUBLIC_SPWIG_URL || 'https://example.com').hostname], provider: 'ipx' },
  routeRules: {
    '/': { swr: 60 }, '/products': { isr: 300 }, '/products/**': { isr: 120 },
    '/categories/**': { swr: 600 }, '/cart': { ssr: true }, '/checkout': { ssr: true }, '/about': { prerender: true },
  },
  sitemap: { sources: ['/api/__sitemap__/urls'] },
  nitro: { /* preset: 'vercel' | 'netlify' | 'node-server' */ },
});
```
