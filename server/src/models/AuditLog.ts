import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../../../shared/types/index.js';

export interface IAuditLogDocument extends Document {
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'CONSULTATION' | 'DOCUMENT' | 'PATIENT' | 'USER';
  entityId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true },
    entityType: {
      type: String,
      enum: ['CONSULTATION', 'DOCUMENT', 'PATIENT', 'USER'],
      required: true,
    },
    entityId: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: false,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const AuditLogModel = mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
