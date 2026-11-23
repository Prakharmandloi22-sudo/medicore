# MediCore Secure Hospital Deployment Guide
**Assessment 14: Secure Hospital Deployment & Hardening**

## 1. Production Architecture Overview
MediCore uses an isolated multi-network architecture:
- **Public Ingress Network (`medicore-frontend-net`):** Encrypted TLS (HTTPS port 443 / HTTP port 80 redirect) managed by Nginx reverse proxy.
- **Private Database Network (`medicore-backend-net`):** `internal: true` bridge network. PostgreSQL (port 5432) and Redis (port 6379) have zero exposed host ports and can only be reached by authorized backend microservices.
- **Non-Root Containers:** All Node.js, Python, and Next.js containers run as low-privilege service users (`appuser`, `nextjs`).

```
                    Internet (HTTPS:443)
                            │
                    ┌───────▼────────┐
                    │ Nginx Gateway  │
                    │ (SSL & RateLim)│
                    └───────┬────────┘
             ┌──────────────┴──────────────┐
             ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │ Next.js Frontend│           │ Express API     │
    │ (Port 3000)     │           │ (Port 5000)     │
    └─────────────────┘           └────────┬────────┘
                                           │
                                  ┌────────┼────────┐
                                  ▼        ▼        ▼
                              PostgreSQL Redis  FastAPI
                              (Isolated) (Cache)(Analytics)
```

## 2. Secrets Management
- All secrets (`JWT_SECRET`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`) are passed strictly via Docker environment variables or external secret managers (e.g. AWS Secrets Manager, HashiCorp Vault).
- `.env` is ignored by Git; `.env.example` contains non-sensitive placeholders.

## 3. SSL / TLS Configuration
Nginx uses TLSv1.2 and TLSv1.3 with high-cipher security suites:
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

## 4. Backup & Disaster Recovery Validation
- Automated daily backups are scheduled with `scripts/backup.sh`.
- Backups are compressed with gzip and signed with SHA-256 checksums (`.sha256`).
- Restore validation runbook:
  ```bash
  # Execute dry-run restoration on staging replica
  ./scripts/restore.sh /backups/medicore_backup_20261123_230000.sql.gz
  ```

## 5. Security Incident Contacts
- **Incident Commander:** Dr. Arthur Vance (admin@medicore.internal)
- **Clinical Data Protection Officer:** compliance@medicore.internal
- **24/7 Operations On-Call:** ops-pager@medicore.internal
