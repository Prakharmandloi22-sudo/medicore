#!/bin/sh
# ====================================================================
# MediCore PostgreSQL Database Restore & Validation Script
# Assessment 14: Disaster Recovery Runbook
# ====================================================================

set -e

BACKUP_FILE="$1"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file '${BACKUP_FILE}' does not exist."
  exit 1
fi

echo "[$(date)] Validating backup checksum..."
if [ -f "${BACKUP_FILE}.sha256" ]; then
  sha256sum -c "${BACKUP_FILE}.sha256"
  echo "[$(date)] Checksum verified successfully!"
else
  echo "[WARNING] Checksum file not found. Proceeding with caution..."
fi

echo "[$(date)] Initiating database restore into ${POSTGRES_DB:-medicore}..."

# Decompress and execute restore via psql
gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h "${POSTGRES_HOST:-postgres}" \
  -U "${POSTGRES_USER:-medicore_user}" \
  -d "${POSTGRES_DB:-medicore}"

echo "[$(date)] Database restore completed successfully!"
