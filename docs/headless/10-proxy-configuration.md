# Proxy Configuration for Spwig Headless Development

In a headless deployment, the Spwig Django backend serves APIs, the admin interface, static
assets, and webhooks, while a separate frontend application (Next.js, Nuxt, SvelteKit, etc.)
serves the customer-facing storefront. A reverse proxy sits in front of both, routing
requests to the correct upstream based on the URL path.

This guide provides production-ready configurations for NGINX, Caddy, Apache, and Traefik,
all using the same-domain pattern where both services share a single origin
(e.g. `https://example.com`). A subdomain alternative is covered at the end.

---

## Path Ownership Summary

| Path Pattern | Owner | Notes |
|---|---|---|
| `/api/*` | Spwig backend | All REST API endpoints (no language prefix) |
| `/webhooks/*` | Spwig backend | Stripe, shipping, payout provider callbacks |
| `/static/*` | Spwig backend (direct serve) | CSS, JS, images -- serve from disk, not Django |
| `/media/*` | Spwig backend (direct serve) | User uploads -- serve from disk, not Django |
| `/pos/*` | Spwig backend | POS terminal React SPA |
| `/{lang}/admin/*` | Spwig backend | Django admin (17 languages -- see below) |
| `/accounts/*` | Spwig backend | django-allauth OAuth callbacks |
| `/health/*` | Spwig backend | Liveness and readiness probes |
| `/download/*` | Spwig backend | Digital product download tokens |
| `/receipt/*` | Spwig backend | POS receipt public view |
| `/i18n/` | Spwig backend | Django language switcher |
| `/ckeditor5/*` | Spwig backend | CKEditor file uploads |
| `/admin/api/*` | Spwig backend | OpenAPI schema, Swagger UI, ReDoc |
| Everything else | Headless frontend | `/`, `/products/*`, `/cart`, `/checkout`, `/blog/*`, etc. |

**Supported admin language codes (17):**
`en`, `es`, `fr`, `de`, `pt`, `zh-hans`, `zh-hant`, `ja`, `ar`, `ru`, `hi`, `id`, `ko`, `tr`, `vi`, `it`, `th`

---

## Spwig Backend Environment Variables

Set these in your `.env` or container environment so Spwig trusts the proxy:

```bash
# Hosts Django will respond to
SPWIG_ALLOWED_HOSTS=example.com,localhost

# Origins allowed to submit forms (CSRF protection)
SPWIG_CSRF_TRUSTED_ORIGINS=https://example.com

# Origins allowed for cross-origin API requests
CORS_ALLOWED_ORIGINS=https://example.com

# Disable Django debug mode in production
DEBUG=False
```

When `DEBUG=False`, Spwig automatically sets `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')`,
so it correctly detects HTTPS when the proxy terminates TLS. All proxy configurations below
forward the `X-Forwarded-Proto` header.

---

## 1. NGINX (Same Domain)

This is the recommended production configuration. NGINX handles TLS termination, serves
static and media files directly from disk, and proxies dynamic requests to Spwig or the
frontend.

