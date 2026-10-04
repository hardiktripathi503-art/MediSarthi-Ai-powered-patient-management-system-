import mongoose, { Schema, Document } from 'mongoose';
import { RiskLevel } from '../../../shared/types/index.js';

export interface IMedicalTimelineDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  eventType: 'CONSULTATION' | 'DOCUMENT_UPLOAD' | 'LAB_TEST' | 'PRESCRIPTION' | 'EMERGENCY_TRIAGE';
  date: string;
  title: string;
  summary: string;
  sourceId: string;
  riskLevel?: RiskLevel;
  verifiedStatus?: 'AI_GENERATED' | 'VERIFIED' | 'PENDING';
  createdAt: Date;
}

const MedicalTimelineSchema = new Schema<IMedicalTimelineDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'PatientProfile', required: true },
    eventType: {
      type: String,
      enum: ['CONSULTATION', 'DOCUMENT_UPLOAD', 'LAB_TEST', 'PRESCRIPTION', 'EMERGENCY_TRIAGE'],
      required: true,
    },
    date: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    sourceId: { type: String, required: true },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: false },
    verifiedStatus: {
      type: String,
      enum: ['AI_GENERATED', 'VERIFIED', 'PENDING'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id?.toString();
        ret.patientId = ret.patientId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const MedicalTimelineModel = mongoose.model<IMedicalTimelineDocument>(
  'MedicalTimeline',
  MedicalTimelineSchema
);
