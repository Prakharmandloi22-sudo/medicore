import { Request, Response, NextFunction } from 'express';
import { db } from '../db';

export const listDepartments = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ data: db.departments });
};

export const listProviders = async (req: Request, res: Response): Promise<void> => {
  const departmentId = req.query.departmentId as string;
  let providers = db.providers;
  if (departmentId) {
    providers = providers.filter(p => p.department_id === departmentId);
  }
  res.status(200).json({ data: providers });
};

export const listStaff = async (req: Request, res: Response): Promise<void> => {
  const staffUsers = db.users
    .filter(u => u.role !== 'patient')
    .map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      fullName: u.full_name,
      phone: u.phone,
      isActive: u.is_active,
    }));
  res.status(200).json({ data: staffUsers });
};
