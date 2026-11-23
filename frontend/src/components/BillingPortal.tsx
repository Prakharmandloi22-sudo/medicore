'use client';

import React, { useState, useEffect } from 'react';
import { api, UserSession } from '../lib/api';
import { CreditCard, CheckCircle2, DollarSign, Receipt, PlusCircle } from 'lucide-react';

export const BillingPortal: React.FC<{ session: UserSession }> = ({ session }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(30);
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [showCreate, setShowCreate] = useState(false);
  const [patientId, setPatientId] = useState('pat-john-doe');
  const [itemDesc, setItemDesc] = useState('Cardiology Specialist Consultation');
  const [itemCategory, setItemCategory] = useState('CONSULTATION');
  const [itemPrice, setItemPrice] = useState(150);
  const [copay, setCopay] = useState(25);
  const [insurance, setInsurance] = useState(125);
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    try {
      const invs = await api.getInvoices();
      setInvoices(invs);
      if (invs.length > 0 && !selectedInvoiceId) {
        setSelectedInvoiceId(invs[0].id);
        setPaymentAmount(invs[0].copay_amount || invs[0].total_amount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newInv = await api.createInvoice({
        patientId,
        items: [{ description: itemDesc, category: itemCategory, unitPrice: Number(itemPrice) }],
        copayAmount: Number(copay),
        insuranceCovered: Number(insurance),
      });
      setMsg(`Created Invoice ${newInv.invoice_number} for total $${newInv.total_amount}!`);
      setShowCreate(false);
      loadData();
    } catch (err: any) {
      alert(`Invoice error: ${err.message}`);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;
    try {
      const res = await api.recordPayment(selectedInvoiceId, Number(paymentAmount), paymentMethod);
      setMsg(`Payment of $${res.payment.amount} recorded! Status: ${res.invoice.status}`);
      loadData();
    } catch (err: any) {
      alert(`Payment error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-rose-600" />
            <span>Hospital Billing & Revenue Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Billing Officer: <strong>Diana Prince</strong> | Invoices, Copay Calculations & Idempotent Payments
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center space-x-2 text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Invoice</span>
        </button>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {showCreate && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 text-base flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-rose-600" />
            <span>Generate Patient Hospital Invoice</span>
          </h3>
          <form onSubmit={handleCreateInvoice} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Patient</label>
              <select value={patientId} onChange={e => setPatientId(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white">
                <option value="pat-john-doe">John Doe (MRN-10001)</option>
                <option value="pat-emily-watson">Emily Watson (MRN-10002)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Item Description</label>
              <input type="text" required value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Category</label>
              <select value={itemCategory} onChange={e => setItemCategory(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white">
                <option value="CONSULTATION">CONSULTATION</option>
                <option value="LAB">LAB</option>
                <option value="PHARMACY">PHARMACY</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Unit Price ($)</label>
              <input type="number" required value={itemPrice} onChange={e => setItemPrice(Number(e.target.value))} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Patient Copay ($)</label>
              <input type="number" required value={copay} onChange={e => setCopay(Number(e.target.value))} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Insurance Portion ($)</label>
              <input type="number" required value={insurance} onChange={e => setInsurance(Number(e.target.value))} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div className="md:col-span-3 flex justify-end space-x-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-sm bg-rose-600 text-white rounded-lg font-medium">Issue Invoice</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoices List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-2">
          <h2 className="font-bold text-slate-900 text-base mb-3 flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-rose-600" />
            <span>Hospital Invoices Ledger</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="p-3 font-semibold">Invoice #</th>
                  <th className="p-3 font-semibold">Total ($)</th>
                  <th className="p-3 font-semibold">Patient Copay</th>
                  <th className="p-3 font-semibold">Insurance</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-800">{inv.invoice_number}</td>
                    <td className="p-3 font-semibold text-slate-900">${inv.total_amount?.toFixed(2)}</td>
                    <td className="p-3 text-slate-600">${inv.copay_amount?.toFixed(2)}</td>
                    <td className="p-3 text-slate-600">${inv.insurance_covered?.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                        inv.status === 'ISSUED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedInvoiceId(inv.id);
                          setPaymentAmount(inv.copay_amount || inv.total_amount);
                        }}
                        className="text-xs bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1 rounded font-medium"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Processing Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-1 space-y-4">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-rose-600" />
            <span>Process Payment (Idempotent)</span>
          </h2>
          <form onSubmit={handleRecordPayment} className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Target Invoice ID</label>
              <input type="text" readOnly value={selectedInvoiceId} className="w-full text-xs border border-slate-200 bg-slate-100 rounded-lg p-2 font-mono text-slate-600" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Amount ($)</label>
              <input type="number" required value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white">
                <option value="CREDIT_CARD">Credit Card / POS</option>
                <option value="INSURANCE">Direct Insurance Claim</option>
                <option value="CASH">Cash Deposit</option>
                <option value="BANK_TRANSFER">Bank Wire Transfer</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-sm shadow transition"
            >
              Record Payment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
