#!/usr/bin/env bash
# Generate TypeScript types from the Spwig OpenAPI schema.
# Run from the SDK root: npm run generate
#
# The schema is produced by the Django backend, which lives in a *separate*
# repository. This script previously resolved it as "$SDK_DIR/../docs/api/",
# which was correct only while the SDK was a subdirectory of the backend repo;
# once it moved to its own repo that path pointed at a directory that does not
# exist, `npm run generate` failed every time, and the committed
# src/generated/schema.ts silently went stale. `prepublishOnly` runs this, so
# publishing was failing on the same path.
#
# Override explicitly with:
#   SPWIG_SCHEMA_PATH=/path/to/schema.yml npm run generate

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_PATH="$SDK_DIR/src/generated/schema.ts"

# Candidate backend checkouts, in preference order: explicit override, the
# legacy in-repo layout, then the usual sibling checkouts (dev, production,
# public OSS mirror).
CANDIDATES=(
  "${SPWIG_SCHEMA_PATH:-}"
  "$SDK_DIR/../docs/api/schema.yml"
  "$SDK_DIR/../shop-dev/docs/api/schema.yml"
  "$SDK_DIR/../shop/docs/api/schema.yml"
  "$SDK_DIR/../commerce/docs/api/schema.yml"
)

SCHEMA_PATH=""
for candidate in "${CANDIDATES[@]}"; do
  if [ -n "$candidate" ] && [ -f "$candidate" ]; then
    SCHEMA_PATH="$candidate"
    break
  fi
done

if [ -z "$SCHEMA_PATH" ]; then
  echo "Error: OpenAPI schema not found. Looked in:"
  for candidate in "${CANDIDATES[@]}"; do
    [ -n "$candidate" ] && echo "  - $candidate"
  done
  echo
  echo "Generate it from the backend repo:"
  echo "  python manage.py spectacular --file docs/api/schema.yml"
  echo "Or point at it directly:"
  echo "  SPWIG_SCHEMA_PATH=/path/to/schema.yml npm run generate"
  exit 1
fi

echo "Generating TypeScript types from $SCHEMA_PATH"
npx openapi-typescript "$SCHEMA_PATH" -o "$OUTPUT_PATH"
echo "Types generated at $OUTPUT_PATH"
