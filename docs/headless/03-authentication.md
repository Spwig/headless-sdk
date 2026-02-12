# Authentication

Spwig uses token-based authentication. After login, include `Authorization: Token <value>` in every request.

## Registration

```typescript
import { SpwigClient, SpwigValidationError } from '@spwig/sdk';

const spwig = new SpwigClient({ baseUrl: 'https://example.com' });

try {
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
} catch (err) {
  if (err instanceof SpwigValidationError) {
    console.log(err.fieldErrors);
    // { username: ["This username is already taken."], email: ["..."] }
  }
}
```

**API:** `POST /api/accounts/api/register/`
**Response:** `{ success: true, data: { user: {...}, token: "abc123" } }`

## Login

```typescript
const { user, token } = await spwig.auth.login({
  username: 'johndoe',
  password: 'SecurePass123!',
});
spwig.setToken(token);
```

**API:** `POST /api/accounts/api/login/`

## Logout

```typescript
await spwig.auth.logout();
spwig.setToken(undefined);
```

Invalidates the token server-side and clears it from the SDK.

## Password Reset

```typescript
// Step 1: Request reset email (always succeeds to prevent email enumeration)
await spwig.auth.requestPasswordReset({ email: 'john@example.com' });

// Step 2: User clicks link, your page extracts uidb64 + token from URL
await spwig.auth.confirmPasswordReset(uidb64, resetToken, {
  new_password: 'NewSecure456!',
  new_password_confirm: 'NewSecure456!',
});
```

## Social OAuth Providers

```typescript
// List configured providers
const providers = await spwig.auth.getSocialProviders();
// [{ provider: "google", name: "Google", is_configured: true }]

// Redirect user to OAuth flow (browser navigation)
window.location.href = `${baseUrl}/accounts/google/login/?process=login&next=/callback`;
```

After OAuth callback, the user has a session. Extract the token from the callback or use session auth.

## Token Storage

### Browser SPA
```typescript
// After login — persist token
localStorage.setItem('spwig_token', token);

// On app load — restore token
const saved = localStorage.getItem('spwig_token');
if (saved) spwig.setToken(saved);

// After logout — clear
localStorage.removeItem('spwig_token');
```

### Server-Side Rendering (Next.js / Nuxt)
```typescript
// Store token in httpOnly cookie via your API route
import { cookies } from 'next/headers';

export async function getServerSpwig() {
  const cookieStore = await cookies();
  const token = cookieStore.get('spwig_token')?.value;
  return new SpwigClient({
    baseUrl: process.env.SPWIG_BACKEND_URL!,
    token,
  });
}
```

## Handling 401 Unauthorized

```typescript
const spwig = new SpwigClient({
  baseUrl: 'https://example.com',
  onUnauthorized: () => {
    localStorage.removeItem('spwig_token');
    window.location.href = '/login';
  },
});
```

The `onUnauthorized` callback fires on any 401 response, before the error is thrown.
