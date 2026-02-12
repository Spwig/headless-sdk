# Multi-Language

Spwig supports 17 languages out of the box. This chapter explains how to fetch translated content and switch languages in a headless storefront.

---

## How Spwig Handles i18n

Spwig uses two independent translation systems:

1. **Admin interface translations** -- Django's built-in i18n system with `.po` files for the merchant admin backend.
2. **Content translations** -- An AI-powered translation service that merchants use to translate product descriptions, page content, SEO metadata, and other storefront content into any of the supported languages.

When building a headless frontend, you interact primarily with the content translation system through the API. Translated content is returned automatically based on the language you request.

---

## Supported Languages

| Code | Language |
|------|----------|
| `en` | English |
| `es` | Spanish |
| `fr` | French |
| `de` | German |
| `pt` | Portuguese |
| `zh-hans` | Simplified Chinese |
| `zh-hant` | Traditional Chinese |
| `ja` | Japanese |
| `ar` | Arabic |
| `ru` | Russian |
| `hi` | Hindi |
| `id` | Indonesian |
| `ko` | Korean |
| `tr` | Turkish |
| `vi` | Vietnamese |
| `it` | Italian |
| `th` | Thai |

---

## Setting the Language

### Via SDK Configuration

Set the default language when initializing the client:

```typescript
import { SpwigClient } from '@spwig/sdk';

const spwig = new SpwigClient({
  baseUrl: 'https://mystore.example.com',
  language: 'fr',  // All requests default to French
});
```

### Switching Language at Runtime

```typescript
spwig.setLanguage('de');

// All subsequent requests will use German
const products = await spwig.catalog.products.list();
// Product names, descriptions etc. returned in German (if translations exist)
```

### Per-Request Language Override

Override the language for a single request without changing the client default:

```typescript
// Client default is English, but fetch this product in Japanese
const product = await spwig.catalog.products.get('my-product', {
  language: 'ja',
});
```

### Via Accept-Language Header (Raw API)

If you are not using the SDK, set the `Accept-Language` header on your requests:

```
GET /api/catalog/products/
Accept-Language: fr
```

The API returns content in the requested language. If a translation is not available for a field, the value falls back to the default language (English).

---

## Fetching Translated Content

When you request content in a specific language, the API automatically returns translated fields where translations exist.

### Products

```typescript
spwig.setLanguage('es');

const product = await spwig.catalog.products.get('running-shoes');
// product.name         -> "Zapatillas para correr"  (translated)
// product.description  -> "Zapatillas ligeras..."    (translated)
// product.slug         -> "running-shoes"            (slug stays the same)
// product.price        -> "59.99"                    (numbers are not translated)
```

### Categories

```typescript
spwig.setLanguage('ja');

const categories = await spwig.catalog.categories.list();
// Each category returns with translated name and description
```

### Pages

Page builder content is also translated when the merchant has provided translations.

### Fallback Behavior

If a translation does not exist for a specific field in the requested language, the API returns the default language (English) value for that field. This means you always get content -- never an empty string due to a missing translation.

---

## Building a Language Switcher

### Get Available Languages

You can query the translation service to find which languages have translations available:

```
GET /api/translations/languages/
```

This returns the list of languages that the merchant has configured for their store.

### Example: Language Switcher Component

```typescript
import { SpwigClient } from '@spwig/sdk';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
  { code: 'fr', name: 'French', nativeName: 'Francais' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'zh-hans', name: 'Chinese (Simplified)', nativeName: '中文 (简体)' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
];

function switchLanguage(spwig: SpwigClient, languageCode: string) {
  spwig.setLanguage(languageCode);

  // Persist the choice
  localStorage.setItem('preferred_language', languageCode);

  // Update the document language for accessibility and SEO
  document.documentElement.lang = languageCode;

  // Update text direction for RTL languages
  document.documentElement.dir = languageCode === 'ar' ? 'rtl' : 'ltr';
}
```

---

## RTL Support for Arabic

Arabic (`ar`) is a right-to-left (RTL) language. When the user selects Arabic, your frontend must:

1. Set `dir="rtl"` on the `<html>` element
2. Flip your layout (CSS logical properties help here)
3. Mirror navigation, icons, and directional UI

### Detecting RTL

```typescript
function isRtl(languageCode: string): boolean {
  return languageCode === 'ar';
}

// When initializing or switching language
const lang = 'ar';
document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
document.documentElement.lang = lang;
```

### CSS Logical Properties

Use CSS logical properties so your layout flips automatically with the `dir` attribute:

```css
/* Instead of margin-left, use margin-inline-start */
.sidebar {
  margin-inline-start: 1rem;
  padding-inline-end: 1rem;
}

/* Instead of text-align: left, use start */
.content {
  text-align: start;
}

/* Instead of float: left */
.image {
  float: inline-start;
}
```

---

## SEO Considerations for Multi-Language

When building a multi-language headless storefront, add these for SEO:

### Hreflang Tags

```html
<link rel="alternate" hreflang="en" href="https://mystore.com/en/products/shoes" />
<link rel="alternate" hreflang="fr" href="https://mystore.com/fr/products/shoes" />
<link rel="alternate" hreflang="de" href="https://mystore.com/de/products/shoes" />
<link rel="alternate" hreflang="x-default" href="https://mystore.com/en/products/shoes" />
```

### Language in URLs

Common patterns for multi-language storefronts:

| Pattern | Example |
|---------|---------|
| Path prefix | `mystore.com/fr/products/shoes` |
| Subdomain | `fr.mystore.com/products/shoes` |
| Query parameter | `mystore.com/products/shoes?lang=fr` |

Path prefix is the most common and SEO-friendly approach. Your frontend router should extract the language from the URL and pass it to the SDK:

```typescript
// Next.js example with path prefix
const lang = params.lang || 'en';
const spwig = new SpwigClient({
  baseUrl: process.env.SPWIG_BACKEND_URL!,
  language: lang,
});
```

---

## Complete Example: Multi-Language Product Page

```typescript
import { SpwigClient } from '@spwig/sdk';

interface PageProps {
  lang: string;
  slug: string;
}

async function getProductPage({ lang, slug }: PageProps) {
  const spwig = new SpwigClient({
    baseUrl: process.env.SPWIG_BACKEND_URL!,
    language: lang,
  });

  const product = await spwig.catalog.products.get(slug);
  const categories = await spwig.catalog.categories.list();

  return {
    product: {
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      images: product.images,
    },
    categories: categories.results,
    currentLanguage: lang,
    isRtl: lang === 'ar',
  };
}
```
