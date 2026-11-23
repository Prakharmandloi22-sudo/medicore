import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { Diagnosis, Prescription, LabOrder, LabResult, LabFlag } from '../db/types';
import { logAudit } from '../middleware/auditLogger';

export class ClinicalService {
  // --- DIAGNOSES ---
  async addDiagnosis(data: {
    encounterId: string;
    patientId: string;
    code: string;
    description: string;
    category?: string;
    isPrimary?: boolean;
  }, userId?: string): Promise<Diagnosis> {
    const diag: Diagnosis = {
      id: `diag-${uuidv4().substring(0, 8)}`,
      encounter_id: data.encounterId,
      patient_id: data.patientId,
      code: data.code,
      description: data.description,
      category: data.category || 'General',
      is_primary: data.isPrimary || false,
      recorded_at: new Date().toISOString(),
    };

    db.diagnoses.push(diag);

    logAudit({
      userId,
      action: 'CREATE',
      entityType: 'DIAGNOSIS',
      entityId: diag.id,
      patientId: data.patientId,
      newState: diag,
      rationale: `Added diagnosis ${data.code} (${data.description})`,
    });

    return diag;
  }

  async listDiagnoses(patientId: string): Promise<Diagnosis[]> {
    return db.diagnoses.filter(d => d.patient_id === patientId);
  }

  // --- PRESCRIPTIONS ---
  async addPrescription(data: {
    encounterId?: string;
    patientId: string;
    providerId: string;
    medicationName: string;
    dosage: string;
    route?: string;
    frequency: string;
    durationDays?: number;
    refillsAllowed?: number;
    instructions?: string;
  }, userId?: string): Promise<Prescription> {
    // Validation check
    if (!data.medicationName || !data.dosage || !data.frequency) {
      throw { statusCode: 400, code: 'INVALID_PRESCRIPTION', message: 'Medication name, dosage, and frequency are required.' };
    }

    const rx: Prescription = {
      id: `rx-${uuidv4().substring(0, 8)}`,
      encounter_id: data.encounterId,
      patient_id: data.patientId,
      provider_id: data.providerId,
      medication_name: data.medicationName,
      dosage: data.dosage,
      route: data.route || 'ORAL',
      frequency: data.frequency,
      duration_days: data.durationDays || 7,
      refills_allowed: data.refillsAllowed || 0,
      status: 'ACTIVE',
      instructions: data.instructions,
      issued_at: new Date().toISOString(),
    };

    db.prescriptions.push(rx);

    logAudit({
      userId,
      action: 'CREATE',
      entityType: 'PRESCRIPTION',
      entityId: rx.id,
      patientId: data.patientId,
      newState: rx,
      rationale: `Issued prescription: ${rx.medication_name} ${rx.dosage}`,
    });

    return rx;
  }

  async listPrescriptions(patientId?: string): Promise<Prescription[]> {
    if (patientId) {
      return db.prescriptions.filter(p => p.patient_id === patientId);
    }
    return db.prescriptions;
  }

  // --- LAB ORDERS & RESULTS ---
  async createLabOrder(data: {
    encounterId?: string;
    patientId: string;
    providerId: string;
    orderCode: string;
    testName: string;
    priority?: 'ROUTINE' | 'URGENT' | 'STAT';
  }, userId?: string): Promise<LabOrder> {
    const order: LabOrder = {
      id: `lo-${uuidv4().substring(0, 8)}`,
      encounter_id: data.encounterId,
      patient_id: data.patientId,
      provider_id: data.providerId,
      order_code: data.orderCode,
      test_name: data.testName,
      priority: data.priority || 'ROUTINE',
      status: 'ORDERED',
      ordered_at: new Date().toISOString(),
    };

    db.labOrders.push(order);

    logAudit({
      userId,
      action: 'CREATE',
      entityType: 'LAB_ORDER',
      entityId: order.id,
      patientId: data.patientId,
      newState: order,
      rationale: `Ordered laboratory test ${order.order_code} (${order.test_name})`,
    });

    return order;
  }

  async recordLabResult(data: {
    labOrderId: string;
    testCode: string;
    testName: string;
    numericValue: number;
    unit: string;
    referenceMin?: number;
    referenceMax?: number;
    notes?: string;
  }, labTechUserId?: string): Promise<LabResult> {
    const order = db.labOrders.find(o => o.id === data.labOrderId);
    if (!order) {
      throw { statusCode: 404, code: 'LAB_ORDER_NOT_FOUND', message: 'Lab order does not exist.' };
    }

    // Reference range flag evaluation
    let flag: LabFlag = 'NORMAL';
    if (data.referenceMin !== undefined && data.numericValue < data.referenceMin) {
      flag = 'ABNORMAL_LOW';
    } else if (data.referenceMax !== undefined && data.numericValue > data.referenceMax) {
      flag = 'ABNORMAL_HIGH';
    }

    // Critical check
    if (data.testCode === 'K' && (data.numericValue < 2.8 || data.numericValue > 6.2)) {
      flag = 'CRITICAL';
    } else if (data.testCode === 'GLU' && (data.numericValue < 50 || data.numericValue > 350)) {
      flag = 'CRITICAL';
    }

    const result: LabResult = {
      id: `lr-${uuidv4().substring(0, 8)}`,
      lab_order_id: data.labOrderId,
      patient_id: order.patient_id,
      test_code: data.testCode,
      test_name: data.testName,
      numeric_value: data.numericValue,
      unit: data.unit,
      reference_min: data.referenceMin,
      reference_max: data.referenceMax,
      flag,
      verified_by: labTechUserId,
      verified_at: new Date().toISOString(),
      notes: data.notes,
    };

    db.labResults.push(result);
    order.status = 'COMPLETED';

    logAudit({
      userId: labTechUserId,
      action: 'CREATE',
      entityType: 'LAB_RESULT',
      entityId: result.id,
      patientId: order.patient_id,
      newState: result,
      rationale: `Verified lab result for ${result.test_code}: ${result.numeric_value} ${result.unit} (Flag: ${flag})`,
    });

    return result;
  }

  async listLabOrders(patientId?: string): Promise<LabOrder[]> {
    if (patientId) {
      return db.labOrders.filter(lo => lo.patient_id === patientId);
    }
    return db.labOrders;
  }

  async listLabResults(patientId?: string): Promise<LabResult[]> {
    if (patientId) {
      return db.labResults.filter(lr => lr.patient_id === patientId);
    }
    return db.labResults;
  }
}

export const clinicalService = new ClinicalService();
