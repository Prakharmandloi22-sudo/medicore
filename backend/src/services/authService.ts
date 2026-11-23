import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { db } from '../db';
import { User, UserRole, Patient } from '../db/types';
import { logAudit } from '../middleware/auditLogger';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
    phone?: string;
    patientId?: string;
    providerId?: string;
  };
}

export class AuthService {
  async login(email: string, passwordPlain: string, ipAddress?: string, userAgent?: string): Promise<LoginResult> {
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    if (!user.is_active) {
      throw { statusCode: 403, code: 'ACCOUNT_INACTIVE', message: 'User account has been deactivated.' };
    }

    const matches = bcrypt.compareSync(passwordPlain, user.password_hash);
    if (!matches) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    let patientId: string | undefined;
    let providerId: string | undefined;

    if (user.role === 'patient') {
      const patient = db.patients.find(p => p.user_id === user.id);
      patientId = patient?.id;
    } else if (user.role === 'doctor') {
      const provider = db.providers.find(p => p.user_id === user.id);
      providerId = provider?.id;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        patientId,
        providerId,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    logAudit({
      userId: user.id,
      action: 'ACCESS_RECORD',
      entityType: 'AUTH_SESSION',
      entityId: user.id,
      ipAddress,
      userAgent,
      rationale: `User ${user.email} successfully logged in as ${user.role}`,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        phone: user.phone,
        patientId,
        providerId,
      },
    };
  }

  async registerPatient(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    address?: string;
    bloodType?: string;
    allergies?: string[];
  }): Promise<{ user: User; patient: Patient; token: string }> {
    const existing = db.users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw { statusCode: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'Email address is already registered.' };
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(data.password, salt);
    const userId = `usr-pat-${uuidv4().substring(0, 8)}`;
    const patientId = `pat-${uuidv4().substring(0, 8)}`;
    const mrn = `MRN-${Math.floor(10000 + Math.random() * 90000)}`;

    const newUser: User = {
      id: userId,
      email: data.email.toLowerCase(),
      password_hash: hash,
      role: 'patient',
      full_name: `${data.firstName} ${data.lastName}`,
      phone: data.phone,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newPatient: Patient = {
      id: patientId,
      user_id: userId,
      mrn,
      first_name: data.firstName,
      last_name: data.lastName,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
      contact_phone: data.phone,
      contact_email: data.email.toLowerCase(),
      address: data.address,
      blood_type: data.bloodType,
      allergies: data.allergies || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.users.push(newUser);
    db.patients.push(newPatient);

    // Initial treatment consent granted upon self-registration
    db.consents.push({
      id: `cst-${uuidv4().substring(0, 8)}`,
      patient_id: patientId,
      consent_type: 'TREATMENT',
      is_granted: true,
      granted_at: new Date().toISOString(),
      notes: 'Granted upon patient self-registration',
    });

    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.full_name,
        patientId,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    logAudit({
      userId,
      action: 'CREATE',
      entityType: 'PATIENT',
      entityId: patientId,
      patientId,
      rationale: `Patient ${newPatient.first_name} ${newPatient.last_name} self-registered with MRN ${mrn}`,
    });

    return { user: newUser, patient: newPatient, token };
  }
}

export const authService = new AuthService();
