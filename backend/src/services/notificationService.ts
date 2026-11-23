import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { NotificationLog } from '../db/types';

export interface SendNotificationOptions {
  recipient: string;
  channel: 'EMAIL' | 'SMS';
  templateName: string;
  payload: any;
  idempotencyKey?: string;
}

export class NotificationService {
  async sendSandboxNotification(options: SendNotificationOptions): Promise<NotificationLog> {
    const key = options.idempotencyKey || `idem-${uuidv4().substring(0, 8)}`;

    // Idempotency check: prevent duplicate notifications
    const existing = db.notifications.find(n => n.idempotency_key === key);
    if (existing) {
      return existing;
    }

    const logEntry: NotificationLog = {
      id: `notif-${uuidv4().substring(0, 8)}`,
      recipient: options.recipient,
      channel: options.channel,
      template_name: options.templateName,
      payload: options.payload,
      status: 'DELIVERED',
      idempotency_key: key,
      sent_at: new Date().toISOString(),
    };

    db.notifications.unshift(logEntry);
    return logEntry;
  }

  async listNotifications(limit: number = 50): Promise<NotificationLog[]> {
    return db.notifications.slice(0, limit);
  }
}

export const notificationService = new NotificationService();
