import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import { UserModel } from '../models/User.js';
import { PatientProfileModel } from '../models/PatientProfile.js';
import { ConsultationModel } from '../models/Consultation.js';
import { MedicalDocumentModel } from '../models/MedicalDocument.js';
import { MedicalTimelineModel } from '../models/MedicalTimeline.js';
import { AuditLogModel } from '../models/AuditLog.js';

dotenv.config();

export async function seedDatabase(force: boolean = false) {
  const [patientCount, userCount] = await Promise.all([
    PatientProfileModel.countDocuments(),
    UserModel.countDocuments(),
  ]);

  if ((patientCount > 0 || userCount > 0) && !force) {
    console.log(`[Seed] Database already initialized (${userCount} users, ${patientCount} patients found). Skipping.`);
    return;
  }

  console.log(`[Seed] Seeding database with SIH 2026 test datasets & clinical profiles...`);

  // Clear collections if force is true
  if (force) {
    await UserModel.deleteMany({});
    await PatientProfileModel.deleteMany({});
    await ConsultationModel.deleteMany({});
    await MedicalDocumentModel.deleteMany({});
    await MedicalTimelineModel.deleteMany({});
    await AuditLogModel.deleteMany({});
  }

  const salt = await bcrypt.genSalt(10);
  const doctorPassword = await bcrypt.hash('Doctor@123', salt);
  const patientPassword = await bcrypt.hash('Patient@123', salt);

  // 1. Doctors
  const doc1 = await UserModel.create({
    name: 'Dr. V. K. Saxena, MD',
    email: 'dr.saxena@medisaarthi.in',
    passwordHash: doctorPassword,
    role: 'DOCTOR',
    language: 'en',
  });

  const doc2 = await UserModel.create({
    name: 'Dr. Ananya Sharma, BAMS (Ayurveda)',
    email: 'dr.ananya@medisaarthi.in',
    passwordHash: doctorPassword,
    role: 'DOCTOR',
    language: 'hi',
  });

  const doc3 = await UserModel.create({
    name: 'Dr. Rajesh Nair, MS (General Surgery)',
    email: 'dr.nair@medisaarthi.in',
    passwordHash: doctorPassword,
    role: 'DOCTOR',
    language: 'en',
  });

  // Admin
  await UserModel.create({
    name: 'SIH Admin Evaluator',
    email: 'admin@medisaarthi.in',
    passwordHash: doctorPassword,
    role: 'ADMIN',
    language: 'en',
  });

  // 2. Patients
  // Patient 1: Rahul Sharma (Primary Demo Patient - Scenario A)
  const patient1User = await UserModel.create({
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    passwordHash: patientPassword,
    role: 'PATIENT',
    language: 'hi',
  });

  const p1 = await PatientProfileModel.create({
    userId: patient1User._id,
    name: 'Rahul Sharma',
    age: 42,
    gender: 'MALE',
    contact: '+91 98765 43210',
    allergies: ['No known drug allergies (NKDA)'],
    chronicConditions: ['Hypertension (Essential Stage 1)'],
    medications: ['Amlodipine 5 mg OD (Morning)'],
  });

  // Patient 2: Sunita Devi (High Risk Emergency Scenario - Scenario B)
  const p2 = await PatientProfileModel.create({
    name: 'Sunita Devi',
    age: 58,
    gender: 'FEMALE',
    contact: '+91 98123 45678',
    allergies: ['Penicillin'],
    chronicConditions: ['Type 2 Diabetes Mellitus', 'Dyslipidemia'],
    medications: ['Metformin 500 mg BD', 'Atorvastatin 10 mg HS'],
  });

  // Patient 3: Priya Patel (AYUSH Case Profile)
  const p3 = await PatientProfileModel.create({
    name: 'Priya Patel',
    age: 29,
    gender: 'FEMALE',
    contact: '+91 97234 56789',
    allergies: ['Sulfonamides'],
    chronicConditions: ['Chronic Dyspepsia / Amlapitta'],
    medications: ['Avipattikar Churna (Ayurvedic)', 'Antacid SOS'],
  });

  // Patient 4: Mohammed Farooq (Moderate Abdominal / Surgical Review)
  const p4 = await PatientProfileModel.create({
    name: 'Mohammed Farooq',
    age: 47,
    gender: 'MALE',
    contact: '+91 99345 67890',
    allergies: [],
    chronicConditions: ['Mild Fatty Liver (Grade 1)'],
    medications: [],
  });

  // Patient 5: Aarav Verma (Pediatric Intake)
  const p5 = await PatientProfileModel.create({
    name: 'Aarav Verma',
    age: 9,
    gender: 'MALE',
    contact: '+91 98456 78901',
    allergies: ['Peanuts'],
    chronicConditions: ['Mild Asthma / Wheezing'],
    medications: ['Salbutamol inhaler SOS'],
  });

  // 3. Consultations
  // Consultation 1: Rahul Sharma - Abdominal Pain (Scenario A Normal Intake - DOCTOR_EDITED)
  const c1 = await ConsultationModel.create({
    patientId: p1._id,
    patientName: p1.name,
    patientAge: p1.age,
    patientGender: p1.gender,
    doctorId: doc1._id,
    language: 'hi',
    mode: 'MODERN',
    status: 'COMPLETED',
    chiefComplaint: 'पेट में दर्द (Abdominal pain)',
    messages: [
      {
        id: 'c1_m1',
        sender: 'AI',
        text: 'नमस्ते! मैं मेडीसारथी एआई क्लिनिकल सहायक हूँ। आज आपको क्या समस्या या परेशानी हो रही है?',
        language: 'hi',
        timestamp: '2026-09-02T10:00:00.000Z',
      },
      {
        id: 'c1_m2',
        sender: 'PATIENT',
        text: 'Mujhe pet mein dard hai.',
        language: 'hi',
        timestamp: '2026-09-02T10:00:30.000Z',
      },
      {
        id: 'c1_m3',
        sender: 'AI',
        text: 'Dard kab se ho raha hai?',
        language: 'hi',
        timestamp: '2026-09-02T10:00:35.000Z',
      },
      {
        id: 'c1_m4',
        sender: 'PATIENT',
        text: '3 din se.',
        language: 'hi',
        timestamp: '2026-09-02T10:01:00.000Z',
      },
      {
        id: 'c1_m5',
        sender: 'AI',
        text: 'क्या दर्द लगातार रहता है या बीच-बीच में होता है? क्या इसके साथ जी मिचलाना या भूख कम लगना भी है?',
        language: 'hi',
        timestamp: '2026-09-02T10:01:05.000Z',
      },
      {
        id: 'c1_m6',
        sender: 'PATIENT',
        text: 'लगातार रहता है, और हल्का जी मिचलाना और भूख न लगना भी है।',
        language: 'hi',
        timestamp: '2026-09-02T10:01:40.000Z',
      },
    ],
    structuredHistory: {
      chiefComplaint: 'Abdominal pain (Epigastric discomfort)',
      duration: '3 days',
      severity: 'Moderate',
      associatedSymptoms: ['Nausea', 'Loss of appetite'],
      pastHistory: ['Hypertension'],
      medications: ['Amlodipine 5 mg'],
      allergies: ['No known drug allergies (NKDA)'],
      familyHistory: ['Father had hypertension'],
      lifestyle: { diet: 'Mixed, irregular timing', sleep: '6 hrs/night' },
      ayushAssessment: {},
      unansweredFields: [],
    },
    triageResult: {
      riskLevel: 'LOW',
      reasons: ['Localized subacute abdominal discomfort without peritoneal signs or bleeding'],
      recommendedAction: 'Routine Clinical Evaluation & Diet Advice',
      disclaimer: 'This is an automated triage classification. Definitive clinical evaluation by a medical doctor is required.',
      detectedEmergencyTrigger: false,
      evaluatedAt: '2026-09-02T10:02:00.000Z',
    },
    aiSummary: `### Clinical History Summary (AI Intake)
**Patient:** Rahul Sharma, 42 Yrs, Male  
**Chief Complaint:** Epigastric Abdominal Pain for 3 days (continuous, moderate).  
**Associated Symptoms:** Nausea, Loss of appetite. Pertinent negatives: No hematemesis, no jaundice, no fever.  
**Past Medical History:** Essential Hypertension on Tab. Amlodipine 5mg OD.  
*Requires clinical palpation and physician verification.*`,
    doctorReview: {
      status: 'DOCTOR_EDITED',
      reviewedBy: 'Dr. V. K. Saxena, MD',
      reviewedAt: '2026-09-02T11:15:00.000Z',
      notes: 'Reviewed patient intake. Added rule out gastritis/peptic ulcer disease. Prescribed PPI.',
      verifiedByDoctor: true,
    },
    consentGiven: true,
    consentTimestamp: '2026-09-02T09:59:00.000Z',
    consentVersion: '1.0',
    createdAt: new Date('2026-09-02T10:00:00.000Z'),
    updatedAt: new Date('2026-09-02T11:15:00.000Z'),
  });

  // Consultation 2: Sunita Devi - Chest Pain & Dyspnea (Scenario B High Risk Emergency Halt)
  const c2 = await ConsultationModel.create({
    patientId: p2._id,
    patientName: p2.name,
    patientAge: p2.age,
    patientGender: p2.gender,
    language: 'hi',
    mode: 'MODERN',
    status: 'HALTED_EMERGENCY',
    chiefComplaint: 'सीने में दर्द एवं सांस लेने में तकलीफ (Chest pain & breathing difficulty)',
    messages: [
      {
        id: 'c2_m1',
        sender: 'AI',
        text: 'नमस्ते! मैं मेडीसारथी एआई सहायक हूँ। कृपया बताएं कि आज आपको क्या मुख्य समस्या हो रही है?',
        language: 'hi',
        timestamp: '2026-09-03T14:20:00.000Z',
      },
      {
        id: 'c2_m2',
        sender: 'PATIENT',
        text: 'Mujhe chest mein dard ho raha hai aur saans lene mein dikkat ho rahi hai.',
        language: 'hi',
        timestamp: '2026-09-03T14:20:45.000Z',
      },
      {
        id: 'c2_m3',
        sender: 'AI',
        text: '🔴 **उच्च प्राथमिकता चेतावनी (EMERGENCY ALERT)**\n\nआपके द्वारा बताए गए लक्षणों (सीने में दर्द/सांस में कठिनाई) में तत्काल चिकित्सीय हस्तक्षेप की आवश्यकता हो सकती है। सामान्य पूछताछ रोक दी गई है।\n\nकृपया तुरंत निकटतम आपातकालीन कक्ष में जाएं या आपातकालीन सेवा (108 / 112) पर संपर्क करें। यह मामला डॉक्टर के डैशबोर्ड पर प्राथमिक अलर्ट के साथ भेज दिया गया है।',
        language: 'hi',
        timestamp: '2026-09-03T14:20:47.000Z',
        isEmergencyAlert: true,
      },
    ],
    structuredHistory: {
      chiefComplaint: 'Acute chest pain (Retrosternal)',
      duration: 'Acute (< 2 hours)',
      severity: 'Severe',
      associatedSymptoms: ['Difficulty breathing (Dyspnea)', 'Diaphoresis'],
      pastHistory: ['Type 2 Diabetes Mellitus', 'Dyslipidemia'],
      medications: ['Metformin 500 mg', 'Atorvastatin 10 mg'],
      allergies: ['Penicillin'],
      familyHistory: ['History of CAD in maternal side'],
      lifestyle: {},
      ayushAssessment: {},
      unansweredFields: [],
    },
    triageResult: {
      riskLevel: 'HIGH',
      reasons: [
        'Acute retrosternal chest pain combined with dyspnea (difficulty breathing)',
        'Significant risk profile for Acute Coronary Syndrome (ACS) / Cardiac event in diabetic patient',
      ],
      recommendedAction: 'Immediate Emergency Room Evaluation / Call 108/112',
      disclaimer: 'This is an automated safety triage alert, NOT a clinical diagnosis. Immediate emergency doctor evaluation is mandatory.',
      detectedEmergencyTrigger: true,
      evaluatedAt: '2026-09-03T14:20:47.000Z',
    },
    aiSummary: `### 🚨 URGENT CLINICAL SUMMARY (High Priority)
**Patient:** Sunita Devi, 58 Yrs, Female  
**Chief Complaint:** Acute Chest Pain accompanied by Dyspnea.  
**Triage Category:** HIGH PRIORITY (Red Flag Detected).  
**Clinical Urgency:** Suspected acute cardiorespiratory compromise. Immediate 12-lead ECG, troponin, and vitals assessment required.`,
    doctorReview: {
      status: 'AI_GENERATED',
      reviewedBy: '',
      reviewedAt: '',
      notes: 'Pending immediate emergency physician review.',
      verifiedByDoctor: false,
    },
    consentGiven: true,
    consentTimestamp: '2026-09-03T14:19:00.000Z',
    consentVersion: '1.0',
    createdAt: new Date('2026-09-03T14:20:00.000Z'),
    updatedAt: new Date('2026-09-03T14:20:47.000Z'),
  });

  // Consultation 3: Priya Patel (AYUSH Case-Taking Mode)
  const c3 = await ConsultationModel.create({
    patientId: p3._id,
    patientName: p3.name,
    patientAge: p3.age,
    patientGender: p3.gender,
    doctorId: doc2._id,
    language: 'hi',
    mode: 'AYUSH',
    status: 'COMPLETED',
    chiefComplaint: 'पेट में जलन, खट्टी डकारें एवं अपच (Amlapitta / Hyperacidity)',
    messages: [
      {
        id: 'c3_m1',
        sender: 'AI',
        text: 'नमस्ते! मैं मेडीसारथी आयुष सहायक हूँ। आज आपको क्या स्वास्थ्य संबंधी समस्या है?',
        language: 'hi',
        timestamp: '2026-09-03T09:00:00.000Z',
      },
      {
        id: 'c3_m2',
        sender: 'PATIENT',
        text: 'Mujhe pichhle 2 hafte se khane ke baad seene aur pet mein jalan hoti hai aur khatti dakare aati hain.',
        language: 'hi',
        timestamp: '2026-09-03T09:01:00.000Z',
      },
      {
        id: 'c3_m3',
        sender: 'AI',
        text: 'आयुष परामर्श के अनुसार: आपकी भूख (अग्नि) कैसी है, और क्या पेट साफ होने में कोई परेशानी रहती है?',
        language: 'hi',
        timestamp: '2026-09-03T09:01:05.000Z',
      },
      {
        id: 'c3_m4',
        sender: 'PATIENT',
        text: 'Bhookh bahut tez lagti hai par khane ke baad jalan badh jati hai. Subah pet theek se saaf nahi hota.',
        language: 'hi',
        timestamp: '2026-09-03T09:02:00.000Z',
      },
    ],
    structuredHistory: {
      chiefComplaint: 'Amlapitta (Hyperacidity & Burning Sensation)',
      duration: '2 weeks',
      severity: 'Moderate',
      associatedSymptoms: ['Tikshna Agni (Hyperactive digestion)', 'Krura Koshtha (Constipation tendency)', 'Udgara (Sour eructations)'],
      pastHistory: ['Recurrent dyspepsia'],
      medications: ['Avipattikar Churna 3g BD'],
      allergies: ['Sulfonamides'],
      familyHistory: [],
      lifestyle: { diet: 'Katu-Amla-Lavana (Spicy/fried)', sleep: 'Broken sleep due to late night work' },
      ayushAssessment: {
        dominantDoshaTendency: 'Pitta-predominant (Warm body, sharp hunger, irritable)',
        agniAssessment: 'Tikshna-Agni (Hyperactive digestion, acidity, burning)',
        koshthaNature: 'Krura-Koshtha (Hard, dry stools, constipation tendency)',
        nidraQuality: 'Alpanidra (Disturbed / broken sleep)',
        satmyaDiet: 'Katu-Amla-Lavana (High spicy, sour & salty intake)',
      },
      unansweredFields: [],
    },
    triageResult: {
      riskLevel: 'LOW',
      reasons: ['Chronic functional acid peptic symptoms without alarm signs'],
      recommendedAction: 'AYUSH Clinical Outpatient Consultation & Ahara/Vihara Guidance',
      disclaimer: 'This is an AYUSH observational intake summary, not a medical validation or diagnosis.',
      detectedEmergencyTrigger: false,
      evaluatedAt: '2026-09-03T09:02:00.000Z',
    },
    aiSummary: `### AYUSH Clinical Intake Summary
**Patient:** Priya Patel, 29 Yrs, Female  
**Intake Protocol:** AYUSH Case Profile  
**Chief Complaint:** Amlapitta (Urdhwaga) with Vidaha (retrosternal burning) & Tikta/Amla Udgara for 2 weeks.  
**Prakriti & Agni Assessment:** Pitta-predominant prakriti, Tikshna Agni, Krura Koshtha.  
**Ahara-Vihara Factors:** High consumption of spicy/sour items, irregular night meal timings.  
*Requires AYUSH physician verification and formal clinical examination.*`,
    doctorReview: {
      status: 'DOCTOR_REVIEWED',
      reviewedBy: 'Dr. Ananya Sharma, BAMS',
      reviewedAt: '2026-09-03T10:30:00.000Z',
      notes: 'Confirmed Pitta aggravation symptoms. Advised Pathya Ahara (cooling diet, regular timings) and Kamadudha Rasa.',
      verifiedByDoctor: true,
    },
    consentGiven: true,
    consentTimestamp: '2026-09-03T08:59:00.000Z',
    consentVersion: '1.0',
    createdAt: new Date('2026-09-03T09:00:00.000Z'),
    updatedAt: new Date('2026-09-03T10:30:00.000Z'),
  });

  // Consultation 4: Mohammed Farooq (In Progress)
  const c4 = await ConsultationModel.create({
    patientId: p4._id,
    patientName: p4.name,
    patientAge: p4.age,
    patientGender: p4.gender,
    language: 'en',
    mode: 'MODERN',
    status: 'IN_PROGRESS',
    chiefComplaint: 'Right upper quadrant heaviness',
    messages: [
      {
        id: 'c4_m1',
        sender: 'AI',
        text: 'Hello! I am MediSaarthi AI Clinical Assistant. What symptoms or medical concern brings you in today?',
        language: 'en',
        timestamp: '2026-09-03T16:00:00.000Z',
      },
      {
        id: 'c4_m2',
        sender: 'PATIENT',
        text: 'I have had mild heaviness on the right side of my stomach after heavy meals.',
        language: 'en',
        timestamp: '2026-09-03T16:01:00.000Z',
      },
      {
        id: 'c4_m3',
        sender: 'AI',
        text: 'How long have you been experiencing this heaviness, and does it radiate to your back or shoulder?',
        language: 'en',
        timestamp: '2026-09-03T16:01:05.000Z',
      },
    ],
    structuredHistory: {
      chiefComplaint: 'Right upper quadrant heaviness',
      duration: '10 days',
      severity: 'Mild',
      associatedSymptoms: ['Postprandial fullness'],
      pastHistory: ['Fatty Liver Grade 1'],
      medications: [],
      allergies: [],
      familyHistory: [],
      lifestyle: { physicalActivity: 'Sedentary' },
      ayushAssessment: {},
      unansweredFields: ['Current medications', 'Allergies'],
    },
    triageResult: {
      riskLevel: 'LOW',
      reasons: ['Mild subacute abdominal fullness without acute inflammatory or obstructive signs'],
      recommendedAction: 'Standard Outpatient Consultation',
      disclaimer: 'This is an automated triage evaluation, not a diagnosis.',
      detectedEmergencyTrigger: false,
      evaluatedAt: '2026-09-03T16:01:05.000Z',
    },
    aiSummary: 'Ongoing intake for right upper quadrant discomfort.',
    doctorReview: { status: 'AI_GENERATED', reviewedBy: '', reviewedAt: '', notes: '', verifiedByDoctor: false },
    consentGiven: true,
    consentTimestamp: '2026-09-03T15:58:00.000Z',
    consentVersion: '1.0',
    createdAt: new Date('2026-09-03T16:00:00.000Z'),
    updatedAt: new Date('2026-09-03T16:01:05.000Z'),
  });

  // Consultation 5: Aarav Verma (Pediatric Intake)
  const c5 = await ConsultationModel.create({
    patientId: p5._id,
    patientName: p5.name,
    patientAge: p5.age,
    patientGender: p5.gender,
    language: 'en',
    mode: 'MODERN',
    status: 'COMPLETED',
    chiefComplaint: 'Night-time dry cough and mild wheeze',
    messages: [
      {
        id: 'c5_m1',
        sender: 'AI',
        text: 'Hello! What symptoms or medical concern brings Aarav in today?',
        language: 'en',
        timestamp: '2026-09-01T11:00:00.000Z',
      },
      {
        id: 'c5_m2',
        sender: 'PATIENT',
        text: 'He has had a dry cough at night for 4 days with mild whistling sound when breathing.',
        language: 'en',
        timestamp: '2026-09-01T11:01:00.000Z',
      },
    ],
    structuredHistory: {
      chiefComplaint: 'Nocturnal dry cough and mild wheezing',
      duration: '4 days',
      severity: 'Moderate',
      associatedSymptoms: ['Mild expiratory wheeze', 'Disturbed sleep'],
      pastHistory: ['Mild childhood asthma'],
      medications: ['Salbutamol inhaler SOS'],
      allergies: ['Peanuts'],
      familyHistory: ['Mother has allergic rhinitis'],
      lifestyle: {},
      ayushAssessment: {},
      unansweredFields: [],
    },
    triageResult: {
      riskLevel: 'MEDIUM',
      reasons: ['Pediatric nocturnal cough with audible wheeze; known asthma profile'],
      recommendedAction: 'Priority Pediatric Outpatient Evaluation',
      disclaimer: 'This is an AI triage classification. Seek immediate care if intercostal retractions or cyanosis occur.',
      detectedEmergencyTrigger: false,
      evaluatedAt: '2026-09-01T11:01:05.000Z',
    },
    aiSummary: `### Pediatric Clinical Intake Summary
**Patient:** Aarav Verma, 9 Yrs, Male  
**Chief Complaint:** Nocturnal dry cough and audible wheeze for 4 days.  
**Relevant History:** Known mild asthma, peanut allergy.  
*Requires chest auscultation and peak flow measurement by pediatrician.*`,
    doctorReview: {
      status: 'DOCTOR_REVIEWED',
      reviewedBy: 'Dr. V. K. Saxena, MD',
      reviewedAt: '2026-09-01T12:00:00.000Z',
      notes: 'Reviewed pediatric intake. Auscultated bilateral mild rhonchi. Advised nebulization and inhaler spacing.',
      verifiedByDoctor: true,
    },
    consentGiven: true,
    consentTimestamp: '2026-09-01T10:55:00.000Z',
    consentVersion: '1.0',
    createdAt: new Date('2026-09-01T11:00:00.000Z'),
    updatedAt: new Date('2026-09-01T12:00:00.000Z'),
  });

  // 4. Medical Documents with OCR Data
  // Document 1: Rahul Sharma Prescription
  const d1 = await MedicalDocumentModel.create({
    patientId: p1._id,
    fileName: 'Prescription_DrSaxena_Jan2026.png',
    fileType: 'image/png',
    documentType: 'PRESCRIPTION',
    extractedText: `METROPOLITAN HOSPITAL\nPatient: Rahul Sharma | Age: 42 | BP: 150/95 mmHg\nDiagnosis: Essential Hypertension\nRx:\nTab. Amlodipine 5 mg OD\nTab. Multivitamin 1 tab daily`,
    structuredData: {
      diagnoses: ['Essential Hypertension'],
      medications: ['Amlodipine 5 mg OD', 'Multivitamin 1 tab daily'],
      investigations: [
        { testName: 'Blood Pressure', value: '150/95 mmHg', referenceRange: '< 120/80 mmHg', isAbnormal: true, notes: 'Elevated' },
      ],
      potentialAbnormalities: ['Blood Pressure 150/95 mmHg (Elevated)'],
    },
    verificationStatus: 'VERIFIED',
    doctorNotes: 'Prescription verified. Dose active.',
    uploadedAt: new Date('2026-01-15T09:30:00.000Z'),
  });

  // Document 2: Rahul Sharma CBC Blood Report
  const d2 = await MedicalDocumentModel.create({
    patientId: p1._id,
    fileName: 'Complete_Blood_Count_Report.pdf',
    fileType: 'application/pdf',
    documentType: 'BLOOD_REPORT',
    extractedText: `APOLLO CLINICAL LAB\nPatient: Rahul Sharma | Ref: Dr. V. K. Saxena\nHb: 12.4 g/dL (Ref: 13.0 - 17.0 g/dL)\nWBC: 6,800 /mcL\nPlatelet Count: 240,000 /mcL\nFasting Glucose: 102 mg/dL`,
    structuredData: {
      diagnoses: ['Mild nutritional anemia'],
      medications: [],
      investigations: [
        { testName: 'Hemoglobin (Hb)', value: '12.4 g/dL', referenceRange: '13.0 - 17.0 g/dL', isAbnormal: true, notes: 'Mildly low' },
        { testName: 'Total WBC Count', value: '6,800 /mcL', referenceRange: '4,000 - 11,000 /mcL', isAbnormal: false },
        { testName: 'Platelet Count', value: '240,000 /mcL', referenceRange: '150,000 - 450,000 /mcL', isAbnormal: false },
      ],
      potentialAbnormalities: ['Hemoglobin 12.4 g/dL (Mildly low)'],
    },
    verificationStatus: 'VERIFIED',
    doctorNotes: 'Recommended dietary iron supplementation.',
    uploadedAt: new Date('2026-03-10T14:00:00.000Z'),
  });

  // Document 3: Sunita Devi Lipid Panel
  await MedicalDocumentModel.create({
    patientId: p2._id,
    fileName: 'Lipid_Panel_SunitaDevi.png',
    fileType: 'image/png',
    documentType: 'BLOOD_REPORT',
    extractedText: `HEALTH DIAGNOSTICS\nPatient: Sunita Devi | Age: 58\nTotal Cholesterol: 245 mg/dL (High)\nLDL Cholesterol: 162 mg/dL (High)\nHDL Cholesterol: 41 mg/dL\nTriglycerides: 210 mg/dL (High)`,
    structuredData: {
      diagnoses: ['Mixed Dyslipidemia'],
      medications: ['Atorvastatin 10 mg'],
      investigations: [
        { testName: 'Total Cholesterol', value: '245 mg/dL', referenceRange: '< 200 mg/dL', isAbnormal: true, notes: 'High' },
        { testName: 'LDL Cholesterol', value: '162 mg/dL', referenceRange: '< 100 mg/dL', isAbnormal: true, notes: 'High' },
      ],
      potentialAbnormalities: ['Total Cholesterol elevated (245 mg/dL)', 'LDL Cholesterol high (162 mg/dL)'],
    },
    verificationStatus: 'VERIFIED',
    doctorNotes: 'Under active statin management.',
    uploadedAt: new Date('2026-06-20T11:00:00.000Z'),
  });

  // Document 4: Priya Patel Discharge Summary
  await MedicalDocumentModel.create({
    patientId: p3._id,
    fileName: 'Ayush_Case_Observation_Sheet.png',
    fileType: 'image/png',
    documentType: 'DISCHARGE_SUMMARY',
    extractedText: `PATANJALI AYURVEDIC CLINIC\nPatient: Priya Patel | Age: 29\nObservation: Pittaja Amlapitta\nAgni: Tikshna | Koshtha: Krura\nPrescribed: Avipattikar Churna 3g BD with warm water`,
    structuredData: {
      diagnoses: ['Pitta-predominant Amlapitta'],
      medications: ['Avipattikar Churna 3g BD'],
      investigations: [],
      potentialAbnormalities: [],
    },
    verificationStatus: 'VERIFIED',
    doctorNotes: 'Ayurveda case profile matched.',
    uploadedAt: new Date('2026-08-15T15:30:00.000Z'),
  });

  // Document 5: Aarav Verma Allergy Panel
  await MedicalDocumentModel.create({
    patientId: p5._id,
    fileName: 'Pediatric_Allergy_Summary.pdf',
    fileType: 'application/pdf',
    documentType: 'OTHER',
    extractedText: `CHILDREN SPECIALTY HOSPITAL\nPatient: Aarav Verma | Age: 9\nSpecific IgE: Peanut (Class 3 - Positive)\nEnvironmental: House Dust Mite (Mild positive)`,
    structuredData: {
      diagnoses: ['Peanut Allergy', 'Atopic Wheeze'],
      medications: ['Salbutamol MDI'],
      investigations: [
        { testName: 'Peanut IgE', value: 'Positive (Class 3)', referenceRange: 'Negative', isAbnormal: true, notes: 'Avoid peanut exposure' },
      ],
      potentialAbnormalities: ['Peanut IgE Positive'],
    },
    verificationStatus: 'VERIFIED',
    doctorNotes: 'Advised strict peanut exclusion at school.',
    uploadedAt: new Date('2026-07-05T10:00:00.000Z'),
  });

  // 5. Timeline Events for Rahul Sharma
  await MedicalTimelineModel.create([
    {
      patientId: p1._id,
      eventType: 'PRESCRIPTION',
      date: '2026-01-15',
      title: 'Prescription: Essential Hypertension Initiation',
      summary: 'Dr. V. K. Saxena initiated Tab. Amlodipine 5mg OD. BP recorded at 150/95 mmHg.',
      sourceId: d1.id,
      riskLevel: 'MEDIUM',
      verifiedStatus: 'VERIFIED',
    },
    {
      patientId: p1._id,
      eventType: 'LAB_TEST',
      date: '2026-03-10',
      title: 'Blood Test: Complete Blood Count (CBC)',
      summary: 'Hemoglobin: 12.4 g/dL (Mildly low). Platelets & WBC normal.',
      sourceId: d2.id,
      riskLevel: 'LOW',
      verifiedStatus: 'VERIFIED',
    },
    {
      patientId: p1._id,
      eventType: 'CONSULTATION',
      date: '2026-09-02',
      title: 'AI Clinical Intake: Epigastric Abdominal Pain',
      summary: 'Subacute 3-day history of moderate abdominal discomfort and nausea. Doctor reviewed and prescribed PPI.',
      sourceId: c1.id,
      riskLevel: 'LOW',
      verifiedStatus: 'VERIFIED',
    },
  ]);

  // Timeline Event for Sunita Devi (Emergency Red Flag)
  await MedicalTimelineModel.create({
    patientId: p2._id,
    eventType: 'EMERGENCY_TRIAGE',
    date: '2026-09-03',
    title: 'CRITICAL RED FLAG ALERT: Chest Pain + Dyspnea',
    summary: 'Acute chest pain with breathing difficulty detected in diabetic female. High risk triage triggered.',
    sourceId: c2.id,
    riskLevel: 'HIGH',
    verifiedStatus: 'AI_GENERATED',
  });

  console.log(`[Seed] Seed data successfully loaded: 5 patients, 3 doctors, 5 consultations, 5 documents, and timeline events.`);
}

export async function seedDatabaseIfEmpty() {
  await seedDatabase(false);
}

// Standalone execution runner
if (process.argv[1]?.endsWith('seedRunner.ts') || process.argv[1]?.endsWith('seedRunner.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase(true);
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[Seed Runner Error]:', err);
      process.exit(1);
    }
  })();
}
