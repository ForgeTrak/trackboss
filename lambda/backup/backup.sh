#!/bin/bash
set -euo pipefail

TS=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
KEY="${PREFIX}${DB_NAME}/${TS}.sql.gz"

mysqldump -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASS}" \
  --single-transaction --quick --routines --triggers "${DB_NAME}" \
| gzip \
| aws s3 cp - "s3://${BUCKET}/${KEY}"

echo "s3://${BUCKET}/${KEY}"
