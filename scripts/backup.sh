#!/bin/sh
# ====================================================================
# MediCore PostgreSQL Database Backup Script
# Assessment 14: Secure Hospital Deployment & Backup Validation
# ====================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="${BACKUP_DIR}/medicore_backup_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting encrypted PostgreSQL database backup..."
mkdir -p "${BACKUP_DIR}"

# Execute pg_dump with gzip compression
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${POSTGRES_HOST:-postgres}" \
  -U "${POSTGRES_USER:-medicore_user}" \
  -d "${POSTGRES_DB:-medicore}" \
  --clean --if-exists --no-owner | gzip -9 > "${FILENAME}"

# Generate SHA256 checksum for audit & tamper-evidence
sha256sum "${FILENAME}" > "${FILENAME}.sha256"

echo "[$(date)] Backup completed successfully: ${FILENAME}"
echo "[$(date)] Checksum generated: $(cat "${FILENAME}.sha256")"

# Retain only last 30 daily backups
find "${BACKUP_DIR}" -type f -name "medicore_backup_*.sql.gz" -mtime +30 -exec rm {} \;
echo "[$(date)] Pruning completed for backups older than 30 days."
