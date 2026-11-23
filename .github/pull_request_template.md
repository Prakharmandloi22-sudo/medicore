## Clinical & Architecture Change Review (MediCore Healthcare Platform)

### 1. Summary of Changes
<!-- Describe the business requirement, affected modules, and purpose of change -->

### 2. Clinical Data & Access Control Impact Analysis
- [ ] **Access Control Modified?** Does this PR alter RBAC roles, record-level authorization, or IDOR controls?
- [ ] **Clinical Data Schema Modified?** Does this PR change tables containing diagnoses, prescriptions, lab results, or vitals?
- [ ] **Patient Consent Impact?** Does this feature require checking active patient consent (TREATMENT or DATA_SHARING)?
- [ ] **Audit Trail Verified?** Are all new mutation operations intercepted by `audit_logs`?

### 3. Concurrency & Concurrency Constraints (Capstone)
- [ ] If changing provider scheduling or appointments, does this PR preserve atomic exclusion of overlapping appointments?

### 4. Verification & Testing Evidence
- [ ] Unit & Integration tests passing (Jest / pytest)
- [ ] Regression test added for any bug fix or edge case
- [ ] Tested with synthetic patient data only (NO real patient data or secrets)

### 5. Reviewer Sign-Off
- **Primary Clinical Reviewer:** ___________________
- **Security / Compliance Reviewer:** ___________________
