export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type LanguageCode = 'en' | 'hi';

export type IntakeMode = 'MODERN' | 'AYUSH';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ReviewStatus = 'AI_GENERATED' | 'DOCTOR_REVIEWED' | 'DOCTOR_EDITED' | 'REJECTED';

export type DocumentType = 'PRESCRIPTION' | 'BLOOD_REPORT' | 'XRAY_REPORT' | 'DISCHARGE_SUMMARY' | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  language: LanguageCode;
  createdAt: string;
}

export type PatientStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface PatientDoctorReview {
  status: PatientStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  acceptanceNotes?: string;
  rejectionReason?: string;
  department?: string;
}

export interface PatientProfile {
  id: string;
  userId?: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  contact: string;
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  status?: PatientStatus;
  doctorReview?: PatientDoctorReview;
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  sender: 'AI' | 'PATIENT' | 'SYSTEM';
  text: string;
  language: LanguageCode;
  timestamp: string;
  isEmergencyAlert?: boolean;
}

export interface FacialVisualSymptom {
  region: 'EYES' | 'FACE_SYMMETRY' | 'LIPS' | 'SKIN';
  sign: string;
  confidence: number; // 0 to 100
  severity: 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE';
  clinicalSignificance: string;
  ayushCorrelation?: string;
  isRedFlag?: boolean;
}

export interface VisualInspectionResult {
  id: string;
  capturedAt: string;
  imageUrl?: string;
  findings: FacialVisualSymptom[];
  overallObservation: string;
  detectedRedFlags: string[];
  eyeInspection: {
    scleralIcterus: boolean;
    conjunctivalPallor: boolean;
    conjunctivalRedness: boolean;
    periorbitalEdema: boolean;
    notes: string;
  };
  facialSymmetry: {
    symmetryScorePercent: number;
    droopDetected: boolean;
    affectedSide?: 'LEFT' | 'RIGHT' | 'NONE';
    notes: string;
  };
  lipsInspection: {
    cyanosisDetected: boolean;
    pallorDetected: boolean;
    notes: string;
  };
  summaryForDoctor: string;
}

export interface StructuredHistory {
  chiefComplaint: string;
  duration: string;
  severity: string; // e.g. 'Mild', 'Moderate', 'Severe'
  associatedSymptoms: string[];
  pastHistory: string[];
  medications: string[];
  allergies: string[];
  familyHistory: string[];
  lifestyle: {
    diet?: string;
    sleep?: string;
    physicalActivity?: string;
    habits?: string[];
  };
  ayushAssessment?: Record<string, string>;
  visualInspection?: VisualInspectionResult;
  unansweredFields?: string[];
}

export interface TriageResult {
  riskLevel: RiskLevel;
  reasons: string[];
  recommendedAction: string;
  disclaimer: string;
  detectedEmergencyTrigger?: boolean;
  evaluatedAt: string;
}

export interface DoctorReview {
  status: ReviewStatus;
  reviewedBy?: string; // Doctor name or ID
  reviewedAt?: string;
  notes?: string;
  editedFields?: Partial<StructuredHistory>;
  verifiedByDoctor: boolean;
}

export interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorId?: string;
  language: LanguageCode;
  mode: IntakeMode;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'HALTED_EMERGENCY';
  chiefComplaint: string;
  messages: Message[];
  structuredHistory: StructuredHistory;
  triageResult: TriageResult;
  aiSummary: string;
  doctorReview: DoctorReview;
  consentGiven: boolean;
  consentTimestamp: string;
  consentVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedLabValue {
  testName: string;
  value: string;
  referenceRange?: string;
  isAbnormal: boolean;
  notes?: string;
}

export interface MedicalDocument {
  id: string;
  patientId: string;
  fileName: string;
  fileType: string;
  documentType: DocumentType;
  extractedText: string;
  structuredData: {
    diagnoses: string[];
    medications: string[];
    investigations: ExtractedLabValue[];
    potentialAbnormalities: string[];
  };
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  doctorNotes?: string;
  uploadedAt: string;
}

export interface TimelineEvent {
  id: string;
  patientId: string;
  eventType: 'CONSULTATION' | 'DOCUMENT_UPLOAD' | 'LAB_TEST' | 'PRESCRIPTION' | 'EMERGENCY_TRIAGE';
  date: string;
  title: string;
  summary: string;
  sourceId: string;
  riskLevel?: RiskLevel;
  verifiedStatus?: 'AI_GENERATED' | 'VERIFIED' | 'PENDING';
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'CONSULTATION' | 'DOCUMENT' | 'PATIENT' | 'USER';
  entityId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AYUSHFieldConfig {
  key: string;
  label: string;
  labelHi: string;
  type: 'select' | 'text' | 'multiselect';
  options?: { value: string; label: string; labelHi: string }[];
  description: string;
  descriptionHi: string;
}

export interface AYUSHSectionConfig {
  sectionKey: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi?: string;
  fields: AYUSHFieldConfig[];
}
