'use client';

import React, { useState, useEffect } from 'react';
import { api, UserSession } from '../lib/api';
import { ShieldAlert, Server, Download, RefreshCw, Filter, CheckCircle2 } from 'lucide-react';

export const AdminPortal: React.FC<{ session: UserSession }> = ({ session }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filterAction, setFilterAction] = useState('');
  const [fhirJson, setFhirJson] = useState<string>('');
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    try {
      const res = await api.getAuditLogs({ action: filterAction || undefined });
      setLogs(res.logs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterAction]);

  const handleExportFhir = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/v1/fhir/export/pat-john-doe', {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const data = await res.json();
      setFhirJson(JSON.stringify(data, null, 2));
      setMsg('Exported standard FHIR R4 Bundle for John Doe (MRN-10001)!');
    } catch (err: any) {
      alert(`FHIR Export Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-slate-800" />
            <span>Hospital Systems Administration & Compliance Console</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administrator: <strong>Dr. Arthur Vance</strong> | Tamper-Evident Audit Trails, Security Forensics & FHIR Interop
          </p>
        </div>
        <button
          onClick={handleExportFhir}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center space-x-2 text-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export FHIR R4 Bundle</span>
        </button>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* FHIR Export Modal/Preview */}
      {fhirJson && (
        <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-lg space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-emerald-400">FHIR R4 Standard Patient Bundle (Application/FHIR+JSON)</span>
            <button onClick={() => setFhirJson('')} className="text-slate-400 hover:text-white">Close</button>
          </div>
          <pre className="max-h-60 overflow-y-auto bg-slate-950 p-3 rounded">{fhirJson}</pre>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-slate-800" />
            <h2 className="font-bold text-slate-900 text-lg">Immutable System Audit Trail</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white"
            >
              <option value="">All Actions</option>
              <option value="ACCESS_RECORD">ACCESS_RECORD (Security)</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="EXPORT_FHIR">EXPORT_FHIR</option>
            </select>
            <button onClick={loadData} className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100">
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 uppercase">
              <tr>
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5">Action</th>
                <th className="p-2.5">Entity</th>
                <th className="p-2.5">Target ID</th>
                <th className="p-2.5">IP Address</th>
                <th className="p-2.5">Rationale / Security Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(l => {
                const isAlert = l.rationale && l.rationale.includes('SECURITY_ALERT');
                return (
                  <tr key={l.id} className={isAlert ? 'bg-rose-50 text-rose-900 font-semibold' : 'hover:bg-slate-50'}>
                    <td className="p-2.5 text-slate-500">{new Date(l.created_at).toLocaleTimeString()}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isAlert ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="p-2.5">{l.entity_type}</td>
                    <td className="p-2.5 text-slate-600">{l.entity_id}</td>
                    <td className="p-2.5 text-slate-500">{l.ip_address}</td>
                    <td className="p-2.5">{l.rationale}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