```nginx
# /etc/nginx/sites-available/example.com

# ─── Upstreams ───────────────────────────────────────────────────────────────

upstream spwig_backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

upstream headless_frontend {
    server 127.0.0.1:3000;
    keepalive 16;
}

# ─── Redirect HTTP to HTTPS ─────────────────────────────────────────────────

server {
    listen 80;
    listen [::]:80;
    server_name example.com;

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# ─── HTTPS Server ────────────────────────────────────────────────────────────

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name example.com;

    # ── TLS ──────────────────────────────────────────────────────────────
    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 10m;

    # ── Shared proxy headers ─────────────────────────────────────────────
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host  $host;
    proxy_set_header X-Forwarded-Port  $server_port;

    # ── Request size (allow large media uploads) ─────────────────────────
    client_max_body_size 100M;

    # ── Static files (served directly, not proxied to Django) ────────────
    location /static/ {
        alias /path/to/spwig/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
        access_log off;
    }

    # ── Media files (served directly, not proxied to Django) ─────────────
    location /media/ {
        alias /path/to/spwig/media/;
        expires 30d;
        add_header Cache-Control "public";
        add_header X-Content-Type-Options nosniff;
        access_log off;
    }

    # ── Spwig API ────────────────────────────────────────────────────────
    location /api/ {
        proxy_pass http://spwig_backend;
        proxy_redirect off;
        proxy_read_timeout 120s;
    }

    # ── Webhooks (Stripe, shipping, payouts) ─────────────────────────────
    location /webhooks/ {
        proxy_pass http://spwig_backend;
        proxy_redirect off;
        proxy_read_timeout 60s;
    }

    # ── POS terminal (React SPA) ────────────────────────────────────────
    location /pos/ {
        proxy_pass http://spwig_backend;
        proxy_redirect off;
    }

    # ── Django admin (language-prefixed) ─────────────────────────────────
    # Matches: /en/admin/, /fr/admin/, /zh-hans/admin/, etc.
    location ~ ^/(en|es|fr|de|pt|zh-hans|zh-hant|ja|ar|ru|hi|id|ko|tr|vi|it|th)/admin/ {
        proxy_pass http://spwig_backend;
        proxy_redirect off;
        proxy_read_timeout 120s;
    }

    # ── Non-prefixed admin routes (OpenAPI, Swagger, ReDoc) ──────────────
    location /admin/api/ {
        proxy_pass http://spwig_backend;
        proxy_redirect off;
    }

    # ── OAuth callbacks (django-allauth) ─────────────────────────────────
    location /accounts/ {
        proxy_pass http://spwig_backend;
        proxy_redirect off;
    }

    # ── Health checks ────────────────────────────────────────────────────
    location /health/ {
        proxy_pass http://spwig_backend;
        proxy_redirect off;
        access_log off;
    }

    # ── Digital product downloads ────────────────────────────────────────
    location /download/ {
        proxy_pass http://spwig_backend;
        proxy_redirect off;
    }

    # ── POS receipts ─────────────────────────────────────────────────────
    location /receipt/ {
        proxy_pass http://spwig_backend;
        proxy_redirect off;
    }

    # ── Django language switcher ─────────────────────────────────────────
    location /i18n/ {
        proxy_pass http://spwig_backend;
        proxy_redirect off;
    }

    # ── CKEditor uploads ─────────────────────────────────────────────────
    location /ckeditor5/ {
        proxy_pass http://spwig_backend;
        proxy_redirect off;
        client_max_body_size 50M;
    }

    # ── Everything else goes to the headless frontend ────────────────────
    location / {
        proxy_pass http://headless_frontend;
        proxy_redirect off;
        proxy_read_timeout 60s;

        # WebSocket support (Next.js hot reload in development)
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
}

# ─── WebSocket upgrade map (place in http block or a conf.d file) ────────────

map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

### Key points

- **Static/media paths** use `alias` to serve files directly from disk. Update
  `/path/to/spwig/staticfiles/` and `/path/to/spwig/media/` to match your deployment.
- **Admin regex** matches all 17 language codes. The regex is explicit rather than a
  catch-all `[a-z-]+` to prevent accidental interception of frontend routes like
  `/en/products/`.
- **WebSocket upgrade** is configured on the frontend location for dev-server hot reload.
  It is harmless in production and can be left in place.
- **`client_max_body_size`** is set to 100M globally and 50M for CKEditor uploads. Adjust
  based on your media upload limits.

---

## 2. Caddy (Same Domain)

Caddy provides automatic HTTPS via Let's Encrypt with zero configuration. This is the
simplest production setup.

```caddyfile
# /etc/caddy/Caddyfile

