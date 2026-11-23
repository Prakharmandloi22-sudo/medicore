const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const ANALYTICS_BASE = process.env.NEXT_PUBLIC_ANALYTICS_URL || 'http://localhost:8000/api/v1/analytics';

export interface UserSession {
  token: string;
  user: {
    id: string;
    email: string;
    role: 'patient' | 'doctor' | 'nurse' | 'receptionist' | 'lab_tech' | 'billing_officer' | 'admin';
    fullName: string;
    phone?: string;
    patientId?: string;
    providerId?: string;
  };
}

let activeToken: string = '';

export const setSessionToken = (token: string) => {
  activeToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('medicore_token', token);
  }
};

export const getSessionToken = (): string => {
  if (!activeToken && typeof window !== 'undefined') {
    activeToken = localStorage.getItem('medicore_token') || '';
  }
  return activeToken;
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || data.detail || 'API Request failed');
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest<UserSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getCurrentUser: () => apiRequest<any>('/auth/me'),

  // Patients
  getPatients: (search?: string) =>
    apiRequest<{ patients: any[]; total: number }>(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getPatientById: (id: string) => apiRequest<any>(`/patients/${id}`),
  getPatientChart: (id: string) => apiRequest<any>(`/patients/${id}/chart`),
  createPatient: (data: any) =>
    apiRequest<any>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Appointments
  getAppointments: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return apiRequest<any[]>(`/appointments${query ? `?${query}` : ''}`);
  },
  bookAppointment: (data: any) =>
    apiRequest<any>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAppointmentStatus: (id: string, status: string, cancellationReason?: string) =>
    apiRequest<any>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, cancellationReason }),
    }),

  // Encounters & Clinical
  getEncounters: (patientId?: string) =>
    apiRequest<any[]>(`/encounters${patientId ? `?patientId=${patientId}` : ''}`),
  createEncounter: (data: any) =>
    apiRequest<any>('/encounters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  completeEncounter: (id: string, notes?: string) =>
    apiRequest<any>(`/encounters/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ clinicalNotes: notes }),
    }),
  recordVitals: (encounterId: string, vitals: any) =>
    apiRequest<any>(`/encounters/${encounterId}/vitals`, {
      method: 'POST',
      body: JSON.stringify(vitals),
    }),
  addDiagnosis: (data: any) =>
    apiRequest<any>('/clinical/diagnoses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addPrescription: (data: any) =>
    apiRequest<any>('/clinical/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPrescriptions: (patientId?: string) =>
    apiRequest<any[]>(`/clinical/prescriptions${patientId ? `?patientId=${patientId}` : ''}`),
  getLabOrders: (patientId?: string) =>
    apiRequest<any[]>(`/clinical/lab-orders${patientId ? `?patientId=${patientId}` : ''}`),
  createLabOrder: (data: any) =>
    apiRequest<any>('/clinical/lab-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getLabResults: (patientId?: string) =>
    apiRequest<any[]>(`/clinical/lab-results${patientId ? `?patientId=${patientId}` : ''}`),
  recordLabResult: (data: any) =>
    apiRequest<any>('/clinical/lab-results', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Billing
  getInvoices: (patientId?: string) =>
    apiRequest<any[]>(`/billing${patientId ? `?patientId=${patientId}` : ''}`),
  createInvoice: (data: any) =>
    apiRequest<any>('/billing', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recordPayment: (invoiceId: string, amount: number, paymentMethod: string) =>
    apiRequest<any>(`/billing/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ invoiceId, amount, paymentMethod }),
    }),

  // Consents & Audits
  getConsents: (patientId: string) => apiRequest<any[]>(`/consents/${patientId}`),
  grantConsent: (data: any) =>
    apiRequest<any>('/consents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  revokeConsent: (id: string, rationale?: string) =>
    apiRequest<any>(`/consents/${id}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ rationale }),
    }),
  getAuditLogs: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return apiRequest<{ logs: any[]; total: number }>(`/audit-logs${query ? `?${query}` : ''}`);
  },

  // Analytics (Microservice)
  getAnalyticsSummary: () =>
    fetch(`${ANALYTICS_BASE}/summary`).then(r => r.json()).catch(() => null),
  getUtilization: () =>
    fetch(`${ANALYTICS_BASE}/utilization`).then(r => r.json()).catch(() => null),
  getWaitTimes: () =>
    fetch(`${ANALYTICS_BASE}/wait-times`).then(r => r.json()).catch(() => null),
  getLabTurnaround: () =>
    fetch(`${ANALYTICS_BASE}/lab-turnaround`).then(r => r.json()).catch(() => null),
  getDemographics: () =>
    fetch(`${ANALYTICS_BASE}/demographics`).then(r => r.json()).catch(() => null),
};
