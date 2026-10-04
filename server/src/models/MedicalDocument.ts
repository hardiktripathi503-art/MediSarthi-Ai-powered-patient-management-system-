import mongoose, { Schema, Document } from 'mongoose';
import { DocumentType } from '../../../shared/types/index.js';

export interface IMedicalDocumentDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  fileName: string;
  fileType: string;
  documentType: DocumentType;
  extractedText: string;
  structuredData: {
    diagnoses: string[];
    medications: string[];
    investigations: {
      testName: string;
      value: string;
      referenceRange?: string;
      isAbnormal: boolean;
      notes?: string;
    }[];
    potentialAbnormalities: string[];
  };
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  doctorNotes?: string;
  uploadedAt: Date;
}

const MedicalDocumentSchema = new Schema<IMedicalDocumentDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'PatientProfile', required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    documentType: {
      type: String,
      enum: ['PRESCRIPTION', 'BLOOD_REPORT', 'XRAY_REPORT', 'DISCHARGE_SUMMARY', 'OTHER'],
      default: 'OTHER',
    },
    extractedText: { type: String, default: '' },
    structuredData: {
      diagnoses: { type: [String], default: [] },
      medications: { type: [String], default: [] },
      investigations: [
        {
          testName: { type: String, required: true },
          value: { type: String, required: true },
          referenceRange: { type: String, default: '' },
          isAbnormal: { type: Boolean, default: false },
          notes: { type: String, default: '' },
        },
      ],
      potentialAbnormalities: { type: [String], default: [] },
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    doctorNotes: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: 'uploadedAt', updatedAt: false },
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

export const MedicalDocumentModel = mongoose.model<IMedicalDocumentDocument>(
  'MedicalDocument',
  MedicalDocumentSchema
);
