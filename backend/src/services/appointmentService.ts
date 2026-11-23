import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { Appointment, AppointmentStatus, WaitingListEntry } from '../db/types';
import { logAudit } from '../middleware/auditLogger';
import { notificationService } from './notificationService';

export class AppointmentService {
  async listAppointments(filter: {
    patientId?: string;
    providerId?: string;
    departmentId?: string;
    status?: AppointmentStatus;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Appointment[]> {
    return db.appointments.filter(a => {
      if (filter.patientId && a.patient_id !== filter.patientId) return false;
      if (filter.providerId && a.provider_id !== filter.providerId) return false;
      if (filter.departmentId && a.department_id !== filter.departmentId) return false;
      if (filter.status && a.status !== filter.status) return false;
      if (filter.startDate && new Date(a.scheduled_start) < new Date(filter.startDate)) return false;
      if (filter.endDate && new Date(a.scheduled_start) > new Date(filter.endDate)) return false;
      return true;
    }).sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    const apt = db.appointments.find(a => a.id === id);
    if (!apt) {
      throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: `Appointment ${id} not found.` };
    }
    return apt;
  }

  /**
   * CAPSTONE CHALLENGE & ASSESSMENT 07:
   * Concurrency-safe appointment booking that strictly blocks overlapping doctor schedules.
   */
  async bookAppointment(data: {
    patientId: string;
    providerId: string;
    departmentId?: string;
    scheduledStart: string;
    durationMinutes?: number;
    reason: string;
  }, requestingUserId?: string): Promise<Appointment> {
    const duration = data.durationMinutes || 30;
    const startTime = new Date(data.scheduledStart);
    if (isNaN(startTime.getTime())) {
      throw { statusCode: 400, code: 'INVALID_TIMESTAMP', message: 'scheduledStart must be a valid ISO 8601 timestamp.' };
    }

    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Verify patient
    const patient = db.patients.find(p => p.id === data.patientId);
    if (!patient) {
      throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: 'Patient does not exist.' };
    }

    // Verify provider
    const provider = db.providers.find(p => p.id === data.providerId && p.is_active);
    if (!provider) {
      throw { statusCode: 404, code: 'PROVIDER_NOT_FOUND', message: 'Active healthcare provider not found.' };
    }

    const departmentId = data.departmentId || provider.department_id;
    const department = db.departments.find(d => d.id === departmentId);

    // ATOMIC CONCURRENCY CHECK: Detect overlapping appointments for this doctor
    const hasCollision = db.checkProviderSlotCollision(provider.id, startTime, endTime);
    if (hasCollision) {
      logAudit({
        userId: requestingUserId,
        action: 'CREATE',
        entityType: 'APPOINTMENT',
        entityId: 'CONFLICT_REJECTED',
        patientId: patient.id,
        rationale: `CONCURRENCY_BLOCKED: Overlapping appointment booking rejected for Dr. ${provider.full_name} at ${startTime.toISOString()}`,
      });

      throw {
        statusCode: 409,
        code: 'SCHEDULE_COLLISION',
        message: `Conflict: Provider ${provider.full_name || provider.license_number} is already booked during this time interval (${startTime.toISOString()} to ${endTime.toISOString()}).`,
      };
    }

    const appointmentId = `apt-${uuidv4().substring(0, 8)}`;
    const newAppointment: Appointment = {
      id: appointmentId,
      patient_id: patient.id,
      provider_id: provider.id,
      department_id: departmentId,
      scheduled_start: startTime.toISOString(),
      scheduled_end: endTime.toISOString(),
      duration_minutes: duration,
      status: 'SCHEDULED',
      reason: data.reason,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      patient_name: `${patient.first_name} ${patient.last_name}`,
      provider_name: provider.full_name,
      department_name: department?.name,
    };

    db.appointments.push(newAppointment);

    // Audit log
    logAudit({
      userId: requestingUserId,
      action: 'CREATE',
      entityType: 'APPOINTMENT',
      entityId: appointmentId,
      patientId: patient.id,
      newState: newAppointment,
      rationale: `Booked appointment for ${patient.first_name} ${patient.last_name} with ${provider.full_name}`,
    });

    // Dispatch sandbox confirmation notification
    await notificationService.sendSandboxNotification({
      recipient: patient.contact_email || patient.contact_phone,
      channel: patient.contact_email ? 'EMAIL' : 'SMS',
      templateName: 'APPOINTMENT_CONFIRMATION',
      payload: {
        appointmentId,
        patientName: `${patient.first_name} ${patient.last_name}`,
        providerName: provider.full_name,
        scheduledStart: startTime.toISOString(),
      },
    });

    return newAppointment;
  }

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    options: { cancellationReason?: string; userId?: string } = {}
  ): Promise<Appointment> {
    const apt = await this.getAppointmentById(id);
    const prev = { ...apt };

    apt.status = status;
    if (status === 'CANCELLED' && options.cancellationReason) {
      apt.cancellation_reason = options.cancellationReason;
    }
    apt.updated_at = new Date().toISOString();

    logAudit({
      userId: options.userId,
      action: 'UPDATE',
      entityType: 'APPOINTMENT',
      entityId: id,
      patientId: apt.patient_id,
      previousState: prev,
      newState: apt,
      rationale: `Appointment status transitioned from ${prev.status} to ${status}`,
    });

    // If cancelled, check if waiting list entries can be promoted
    if (status === 'CANCELLED') {
      await this.checkWaitingListPromotion(apt);
    }

    return apt;
  }

  async checkWaitingListPromotion(cancelledApt: Appointment): Promise<WaitingListEntry | null> {
    const candidate = db.waitingList.find(
      w => w.department_id === cancelledApt.department_id && w.status === 'WAITING'
    );

    if (candidate) {
      candidate.status = 'OFFERED';
      const patient = db.patients.find(p => p.id === candidate.patient_id);
      if (patient) {
        await notificationService.sendSandboxNotification({
          recipient: patient.contact_email || patient.contact_phone,
          channel: patient.contact_email ? 'EMAIL' : 'SMS',
          templateName: 'WAITING_LIST_SLOT_AVAILABLE',
          payload: {
            slotTime: cancelledApt.scheduled_start,
            providerId: cancelledApt.provider_id,
          },
        });
      }
      return candidate;
    }
    return null;
  }

  async addToWaitingList(data: {
    patientId: string;
    departmentId: string;
    providerId?: string;
    preferredDateStart: string;
    preferredDateEnd: string;
    priority?: number;
  }): Promise<WaitingListEntry> {
    const entry: WaitingListEntry = {
      id: `wait-${uuidv4().substring(0, 8)}`,
      patient_id: data.patientId,
      department_id: data.departmentId,
      provider_id: data.providerId,
      preferred_date_start: data.preferredDateStart,
      preferred_date_end: data.preferredDateEnd,
      priority: data.priority || 1,
      status: 'WAITING',
      created_at: new Date().toISOString(),
    };
    db.waitingList.push(entry);
    return entry;
  }

  async listWaitingList(departmentId?: string): Promise<WaitingListEntry[]> {
    if (departmentId) {
      return db.waitingList.filter(w => w.department_id === departmentId);
    }
    return db.waitingList;
  }
}

export const appointmentService = new AppointmentService();
