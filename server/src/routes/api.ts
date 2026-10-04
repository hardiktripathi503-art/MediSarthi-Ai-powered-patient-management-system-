import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { listPatients, getPatientById, updatePatient, createPatient, reviewPatient } from '../controllers/patientController.js';
import {
  createConsultation,
  listConsultations,
  getConsultationById,
  postConsultationMessage,
  completeConsultation,
  reviewConsultation,
  updateConsultationLanguage,
  updateConsultationAyushAssessment,
  handleVisualInspection,
  analyzeStandaloneFace,
} from '../controllers/consultationController.js';
import {
  uploadDocument,
  uploadMiddleware,
  getDocumentsByPatient,
  getDocumentById,
  verifyDocument,
} from '../controllers/documentController.js';
import { getPatientTimeline } from '../controllers/timelineController.js';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { authMiddleware, optionalAuthMiddleware, requireRole } from '../middleware/auth.js';
import { AYUSH_CASE_SCHEMA } from '../../../shared/config/ayushSchema.js';
import { aiService } from '../services/aiService.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MediSaarthi Clinical API', timestamp: new Date().toISOString() });
});

// AI Translation (Hindi <-> English)
router.post('/ai/translate', async (req, res) => {
  try {
    const { text, targetLang = 'en' } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required for translation.' });
    }
    const result = await aiService.translateText(text, targetLang);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Translation failed' });
  }
});

// AYUSH Schema Configuration
router.get('/config/ayush-schema', (req, res) => {
  res.json({ success: true, data: AYUSH_CASE_SCHEMA });
});

// Authentication
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', authMiddleware, getMe);

// Patients
router.get('/patients', listPatients);
router.post('/patients', createPatient);
router.get('/patients/:id', getPatientById);
router.put('/patients/:id', optionalAuthMiddleware, updatePatient);
router.put('/patients/:id/review', optionalAuthMiddleware, reviewPatient);

// Consultations
router.post('/consultations', optionalAuthMiddleware, createConsultation);
router.get('/consultations', listConsultations);
router.get('/consultations/:id', getConsultationById);
router.post('/consultations/:id/message', postConsultationMessage);
router.post('/consultations/:id/complete', completeConsultation);
router.patch('/consultations/:id/language', updateConsultationLanguage);
router.patch('/consultations/:id/ayush', updateConsultationAyushAssessment);
router.post('/consultations/:id/visual-inspection', handleVisualInspection);
router.put('/consultations/:id/review', optionalAuthMiddleware, reviewConsultation);

// AI Visual Facial & Ocular Symptom Recognition
router.post('/ai/analyze-face', analyzeStandaloneFace);

// Medical Documents & OCR
router.post('/documents/upload', uploadMiddleware, uploadDocument);
router.get('/documents/patient/:patientId', getDocumentsByPatient);
router.get('/documents/:id', getDocumentById);
router.put('/documents/:id/verify', optionalAuthMiddleware, verifyDocument);

// Timeline
router.get('/timeline/:patientId', getPatientTimeline);

// Analytics
router.get('/analytics/dashboard', getDashboardAnalytics);

export default router;
