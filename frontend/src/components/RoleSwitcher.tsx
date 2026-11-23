'use client';

import React from 'react';
import { UserSession, api, setSessionToken } from '../lib/api';

interface RoleSwitcherProps {
  currentRole: string;
  onRoleChanged: (session: UserSession) => void;
  isLoading: boolean;
}

const PRESET_ACCOUNTS = [
  { role: 'doctor', email: 'doctor.carter@medicore.internal', label: 'Doctor (Dr. Carter)', color: 'bg-emerald-600' },
  { role: 'receptionist', email: 'receptionist.amy@medicore.internal', label: 'Receptionist (Amy)', color: 'bg-amber-600' },
  { role: 'patient', email: 'patient.john@medicore.internal', label: 'Patient (John Doe)', color: 'bg-sky-600' },
  { role: 'nurse', email: 'nurse.sarah@medicore.internal', label: 'Nurse (Sarah, RN)', color: 'bg-purple-600' },
  { role: 'lab_tech', email: 'labtech.marcus@medicore.internal', label: 'Lab Tech (Marcus)', color: 'bg-indigo-600' },
  { role: 'billing_officer', email: 'billing.diana@medicore.internal', label: 'Billing (Diana)', color: 'bg-rose-600' },
  { role: 'admin', email: 'admin@medicore.internal', label: 'Admin (System)', color: 'bg-slate-800' },
];

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChanged, isLoading }) => {
  const switchRole = async (email: string) => {
    try {
      const res = await api.login(email, 'Password123!');
      setSessionToken(res.token);
      onRoleChanged(res);
    } catch (err: any) {
      alert(`Role switch error: ${err.message}`);
    }
  };

  return (
    <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2 shadow-inner">
      <div className="flex items-center space-x-2">
        <span className="font-bold tracking-wider uppercase text-slate-400">Assessment Role Switcher:</span>
        <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
          Active: <strong className="text-white uppercase">{currentRole}</strong>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESET_ACCOUNTS.map(acc => {
          const isActive = currentRole === acc.role;
          return (
            <button
              key={acc.role}
              onClick={() => switchRole(acc.email)}
              disabled={isLoading || isActive}
              className={`px-2.5 py-1 rounded transition-all font-medium ${
                isActive
                  ? `${acc.color} text-white ring-2 ring-white ring-offset-1 ring-offset-slate-900 font-bold shadow`
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              } disabled:opacity-50`}
            >
              {acc.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
