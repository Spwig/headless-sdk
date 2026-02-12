#!/usr/bin/env bash
# Generate TypeScript types from the Spwig OpenAPI schema.
# Run from the sdk/ directory: bash scripts/generate-types.sh
# Or use: npm run generate

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK_DIR="$(dirname "$SCRIPT_DIR")"
SCHEMA_PATH="$SDK_DIR/../docs/api/schema.yml"
OUTPUT_PATH="$SDK_DIR/src/generated/schema.ts"

if [ ! -f "$SCHEMA_PATH" ]; then
  echo "Error: OpenAPI schema not found at $SCHEMA_PATH"
  echo "Generate it first: cd .. && python manage.py spectacular --file docs/api/schema.yml"
  exit 1
fi

echo "Generating TypeScript types from OpenAPI schema..."
npx openapi-typescript "$SCHEMA_PATH" -o "$OUTPUT_PATH"
echo "Types generated at $OUTPUT_PATH"
