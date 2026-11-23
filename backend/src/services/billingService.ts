import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { Invoice, InvoiceItem, Payment, InvoiceStatus } from '../db/types';
import { logAudit } from '../middleware/auditLogger';

export class BillingService {
  async listInvoices(patientId?: string): Promise<Invoice[]> {
    const invoices = patientId
      ? db.invoices.filter(i => i.patient_id === patientId)
      : db.invoices;

    return invoices.map(inv => ({
      ...inv,
      items: db.invoiceItems.filter(item => item.invoice_id === inv.id),
    }));
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    const inv = db.invoices.find(i => i.id === id);
    if (!inv) {
      throw { statusCode: 404, code: 'INVOICE_NOT_FOUND', message: `Invoice ${id} not found.` };
    }
    const items = db.invoiceItems.filter(item => item.invoice_id === inv.id);
    return { ...inv, items };
  }

  async createInvoice(data: {
    patientId: string;
    encounterId?: string;
    items: Array<{ description: string; category: string; unitPrice: number; quantity?: number }>;
    copayAmount?: number;
    insuranceCovered?: number;
    dueDate?: string;
  }, userId?: string): Promise<Invoice> {
    const invoiceId = `inv-${uuidv4().substring(0, 8)}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let total = 0;
    const createdItems: InvoiceItem[] = [];

    for (const item of data.items) {
      const qty = item.quantity || 1;
      const lineTotal = item.unitPrice * qty;
      total += lineTotal;

      const invItem: InvoiceItem = {
        id: `item-${uuidv4().substring(0, 8)}`,
        invoice_id: invoiceId,
        description: item.description,
        category: item.category,
        unit_price: item.unitPrice,
        quantity: qty,
        total_price: lineTotal,
      };
      createdItems.push(invItem);
      db.invoiceItems.push(invItem);
    }

    const copay = data.copayAmount || 0;
    const insurance = data.insuranceCovered || 0;

    const invoice: Invoice = {
      id: invoiceId,
      patient_id: data.patientId,
      encounter_id: data.encounterId,
      invoice_number: invoiceNumber,
      total_amount: total,
      copay_amount: copay,
      insurance_covered: insurance,
      status: 'ISSUED',
      due_date: data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      items: createdItems,
    };

    db.invoices.push(invoice);

    logAudit({
      userId,
      action: 'CREATE',
      entityType: 'INVOICE',
      entityId: invoiceId,
      patientId: data.patientId,
      newState: invoice,
      rationale: `Generated invoice ${invoiceNumber} for total $${total.toFixed(2)}`,
    });

    return invoice;
  }

  async recordPayment(data: {
    invoiceId: string;
    amount: number;
    paymentMethod: string;
    transactionReference?: string;
  }, userId?: string): Promise<{ payment: Payment; invoice: Invoice }> {
    const invoice = await this.getInvoiceById(data.invoiceId);
    const ref = data.transactionReference || `TXN-${uuidv4().substring(0, 10).toUpperCase()}`;

    // Idempotency: verify transaction reference has not been processed
    const existingTx = db.payments.find(p => p.transaction_reference === ref);
    if (existingTx) {
      return { payment: existingTx, invoice };
    }

    const payment: Payment = {
      id: `pay-${uuidv4().substring(0, 8)}`,
      invoice_id: data.invoiceId,
      amount: data.amount,
      payment_method: data.paymentMethod,
      transaction_reference: ref,
      status: 'SUCCESS',
      paid_at: new Date().toISOString(),
    };

    db.payments.push(payment);

    // Update invoice status
    const allPayments = db.payments.filter(p => p.invoice_id === invoice.id && p.status === 'SUCCESS');
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    const prev = { ...invoice };
    if (totalPaid >= invoice.total_amount) {
      invoice.status = 'PAID';
    } else if (totalPaid > 0) {
      invoice.status = 'PARTIALLY_PAID';
    }

    logAudit({
      userId,
      action: 'UPDATE',
      entityType: 'PAYMENT',
      entityId: payment.id,
      patientId: invoice.patient_id,
      previousState: prev,
      newState: { payment, invoiceStatus: invoice.status },
      rationale: `Recorded payment of $${data.amount} via ${data.paymentMethod} (Ref: ${ref})`,
    });

    return { payment, invoice };
  }
}

export const billingService = new BillingService();
