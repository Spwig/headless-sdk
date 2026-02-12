// Main entry point for @spwig/sdk
export { SpwigClient } from './client.js';
export type { SpwigConfig } from './config.js';

// Error classes
export {
  SpwigError,
  SpwigApiError,
  SpwigAuthError,
  SpwigValidationError,
  SpwigTimeoutError,
  SpwigNetworkError,
} from './errors.js';

// Shared types
export type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  RequestOptions,
} from './utils/types.js';

// Module types — Auth
export type {
  RegisterInput,
  LoginInput,
  PasswordResetInput,
  PasswordResetConfirmInput,
  AuthUser,
  AuthResponse,
  OAuthProvider,
} from './modules/auth.js';

// Module types — Catalog
export type {
  Product,
  ProductImage,
  ProductVariant,
  Category,
  CategorySummary,
  Brand,
  BrandSummary,
  Collection,
  Review,
  ProductListParams,
  StockAvailability,
} from './modules/catalog.js';

// Module types — Cart
export type {
  Cart,
  CartItem,
  AppliedVoucher,
  CartSummary,
  AddToCartInput,
  UpdateCartItemInput,
} from './modules/cart.js';

// Module types — Checkout
export type {
  CheckoutSession,
  Address,
  ShippingMethod,
  PaymentProvider,
  CompletedOrder,
  ValidationResult,
} from './modules/checkout.js';

// Module types — Orders
export type {
  Order,
  OrderItem,
  OrderAddress,
  ReturnRequest,
  CreateReturnInput,
  OrderListParams,
} from './modules/orders.js';

// Module types — Account
export type {
  CustomerProfile,
  UpdateProfileInput,
  DashboardPreferences,
  CustomerAddress,
  CreateAddressInput,
  NotificationPreferences,
} from './modules/account.js';

// Module types — Search
export type {
  SearchResult,
  AutocompleteSuggestion,
  TrendingSearch,
  SearchParams,
} from './modules/search.js';

// Module types — Store
export type {
  StoreInfo,
  StoreContact,
  StoreSocial,
  StoreCurrency,
  Currency,
} from './modules/store.js';

// Module types — Loyalty
export type {
  LoyaltyStatus,
  LoyaltyTier,
  LoyaltyReward,
  LoyaltyRedemption,
  LoyaltyProgress,
  LoyaltyHistoryEntry,
  EarningRule,
  LoyaltyBadge,
} from './modules/loyalty.js';

// Module types — Wishlist
export type { WishlistItem } from './modules/wishlist.js';

// Module types — Payments
export type {
  PaymentIntent,
  SavedPaymentMethod,
  CreatePaymentIntentInput,
} from './modules/payments.js';

// Webhook utilities (also available as separate import: @spwig/sdk/webhooks)
export {
  verifyWebhookSignature,
  parseWebhookHeaders,
  WEBHOOK_EVENTS,
} from './modules/webhooks.js';
export type { WebhookEvent } from './modules/webhooks.js';