example.com {
    # ── Static files (served from disk) ──────────────────────────────
    handle_path /static/* {
        root * /path/to/spwig/staticfiles
        file_server {
            precompressed gzip br
        }
        header Cache-Control "public, max-age=31536000, immutable"
        header X-Content-Type-Options nosniff
    }

    # ── Media files (served from disk) ───────────────────────────────
    handle_path /media/* {
        root * /path/to/spwig/media
        file_server
        header Cache-Control "public, max-age=2592000"
        header X-Content-Type-Options nosniff
    }

    # ── Spwig API ────────────────────────────────────────────────────
    handle /api/* {
        reverse_proxy 127.0.0.1:8000
    }

    # ── Webhooks ─────────────────────────────────────────────────────
    handle /webhooks/* {
        reverse_proxy 127.0.0.1:8000
    }

    # ── POS terminal ─────────────────────────────────────────────────
    handle /pos/* {
        reverse_proxy 127.0.0.1:8000
    }

    # ── Django admin (language-prefixed) ─────────────────────────────
    @admin path_regexp ^/(en|es|fr|de|pt|zh-hans|zh-hant|ja|ar|ru|hi|id|ko|tr|vi|it|th)/admin/.*
    handle @admin {
        reverse_proxy 127.0.0.1:8000
    }

    # ── Non-prefixed admin API (OpenAPI, Swagger, ReDoc) ─────────────
    handle /admin/api/* {
        reverse_proxy 127.0.0.1:8000
    }

    # ── OAuth callbacks ──────────────────────────────────────────────
    handle /accounts/* {
        reverse_proxy 127.0.0.1:8000
    }

    # ── Health checks ────────────────────────────────────────────────
    handle /health/* {
        reverse_proxy 127.0.0.1:8000
    }

    # ── Digital downloads ────────────────────────────────────────────
    handle /download/* {
        reverse_proxy 127.0.0.1:8000
    }

    # ── POS receipts ─────────────────────────────────────────────────
    handle /receipt/* {
        reverse_proxy 127.0.0.1:8000
    }

    # ── Django language switcher ─────────────────────────────────────
    handle /i18n/* {
        reverse_proxy 127.0.0.1:8000
    }

    # ── CKEditor uploads ─────────────────────────────────────────────
    handle /ckeditor5/* {
        reverse_proxy 127.0.0.1:8000
    }

    # ── Everything else goes to the headless frontend ────────────────
    handle {
        reverse_proxy 127.0.0.1:3000
    }

    # ── Global settings ──────────────────────────────────────────────
    encode gzip

    # Allow large file uploads (100MB)
    request_body {
        max_size 100MB
    }
}
```

### Key points

- Caddy handles TLS certificates automatically. No `ssl_certificate` paths needed.
- Caddy automatically sets `X-Forwarded-For`, `X-Forwarded-Proto`, and `X-Forwarded-Host`
  on all proxied requests.
- `handle` blocks are evaluated in order of specificity (longest path first), so the
  catch-all `handle` block at the bottom only matches routes not claimed above.

---

## 3. Apache (Same Domain)

Requires `mod_proxy`, `mod_proxy_http`, `mod_ssl`, `mod_rewrite`, and `mod_headers`.

```apache
# /etc/apache2/sites-available/example.com.conf

<VirtualHost *:80>
    ServerName example.com

    # Let's Encrypt ACME challenge
    Alias /.well-known/acme-challenge/ /var/www/certbot/.well-known/acme-challenge/
    <Directory /var/www/certbot/.well-known/acme-challenge/>
        Require all granted
    </Directory>

    # Redirect everything else to HTTPS
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/.well-known/acme-challenge/
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName example.com

    # ── TLS ──────────────────────────────────────────────────────────────
    SSLEngine on
    SSLCertificateFile    /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem
    SSLProtocol           all -SSLv3 -TLSv1 -TLSv1.1
    SSLHonorCipherOrder   on

    # ── Proxy headers ────────────────────────────────────────────────────
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"

    # ── Static files (served from disk) ──────────────────────────────────
    Alias /static/ /path/to/spwig/staticfiles/
    <Directory /path/to/spwig/staticfiles/>
        Require all granted
        Options -Indexes
        Header set Cache-Control "public, max-age=31536000, immutable"
        Header set X-Content-Type-Options nosniff
    </Directory>

    # ── Media files (served from disk) ───────────────────────────────────
    Alias /media/ /path/to/spwig/media/
    <Directory /path/to/spwig/media/>
        Require all granted
        Options -Indexes
        Header set Cache-Control "public, max-age=2592000"
        Header set X-Content-Type-Options nosniff
    </Directory>

    # ── Spwig backend routes ─────────────────────────────────────────────
    # Order matters: more specific rules first, catch-all frontend last.

    # API
    ProxyPass        /api/ http://127.0.0.1:8000/api/
    ProxyPassReverse /api/ http://127.0.0.1:8000/api/

    # Webhooks
    ProxyPass        /webhooks/ http://127.0.0.1:8000/webhooks/
    ProxyPassReverse /webhooks/ http://127.0.0.1:8000/webhooks/

    # POS terminal
    ProxyPass        /pos/ http://127.0.0.1:8000/pos/
    ProxyPassReverse /pos/ http://127.0.0.1:8000/pos/

    # OAuth callbacks
    ProxyPass        /accounts/ http://127.0.0.1:8000/accounts/
    ProxyPassReverse /accounts/ http://127.0.0.1:8000/accounts/

    # Health checks
    ProxyPass        /health/ http://127.0.0.1:8000/health/
    ProxyPassReverse /health/ http://127.0.0.1:8000/health/

    # Digital downloads
    ProxyPass        /download/ http://127.0.0.1:8000/download/
    ProxyPassReverse /download/ http://127.0.0.1:8000/download/

    # POS receipts
    ProxyPass        /receipt/ http://127.0.0.1:8000/receipt/
    ProxyPassReverse /receipt/ http://127.0.0.1:8000/receipt/

    # Django language switcher
    ProxyPass        /i18n/ http://127.0.0.1:8000/i18n/
    ProxyPassReverse /i18n/ http://127.0.0.1:8000/i18n/

    # CKEditor uploads
    ProxyPass        /ckeditor5/ http://127.0.0.1:8000/ckeditor5/
    ProxyPassReverse /ckeditor5/ http://127.0.0.1:8000/ckeditor5/

    # Non-prefixed admin API (OpenAPI, Swagger, ReDoc)
    ProxyPass        /admin/api/ http://127.0.0.1:8000/admin/api/
    ProxyPassReverse /admin/api/ http://127.0.0.1:8000/admin/api/

    # Django admin (language-prefixed) -- uses mod_rewrite + mod_proxy
    RewriteEngine On
    RewriteRule ^/(en|es|fr|de|pt|zh-hans|zh-hant|ja|ar|ru|hi|id|ko|tr|vi|it|th)/admin/(.*)$ http://127.0.0.1:8000/$1/admin/$2 [P,L]

    # ── Headless frontend (catch-all, must be last) ──────────────────────
    # Exclude paths already handled by Alias or ProxyPass above
    ProxyPass        / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    # ── Request size limit ───────────────────────────────────────────────
    LimitRequestBody 104857600
</VirtualHost>
```

### Key points

- Apache evaluates `ProxyPass` directives in order of definition. Specific paths must
  appear **before** the catch-all `/` rule, or they will never match.
- The language-prefixed admin route uses `RewriteRule` with the `[P]` (proxy) flag since
  `ProxyPass` does not support regex patterns.
- Enable required modules: `a2enmod proxy proxy_http ssl rewrite headers`.

---

## 4. Traefik (Docker Labels)

Traefik is ideal for Docker-based deployments. Each service declares its own routing rules
via container labels. This example uses a `docker-compose.yml` with Traefik as the edge
router.

```yaml
# docker-compose.yml

version: "3.9"

services:
  # ── Traefik edge router ──────────────────────────────────────────────
  traefik:
    image: traefik:v3.0
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      # Let's Encrypt automatic TLS
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      # HTTP to HTTPS redirect
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certs:/letsencrypt

  # ── Spwig backend ───────────────────────────────────────────────────
  spwig:
    image: spwig/shop:latest
    environment:
      - SPWIG_ALLOWED_HOSTS=example.com,localhost
      - SPWIG_CSRF_TRUSTED_ORIGINS=https://example.com
      - CORS_ALLOWED_ORIGINS=https://example.com
      - DEBUG=False
    volumes:
      - spwig-static:/app/staticfiles
      - spwig-media:/app/media
    labels:
      - "traefik.enable=true"

      # ── Router: API ──────────────────────────────────────────────────
      - "traefik.http.routers.spwig-api.rule=Host(`example.com`) && PathPrefix(`/api/`)"
      - "traefik.http.routers.spwig-api.entrypoints=websecure"
      - "traefik.http.routers.spwig-api.tls.certresolver=letsencrypt"
      - "traefik.http.routers.spwig-api.service=spwig-svc"

      # ── Router: Webhooks ─────────────────────────────────────────────
      - "traefik.http.routers.spwig-webhooks.rule=Host(`example.com`) && PathPrefix(`/webhooks/`)"
      - "traefik.http.routers.spwig-webhooks.entrypoints=websecure"
      - "traefik.http.routers.spwig-webhooks.tls.certresolver=letsencrypt"
      - "traefik.http.routers.spwig-webhooks.service=spwig-svc"

      # ── Router: POS terminal ─────────────────────────────────────────
      - "traefik.http.routers.spwig-pos.rule=Host(`example.com`) && PathPrefix(`/pos/`)"
      - "traefik.http.routers.spwig-pos.entrypoints=websecure"
      - "traefik.http.routers.spwig-pos.tls.certresolver=letsencrypt"
      - "traefik.http.routers.spwig-pos.service=spwig-svc"

      # ── Router: Admin (language-prefixed) ────────────────────────────
      - "traefik.http.routers.spwig-admin.rule=Host(`example.com`) && PathPrefix(`/{lang:en|es|fr|de|pt|zh-hans|zh-hant|ja|ar|ru|hi|id|ko|tr|vi|it|th}/admin/`)"
      - "traefik.http.routers.spwig-admin.entrypoints=websecure"
      - "traefik.http.routers.spwig-admin.tls.certresolver=letsencrypt"
      - "traefik.http.routers.spwig-admin.service=spwig-svc"

      # ── Router: Admin API (non-prefixed) ─────────────────────────────
      - "traefik.http.routers.spwig-admin-api.rule=Host(`example.com`) && PathPrefix(`/admin/api/`)"
      - "traefik.http.routers.spwig-admin-api.entrypoints=websecure"
      - "traefik.http.routers.spwig-admin-api.tls.certresolver=letsencrypt"
      - "traefik.http.routers.spwig-admin-api.service=spwig-svc"

      # ── Router: OAuth, health, downloads, receipts, i18n, CKEditor ──
      - "traefik.http.routers.spwig-misc.rule=Host(`example.com`) && (PathPrefix(`/accounts/`) || PathPrefix(`/health/`) || PathPrefix(`/download/`) || PathPrefix(`/receipt/`) || PathPrefix(`/i18n/`) || PathPrefix(`/ckeditor5/`))"
      - "traefik.http.routers.spwig-misc.entrypoints=websecure"
      - "traefik.http.routers.spwig-misc.tls.certresolver=letsencrypt"
      - "traefik.http.routers.spwig-misc.service=spwig-svc"

      # ── Router: Static files ─────────────────────────────────────────
      - "traefik.http.routers.spwig-static.rule=Host(`example.com`) && (PathPrefix(`/static/`) || PathPrefix(`/media/`))"
      - "traefik.http.routers.spwig-static.entrypoints=websecure"
      - "traefik.http.routers.spwig-static.tls.certresolver=letsencrypt"
      - "traefik.http.routers.spwig-static.service=spwig-svc"

      # Caching middleware for static assets
      - "traefik.http.middlewares.static-cache.headers.customresponseheaders.Cache-Control=public, max-age=31536000, immutable"
      - "traefik.http.routers.spwig-static.middlewares=static-cache"

      # ── Service definition ───────────────────────────────────────────
      - "traefik.http.services.spwig-svc.loadbalancer.server.port=8000"

      # ── Priority ─────────────────────────────────────────────────────
      # Higher priority than the frontend catch-all
      - "traefik.http.routers.spwig-api.priority=100"
      - "traefik.http.routers.spwig-webhooks.priority=100"
      - "traefik.http.routers.spwig-pos.priority=100"
      - "traefik.http.routers.spwig-admin.priority=100"
      - "traefik.http.routers.spwig-admin-api.priority=100"
      - "traefik.http.routers.spwig-misc.priority=100"
      - "traefik.http.routers.spwig-static.priority=100"

  # ── Headless frontend ──────────────────────────────────────────────
  frontend:
    image: your-org/storefront:latest
    labels:
      - "traefik.enable=true"

      # ── Router: catch-all (lowest priority) ──────────────────────────
      - "traefik.http.routers.frontend.rule=Host(`example.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.routers.frontend.priority=1"
      - "traefik.http.routers.frontend.service=frontend-svc"

      - "traefik.http.services.frontend-svc.loadbalancer.server.port=3000"

volumes:
  traefik-certs:
  spwig-static:
  spwig-media:
```

### Key points

- Traefik routes by **priority**. Spwig routers use `priority=100`; the frontend catch-all
  uses `priority=1`. This ensures all Spwig paths are matched before falling through.
- The admin language regex uses Traefik's path parameter syntax
  `{lang:en|es|fr|de|...}` for pattern matching.
- For production, consider adding a dedicated NGINX or Caddy container to serve
  `/static/` and `/media/` from shared volumes instead of routing through Gunicorn.
  The configuration above routes them through Spwig for simplicity.

---

## 5. Subdomain Setup (Alternative)

Instead of path-based routing on a single domain, you can separate concerns onto subdomains:

| Subdomain | Target | Purpose |
|---|---|---|
| `www.example.com` | Frontend (port 3000) | Customer storefront |
| `api.example.com` | Spwig (port 8000) | API, admin, webhooks, POS |
| `static.example.com` | CDN or disk | Static and media files |

Update Spwig environment variables:

```bash
SPWIG_ALLOWED_HOSTS=api.example.com,localhost
SPWIG_CSRF_TRUSTED_ORIGINS=https://api.example.com,https://www.example.com
CORS_ALLOWED_ORIGINS=https://www.example.com
```

### NGINX Subdomain Example

```nginx
# ── API subdomain ────────────────────────────────────────────────────────────

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    client_max_body_size 100M;

    # Static files
    location /static/ {
        alias /path/to/spwig/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Media files
    location /media/ {
        alias /path/to/spwig/media/;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    # Everything else to Spwig
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_redirect off;
    }
}

# ── Frontend subdomain ───────────────────────────────────────────────────────

server {
    listen 443 ssl http2;
    server_name www.example.com;

    ssl_certificate     /etc/letsencrypt/live/www.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.example.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_redirect off;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
}
```

### Caddy Subdomain Example

```caddyfile
api.example.com {
    # Static files
    handle_path /static/* {
        root * /path/to/spwig/staticfiles
        file_server
        header Cache-Control "public, max-age=31536000, immutable"
    }

    # Media files
    handle_path /media/* {
        root * /path/to/spwig/media
        file_server
        header Cache-Control "public, max-age=2592000"
    }

    # Everything else to Spwig
    handle {
        reverse_proxy 127.0.0.1:8000
    }
}

www.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

### Subdomain trade-offs

**Advantages:**
- Simpler proxy rules -- no path-based routing logic needed.
- Frontend API calls go to a clear, separate origin.
- Static files can be moved to a CDN subdomain trivially.

**Disadvantages:**
- Cookies are not shared between subdomains by default. Session-based authentication
  (admin login) requires `SESSION_COOKIE_DOMAIN=.example.com` in Spwig settings.
- CORS configuration is required since the frontend and API are on different origins.
- Two TLS certificates (or a wildcard) are needed.

---

## Troubleshooting

**502 Bad Gateway:** The upstream service is not running or not listening on the expected
port. Verify `spwig` is bound to `0.0.0.0:8000` (not `127.0.0.1:8000` if running in
Docker).

**CSRF verification failed:** Ensure `SPWIG_CSRF_TRUSTED_ORIGINS` includes the full origin
with scheme (e.g. `https://example.com`, not just `example.com`). Also verify the proxy
forwards `X-Forwarded-Proto`.

**Static files return 404:** Run `python manage.py collectstatic` to populate the
`staticfiles/` directory. Verify the `alias` or `root` path in your proxy config matches
the actual directory on disk.

**Admin login redirects to wrong URL:** Check that `SPWIG_ALLOWED_HOSTS` includes the
domain the proxy is serving. Django will reject requests with a `Host` header that is not
in `ALLOWED_HOSTS`.

**Mixed content warnings:** Ensure `SECURE_PROXY_SSL_HEADER` is active (it is automatic
when `DEBUG=False`). If you see HTTP URLs in Django responses, the proxy is not sending
`X-Forwarded-Proto: https`.

**Large file uploads fail:** Increase `client_max_body_size` (NGINX), `request_body max_size`
(Caddy), or `LimitRequestBody` (Apache). Also check Gunicorn's `--timeout` flag if uploads
are slow.
