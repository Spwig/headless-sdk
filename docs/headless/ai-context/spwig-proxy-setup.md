# Spwig Proxy Setup — AI Context

You are configuring a reverse proxy so a headless frontend and the Spwig backend share the same domain.

## Path Ownership

| Path Pattern | Owner | Description |
|---|---|---|
| `/api/*` | Spwig backend | All REST APIs |
| `/webhooks/*` | Spwig backend | External provider webhooks |
| `/static/*` | Spwig backend (Nginx direct) | CSS, JS, images — 30d cache |
| `/media/*` | Spwig backend (Nginx direct) | Uploaded files — 7d cache |
| `/pos/*` | Spwig backend | POS terminal (React SPA) |
| `/{lang}/admin/*` | Spwig backend | Django admin (17 languages) |
| `/accounts/*` | Spwig backend | OAuth callbacks |
| `/health/*` | Spwig backend | Health checks |
| `/download/*` | Spwig backend | Digital product downloads |
| `/receipt/*` | Spwig backend | POS receipt links |
| `/i18n/` | Spwig backend | Language switcher |
| `/ckeditor5/*` | Spwig backend | Admin editor uploads |
| `/admin/api/*` | Spwig backend | API docs (Swagger, ReDoc) |
| Everything else | Headless frontend | Your custom storefront |

Language codes for admin regex: `en|es|fr|de|pt|zh-hans|zh-hant|ja|ar|ru|hi|id|ko|tr|vi|it|th`

## Required Environment Variables (Spwig Backend)

```bash
SPWIG_ALLOWED_HOSTS=example.com,localhost
SPWIG_CSRF_TRUSTED_ORIGINS=https://example.com
CORS_ALLOWED_ORIGINS=https://example.com
# Set automatically when behind proxy:
# SECURE_PROXY_SSL_HEADER is handled by X-Forwarded-Proto header
```

## NGINX Configuration (Same Domain)

```nginx
upstream frontend {
    server 127.0.0.1:3000;  # Next.js / Nuxt / SvelteKit
}

upstream spwig {
    server 127.0.0.1:8000;  # Django / Gunicorn
}

server {
    listen 443 ssl http2;
    server_name example.com;
    client_max_body_size 100M;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # --- Spwig backend paths ---

    # API endpoints
    location /api/ {
        proxy_pass http://spwig;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Webhooks from external providers
    location /webhooks/ {
        proxy_pass http://spwig;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (served directly by Nginx for performance)
    location /static/ {
        alias /path/to/spwig/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media uploads
    location /media/ {
        alias /path/to/spwig/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # POS terminal
    location /pos/ {
        proxy_pass http://spwig;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django admin (language-prefixed)
    location ~ ^/(en|es|fr|de|pt|zh-hans|zh-hant|ja|ar|ru|hi|id|ko|tr|vi|it|th)/admin {
        proxy_pass http://spwig;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API docs
    location /admin/api/ {
        proxy_pass http://spwig;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # OAuth callbacks, health, downloads, receipts, etc.
    location /accounts/ { proxy_pass http://spwig; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; }
    location /health    { proxy_pass http://spwig; proxy_set_header Host $host; }
    location /download/ { proxy_pass http://spwig; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; }
    location /receipt/  { proxy_pass http://spwig; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; }
    location /i18n/     { proxy_pass http://spwig; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; }
    location /ckeditor5/ { proxy_pass http://spwig; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; }

    # --- Frontend (everything else) ---
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

## Caddy Configuration

```caddyfile
example.com {
    # Spwig backend paths
    handle /api/* {
        reverse_proxy localhost:8000
    }
    handle /webhooks/* {
        reverse_proxy localhost:8000
    }
    handle /static/* {
        root * /path/to/spwig/staticfiles
        file_server
        header Cache-Control "public, immutable, max-age=2592000"
    }
    handle /media/* {
        root * /path/to/spwig/media
        file_server
        header Cache-Control "public, max-age=604800"
    }
    handle /pos/* {
        reverse_proxy localhost:8000
    }
    @admin path_regexp admin ^/(en|es|fr|de|pt|zh-hans|zh-hant|ja|ar|ru|hi|id|ko|tr|vi|it|th)/admin
    handle @admin {
        reverse_proxy localhost:8000
    }
    handle /admin/api/* {
        reverse_proxy localhost:8000
    }
    handle /accounts/* {
        reverse_proxy localhost:8000
    }
    handle /health* {
        reverse_proxy localhost:8000
    }
    handle /download/* {
        reverse_proxy localhost:8000
    }
    handle /receipt/* {
        reverse_proxy localhost:8000
    }
    handle /i18n/* {
        reverse_proxy localhost:8000
    }
    handle /ckeditor5/* {
        reverse_proxy localhost:8000
    }

    # Everything else → frontend
    handle {
        reverse_proxy localhost:3000
    }
}
```

## Subdomain Setup (Alternative)

If you prefer separate subdomains:

```nginx
# api.example.com → Spwig backend
server {
    listen 443 ssl;
    server_name api.example.com;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# www.example.com → Frontend
server {
    listen 443 ssl;
    server_name www.example.com example.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

With subdomain setup, configure:
```bash
SPWIG_ALLOWED_HOSTS=api.example.com
CORS_ALLOWED_ORIGINS=https://www.example.com,https://example.com
SPWIG_CSRF_TRUSTED_ORIGINS=https://www.example.com,https://example.com
```

And initialize SDK with:
```typescript
const spwig = new SpwigClient({ baseUrl: 'https://api.example.com' });
```
