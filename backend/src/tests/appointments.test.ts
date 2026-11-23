import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('Appointments & Concurrency Workflow (Assessment 07 & Capstone Challenge)', () => {
  let receptionistToken: string;
  let doctorToken: string;
  let patientToken: string;

  beforeAll(async () => {
    // Login as receptionist
    const rRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'receptionist.amy@medicore.internal', password: 'Password123!' });
    receptionistToken = rRes.body.data.token;

    // Login as doctor
    const dRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'doctor.carter@medicore.internal', password: 'Password123!' });
    doctorToken = dRes.body.data.token;

    // Login as patient
    const pRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'patient.john@medicore.internal', password: 'Password123!' });
    patientToken = pRes.body.data.token;
  });

  it('should list existing appointments for front desk', async () => {
    const res = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${receptionistToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should successfully book a non-conflicting appointment slot', async () => {
    const startTime = new Date(Date.now() + 5 * 86400000); // 5 days in future
    startTime.setHours(11, 0, 0, 0);

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patientId: 'pat-emily-watson',
        providerId: 'prov-carter',
        scheduledStart: startTime.toISOString(),
        durationMinutes: 30,
        reason: 'Hypertension checkup and medication titration',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('SCHEDULED');
    expect(res.body.data.provider_id).toBe('prov-carter');
  });

  it('CAPSTONE CHALLENGE: should strictly REJECT overlapping doctor appointment booking with 409 Conflict', async () => {
    const conflictTime = new Date(Date.now() + 6 * 86400000); // 6 days in future
    conflictTime.setHours(14, 0, 0, 0);

    // 1st Booking: Succeeds
    const firstRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patientId: 'pat-emily-watson',
        providerId: 'prov-carter',
        scheduledStart: conflictTime.toISOString(),
        durationMinutes: 30,
        reason: 'First patient booked in this slot',
      });
    expect(firstRes.status).toBe(201);

    // 2nd Booking: Overlaps EXACT same time -> MUST FAIL WITH 409 CONFLICT
    const collisionRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patientId: 'pat-david-kim',
        providerId: 'prov-carter',
        scheduledStart: conflictTime.toISOString(),
        durationMinutes: 30,
        reason: 'Second patient attempting to double-book doctor',
      });

    expect(collisionRes.status).toBe(409);
    expect(collisionRes.body.error.code).toBe('SCHEDULE_COLLISION');
    expect(collisionRes.body.error.message).toContain('already booked');

    // 3rd Booking: Partial overlap (starts 15 mins into the 30-min slot) -> MUST ALSO FAIL WITH 409
    const partialOverlapTime = new Date(conflictTime.getTime() + 15 * 60000);
    const partialRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patientId: 'pat-john-doe',
        providerId: 'prov-carter',
        scheduledStart: partialOverlapTime.toISOString(),
        durationMinutes: 30,
        reason: 'Attempted partial overlap booking',
      });

    expect(partialRes.status).toBe(409);
    expect(partialRes.body.error.code).toBe('SCHEDULE_COLLISION');
  });

  it('should cancel appointment and allow previously conflicting slot to be booked', async () => {
    const slotTime = new Date(Date.now() + 7 * 86400000);
    slotTime.setHours(15, 0, 0, 0);

    // Book
    const bookRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patientId: 'pat-emily-watson',
        providerId: 'prov-chen',
        scheduledStart: slotTime.toISOString(),
        durationMinutes: 30,
        reason: 'Pre-surgery evaluation',
      });
    expect(bookRes.status).toBe(201);
    const aptId = bookRes.body.data.id;

    // Cancel
    const cancelRes = await request(app)
      .patch(`/api/v1/appointments/${aptId}/status`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        status: 'CANCELLED',
        cancellationReason: 'Patient had scheduling emergency',
      });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // Re-booking the same slot should now SUCCEED because cancelled appointments do not block the schedule
    const rebookRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patientId: 'pat-david-kim',
        providerId: 'prov-chen',
        scheduledStart: slotTime.toISOString(),
        durationMinutes: 30,
        reason: 'Rebooking previously cancelled slot',
      });
    expect(rebookRes.status).toBe(201);
  });
});
