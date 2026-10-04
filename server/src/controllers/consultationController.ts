import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ConsultationModel } from '../models/Consultation.js';
import { PatientProfileModel } from '../models/PatientProfile.js';
import { MedicalTimelineModel } from '../models/MedicalTimeline.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { interviewEngine } from '../services/interviewEngine.js';
import { aiService } from '../services/aiService.js';
import { triageService } from '../services/triageService.js';
import { visualInspectionService } from '../services/visualInspectionService.js';
import {
  createConsultationSchema,
  postMessageSchema,
  doctorReviewSchema,
  analyzeFaceInputSchema,
} from '../../../shared/schemas/index.js';
import { AuthRequest } from '../middleware/auth.js';

export async function createConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = createConsultationSchema.parse(req.body);

    const authReq = req as AuthRequest;

    // Find or create patient profile
    let patient = null;
    if (authReq.user?.id) {
      patient = await PatientProfileModel.findOne({ userId: authReq.user.id });
    }
    if (!patient) {
      patient = await PatientProfileModel.findOne({ name: validated.patientName });
    }

    if (!patient) {
      patient = await PatientProfileModel.create({
        userId: authReq.user?.id ? new mongoose.Types.ObjectId(authReq.user.id) : undefined,
        name: validated.patientName,
        age: validated.patientAge,
        gender: validated.patientGender,
        contact: '',
        allergies: [],
        chronicConditions: [],
        medications: [],
      });
    } else {
      // Always synchronize patient profile with the age and gender entered for this intake
      patient.name = validated.patientName;
      patient.age = validated.patientAge;
      patient.gender = validated.patientGender;
      if (authReq.user?.id && !patient.userId) {
        patient.userId = new mongoose.Types.ObjectId(authReq.user.id);
      }
      await patient.save();
    }

    const visualResult = validated.visualInspection || null;
    const initialAssociatedSymptoms: string[] = [];
    if (visualResult) {
      if (visualResult.eyeInspection?.scleralIcterus) initialAssociatedSymptoms.push('Scleral Icterus (Jaundice sign)');
      if (visualResult.eyeInspection?.conjunctivalPallor) initialAssociatedSymptoms.push('Conjunctival Pallor (Anemia sign)');
      if (visualResult.eyeInspection?.conjunctivalRedness) initialAssociatedSymptoms.push('Conjunctival Redness');
      if (visualResult.eyeInspection?.periorbitalEdema) initialAssociatedSymptoms.push('Periorbital Puffiness / Fatigue');
      if (visualResult.lipsInspection?.cyanosisDetected) initialAssociatedSymptoms.push('Central Cyanosis (Hypoxia sign)');
      if (visualResult.facialSymmetry?.droopDetected) initialAssociatedSymptoms.push('Facial Droop / Hemifacial Asymmetry');
    }

    let initialGreeting =
      validated.language === 'hi'
        ? `नमस्ते ${validated.patientName} जी! मैं डॉ. सारथी (MediSaarthi AI Clinical Physician) हूँ। कृपया तसल्ली से बैठिए। आज आपको क्या मुख्य समस्या या तकलीफ हो रही है? आप अपनी भाषा में बोलकर या लिखकर मुझे खुलकर बता सकते हैं।`
        : `Hello ${validated.patientName}! I am Dr. Saarthi, your AI Clinical Physician. Please take a comfortable seat. What main symptom or health concern brings you in to see us today? Please feel free to share in your own words.`;

    if (visualResult && visualResult.findings && visualResult.findings.length > 0) {
      const isHindi = validated.language === 'hi';
      const signs = visualResult.findings.map((f: any) => f.sign).join(', ');
      initialGreeting += isHindi
        ? `\n\n(नोट: आपके चेहरे व नेत्र परीक्षण (Netra Pariksha) के प्रारंभिक लक्षण [${signs}] भी संलग्न कर लिए गए हैं।)`
        : `\n\n(Note: Your visual facial & ocular findings [${signs}] have been successfully attached.)`;
    }

    const initialTriage = visualResult
      ? triageService.evaluateTriage({
          history: {
            chiefComplaint: validated.chiefComplaint || '',
            duration: '',
            severity: '',
            associatedSymptoms: initialAssociatedSymptoms,
            pastHistory: patient.chronicConditions || [],
            medications: patient.medications || [],
            allergies: patient.allergies || [],
            familyHistory: [],
            lifestyle: {},
            visualInspection: visualResult,
          },
          recentMessages: [],
        })
      : {
          riskLevel: 'LOW' as const,
          reasons: ['Initial clinical intake started'],
          recommendedAction: 'Standard intake assessment',
          disclaimer: 'This is an AI-assisted intake evaluation and not a diagnosis.',
          detectedEmergencyTrigger: false,
          evaluatedAt: new Date().toISOString(),
        };

    const initialMessage = {
      id: `msg_${Date.now()}_init`,
      sender: 'AI' as const,
      text: initialGreeting,
      language: validated.language,
      timestamp: new Date().toISOString(),
      isEmergencyAlert: Boolean(initialTriage.detectedEmergencyTrigger),
    };

    const consultation = await ConsultationModel.create({
      patientId: patient._id,
      patientName: validated.patientName,
      patientAge: validated.patientAge,
      patientGender: validated.patientGender,
      language: validated.language,
      mode: validated.mode,
      status: initialTriage.detectedEmergencyTrigger ? 'HALTED_EMERGENCY' : 'IN_PROGRESS',
      chiefComplaint: validated.chiefComplaint || '',
      messages: [initialMessage],
      structuredHistory: {
        chiefComplaint: validated.chiefComplaint || '',
        duration: '',
        severity: '',
        associatedSymptoms: initialAssociatedSymptoms,
        pastHistory: patient.chronicConditions || [],
        medications: patient.medications || [],
        allergies: patient.allergies || [],
        familyHistory: [],
        lifestyle: {},
        ayushAssessment: {},
        visualInspection: visualResult,
        unansweredFields: [],
      },
      triageResult: initialTriage,
      doctorReview: {
        status: 'AI_GENERATED',
        reviewedBy: '',
        reviewedAt: '',
        notes: '',
        verifiedByDoctor: false,
      },
      consentGiven: validated.consentGiven,
      consentTimestamp: new Date().toISOString(),
      consentVersion: validated.consentVersion,
    });

    res.status(201).json({ success: true, data: consultation.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function listConsultations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, riskLevel, mode } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (riskLevel) filter['triageResult.riskLevel'] = riskLevel;
    if (mode) filter.mode = mode;

    const consultations = await ConsultationModel.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: consultations });
  } catch (err) {
    next(err);
  }
}

