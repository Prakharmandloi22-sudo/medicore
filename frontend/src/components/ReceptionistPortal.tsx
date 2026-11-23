'use client';

import React, { useState, useEffect } from 'react';
import { api, UserSession } from '../lib/api';
import { UserPlus, Calendar, AlertTriangle, CheckCircle, Clock, Search } from 'lucide-react';

export const ReceptionistPortal: React.FC<{ session: UserSession }> = ({ session }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Register form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('1988-05-20');
  const [gender, setGender] = useState('Female');
  const [phone, setPhone] = useState('+1-555-0155');
  const [email, setEmail] = useState('');

  // Book appointment form state
  const [bookPatientId, setBookPatientId] = useState('');
  const [bookProviderId, setBookProviderId] = useState('prov-carter');
  const [bookTime, setBookTime] = useState('');
  const [bookReason, setBookReason] = useState('');

  const loadData = async () => {
    try {
      const pats = await api.getPatients(search);
      setPatients(pats.patients);
      if (pats.patients.length > 0 && !bookPatientId) {
        setBookPatientId(pats.patients[0].id);
      }
      const apts = await api.getAppointments();
      setAppointments(apts);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const newPat = await api.createPatient({
        firstName,
        lastName,
        dateOfBirth: dob,
        gender,
        contactPhone: phone,
        contactEmail: email || undefined,
      });
      setMsg(`Registered new patient ${newPat.first_name} ${newPat.last_name} with MRN ${newPat.mrn}!`);
      setShowRegister(false);
      setFirstName('');
      setLastName('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');
    try {
      const res = await api.bookAppointment({
        patientId: bookPatientId,
        providerId: bookProviderId,
        scheduledStart: new Date(bookTime).toISOString(),
        durationMinutes: 30,
        reason: bookReason,
      });
      setMsg(`Successfully booked appointment ${res.id} for ${res.patient_name}!`);
      loadData();
    } catch (err: any) {
      // CAPSTONE COLLISION HIGHLIGHT
      setErrorMsg(`CAPSTONE COLLISION DETECTED: ${err.message}`);
    }
  };

  const handleCheckIn = async (aptId: string) => {
    try {
      await api.updateAppointmentStatus(aptId, 'CHECKED_IN');
      setMsg(`Patient checked in. Transitioned to CHECKED_IN.`);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Reception & Front Desk Console</h1>
          <p className="text-sm text-slate-500 mt-1">
            Operator: <strong>Amy Adams</strong> | Patient Registration, Schedule Concurrency & Triage Check-in
          </p>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center space-x-2 text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Patient Registration Modal */}
      {showRegister && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 text-base flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-amber-600" />
            <span>New Patient Intake & MRN Generation</span>
          </h3>
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">First Name</label>
              <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Last Name</label>
              <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Date of Birth</label>
              <input type="date" required value={dob} onChange={e => setDob(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white">
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone</label>
              <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div className="md:col-span-3 flex justify-end space-x-2">
              <button type="button" onClick={() => setShowRegister(false)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-sm bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700">Register & Assign MRN</button>
            </div>
          </form>
        </div>
      )}

      {/* Grid: Booking Scheduler & Front Desk Check-in List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduler Form with Capstone Protection */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Calendar className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-slate-900 text-base">Schedule Appointment (With Collision Guard)</h2>
          </div>
          <form onSubmit={handleBook} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Patient</label>
              <select
                value={bookPatientId}
                onChange={e => setBookPatientId(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.mrn})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Physician</label>
                <select
                  value={bookProviderId}
                  onChange={e => setBookProviderId(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="prov-carter">Dr. Sarah Carter, MD (Cardiology)</option>
                  <option value="prov-chen">Dr. Robert Chen, MD (General Medicine)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={bookTime}
                  onChange={e => setBookTime(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Reason for Visit</label>
              <input
                type="text"
                required
                placeholder="e.g. Follow-up consultation"
                value={bookReason}
                onChange={e => setBookReason(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-sm shadow transition"
            >
              Verify Schedule & Book Slot
            </button>
          </form>
        </div>

        {/* Today's Appointments & Check-in */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-slate-900 text-base">Front Desk Check-in Queue</h2>
          </div>
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {appointments.map(apt => (
              <div key={apt.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm text-slate-900">{apt.patient_name || 'Patient'}</p>
                  <p className="text-xs text-slate-500">{new Date(apt.scheduled_start).toLocaleString()} — {apt.provider_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                    apt.status === 'CHECKED_IN' ? 'bg-purple-100 text-purple-800' :
                    apt.status === 'SCHEDULED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {apt.status}
                  </span>
                  {apt.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleCheckIn(apt.id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2.5 py-1 rounded font-medium"
                    >
                      Check In
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
