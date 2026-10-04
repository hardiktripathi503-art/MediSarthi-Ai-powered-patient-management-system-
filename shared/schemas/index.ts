import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['PATIENT', 'DOCTOR', 'ADMIN']).default('PATIENT'),
  language: z.enum(['en', 'hi']).default('en'),
  age: z.number().min(0).max(125).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createConsultationSchema = z.object({
  patientName: z.string().min(2, 'Patient name is required'),
  patientAge: z.number().min(0).max(120),
  patientGender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  language: z.enum(['en', 'hi']).default('en'),
  mode: z.enum(['MODERN', 'AYUSH']).default('MODERN'),
  chiefComplaint: z.string().optional().default(''),
  consentGiven: z.boolean().refine(val => val === true, {
    message: 'Consent must be explicitly given to proceed',
  }),
  consentVersion: z.string().default('1.0'),
  visualInspection: z.any().optional(),
});

export const postMessageSchema = z.object({
  text: z.string().min(1, 'Message text cannot be empty'),
  language: z.enum(['en', 'hi']).optional(),
});

export const structuredHistorySchema = z.object({
  chiefComplaint: z.string().default(''),
  duration: z.string().default(''),
  severity: z.string().default(''),
  associatedSymptoms: z.array(z.string()).default([]),
  pastHistory: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  familyHistory: z.array(z.string()).default([]),
  lifestyle: z.object({
    diet: z.string().optional(),
    sleep: z.string().optional(),
    physicalActivity: z.string().optional(),
    habits: z.array(z.string()).optional(),
  }).default({}),
  ayushAssessment: z.record(z.string()).optional(),
  visualInspection: z.any().optional(),
  unansweredFields: z.array(z.string()).default([]),
});

export const analyzeFaceInputSchema = z.object({
  imageBase64: z.string().optional(),
  presetType: z.enum(['JAUNDICE', 'ANEMIA_PALLOR', 'STROKE_DROOP', 'CYANOSIS', 'NORMAL']).optional(),
  language: z.enum(['en', 'hi']).default('en'),
});

export const triageResultSchema = z.object({
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  reasons: z.array(z.string()),
  recommendedAction: z.string(),
  disclaimer: z.string(),
  detectedEmergencyTrigger: z.boolean().optional(),
  evaluatedAt: z.string().default(() => new Date().toISOString()),
});

export const doctorReviewSchema = z.object({
  status: z.enum(['DOCTOR_REVIEWED', 'DOCTOR_EDITED', 'REJECTED']),
  notes: z.string().optional().default(''),
  editedFields: structuredHistorySchema.partial().optional(),
});
