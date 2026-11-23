import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('Clinical Care Workflow & Lifecycle (Assessment 02 & 07)', () => {
  let doctorToken: string;
  let nurseToken: string;
  let labTechToken: string;

  beforeAll(async () => {
    const dRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'doctor.carter@medicore.internal', password: 'Password123!' });
    doctorToken = dRes.body.data.token;

    const nRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nurse.sarah@medicore.internal', password: 'Password123!' });
    nurseToken = nRes.body.data.token;

    const lRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'labtech.marcus@medicore.internal', password: 'Password123!' });
    labTechToken = lRes.body.data.token;
  });

  it('should execute end-to-end clinical encounter lifecycle', async () => {
    // 1. Doctor initiates encounter for John Doe (has active TREATMENT consent)
    const encRes = await request(app)
      .post('/api/v1/encounters')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: 'pat-john-doe',
        providerId: 'prov-carter',
        encounterType: 'AMBULATORY',
        chiefComplaint: 'Chest tightness and shortness of breath upon exertion',
        clinicalNotes: 'Initial examination commenced.',
      });

    expect(encRes.status).toBe(201);
    const encounterId = encRes.body.data.id;
    expect(encRes.body.data.status).toBe('IN_PROGRESS');

    // 2. Nurse records triage vitals
    const vitalsRes = await request(app)
      .post(`/api/v1/encounters/${encounterId}/vitals`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({
        systolicBp: 138,
        diastolicBp: 88,
        heartRate: 84,
        respiratoryRate: 18,
        temperatureC: 37.1,
        spO2: 97,
        bmi: 25.4,
      });

    expect(vitalsRes.status).toBe(201);
    expect(vitalsRes.body.data.systolic_bp).toBe(138);

    // 3. Doctor records ICD-10 diagnosis
    const diagRes = await request(app)
      .post('/api/v1/clinical/diagnoses')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        encounterId,
        patientId: 'pat-john-doe',
        code: 'I20.9',
        description: 'Angina pectoris, unspecified',
        category: 'Cardiology',
        isPrimary: true,
      });

    expect(diagRes.status).toBe(201);
    expect(diagRes.body.data.code).toBe('I20.9');

    // 4. Doctor issues prescription with dosage & frequency
    const rxRes = await request(app)
      .post('/api/v1/clinical/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        encounterId,
        patientId: 'pat-john-doe',
        providerId: 'prov-carter',
        medicationName: 'Nitroglycerin Sublingual',
        dosage: '0.4mg',
        route: 'SUBLINGUAL',
        frequency: 'As needed for acute chest pain',
        durationDays: 30,
        refillsAllowed: 1,
        instructions: 'Take 1 tablet under tongue at onset of pain.',
      });

    expect(rxRes.status).toBe(201);
    expect(rxRes.body.data.status).toBe('ACTIVE');

    // 5. Doctor orders laboratory test
    const orderRes = await request(app)
      .post('/api/v1/clinical/lab-orders')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        encounterId,
        patientId: 'pat-john-doe',
        providerId: 'prov-carter',
        orderCode: 'TROP-I',
        testName: 'Troponin I (Cardiac Biomarker)',
        priority: 'STAT',
      });

    expect(orderRes.status).toBe(201);
    const labOrderId = orderRes.body.data.id;

    // 6. Lab tech enters and verifies results
    const resultRes = await request(app)
      .post('/api/v1/clinical/lab-results')
      .set('Authorization', `Bearer ${labTechToken}`)
      .send({
        labOrderId,
        testCode: 'TROP-I',
        testName: 'Troponin I',
        numericValue: 0.02,
        unit: 'ng/mL',
        referenceMin: 0.0,
        referenceMax: 0.04,
        notes: 'Normal troponin level. No myocardial necrosis detected.',
      });

    expect(resultRes.status).toBe(201);
    expect(resultRes.body.data.flag).toBe('NORMAL');

    // 7. Doctor completes and locks encounter
    const completeRes = await request(app)
      .post(`/api/v1/encounters/${encounterId}/complete`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ clinicalNotes: 'Troponin normal. Discharged with sublingual nitroglycerin and outpatient follow-up.' });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');
    expect(completeRes.body.data.end_time).toBeDefined();
  });
});
