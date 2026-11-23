import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { notificationService } from '../services/notificationService';

const sendNotificationSchema = z.object({
  recipient: z.string().min(1),
  channel: z.enum(['EMAIL', 'SMS']),
  templateName: z.string().min(1),
  payload: z.record(z.any()).default({}),
  idempotencyKey: z.string().optional(),
});

export const sendNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = sendNotificationSchema.parse(req.body);
    const key = (req.headers['idempotency-key'] as string) || data.idempotencyKey;
    const result = await notificationService.sendSandboxNotification({
      recipient: data.recipient,
      channel: data.channel,
      templateName: data.templateName,
      payload: data.payload,
      idempotencyKey: key,
    });
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const listNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const list = await notificationService.listNotifications();
    res.status(200).json({ data: list });
  } catch (err) {
    next(err);
  }
};
