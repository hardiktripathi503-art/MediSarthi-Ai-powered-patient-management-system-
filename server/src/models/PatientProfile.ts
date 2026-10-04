import mongoose, { Schema, Document } from 'mongoose';

export interface IPatientProfileDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  contact: string;
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  doctorReview?: {
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    reviewedBy?: string;
    reviewedAt?: Date;
    acceptanceNotes?: string;
    rejectionReason?: string;
    department?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PatientProfileSchema = new Schema<IPatientProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 125 },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: 'OTHER' },
    contact: { type: String, default: '' },
    allergies: { type: [String], default: [] },
    chronicConditions: { type: [String], default: [] },
    medications: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
    },
    doctorReview: {
      status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
      reviewedBy: { type: String },
      reviewedAt: { type: Date },
      acceptanceNotes: { type: String },
      rejectionReason: { type: String },
      department: { type: String },
    },
  },
  {
    timestamps: true,
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

export const PatientProfileModel = mongoose.model<IPatientProfileDocument>('PatientProfile', PatientProfileSchema);
