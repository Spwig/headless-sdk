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
  SmsVerificationInput,
  SmsVerifyInput,
  ConvertGuestInput,
  AccountCreationContext,
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
  BookingAvailability,
  BookingSlot,
  BookingResource,
  Booking,
  BookingCheckInput,
  BookingRescheduleInput,
  LicenseInfo,
  LicenseActivation,
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
  CommunicationPreference,
  CommunicationPreferenceUpdate,
} from './modules/account.js';

// Module types — Search
export type {
  SearchResult,
  AutocompleteSuggestion,
  TrendingSearch,
  SearchParams,
  SearchEngine,
  SearchSettings,
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

// Module types — Webhooks
export {
  verifyWebhookSignature,
  parseWebhookHeaders,
  WEBHOOK_EVENTS,
} from './modules/webhooks.js';
export type {
  WebhookEvent,
  WebhookEndpoint,
  CreateEndpointInput,
  UpdateEndpointInput,
  WebhookDelivery,
  WebhookEventType,
  WebhookEndpointStats,
} from './modules/webhooks.js';

// Module types — Blog
export type {
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogSettings,
  BlogPostListParams,
  BlogSubscription,
} from './modules/blog.js';

// Module types — Announcements
export type { Announcement } from './modules/announcements.js';

// Module types — Pages
export type { Page, PageElement, LegalPageSummary, LegalPages } from './modules/pages.js';

// Module types — Forms
export type { Form, FormField, FormStep, FormSubmission } from './modules/forms.js';

// Module types — Social
export type { ShareCounts, UserShare } from './modules/social.js';

// Module types — Messages
export type {
  ContactFormInput,
  ContactSubject,
  Message,
} from './modules/messages.js';

// Module types — Subscriptions
export type {
  PlanPricingTier,
  SubscriptionPlan,
  Subscription,
  CreateSubscriptionInput,
} from './modules/subscriptions.js';

// Module types — GeoIP
export type {
  GeoLocation,
  GeoPreference,
  Country,
  CurrencySuggestion,
  LanguageSuggestion,
} from './modules/geoip.js';

// Module types — Recently Viewed
export type { RecentlyViewedItem } from './modules/recentlyViewed.js';

// Module types — Customizer
export type {
  CustomizerConfig,
  CustomizerSurface,
  ClipartItem,
  FontInfo,
  DesignTemplate,
  SavedDesign,
  SaveDesignInput,
  PriceCalculation,
} from './modules/customizer.js';

// Module types — Customer
export type {
  CustomerDashboard,
  CustomerStats,
  CustomerInsights,
  DigitalProduct,
  DigitalLicense,
} from './modules/customer.js';

// Module types — Address Service
export type {
  AddressSuggestion,
  NormalizedAddress,
  AddressValidation,
  AddressInput,
} from './modules/address.js';

// Module types — Referrals
export type {
  ReferralProgram,
  ReferralDashboard,
  ReferralReward,
} from './modules/referrals.js';

// Module types — Affiliate
export type {
  AffiliateProgram,
  Affiliate,
  AffiliateLink,
  CreateAffiliateLinkInput,
  Commission,
  Payout,
} from './modules/affiliate.js';

// Module types — Wallet
export type {
  WalletBalance,
  WalletTransaction,
  WalletTransactionParams,
  OffsetPaginatedResponse,
} from './modules/wallet.js';

// Shared types — Admin pagination
export type { AdminPagination } from './utils/types.js';

// Module types — Admin (re-exported from admin/index.ts)
export { AdminModule } from './modules/admin/index.js';
export type {
  // Auth
  StaffLoginInput,
  TwoFactorVerifyInput,
  RefreshTokenInput,
  LogoutInput,
  TokenResponse,
  StaffLoginResponse,
  TwoFactorRequiredResponse,
  StaffProfile,
  AdminPasswordResetInput,
  AdminPasswordResetConfirmInput,
  SsoConfig,
  SsoAuthorizeInput,
  SsoCallbackInput,
  SsoTokenInput,
  // Analytics
  DashboardAnalytics,
  QuickStats,
  SalesKPI,
  TopProduct,
  OrderStatusBreakdown,
  SalesComparison,
  DailyStatsItem,
  DailyStats,
  AnalyticsPeriod,
  DailyStatsPeriod,
  TopProductsParams,
  // Orders
  AdminOrder,
  AdminOrderDetail,
  AdminOrderItem,
  OrderCounts,
  OrderNote,
  OrderNotesResponse,
  OrderListResponse,
  OrderStatusUpdateInput,
  TrackingUpdateInput,
  OrderRefundInput,
  OrderCancelInput,
  OrderNoteCreateInput,
  AdminOrderListParams,
  // Products
  AdminProduct,
  AdminProductDetail,
  AdminProductImage,
  AdminProductVariant,
  AdminProductAttribute,
  ProductCounts,
  ProductListResponse,
  LowStockProduct,
  AdminWarehouse,
  AdminProductListParams,
  ProductCreateInput,
  ProductUpdateInput,
  BulkProductCreateInput,
  BulkProductUpdateInput,
  StockAdjustmentInput,
  ProductStatusUpdateInput,
  ProductImageUpdateInput,
  ProductImageReorderInput,
  VariantCreateInput,
  VariantUpdateInput,
  AdminAttribute,
  AttributeCreateInput,
  AttributeAssignInput,
  // Categories
  AdminCategory,
  AdminCategoryListParams,
  CategoryListResponse,
  CategoryCreateInput,
  CategoryUpdateInput,
  BulkCategoryCreateInput,
  // Brands
  AdminBrand,
  AdminBrandListParams,
  BrandListResponse,
  BrandCreateInput,
  BrandUpdateInput,
  BulkBrandCreateInput,
  // Messages
  AdminMessage,
  AdminMessageDetail,
  MessageListResponse,
  MessageCounts,
  UnreadCount,
  MessageStatusUpdateInput,
  MessageReplyInput,
  AdminMessageListParams,
  // Settings
  AppSettings,
  AdminLanguage,
  LanguagesResponse,
  AdminDevice,
  DeviceRegistrationInput,
  PushTokenUpdateInput,
  NotificationPreferencesInput,
  AdminSession,
  // Wallets (admin)
  AdminWallet,
  AdminWalletDetail,
  AdminWalletTransaction,
  WalletCreditInput,
  WalletDebitInput,
  AdminWalletListParams,
  AdminTransactionListParams,
} from './modules/admin/index.js';
