#!/usr/bin/env bash
set -euo pipefail

# Load env vars
if [ -f .env.local ]; then
  set -o allexport
  source .env.local
  set +o allexport
else
  echo "❌ Missing .env.local"; exit 1
fi

DUMP_FILE="$(echo "${TABLE}" | tr '.' '_')_data.sql"

echo "==> Counting rows in SOURCE..."
SRC_COUNT=$(psql "$SRC_URI" -At -c "SELECT COUNT(*) FROM ${TABLE};")
echo "Source has $SRC_COUNT rows."

echo "==> Checking DESTINATION table exists and empty..."
DST_COUNT=$(psql "$DST_URI" -At -c "SELECT COUNT(*) FROM ${TABLE};")
if [ "$DST_COUNT" -ne 0 ]; then
  echo "❌ Destination table ${TABLE} is not empty (count=${DST_COUNT}). Aborting."; exit 1
fi

echo "==> Dumping data from SOURCE..."
pg_dump "$SRC_URI" --data-only --table="${TABLE}" --column-inserts > "${DUMP_FILE}"

echo "==> Importing into DESTINATION..."
psql "$DST_URI" -f "${DUMP_FILE}"

echo "==> Verifying..."
NEW_COUNT=$(psql "$DST_URI" -At -c "SELECT COUNT(*) FROM ${TABLE};")
echo "✅ Destination now has $NEW_COUNT rows."
