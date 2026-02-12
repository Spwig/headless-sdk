# Spwig Authentication Patterns — AI Context

You are implementing authentication for a headless Spwig storefront.
SDK: `import { SpwigClient } from '@spwig/sdk'`
Auth header format: `Authorization: Token <token_value>`

## Registration

```typescript
const spwig = new SpwigClient({ baseUrl: 'https://example.com' });

const { user, token } = await spwig.auth.register({
  username: 'johndoe',
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
  password: 'SecurePass123!',
  password_confirm: 'SecurePass123!',
});
spwig.setToken(token);
// User is now logged in
```

Raw API:
```
POST /api/accounts/api/register/
Content-Type: application/json

{ "username": "johndoe", "email": "john@example.com", "password": "SecurePass123!", "password_confirm": "SecurePass123!" }

→ 201 { "success": true, "data": { "user": { "id": 1, "username": "johndoe", "email": "john@example.com", "full_name": "John Doe" }, "token": "abc123..." }, "message": "Registration successful." }
```

## Login

```typescript
const { user, token } = await spwig.auth.login({
  username: 'johndoe',
  password: 'SecurePass123!',
});
spwig.setToken(token);
```

Raw API:
```
POST /api/accounts/api/login/
{ "username": "johndoe", "password": "SecurePass123!" }
→ 200 { "success": true, "data": { "user": {...}, "token": "abc123..." } }
```

## Logout

```typescript
await spwig.auth.logout(); // Invalidates token server-side
spwig.setToken(undefined); // Clear locally
```

## Password Reset

```typescript
// Step 1: Request reset email
await spwig.auth.requestPasswordReset({ email: 'john@example.com' });
// Always returns success (prevents email enumeration)

// Step 2: User clicks link in email, your frontend receives uidb64 + token from URL
await spwig.auth.confirmPasswordReset(uidb64, resetToken, {
  new_password: 'NewSecure456!',
  new_password_confirm: 'NewSecure456!',
});
```

## Social OAuth Providers

```typescript
const providers = await spwig.auth.getSocialProviders();
// → [{ provider: "google", name: "Google", is_configured: true }, ...]
// Redirect user to: /accounts/google/login/?process=login
// After OAuth callback, user is authenticated with a session
```

## Token Storage Patterns

### Browser SPA (React, Vue, Svelte)
```typescript
// Store in memory + localStorage for persistence
const token = localStorage.getItem('spwig_token');
const spwig = new SpwigClient({ baseUrl: API_URL, token: token ?? undefined });

// After login:
spwig.setToken(token);
localStorage.setItem('spwig_token', token);

// After logout:
spwig.setToken(undefined);
localStorage.removeItem('spwig_token');
```

### Server-Side (Next.js, Nuxt)
```typescript
// Store token in httpOnly cookie (set via your API route, not client JS)
// In your API route / server action:
import { cookies } from 'next/headers';

const cookieStore = await cookies();
const token = cookieStore.get('spwig_token')?.value;
const spwig = new SpwigClient({ baseUrl: BACKEND_URL, token });
```

## Handle 401 Unauthorized

```typescript
const spwig = new SpwigClient({
  baseUrl: 'https://example.com',
  onUnauthorized: () => {
    // Token expired or invalid — redirect to login
    localStorage.removeItem('spwig_token');
    window.location.href = '/login';
  },
});
```

## Error Handling

```typescript
import { SpwigAuthError, SpwigValidationError } from '@spwig/sdk';

try {
  await spwig.auth.login({ username, password });
} catch (err) {
  if (err instanceof SpwigAuthError) {
    // 401 — invalid credentials
  }
  if (err instanceof SpwigValidationError) {
    // 400 — field errors: err.fieldErrors = { username: ["Required"], ... }
  }
}
```

## Profile Management (after login)

```typescript
const profile = await spwig.account.getProfile();
// → { id, username, email, full_name, total_orders, lifetime_value, is_vip_customer, ... }

await spwig.account.updateProfile({ first_name: 'Jane', phone: '+1234567890' });
```

## Address Management (after login)

```typescript
const addresses = await spwig.account.listAddresses();

await spwig.account.createAddress({
  name: 'John Doe', address1: '123 Main St', city: 'New York',
  state: 'NY', postal_code: '10001', country: 'US', is_default: true,
});

await spwig.account.setDefaultAddress(addressId);
await spwig.account.deleteAddress(addressId);
```
