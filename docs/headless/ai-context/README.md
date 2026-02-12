# Give This to Your AI

These documents are designed to be pasted into AI assistants (Claude, ChatGPT, Copilot, Cursor, etc.) to give them full context about the Spwig API when building your headless storefront.

## How to Use

1. Pick the document(s) relevant to what you're building
2. Copy the contents and paste into your AI assistant's context
3. Ask the AI to help you build your feature

## Documents

| Document | Use When | Size |
|----------|----------|------|
| [spwig-api-overview.md](spwig-api-overview.md) | Starting a new project, need full API surface | ~3000 tokens |
| [spwig-auth-patterns.md](spwig-auth-patterns.md) | Building login/register/account pages | ~1500 tokens |
| [spwig-checkout-flow.md](spwig-checkout-flow.md) | Building cart and checkout | ~2000 tokens |
| [spwig-webhook-integration.md](spwig-webhook-integration.md) | Setting up server-side event handling | ~1500 tokens |
| [spwig-proxy-setup.md](spwig-proxy-setup.md) | Deploying frontend + backend together | ~1500 tokens |

## Tips

- For a new project, paste **spwig-api-overview.md** first, then add specific docs as needed
- These docs include request/response shapes so the AI can generate correct code immediately
- All examples use the `@spwig/sdk` TypeScript SDK — install it with `npm install @spwig/sdk`
