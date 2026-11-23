'use client';

import React, { useState, useEffect } from 'react';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { PatientPortal } from '../components/PatientPortal';
import { DoctorPortal } from '../components/DoctorPortal';
import { ReceptionistPortal } from '../components/ReceptionistPortal';
import { NursePortal } from '../components/NursePortal';
import { LabTechPortal } from '../components/LabTechPortal';
import { BillingPortal } from '../components/BillingPortal';
import { AdminPortal } from '../components/AdminPortal';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { UserSession, api, setSessionToken } from '../lib/api';
import { Hospital, BarChart3, Shield, User, LogOut } from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'portal' | 'analytics'>('portal');
  const [loading, setLoading] = useState(true);

  // Initial auto-login as Doctor for immediate evaluation demo
  useEffect(() => {
    async function initAuth() {
      try {
        const res = await api.login('doctor.carter@medicore.internal', 'Password123!');
        setSessionToken(res.token);
        setSession(res);
      } catch (e) {
        console.error('Initial login fallback', e);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const handleRoleChanged = (newSession: UserSession) => {
    setSession(newSession);
    setActiveTab('portal');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Hospital className="w-10 h-10 text-sky-600 animate-bounce mx-auto" />
          <p className="text-slate-600 font-medium">Bootstrapping MediCore Operations Platform...</p>
        </div>
      </div>
    );
  }

  const role = session?.user?.role || 'patient';

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* 1-Click Role Switcher Demo Bar */}
      <RoleSwitcher
        currentRole={role}
        onRoleChanged={handleRoleChanged}
        isLoading={false}
      />

      {/* Main Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-sky-600 text-white p-2 rounded-xl shadow-md">
              <Hospital className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">Medi<span className="text-sky-600">Core</span></span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                Hospital Operations
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-bold">
              <button
                onClick={() => setActiveTab('portal')}
                className={`px-3 py-1.5 rounded-md transition ${
                  activeTab === 'portal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Role Portal View
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 rounded-md transition flex items-center space-x-1.5 ${
                  activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
                <span>FastAPI Analytics</span>
              </button>
            </div>

            {/* Active User Badge */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs uppercase">
                {session?.user.fullName ? session.user.fullName[0] : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{session?.user.fullName}</p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">{session?.user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'analytics' ? (
          <AnalyticsDashboard />
        ) : (
          <>
            {role === 'patient' && session && <PatientPortal session={session} />}
            {role === 'doctor' && session && <DoctorPortal session={session} />}
            {role === 'receptionist' && session && <ReceptionistPortal session={session} />}
            {role === 'nurse' && session && <NursePortal session={session} />}
            {role === 'lab_tech' && session && <LabTechPortal session={session} />}
            {role === 'billing_officer' && session && <BillingPortal session={session} />}
            {role === 'admin' && session && <AdminPortal session={session} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        MediCore Healthcare Operations Platform — Assessment Portfolio & Synthetic Clinical Environment.
      </footer>
    </div>
  );
}
