import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('Billing & FHIR Interoperability (Assessment 02 & 08)', () => {
  let billingToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const bRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'billing.diana@medicore.internal', password: 'Password123!' });
    billingToken = bRes.body.data.token;

    const aRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@medicore.internal', password: 'Password123!' });
    adminToken = aRes.body.data.token;
  });

  it('should generate an invoice with line items, copay and insurance', async () => {
    const res = await request(app)
      .post('/api/v1/billing')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        patientId: 'pat-john-doe',
        items: [
          { description: 'Cardiology Specialist Consultation', category: 'CONSULTATION', unitPrice: 200, quantity: 1 },
          { description: 'Troponin I STAT Lab Test', category: 'LAB', unitPrice: 75, quantity: 1 },
        ],
        copayAmount: 25,
        insuranceCovered: 250,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.total_amount).toBe(275);
    expect(res.body.data.copay_amount).toBe(25);
    expect(res.body.data.status).toBe('ISSUED');
  });

  it('should process payment idempotently without duplicate charges', async () => {
    const invoiceRes = await request(app)
      .post('/api/v1/billing')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        patientId: 'pat-john-doe',
        items: [{ description: 'Follow-up visit', category: 'CONSULTATION', unitPrice: 100 }],
        copayAmount: 100,
        insuranceCovered: 0,
      });

    const invoiceId = invoiceRes.body.data.id;
    const idempotencyRef = `TXN-IDEMPOTENT-${Date.now()}`;

    // 1st Payment
    const payRes1 = await request(app)
      .post(`/api/v1/billing/${invoiceId}/payments`)
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        invoiceId,
        amount: 100,
        paymentMethod: 'CREDIT_CARD',
        transactionReference: idempotencyRef,
      });

    expect(payRes1.status).toBe(201);
    expect(payRes1.body.data.invoice.status).toBe('PAID');

    // 2nd Payment with exact same idempotencyRef (e.g. network retry)
    const payRes2 = await request(app)
      .post(`/api/v1/billing/${invoiceId}/payments`)
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        invoiceId,
        amount: 100,
        paymentMethod: 'CREDIT_CARD',
        transactionReference: idempotencyRef,
      });

    expect(payRes2.status).toBe(201);
    expect(payRes2.body.data.payment.transaction_reference).toBe(idempotencyRef);
    // Payment record must be the existing one, not a duplicate
    expect(payRes2.body.data.payment.id).toBe(payRes1.body.data.payment.id);
  });

  it('FHIR R4: should export compliant Patient Bundle with Patient, Appointments, Encounters, Observations', async () => {
    const res = await request(app)
      .get('/api/v1/fhir/export/pat-john-doe')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.resourceType).toBe('Bundle');
    expect(res.body.type).toBe('collection');
    expect(res.body.total).toBeGreaterThan(0);

    // Verify Patient resource in bundle
    const patientEntry = res.body.entry.find((e: any) => e.resource.resourceType === 'Patient');
    expect(patientEntry).toBeDefined();
    expect(patientEntry.resource.name[0].family).toBe('Doe');

    // Verify Observation resource in bundle
    const obsEntry = res.body.entry.find((e: any) => e.resource.resourceType === 'Observation');
    expect(obsEntry).toBeDefined();
    expect(obsEntry.resource.category[0].coding[0].code).toBe('laboratory');
  });

  it('FHIR R4: should serve standalone FHIR Patient resource', async () => {
    const res = await request(app).get('/api/v1/fhir/Patient/pat-john-doe');
    expect(res.status).toBe(200);
    expect(res.body.resourceType).toBe('Patient');
    expect(res.body.id).toBe('pat-john-doe');
  });
});
