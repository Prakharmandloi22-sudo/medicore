import request from 'supertest';
import { createApp } from '../app';
import { db } from '../db';

const app = createApp();

describe('Clinical Security, RBAC & Privacy Defense (Assessment 04 & 12)', () => {
  let patientJohnToken: string;
  let receptionistToken: string;
  let labTechToken: string;
  let doctorToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Patient John
    const pRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'patient.john@medicore.internal', password: 'Password123!' });
    patientJohnToken = pRes.body.data.token;

    // Receptionist
    const rRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'receptionist.amy@medicore.internal', password: 'Password123!' });
    receptionistToken = rRes.body.data.token;

    // Lab Tech
    const lRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'labtech.marcus@medicore.internal', password: 'Password123!' });
    labTechToken = lRes.body.data.token;

    // Doctor Carter
    const dRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'doctor.carter@medicore.internal', password: 'Password123!' });
    doctorToken = dRes.body.data.token;

    // Admin
    const aRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@medicore.internal', password: 'Password123!' });
    adminToken = aRes.body.data.token;
  });

  it('IDOR DEFENSE: Patient John CANNOT access another patient (Emily Watson) chart or details', async () => {
    // Patient John tries to query Emily Watson's ID
    const res = await request(app)
      .get('/api/v1/patients/pat-emily-watson/chart')
      .set('Authorization', `Bearer ${patientJohnToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCESS_DENIED_IDOR');
    expect(res.body.error.message).toContain('only access their own clinical records');
  });

  it('Patient John CAN access his own chart', async () => {
    const res = await request(app)
      .get('/api/v1/patients/pat-john-doe/chart')
      .set('Authorization', `Bearer ${patientJohnToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.patient.id).toBe('pat-john-doe');
    expect(res.body.data.patient.first_name).toBe('John');
  });

  it('ROLE BOUNDARY: Receptionist CANNOT view protected clinical diagnoses or encounter notes', async () => {
    const res = await request(app)
      .get('/api/v1/clinical/diagnoses?patientId=pat-john-doe')
      .set('Authorization', `Bearer ${receptionistToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CLINICAL_ACCESS_RESTRICTED');
  });

  it('ROLE BOUNDARY: Lab technician CANNOT create billing invoices', async () => {
    const res = await request(app)
      .post('/api/v1/billing')
      .set('Authorization', `Bearer ${labTechToken}`)
      .send({
        patientId: 'pat-john-doe',
        items: [{ description: 'Unauthorized Invoice', category: 'TEST', unitPrice: 100 }],
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('CONSENT ENFORCEMENT: Revoking patient consent immediately BLOCKS new clinical encounter initiation', async () => {
    // 1. Create a temporary patient with no active consent
    const tempPatientId = 'pat-temp-no-consent';
    db.patients.push({
      id: tempPatientId,
      mrn: 'MRN-99999',
      first_name: 'NoConsent',
      last_name: 'Patient',
      date_of_birth: '1990-01-01',
      gender: 'Other',
      contact_phone: '+1-555-0999',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 2. Doctor attempts to create clinical encounter without patient treatment consent -> 403
    const encounterRes = await request(app)
      .post('/api/v1/encounters')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: tempPatientId,
        providerId: 'prov-carter',
        chiefComplaint: 'Unconsented clinical visit attempt',
      });

    expect(encounterRes.status).toBe(403);
    expect(encounterRes.body.error.code).toBe('CONSENT_REQUIRED');
    expect(encounterRes.body.error.message).toContain('consent for \'TREATMENT\' is required');
  });

  it('AUDIT TRAIL: System logs audit records for mutations and blocked security violations', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('logs');
    expect(res.body.data.logs.length).toBeGreaterThan(0);

    // Verify presence of security alert in audit logs
    const securityLog = res.body.data.logs.find(
      (l: any) => l.rationale && l.rationale.includes('SECURITY_ALERT')
    );
    expect(securityLog).toBeDefined();
  });
});
