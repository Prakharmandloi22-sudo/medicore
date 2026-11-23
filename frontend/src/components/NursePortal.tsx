'use client';

import React, { useState, useEffect } from 'react';
import { api, UserSession } from '../lib/api';
import { HeartPulse, CheckCircle2, AlertCircle, Activity } from 'lucide-react';

export const NursePortal: React.FC<{ session: UserSession }> = ({ session }) => {
  const [encounters, setEncounters] = useState<any[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState('');
  const [systolic, setSystolic] = useState(120);
  const [diastolic, setDiastolic] = useState(80);
  const [heartRate, setHeartRate] = useState(72);
  const [temp, setTemp] = useState(36.8);
  const [spO2, setSpO2] = useState(98);
  const [bmi, setBmi] = useState(23.5);
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    try {
      const encs = await api.getEncounters();
      setEncounters(encs);
      if (encs.length > 0 && !selectedEncounterId) {
        setSelectedEncounterId(encs[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounterId) return;
    try {
      await api.recordVitals(selectedEncounterId, {
        systolicBp: Number(systolic),
        diastolicBp: Number(diastolic),
        heartRate: Number(heartRate),
        temperatureC: Number(temp),
        spO2: Number(spO2),
        bmi: Number(bmi),
      });
      setMsg(`Vitals recorded successfully for Encounter ${selectedEncounterId}! (BP: ${systolic}/${diastolic}, HR: ${heartRate} bpm, SpO2: ${spO2}%)`);
    } catch (err: any) {
      alert(`Error recording vitals: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-3">
            <HeartPulse className="w-6 h-6 text-purple-600" />
            <span>Nurse Triage & Vitals Station</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Nurse: <strong>Sarah Jenkins, RN</strong> | Patient Triage, Physiological Monitoring & Vitals Intake
          </p>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Encounters List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-1">
          <h2 className="font-bold text-slate-900 text-base mb-3 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-purple-600" />
            <span>Encounters Awaiting Triage</span>
          </h2>
          <div className="space-y-2.5">
            {encounters.map(enc => (
              <button
                key={enc.id}
                onClick={() => setSelectedEncounterId(enc.id)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedEncounterId === enc.id
                    ? 'border-purple-500 bg-purple-50/70 font-semibold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-900">{enc.id}</span>
                  <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-purple-100 text-purple-800">
                    {enc.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 italic">&ldquo;{enc.chief_complaint}&rdquo;</p>
              </button>
            ))}
          </div>
        </div>

        {/* Vitals Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2 space-y-4">
          <h2 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">
            Physiological Vitals Entry — {selectedEncounterId || 'Select Encounter'}
          </h2>
          <form onSubmit={handleRecordVitals} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Systolic BP (mmHg)</label>
              <input type="number" required value={systolic} onChange={e => setSystolic(Number(e.target.value))} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Diastolic BP (mmHg)</label>
              <input type="number" required value={diastolic} onChange={e => setDiastolic(Number(e.target.value))} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Heart Rate (bpm)</label>
              <input type="number" required value={heartRate} onChange={e => setHeartRate(Number(e.target.value))} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Temperature (°C)</label>
              <input type="number" step="0.1" required value={temp} onChange={e => setTemp(Number(e.target.value))} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Oxygen Saturation SpO2 (%)</label>
              <input type="number" required value={spO2} onChange={e => setSpO2(Number(e.target.value))} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Body Mass Index (BMI)</label>
              <input type="number" step="0.1" required value={bmi} onChange={e => setBmi(Number(e.target.value))} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>

            <div className="md:col-span-3 pt-3">
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg text-sm shadow transition"
              >
                Submit Clinical Vitals & Attach to Chart
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
