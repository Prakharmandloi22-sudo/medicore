# MediCore Clinical Change Review & Migration Protocol
**Assessment 10: Git and Clinical Change Review**

## 1. Governance & Protected Branches
The MediCore platform enforces rigorous clinical change review processes to protect synthetic clinical integrity and HIPAA/GDPR-aligned privacy constraints.
- **Protected Branch:** `main` and `release/*` branches require mandatory PR reviews before merging.
- **Required Approvals:** At least 2 peer approvals (1 architectural reviewer and 1 clinical domain/security reviewer).
- **Mandatory CI Checks:** All GitHub Actions automated quality, security, and integration gates must pass.

## 2. Clinical Data Structure Modification Checklist
Any modification touching clinical entities (`encounters`, `diagnoses`, `prescriptions`, `lab_orders`, `lab_results`, `patient_consents`, `audit_logs`) must undergo the following review:

| Check | Requirement | Reviewer Verification |
|---|---|---|
| **Non-Destructive Migrations** | Avoid dropping columns or tables directly. Use phased deprecation (`ADD COLUMN`, followed by migration script, before drop). | Verified by DB Administrator |
| **Backward Compatibility** | Existing API clients must continue functioning with fallback default values. | Verified by API Engineer |
| **Audit Coverage** | Ensure mutations write previous and new states to the immutable `audit_logs` table. | Verified by Security Officer |
| **Active Consent Check** | Ensure clinical access middleware enforces patient consent before data access. | Verified by Compliance Reviewer |
| **Concurrency Safeguard** | Ensure provider scheduling changes retain atomic locks and exclusion constraints. | Verified by Backend Architect |

## 3. Database Migration Review Protocol
1. New schema changes must be versioned monotonically in `database/migrations/` (e.g. `001_initial_schema.sql`, `002_constraints_and_indexes.sql`).
2. Run migration dry-run on staging replica.
3. Verify that zero live transaction locks persist beyond sub-second execution windows.
4. Verify rollback script is provided and tested (`DOWN` migration script).
