import mongoose, { Schema, Document } from 'mongoose';
import {
  LanguageCode,
  IntakeMode,
  StructuredHistory,
  TriageResult,
  DoctorReview,
  Message,
} from '../../../shared/types/index.js';

export interface IConsultationDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorId?: mongoose.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const MessageSubSchema = new Schema(
  {
    id: { type: String, required: true },
    sender: { type: String, enum: ['AI', 'PATIENT', 'SYSTEM'], required: true },
    text: { type: String, required: true },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    timestamp: { type: String, default: () => new Date().toISOString() },
    isEmergencyAlert: { type: Boolean, default: false },
  },
  { _id: false }
);

const StructuredHistorySubSchema = new Schema(
  {
    chiefComplaint: { type: String, default: '' },
    duration: { type: String, default: '' },
    severity: { type: String, default: '' },
    associatedSymptoms: { type: [String], default: [] },
    pastHistory: { type: [String], default: [] },
    medications: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    familyHistory: { type: [String], default: [] },
    lifestyle: {
      diet: { type: String, default: '' },
      sleep: { type: String, default: '' },
      physicalActivity: { type: String, default: '' },
      habits: { type: [String], default: [] },
    },
    ayushAssessment: { type: Schema.Types.Mixed, default: {} },
    visualInspection: { type: Schema.Types.Mixed, default: null },
    unansweredFields: { type: [String], default: [] },
  },
  { _id: false }
);

const TriageResultSubSchema = new Schema(
  {
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
    reasons: { type: [String], default: [] },
    recommendedAction: { type: String, default: 'Standard medical intake evaluation' },
    disclaimer: {
      type: String,
      default: 'This is an AI-generated triage intake alert and not a clinical diagnosis.',
    },
    detectedEmergencyTrigger: { type: Boolean, default: false },
    evaluatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const DoctorReviewSubSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['AI_GENERATED', 'DOCTOR_REVIEWED', 'DOCTOR_EDITED', 'REJECTED'],
      default: 'AI_GENERATED',
    },
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: String, default: '' },
    notes: { type: String, default: '' },
    editedFields: { type: Schema.Types.Mixed, default: null },
    verifiedByDoctor: { type: Boolean, default: false },
  },
  { _id: false }
);

const ConsultationSchema = new Schema<IConsultationDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'PatientProfile', required: true },
    patientName: { type: String, required: true },
    patientAge: { type: Number, required: true },
    patientGender: { type: String, default: 'OTHER' },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    mode: { type: String, enum: ['MODERN', 'AYUSH'], default: 'MODERN' },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'HALTED_EMERGENCY'],
      default: 'IN_PROGRESS',
    },
    chiefComplaint: { type: String, default: '' },
    messages: { type: [MessageSubSchema], default: [] },
    structuredHistory: { type: StructuredHistorySubSchema, default: () => ({}) },
    triageResult: { type: TriageResultSubSchema, default: () => ({}) },
    aiSummary: { type: String, default: '' },
    doctorReview: { type: DoctorReviewSubSchema, default: () => ({}) },
    consentGiven: { type: Boolean, required: true, default: false },
    consentTimestamp: { type: String, default: () => new Date().toISOString() },
    consentVersion: { type: String, default: '1.0' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id?.toString();
        ret.patientId = ret.patientId?.toString();
        if (ret.doctorId) ret.doctorId = ret.doctorId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const ConsultationModel = mongoose.model<IConsultationDocument>('Consultation', ConsultationSchema);