export async function getConsultationById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const consultation = await ConsultationModel.findById(req.params.id);
    if (!consultation) {
      res.status(404).json({ success: false, error: 'Consultation not found' });
      return;
    }
    res.json({ success: true, data: consultation.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function postConsultationMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = postMessageSchema.parse(req.body);
    const consultation = await ConsultationModel.findById(req.params.id);

    if (!consultation) {
      res.status(404).json({ success: false, error: 'Consultation not found' });
      return;
    }

    if (consultation.status === 'HALTED_EMERGENCY') {
      res.status(400).json({
        success: false,
        error: 'This intake has been halted due to high-risk red flag symptoms. Please seek emergency medical care.',
      });
      return;
    }

    // Determine language from input or consultation, with intelligent Devanagari/Hinglish detection
    const initialLang = validated.language || consultation.language || 'en';
    const effectiveLang = aiService.detectLanguage(validated.text, initialLang);

    // Append patient message
    const patientMsg = {
      id: `msg_${Date.now()}_patient`,
      sender: 'PATIENT' as const,
      text: validated.text,
      language: effectiveLang,
      timestamp: new Date().toISOString(),
    };

    consultation.messages.push(patientMsg);

    // Process through dynamic interview engine
    const turnResult = await interviewEngine.processTurn(
      consultation.structuredHistory,
      validated.text,
      effectiveLang,
      consultation.mode,
      consultation.messages
    );

    // Update state
    consultation.structuredHistory = turnResult.updatedHistory as any;
    consultation.triageResult = turnResult.triageResult as any;
    consultation.messages.push(turnResult.aiReplyMessage);

    if (turnResult.updatedHistory.chiefComplaint && !consultation.chiefComplaint) {
      consultation.chiefComplaint = turnResult.updatedHistory.chiefComplaint;
    }

    if (turnResult.isEmergencyHalt) {
      consultation.status = 'HALTED_EMERGENCY';

      // Automatically generate summary and add emergency timeline event
      const summary = await aiService.generateSummary(
        consultation.structuredHistory,
        consultation.messages,
        consultation.mode,
        consultation.patientName,
        consultation.patientAge,
        consultation.patientGender
      );
      consultation.aiSummary = summary;

      await MedicalTimelineModel.create({
        patientId: consultation.patientId,
        eventType: 'EMERGENCY_TRIAGE',
        date: new Date().toISOString().split('T')[0],
        title: `CRITICAL RED FLAG ALERT: ${turnResult.updatedHistory.chiefComplaint || 'Acute Symptoms'}`,
        summary: turnResult.triageResult.reasons.join('; '),
        sourceId: consultation.id,
        riskLevel: 'HIGH',
        verifiedStatus: 'AI_GENERATED',
      });
    } else if (turnResult.isComplete) {
      consultation.status = 'COMPLETED';

      // Generate AI summary
      const summary = await aiService.generateSummary(
        consultation.structuredHistory,
        consultation.messages,
        consultation.mode,
        consultation.patientName,
        consultation.patientAge,
        consultation.patientGender
      );
      consultation.aiSummary = summary;

      // Add to timeline
      await MedicalTimelineModel.create({
        patientId: consultation.patientId,
        eventType: 'CONSULTATION',
        date: new Date().toISOString().split('T')[0],
        title: `${consultation.mode} Intake: ${consultation.chiefComplaint || 'General Assessment'}`,
        summary: `Intake completed. Triage Level: ${turnResult.triageResult.riskLevel}. Severity: ${turnResult.updatedHistory.severity || 'Moderate'}`,
        sourceId: consultation.id,
        riskLevel: turnResult.triageResult.riskLevel,
        verifiedStatus: 'AI_GENERATED',
      });
    }

    await consultation.save();

    res.json({
      success: true,
      data: {
        consultation: consultation.toJSON(),
        reply: turnResult.aiReplyMessage,
        triageResult: turnResult.triageResult,
        isEmergencyHalt: turnResult.isEmergencyHalt,
        isComplete: turnResult.isComplete,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function completeConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const consultation = await ConsultationModel.findById(req.params.id);
    if (!consultation) {
      res.status(404).json({ success: false, error: 'Consultation not found' });
      return;
    }

    consultation.status = 'COMPLETED';
    const summary = await aiService.generateSummary(
      consultation.structuredHistory,
      consultation.messages,
      consultation.mode,
      consultation.patientName,
      consultation.patientAge,
      consultation.patientGender
    );
    consultation.aiSummary = summary;

    await consultation.save();

    res.json({ success: true, data: consultation.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function reviewConsultation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = doctorReviewSchema.parse(req.body);
    const consultation = await ConsultationModel.findById(req.params.id);

    if (!consultation) {
      res.status(404).json({ success: false, error: 'Consultation not found' });
      return;
    }

    const doctorName = req.user?.name || 'Dr. V. K. Saxena (Attending Physician)';
    const doctorId = req.user?.id || 'doc_default';

    // Apply edited fields if physician made corrections
    if (validated.editedFields && Object.keys(validated.editedFields).length > 0) {
      consultation.structuredHistory = {
        ...consultation.structuredHistory,
        ...validated.editedFields,
      } as any;
    }

    consultation.doctorReview = {
      status: validated.status,
      reviewedBy: doctorName,
      reviewedAt: new Date().toISOString(),
      notes: validated.notes || '',
      editedFields: validated.editedFields || undefined,
      verifiedByDoctor: validated.status !== 'REJECTED',
    };

    consultation.doctorId = mongoose.isValidObjectId(doctorId) ? new mongoose.Types.ObjectId(doctorId) : undefined;

    await consultation.save();

    // Create Audit Log
    await AuditLogModel.create({
      userId: doctorId,
      userName: doctorName,
      userRole: req.user?.role || 'DOCTOR',
      action: `DOCTOR_REVIEW_${validated.status}`,
      entityType: 'CONSULTATION',
      entityId: consultation.id,
      timestamp: new Date().toISOString(),
      metadata: {
        notes: validated.notes,
        editedFields: validated.editedFields,
      },
    });

    // Update timeline verification status
    await MedicalTimelineModel.updateMany(
      { sourceId: consultation.id },
      { verifiedStatus: validated.status === 'REJECTED' ? 'PENDING' : 'VERIFIED' }
    );

    res.json({ success: true, data: consultation.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function updateConsultationLanguage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { language } = req.body;
    if (language !== 'en' && language !== 'hi') {
      res.status(400).json({ success: false, error: 'Valid language (en or hi) required.' });
      return;
    }
    const consultation = await ConsultationModel.findByIdAndUpdate(
      req.params.id,
      { language },
      { new: true }
    );
    if (!consultation) {
      res.status(404).json({ success: false, error: 'Consultation not found.' });
      return;
    }
    res.json({ success: true, data: consultation.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function updateConsultationAyushAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ayushAssessment } = req.body;
    if (!ayushAssessment || typeof ayushAssessment !== 'object') {
      res.status(400).json({ success: false, error: 'ayushAssessment object is required.' });
      return;
    }

    const consultation = await ConsultationModel.findById(req.params.id);
    if (!consultation) {
      res.status(404).json({ success: false, error: 'Consultation not found.' });
      return;
    }

    consultation.structuredHistory.ayushAssessment = {
      ...(consultation.structuredHistory.ayushAssessment || {}),
      ...ayushAssessment,
    };
    consultation.markModified('structuredHistory');

    // If consultation is completed, refresh the clinical summary
    if (consultation.status === 'COMPLETED') {
      const summary = await aiService.generateSummary(
        consultation.structuredHistory,
        consultation.messages,
        consultation.mode,
        consultation.patientName,
        consultation.patientAge,
        consultation.patientGender
      );
      consultation.aiSummary = summary;
    }

    await consultation.save();
    res.json({ success: true, data: consultation.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function handleVisualInspection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const consultation = await ConsultationModel.findById(req.params.id);
    if (!consultation) {
      res.status(404).json({ success: false, error: 'Consultation not found.' });
      return;
    }

    const { imageBase64, presetType, language = consultation.language } = req.body;

    const visualResult = await visualInspectionService.analyzeFacialImage({
      imageBase64,
      presetType,
      language,
      patientName: consultation.patientName,
      mode: consultation.mode,
    });

    // Update structuredHistory with visualInspection
    consultation.structuredHistory.visualInspection = visualResult;

    // Add relevant visual signs to associatedSymptoms
    const existingSymptoms = new Set(consultation.structuredHistory.associatedSymptoms || []);
    if (visualResult.eyeInspection.scleralIcterus) existingSymptoms.add('Scleral Icterus (Jaundice sign)');
    if (visualResult.eyeInspection.conjunctivalPallor) existingSymptoms.add('Conjunctival Pallor (Anemia sign)');
    if (visualResult.eyeInspection.conjunctivalRedness) existingSymptoms.add('Conjunctival Redness');
    if (visualResult.eyeInspection.periorbitalEdema) existingSymptoms.add('Periorbital Puffiness / Fatigue');
    if (visualResult.lipsInspection.cyanosisDetected) existingSymptoms.add('Central Cyanosis (Hypoxia sign)');
    if (visualResult.facialSymmetry.droopDetected) existingSymptoms.add('Facial Droop / Hemifacial Asymmetry');
    consultation.structuredHistory.associatedSymptoms = Array.from(existingSymptoms);

    // Update AYUSH Netra & Akriti Pariksha if in AYUSH mode
    if (consultation.mode === 'AYUSH' || consultation.structuredHistory.ayushAssessment) {
      const ayush = consultation.structuredHistory.ayushAssessment || {};
      if (visualResult.eyeInspection.scleralIcterus) ayush.netraPeetatva = 'Kamala / Peeta Netra (Scleral Icterus)';
      if (visualResult.eyeInspection.conjunctivalPallor) ayush.netraShvetatva = 'Pandu Roga / Shveta Netra (Conjunctival Pallor)';
      if (visualResult.facialSymmetry.droopDetected) ayush.akritiVakrata = 'Pakshaghata / Mukha Vakrata (Facial Droop)';
      consultation.structuredHistory.ayushAssessment = ayush;
    }

    // Re-evaluate Triage with visual inspection data
    const updatedTriage = triageService.evaluateTriage({
      history: consultation.structuredHistory,
      recentMessages: consultation.messages.map((m) => m.text),
    });
    consultation.triageResult = updatedTriage;

    // Generate doctor Saarthi's conversational acknowledgment of visual findings
    const isHindi = language === 'hi';
    let doctorAckText = '';

    if (updatedTriage.detectedEmergencyTrigger) {
      consultation.status = 'HALTED_EMERGENCY';
      doctorAckText = isHindi
        ? `🚨 महत्वपूर्ण नैदानिक चेतावनी (Visual Red Flag): चेहरे व आंखों की जांच में आपातकालीन लक्षण चिन्हित हुए हैं: ${visualResult.detectedRedFlags.join(', ')}। कृपया तुरंत आपातकालीन चिकित्सक अथवा निकटतम अस्पताल से संपर्क करें।`
        : `🚨 CRITICAL CLINICAL ALERT: Facial visual inspection detected urgent signs: ${visualResult.detectedRedFlags.join(', ')}. Please seek immediate emergency medical evaluation.`;
    } else if (visualResult.eyeInspection.scleralIcterus) {
      doctorAckText = isHindi
        ? `मैंने आपके चेहरे व आंखों की जांच (Netra Pariksha) का अवलोकन किया है। आंखों के सफेद भाग में पीलापन (Scleral Icterus) दिखाई दे रहा है, जो पीलिया (कामला/Jaundice) का संकेत हो सकता है। क्या आपको पेशाब गहरा पीला आ रहा है या पेट के ऊपरी दाहिने हिस्से में भारीपन महसूस होता है?`
        : `I have reviewed your facial scan. Noticeable yellowish tinting is present in the ocular sclera (Icterus), suggestive of jaundice or hepatic stress. Have you noticed dark tea-colored urine, pale stools, or right upper quadrant discomfort?`;
    } else if (visualResult.eyeInspection.conjunctivalPallor) {
      doctorAckText = isHindi
        ? `नेत्र परीक्षण (Netra Pariksha) में आंखों की निचली पलकों में रक्ताल्पता (Pallor) का लक्षण मिला है, जो हीमोग्लोबिन की कमी (एनीमिया/पाण्डु) दर्शा सकता है। क्या आपको थोड़ा चलने पर सांस फूलना, असामान्य कमजोरी या चक्कर आने की शिकायत रहती है?`
        : `Visual inspection notes marked conjunctival pallor in the lower eyelids, commonly correlated with anemia (low hemoglobin). Have you been experiencing unusual fatigue, dizziness upon standing, or shortness of breath on exertion?`;
    } else {
      doctorAckText = isHindi
        ? `धन्यवाद! आपके चेहरे व आंखों का दृश्य परीक्षण (Netra & Akriti Pariksha) सफलतापूर्वक दर्ज कर लिया गया है। प्रारंभिक तौर पर कोई पीलापन, रक्ताल्पता अथवा चेहरे की विषमता नहीं पाई गई है।`
        : `Thank you! Your facial and ocular visual scan (Netra & Akriti Pariksha) has been successfully recorded. Initial indicators show normal cranial symmetry and healthy conjunctival perfusion.`;
    }

    const aiMsg = {
      id: `msg_${Date.now()}_vis_ai`,
      sender: 'AI' as const,
      text: doctorAckText,
      language: (language as any) || 'en',
      timestamp: new Date().toISOString(),
      isEmergencyAlert: Boolean(updatedTriage.detectedEmergencyTrigger),
    };
    consultation.messages.push(aiMsg);

    consultation.markModified('structuredHistory');
    await consultation.save();

    res.json({
      success: true,
      data: {
        consultation: consultation.toJSON(),
        visualInspection: visualResult,
        triageResult: updatedTriage,
        doctorReply: aiMsg,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function analyzeStandaloneFace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = analyzeFaceInputSchema.parse(req.body);
    const result = await visualInspectionService.analyzeFacialImage({
      imageBase64: validated.imageBase64,
      presetType: validated.presetType,
      language: validated.language,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}


