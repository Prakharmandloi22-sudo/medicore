'use client';

import React, { useState, useEffect } from 'react';
import { api, UserSession } from '../lib/api';
import { Calendar, FileText, Activity, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export const PatientPortal: React.FC<{ session: UserSession }> = ({ session }) => {
  const [chart, setChart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [reason, setReason] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      if (session.user.patientId) {
        const data = await api.getPatientChart(session.user.patientId);
        setChart(data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session.user.patientId]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.bookAppointment({
        patientId: session.user.patientId,
        providerId: 'prov-carter', // Default Dr. Carter
        scheduledStart: new Date(bookingDate).toISOString(),
        durationMinutes: 30,
        reason,
      });
      setSuccessMsg('Appointment booked successfully! A confirmation notification was sent to your email.');
      setShowBooking(false);
      setReason('');
      setBookingDate('');
      loadData();
    } catch (err: any) {
      alert(`Booking failed: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading your confidential health records...</div>;
  }

  const patient = chart?.patient;

  return (
    <div className="space-y-6">
      {/* Patient Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">{patient?.first_name} {patient?.last_name}</h1>
            <span className="bg-sky-100 text-sky-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              {patient?.mrn}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            DOB: {patient?.date_of_birth} | Blood Type: <strong className="text-slate-700">{patient?.blood_type || 'Unknown'}</strong> | Phone: {patient?.contact_phone}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-slate-400 font-medium">Allergies:</span>
            {patient?.allergies && patient.allergies.length > 0 ? (
              patient.allergies.map((alg: string, idx: number) => (
                <span key={idx} className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-md font-medium">
                  {alg}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">No known drug allergies (NKDA)</span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowBooking(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center space-x-2 text-sm"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Consultation</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 text-base flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>Schedule New Appointment</span>
          </h3>
          <form onSubmit={handleBook} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Provider</label>
              <select className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white">
                <option value="prov-carter">Dr. Sarah Carter, MD (Cardiology)</option>
                <option value="prov-chen">Dr. Robert Chen, MD (General Medicine)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Preferred Date & Time</label>
              <input
                type="datetime-local"
                required
                value={bookingDate}
                onChange={e => setBookingDate(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Reason for Visit</label>
              <input
                type="text"
                required
                placeholder="e.g. Follow-up consultation"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
              />
            </div>
            <div className="md:col-span-3 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowBooking(false)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-sm rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700"
              >
                Confirm Appointment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid: Appointments & Prescriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
            <Clock className="w-5 h-5 text-sky-600" />
            <h2 className="font-bold text-slate-900 text-lg">My Appointments</h2>
          </div>
          <div className="space-y-3">
            {chart?.appointments && chart.appointments.length > 0 ? (
              chart.appointments.map((apt: any) => (
                <div key={apt.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{apt.reason}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(apt.scheduled_start).toLocaleString()} with {apt.provider_name || 'Assigned Provider'}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                    apt.status === 'SCHEDULED' ? 'bg-amber-100 text-amber-800' :
                    apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                    apt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">No appointments on record.</p>
            )}
          </div>
        </div>

        {/* Prescriptions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-lg">Active Medications & Prescriptions</h2>
          </div>
          <div className="space-y-3">
            {chart?.prescriptions && chart.prescriptions.length > 0 ? (
              chart.prescriptions.map((rx: any) => (
                <div key={rx.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm text-slate-900">{rx.medication_name} ({rx.dosage})</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
                      {rx.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Instructions: {rx.frequency} — {rx.instructions || 'As directed'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Refills remaining: {rx.refills_allowed} | Route: {rx.route}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">No active prescriptions.</p>
            )}
          </div>
        </div>
      </div>

      {/* Laboratory Results */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-900 text-lg">Diagnostic Laboratory Results</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="p-3 font-semibold">Test Name</th>
                <th className="p-3 font-semibold">Measured Value</th>
                <th className="p-3 font-semibold">Reference Range</th>
                <th className="p-3 font-semibold">Status Flag</th>
                <th className="p-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chart?.labResults && chart.labResults.length > 0 ? (
                chart.labResults.map((lr: any) => (
                  <tr key={lr.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-medium text-slate-800">{lr.test_name} ({lr.test_code})</td>
                    <td className="p-3 font-bold text-slate-900">{lr.numeric_value} {lr.unit}</td>
                    <td className="p-3 text-slate-500">{lr.reference_min} - {lr.reference_max} {lr.unit}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                        lr.flag === 'NORMAL' ? 'bg-emerald-100 text-emerald-800' :
                        lr.flag === 'CRITICAL' ? 'bg-rose-600 text-white font-extrabold animate-pulse' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {lr.flag}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-xs">{lr.notes || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400 italic">No lab results available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Consents */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
          <ShieldCheck className="w-5 h-5 text-sky-600" />
          <h2 className="font-bold text-slate-900 text-lg">My Health Privacy & Consent Records</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {chart?.consents && chart.consents.length > 0 ? (
            chart.consents.map((c: any) => (
              <div key={c.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm text-slate-800">{c.consent_type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${c.is_granted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {c.is_granted ? 'ACTIVE' : 'REVOKED'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{c.notes}</p>
                <p className="text-xs text-slate-400 mt-2">Granted: {new Date(c.granted_at).toLocaleDateString()}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 italic">No consent records found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
