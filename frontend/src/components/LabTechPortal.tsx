'use client';

import React, { useState, useEffect } from 'react';
import { api, UserSession } from '../lib/api';
import { FlaskConical, CheckCircle2, AlertTriangle, FileCheck, Layers } from 'lucide-react';

export const LabTechPortal: React.FC<{ session: UserSession }> = ({ session }) => {
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [testCode, setTestCode] = useState('GLU');
  const [testName, setTestName] = useState('Fasting Blood Glucose');
  const [value, setValue] = useState(95);
  const [unit, setUnit] = useState('mg/dL');
  const [refMin, setRefMin] = useState(70);
  const [refMax, setRefMax] = useState(99);
  const [notes, setNotes] = useState('Specimen hemolyzed: none. Clean sample.');
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    try {
      const orders = await api.getLabOrders();
      setLabOrders(orders);
      if (orders.length > 0 && !selectedOrderId) {
        setSelectedOrderId(orders[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    try {
      const res = await api.recordLabResult({
        labOrderId: selectedOrderId,
        testCode,
        testName,
        numericValue: Number(value),
        unit,
        referenceMin: Number(refMin),
        referenceMax: Number(refMax),
        notes,
      });
      setMsg(`Result verified & published! Measured: ${res.numeric_value} ${res.unit} (Flag: ${res.flag})`);
      loadData();
    } catch (err: any) {
      alert(`Error publishing result: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-3">
            <FlaskConical className="w-6 h-6 text-indigo-600" />
            <span>Diagnostic Pathology & Laboratory Workbench</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Technologist: <strong>Marcus Vance, MLS</strong> | Specimen Testing, Reference Range Validation & Flags
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
        {/* Lab Orders Queue */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-1">
          <h2 className="font-bold text-slate-900 text-base mb-3 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Pending Specimen Orders</span>
          </h2>
          <div className="space-y-2.5">
            {labOrders.map(lo => (
              <button
                key={lo.id}
                onClick={() => {
                  setSelectedOrderId(lo.id);
                  setTestCode(lo.order_code);
                  setTestName(lo.test_name);
                }}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedOrderId === lo.id
                    ? 'border-indigo-500 bg-indigo-50/70 font-semibold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-900 font-bold">{lo.order_code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                    lo.priority === 'STAT' ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {lo.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{lo.test_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">Status: <strong className="uppercase">{lo.status}</strong></p>
              </button>
            ))}
          </div>
        </div>

        {/* Verification and Result Entry Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2 space-y-4">
          <h2 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            <span>Verify Specimen & Enter Results — Order: {selectedOrderId}</span>
          </h2>
          <form onSubmit={handleRecordResult} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Test Code</label>
              <input type="text" required value={testCode} onChange={e => setTestCode(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Test Name</label>
              <input type="text" required value={testName} onChange={e => setTestName(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Measured Value</label>
              <input type="number" step="0.01" required value={value} onChange={e => setValue(Number(e.target.value))} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Unit of Measure</label>
              <input type="text" required value={unit} onChange={e => setUnit(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Reference Range Minimum</label>
              <input type="number" step="0.01" required value={refMin} onChange={e => setRefMin(Number(e.target.value))} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Reference Range Maximum</label>
              <input type="number" step="0.01" required value={refMax} onChange={e => setRefMax(Number(e.target.value))} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Technologist Quality Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-sm shadow transition"
              >
                Evaluate Reference Ranges & Verify Result
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
