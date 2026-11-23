import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('Auth Service & Endpoints', () => {
  it('should successfully authenticate doctor with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'doctor.carter@medicore.internal',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.role).toBe('doctor');
    expect(res.body.data.user.fullName).toBe('Dr. Sarah Carter, MD');
  });

  it('should reject login with invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'doctor.carter@medicore.internal',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should reject login for non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@medicore.internal',
        password: 'Password123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should register a new portal patient and return token and MRN', async () => {
    const email = `newpatient.${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'SecurePassword2026!',
        firstName: 'Alice',
        lastName: 'Smith',
        dateOfBirth: '1995-04-12',
        gender: 'Female',
        phone: '+1-555-9988',
        bloodType: 'O+',
        allergies: ['Aspirin'],
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.patient).toHaveProperty('mrn');
    expect(res.body.data.patient.mrn).toMatch(/^MRN-\d+$/);
    expect(res.body.data.user.role).toBe('patient');
  });

  it('should return current user profile on /me with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@medicore.internal',
        password: 'Password123!',
      });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('admin@medicore.internal');
    expect(meRes.body.data.role).toBe('admin');
  });
});
