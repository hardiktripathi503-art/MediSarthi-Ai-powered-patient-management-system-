import {
  Consultation,
  MedicalDocument,
  TimelineEvent,
  PatientProfile,
  AYUSHSectionConfig,
  LanguageCode,
  IntakeMode,
  VisualInspectionResult,
  TriageResult,
  Message,
} from '@shared/types';

const API_BASE = '/api';

function getHeaders(isJson: boolean = true) {
  let token: string | null = null;
  try {
    token = localStorage.getItem('medisaarthi_token');
  } catch {
    // Ignore restricted localStorage
  }
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Config
  async getAyushSchema(): Promise<AYUSHSectionConfig[]> {
    const res = await fetch(`${API_BASE}/config/ayush-schema`);
    const json = await res.json();
    return json.data || [];
  },

  // Translation
  async translate(text: string, targetLang: LanguageCode): Promise<{ translatedText: string; sourceLang: LanguageCode }> {
    try {
      const res = await fetch(`${API_BASE}/ai/translate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text, targetLang }),
      });
      const json = await res.json();
      return json.data || { translatedText: text, sourceLang: targetLang };
    } catch {
      return { translatedText: text, sourceLang: targetLang };
    }
  },

  // Auth
  async login(email: string, password: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || `HTTP ${res.status}: Login failed` };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed. Please check server.' };
    }
  },

  async register(name: string, email: string, password: string, role: string, language: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, language }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || `HTTP ${res.status}: Registration failed` };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed. Please check server.' };
    }
  },

  async getMe() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || `HTTP ${res.status}` };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to verify session' };
    }
  },

  async logout() {
    try {
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  // Consultations
  async createConsultation(payload: {
    patientName: string;
    patientAge: number;
    patientGender: string;
    language: LanguageCode;
    mode: IntakeMode;
    chiefComplaint?: string;
    consentGiven: boolean;
    consentVersion?: string;
    visualInspection?: VisualInspectionResult | null;
  }): Promise<{ success: boolean; data: Consultation }> {
    const res = await fetch(`${API_BASE}/consultations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async listConsultations(params?: { status?: string; riskLevel?: string; mode?: string }): Promise<{ success: boolean; data: Consultation[] }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.riskLevel) searchParams.set('riskLevel', params.riskLevel);
    if (params?.mode) searchParams.set('mode', params.mode);

    const url = `${API_BASE}/consultations${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },

  async getConsultation(id: string): Promise<{ success: boolean; data: Consultation }> {
    const res = await fetch(`${API_BASE}/consultations/${id}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async postMessage(consultationId: string, text: string, language: LanguageCode) {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/message`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text, language }),
    });
    return res.json();
  },

  async completeConsultation(consultationId: string) {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/complete`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async updateConsultationLanguage(consultationId: string, language: LanguageCode): Promise<{ success: boolean; data: Consultation }> {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/language`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ language }),
    });
    return res.json();
  },

  async updateAyushAssessment(consultationId: string, ayushAssessment: Record<string, string>): Promise<{ success: boolean; data: Consultation }> {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/ayush`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ ayushAssessment }),
    });
    return res.json();
  },

  async reviewConsultation(
    consultationId: string,
    payload: {
      status: 'DOCTOR_REVIEWED' | 'DOCTOR_EDITED' | 'REJECTED';
      notes?: string;
      editedFields?: any;
    }
  ): Promise<{ success: boolean; data: Consultation }> {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/review`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async analyzeVisualSymptoms(
    consultationId: string,
    payload: { imageBase64?: string; presetType?: string; language?: LanguageCode }
  ): Promise<{
    success: boolean;
    data: {
      consultation: Consultation;
      visualInspection: VisualInspectionResult;
      triageResult: TriageResult;
      doctorReply: Message;
    };
  }> {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/visual-inspection`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async analyzeStandaloneFace(
    payload: { imageBase64?: string; presetType?: string; language?: LanguageCode }
  ): Promise<{ success: boolean; data: VisualInspectionResult }> {
    const res = await fetch(`${API_BASE}/ai/analyze-face`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Patients
  async listPatients(search?: string): Promise<{ success: boolean; data: PatientProfile[] }> {
    const url = search ? `${API_BASE}/patients?search=${encodeURIComponent(search)}` : `${API_BASE}/patients`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },

  async getPatient(id: string): Promise<{
    success: boolean;
    data: {
      patient: PatientProfile;
      consultations: Consultation[];
      documents: MedicalDocument[];
      timeline: TimelineEvent[];
    };
  }> {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async updatePatient(id: string, data: Partial<PatientProfile>): Promise<{ success: boolean; data: PatientProfile }> {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async reviewPatient(
    id: string,
    payload: {
      action?: 'ACCEPT' | 'REJECT' | 'PENDING';
      status?: 'ACCEPTED' | 'REJECTED' | 'PENDING';
      notes?: string;
      acceptanceNotes?: string;
      rejectionReason?: string;
      department?: string;
      reviewedBy?: string;
    }
  ): Promise<{ success: boolean; data: PatientProfile }> {
    const res = await fetch(`${API_BASE}/patients/${id}/review`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Documents & OCR
  async uploadDocument(patientId: string, file: File, documentType: string): Promise<{ success: boolean; data: MedicalDocument }> {
    const formData = new FormData();
    formData.append('patientId', patientId);
    formData.append('documentType', documentType);
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: getHeaders(false),
      body: formData,
    });
    return res.json();
  },

  async getPatientDocuments(patientId: string): Promise<{ success: boolean; data: MedicalDocument[] }> {
    const res = await fetch(`${API_BASE}/documents/patient/${patientId}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async verifyDocument(documentId: string, verificationStatus: string, doctorNotes?: string) {
    const res = await fetch(`${API_BASE}/documents/${documentId}/verify`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ verificationStatus, doctorNotes }),
    });
    return res.json();
  },

  // Timeline
  async getPatientTimeline(patientId: string): Promise<{ success: boolean; data: TimelineEvent[] }> {
    const res = await fetch(`${API_BASE}/timeline/${patientId}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  // Analytics
  async getDashboardAnalytics() {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: getHeaders(),
    });
    return res.json();
  },
};
