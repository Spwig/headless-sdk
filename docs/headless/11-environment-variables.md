# Environment Variables

Complete reference of Spwig backend environment variables relevant to headless deployments.

## Required for Headless

| Variable | Example | Description |
|----------|---------|-------------|
| `SPWIG_ALLOWED_HOSTS` | `example.com,localhost` | Hostnames Django will serve. Must include your domain. |
| `SPWIG_CSRF_TRUSTED_ORIGINS` | `https://example.com` | Origins trusted for CSRF. Include scheme (https://). |
| `CORS_ALLOWED_ORIGINS` | `https://example.com` | Origins allowed for cross-origin API requests. |

## Security

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (auto) | Django secret key. Must be unique per installation. |
| `DEBUG` | `False` | **Must be `False` in production.** |
| `SECURE_PROXY_SSL_HEADER` | auto | Set automatically when behind a proxy sending `X-Forwarded-Proto`. |

## Database

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://user:pass@db:5432/spwig` | PostgreSQL connection string (used when set). |
| `DB_NAME` | `spwig` | Database name (alternative to `DATABASE_URL`). |
| `DB_USER` | `spwig` | Database user. |
| `DB_PASSWORD` | `password` | Database password. |
| `DB_HOST` | `localhost` | Database host. |
| `DB_PORT` | `5432` | Database port. |
| `CONN_MAX_AGE` | `600` | Seconds to keep database connections open. Default `600`. Set to `0` to close after each request. |

## Cache / Message Broker

| Variable | Example | Description |
|----------|---------|-------------|
| `REDIS_HOST` | `localhost` | Redis hostname. |
| `REDIS_PORT` | `6379` | Redis port. |
| `REDIS_DB` | `0` | Redis database number. |

Spwig constructs the Redis URL internally as `redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}`. The same Redis instance is used for caching, session storage, Celery broker, and WebSocket channel layer.

## Email Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_BACKEND` | `django.core.mail.backends.console.EmailBackend` | Django email backend class. Set to `django.core.mail.backends.smtp.EmailBackend` for production. |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP server hostname. |
| `EMAIL_PORT` | `587` | SMTP port. Use `587` for TLS, `465` for SSL. |
| `EMAIL_HOST_USER` | _(empty)_ | SMTP authentication username. |
| `EMAIL_HOST_PASSWORD` | _(empty)_ | SMTP authentication password. |
| `EMAIL_USE_TLS` | `True` | Enable STARTTLS. Mutually exclusive with `EMAIL_USE_SSL`. |
| `EMAIL_USE_SSL` | `False` | Enable implicit SSL. Mutually exclusive with `EMAIL_USE_TLS`. |
| `DEFAULT_FROM_EMAIL` | `noreply@shop.com` | Default sender address for outgoing mail. |

> **Note:** Spwig also provides a full Email System app in the admin UI where merchants can configure email accounts, templates, and sending behaviour per-store. Admin-configured email accounts override these environment variables at runtime.

## Celery / Background Workers

| Variable | Default | Description |
|----------|---------|-------------|
| `CELERY_BROKER_URL` | _(derived from Redis settings)_ | Message broker URL. Defaults to the same Redis instance used for caching. |
| `CELERY_RESULT_BACKEND` | _(same as broker)_ | Where Celery stores task results. Defaults to `CELERY_BROKER_URL`. |

Celery powers all asynchronous work in Spwig. Background tasks include:

- **Webhook delivery** -- retries with exponential backoff
- **Email sending** -- transactional and bulk emails
- **Exchange rate updates** -- periodic currency rate fetching
- **Image processing** -- thumbnail generation, WebP conversion, responsive size presets
- **Stock reservation cleanup** -- releasing expired cart reservations (runs every 60 seconds)
- **Search indexing** -- updating the search index after product/content changes

A headless deployment must run at least one Celery worker alongside the web process. Example:

```bash
celery -A core worker --loglevel=info --concurrency=4
```

## Media / File Storage

### Local Storage (default)

| Variable | Default | Description |
|----------|---------|-------------|
| `MEDIA_URL` | `/media/` | URL prefix for uploaded files. |
| `STATIC_URL` | `/static/` | URL prefix for static assets. |

### S3-Compatible / MinIO Storage

| Variable | Default | Description |
|----------|---------|-------------|
| `MINIO_ENDPOINT` | `localhost:9000` | S3-compatible storage endpoint (MinIO, AWS S3, DigitalOcean Spaces, etc.). |
| `MINIO_ACCESS_KEY` | `minioadmin` | S3 access key ID. |
| `MINIO_SECRET_KEY` | `minioadmin` | S3 secret access key. |
| `MINIO_USE_SSL` | `False` | Use HTTPS for the S3 connection. |
| `MINIO_DIGITAL_ASSETS_BUCKET` | `digital-assets` | Bucket name for digital product files (eBooks, software, etc.). |
| `MINIO_MEDIA_BUCKET` | `media` | Bucket name for general media uploads. |
| `MINIO_REGION` | `us-east-1` | S3 region. |

### AWS S3 (Direct)

Set `USE_S3=True` to use AWS S3 directly for both media and static files:

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_S3` | `False` | Enable direct AWS S3 storage for media and static files. |
| `AWS_ACCESS_KEY_ID` | _(required)_ | AWS access key. |
| `AWS_SECRET_ACCESS_KEY` | _(required)_ | AWS secret key. |
| `AWS_STORAGE_BUCKET_NAME` | _(required)_ | S3 bucket name. |
| `AWS_S3_REGION_NAME` | `us-east-1` | AWS region. |

### Upload Limits

The media library enforces a maximum upload size of **100 MB** (configured in `MEDIA_LIBRARY_SETTINGS`). Spwig automatically generates image presets (thumbnails, responsive sizes, WebP variants) via background Celery tasks when images are uploaded. Preset dimensions are managed through the admin UI under Media Library > Image Size Presets.

## Performance

| Variable | Default | Description |
|----------|---------|-------------|
| `GUNICORN_WORKERS` | `4` | Number of Gunicorn worker processes. Rule of thumb: `2 * CPU_CORES + 1`. |
| `GUNICORN_TIMEOUT` | `120` | Worker timeout in seconds. Increase for large catalogue imports. |
| `CONN_MAX_AGE` | `600` | Database persistent connection lifetime in seconds. |

The default Docker configuration uses Gunicorn with Uvicorn workers for ASGI support (required for WebSocket features like POS customer display). Example supervisor command:

```
gunicorn core.asgi:application --bind 0.0.0.0:8000 --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

## Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` (`DEBUG` when `DEBUG=True`) | Root log level. Options: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`. |
| `SENTRY_DSN` | _(none)_ | Sentry error tracking DSN. Optional. When set, Spwig initialises the Sentry SDK with Django integration and a 10% trace sample rate. |

## Session and Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_COOKIE_AGE` | `2592000` (30 days) | Session lifetime in seconds. |
| `SESSION_COOKIE_SECURE` | `True` (when `DEBUG=False`) | Only send session cookie over HTTPS. |
| `SESSION_COOKIE_HTTPONLY` | `True` | Prevent JavaScript access to the session cookie. |
| `SESSION_COOKIE_SAMESITE` | `Lax` | SameSite policy. Use `None` if your frontend is on a different domain (requires `Secure`). |
| `SESSION_COOKIE_DOMAIN` | _(none)_ | Set to `.example.com` for subdomain deployments so a single session works across `api.example.com` and `www.example.com`. |

For the Admin Mobile API, token lifetimes are configured in `MOBILE_API_SETTINGS`:

| Setting | Default | Description |
|---------|---------|-------------|
| `ACCESS_TOKEN_LIFETIME_MINUTES` | `30` | Short-lived access token expiry. |
| `REFRESH_TOKEN_LIFETIME_DAYS` | `14` | Refresh token expiry. Tokens rotate on use. |

## Search

Spwig uses database full-text search by default with no additional dependencies. For larger catalogues, Elasticsearch can be enabled:

| Variable | Default | Description |
|----------|---------|-------------|
| `SEARCH_BACKEND` | `database` | Search backend. Options: `database`, `elasticsearch`. |
| `ELASTICSEARCH_URL` | `http://localhost:9200` | Elasticsearch connection URL (only used when `SEARCH_BACKEND=elasticsearch`). |

Search index updates are processed asynchronously via Celery.

## Deployment

| Variable | Example | Description |
|----------|---------|-------------|
| `FORCE_SCRIPT_NAME` | `/shop` | Run Spwig at a URL subpath instead of root. |
| `STATIC_URL` | `/static/` | URL prefix for static files. Auto-includes subpath. |
| `MEDIA_URL` | `/media/` | URL prefix for media files. Auto-includes subpath. |

## CORS (Advanced)

If `CORS_ALLOWED_ORIGINS` is not enough:

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ALLOW_CREDENTIALS` | `true` | Allow cookies in cross-origin requests. |
| `CORS_ALLOW_ALL_ORIGINS` | `false` (true in DEBUG) | Allow all origins. **Never use in production.** |

## Complete Production .env Example

A comprehensive example for a production headless deployment. Copy this file, replace placeholder values, and remove any sections you do not need.

```bash
# =============================================================================
# CORE
# =============================================================================
SECRET_KEY=replace-with-a-long-random-string
DEBUG=False
SPWIG_ALLOWED_HOSTS=api.example.com,example.com
SPWIG_CSRF_TRUSTED_ORIGINS=https://example.com,https://api.example.com
CORS_ALLOWED_ORIGINS=https://example.com

# =============================================================================
# DATABASE
# =============================================================================
DATABASE_URL=postgres://spwig:strong-password@db:5432/spwig
CONN_MAX_AGE=600

# =============================================================================
# REDIS (cache, sessions, Celery broker, WebSocket channel layer)
# =============================================================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# =============================================================================
# EMAIL
# =============================================================================
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=postmaster@mg.example.com
EMAIL_HOST_PASSWORD=replace-with-smtp-password
DEFAULT_FROM_EMAIL=store@example.com

# =============================================================================
# OBJECT STORAGE (S3 / MinIO)
# =============================================================================
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=replace-with-access-key
MINIO_SECRET_KEY=replace-with-secret-key
MINIO_USE_SSL=False
MINIO_DIGITAL_ASSETS_BUCKET=digital-assets
MINIO_MEDIA_BUCKET=media

# -- OR for direct AWS S3 --
# USE_S3=True
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=replace-with-secret
# AWS_STORAGE_BUCKET_NAME=my-spwig-bucket
# AWS_S3_REGION_NAME=eu-west-1

# =============================================================================
# PERFORMANCE
# =============================================================================
GUNICORN_WORKERS=4
GUNICORN_TIMEOUT=120

# =============================================================================
# SESSIONS
# =============================================================================
SESSION_COOKIE_AGE=2592000
# SESSION_COOKIE_DOMAIN=.example.com   # uncomment for subdomain deployments

# =============================================================================
# SEARCH (optional -- database search works out of the box)
# =============================================================================
# SEARCH_BACKEND=elasticsearch
# ELASTICSEARCH_URL=http://elasticsearch:9200

# =============================================================================
# LOGGING / ERROR TRACKING
# =============================================================================
# LOG_LEVEL=INFO
# SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0

# =============================================================================
# DEPLOYMENT (optional -- only if running under a subpath)
# =============================================================================
# FORCE_SCRIPT_NAME=/shop
# STATIC_URL=/shop/static/
# MEDIA_URL=/shop/media/
```
