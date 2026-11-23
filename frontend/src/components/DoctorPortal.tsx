'use client';

import React, { useState, useEffect } from 'react';
import { api, UserSession } from '../lib/api';
import { Stethoscope, CheckCircle, PlusCircle, AlertCircle, Clock, Pill, FlaskConical } from 'lucide-react';

export const DoctorPortal: React.FC<{ session: UserSession }> = ({ session }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [selectedEncounter, setSelectedEncounter] = useState<any>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagCode, setDiagCode] = useState('I20.9');
  const [diagDesc, setDiagDesc] = useState('Angina pectoris, unspecified');
  const [medName, setMedName] = useState('Metoprolol 25mg');
  const [medFreq, setMedFreq] = useState('Twice daily with meals');
  const [testCode, setTestCode] = useState('GLU');
  const [testName, setTestName] = useState('Fasting Blood Glucose');
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    try {
      const apts = await api.getAppointments({ providerId: session.user.providerId || 'prov-carter' });
      setAppointments(apts);
      const encs = await api.getEncounters();
      setEncounters(encs);
      if (encs.length > 0 && !selectedEncounter) {
        setSelectedEncounter(encs[0]);
        setClinicalNotes(encs[0].clinical_notes || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [session.user.providerId]);

  const handleStartConsultation = async (patientId: string, aptId?: string) => {
    try {
      const newEnc = await api.createEncounter({
        patientId,
        providerId: session.user.providerId || 'prov-carter',
        appointmentId: aptId,
        encounterType: 'AMBULATORY',
        chiefComplaint: 'Follow-up cardiac review and prescription management',
      });
      setMsg(`Started new encounter ${newEnc.id} for patient.`);
      loadData();
      setSelectedEncounter(newEnc);
    } catch (err: any) {
      alert(`Could not start encounter: ${err.message}`);
    }
  };

  const handleAddDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter) return;
    try {
      await api.addDiagnosis({
        encounterId: selectedEncounter.id,
        patientId: selectedEncounter.patient_id,
        code: diagCode,
        description: diagDesc,
        isPrimary: true,
      });
      setMsg(`Added ICD-10 Diagnosis ${diagCode} to patient record.`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter) return;
    try {
      await api.addPrescription({
        encounterId: selectedEncounter.id,
        patientId: selectedEncounter.patient_id,
        providerId: session.user.providerId || 'prov-carter',
        medicationName: medName,
        dosage: 'Standard',
        frequency: medFreq,
        durationDays: 30,
        refillsAllowed: 2,
      });
      setMsg(`Prescribed ${medName} successfully.`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOrderLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter) return;
    try {
      await api.createLabOrder({
        encounterId: selectedEncounter.id,
        patientId: selectedEncounter.patient_id,
        providerId: session.user.providerId || 'prov-carter',
        orderCode: testCode,
        testName,
        priority: 'ROUTINE',
      });
      setMsg(`Lab order placed for ${testName} (${testCode}).`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompleteEncounter = async () => {
    if (!selectedEncounter) return;
    try {
      await api.completeEncounter(selectedEncounter.id, clinicalNotes);
      setMsg(`Encounter ${selectedEncounter.id} marked as COMPLETED.`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-3">
            <Stethoscope className="w-6 h-6 text-emerald-600" />
            <span>Clinician Care Console — {session.user.fullName}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Department: <strong>Cardiovascular Medicine</strong> | License: <strong>MD-CARD-8831</strong> | Schedule: 09:00 - 17:00
          </p>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Grid: Appointments schedule & Active Clinical Encounter Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments Queue */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-1">
          <h2 className="font-bold text-slate-900 text-base mb-3 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Assigned Patient Queue</span>
          </h2>
          <div className="space-y-3">
            {appointments.length > 0 ? (
              appointments.map(apt => (
                <div key={apt.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{apt.patient_name || 'Patient'}</p>
                      <p className="text-xs text-slate-500">{new Date(apt.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({apt.duration_minutes}m)</p>
                    </div>
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {apt.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 italic">&ldquo;{apt.reason}&rdquo;</p>
                  <button
                    onClick={() => handleStartConsultation(apt.patient_id, apt.id)}
                    className="w-full text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded transition mt-1"
                  >
                    Start Consultation Encounter
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">No scheduled patients today.</p>
            )}
          </div>
        </div>

        {/* Clinical Encounter Workspace */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Active Consultation Workspace</h2>
              <p className="text-xs text-slate-500">
                {selectedEncounter ? `Encounter ID: ${selectedEncounter.id} (Status: ${selectedEncounter.status})` : 'Select or start an encounter'}
              </p>
            </div>
            {selectedEncounter && selectedEncounter.status === 'IN_PROGRESS' && (
              <button
                onClick={handleCompleteEncounter}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
              >
                Complete & Lock Encounter
              </button>
            )}
          </div>

          {selectedEncounter ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Subjective / Objective Clinical Notes</label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={e => setClinicalNotes(e.target.value)}
                  placeholder="Record patient presentation, cardiovascular auscultation, symptoms, and plan..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white transition"
                />
              </div>

              {/* Add Diagnosis & Prescription Forms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Diagnosis */}
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
                  <h3 className="text-xs font-bold uppercase text-slate-700 flex items-center space-x-1.5">
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ICD-10 Clinical Diagnosis</span>
                  </h3>
                  <form onSubmit={handleAddDiagnosis} className="space-y-2">
                    <select
                      value={diagCode}
                      onChange={e => {
                        setDiagCode(e.target.value);
                        if (e.target.value === 'I20.9') setDiagDesc('Angina pectoris, unspecified');
                        if (e.target.value === 'I10') setDiagDesc('Essential (primary) hypertension');
                        if (e.target.value === 'I49.9') setDiagDesc('Cardiac arrhythmia, unspecified');
                      }}
                      className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                    >
                      <option value="I20.9">I20.9 — Angina pectoris, unspecified</option>
                      <option value="I10">I10 — Essential (primary) hypertension</option>
                      <option value="I49.9">I49.9 — Cardiac arrhythmia, unspecified</option>
                    </select>
                    <button type="submit" className="w-full text-xs bg-slate-800 hover:bg-slate-900 text-white py-1 rounded font-medium">
                      Append Diagnosis
                    </button>
                  </form>
                </div>

                {/* Prescription */}
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
                  <h3 className="text-xs font-bold uppercase text-slate-700 flex items-center space-x-1.5">
                    <Pill className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Issue Medication Order</span>
                  </h3>
                  <form onSubmit={handleAddPrescription} className="space-y-2">
                    <input
                      type="text"
                      value={medName}
                      onChange={e => setMedName(e.target.value)}
                      placeholder="Medication name & strength"
                      className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                    />
                    <button type="submit" className="w-full text-xs bg-slate-800 hover:bg-slate-900 text-white py-1 rounded font-medium">
                      Issue Prescription
                    </button>
                  </form>
                </div>
              </div>

              {/* Lab Order */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
                <h3 className="text-xs font-bold uppercase text-slate-700 flex items-center space-x-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Order Diagnostic Laboratory Test</span>
                </h3>
                <form onSubmit={handleOrderLab} className="flex gap-2">
                  <select
                    value={testCode}
                    onChange={e => {
                      setTestCode(e.target.value);
                      if (e.target.value === 'GLU') setTestName('Fasting Blood Glucose');
                      if (e.target.value === 'CHOL') setTestName('Total Cholesterol Panel');
                      if (e.target.value === 'K') setTestName('Serum Potassium Electrolyte');
                      if (e.target.value === 'TROP-I') setTestName('Troponin I (Cardiac STAT)');
                    }}
                    className="flex-1 text-xs border border-slate-300 rounded p-1.5 bg-white"
                  >
                    <option value="GLU">GLU — Fasting Blood Glucose</option>
                    <option value="CHOL">CHOL — Total Cholesterol Panel</option>
                    <option value="K">K — Serum Potassium Electrolyte</option>
                    <option value="TROP-I">TROP-I — Troponin I (Cardiac STAT)</option>
                  </select>
                  <button type="submit" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded font-medium">
                    Dispatch Order
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 italic">
              Please choose a scheduled patient or create a new encounter to view notes and prescribe treatments.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
