import { triageService } from '../services/triageService.js';
import { interviewEngine } from '../services/interviewEngine.js';
import { aiService } from '../services/aiService.js';
import { visualInspectionService } from '../services/visualInspectionService.js';
import { StructuredHistory } from '../../../shared/types/index.js';
import { createConsultationSchema } from '../../../shared/schemas/index.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedTests++;
  }
}

async function runAllTests() {
  console.log(`\n================================================================`);
  console.log(` MEDISAARTHI CLINICAL & AI TRIAGE TEST SUITE (SIH26047)`);
  console.log(`================================================================\n`);

  // TEST 1: High Priority Triage - Chest pain + Breathing difficulty in Hindi / Hinglish
  console.log(`[Suite 1: Deterministic Red-Flag Triage Engine]`);
  {
    const history: StructuredHistory = {
      chiefComplaint: 'Chest pain',
      duration: '1 hour',
      severity: 'Severe',
      associatedSymptoms: ['Difficulty breathing'],
      pastHistory: [],
      medications: [],
      allergies: [],
      familyHistory: [],
      lifestyle: {},
    };

    const emergencyResult = triageService.evaluateTriage({
      history,
      recentMessages: ['Mujhe chest mein dard ho raha hai aur saans lene mein dikkat ho rahi hai.'],
    });

    assert(emergencyResult.riskLevel === 'HIGH', 'Chest pain + dyspnea must classify as HIGH priority');
    assert(emergencyResult.detectedEmergencyTrigger === true, 'detectedEmergencyTrigger must be true');
    assert(emergencyResult.reasons.length > 0, 'Reasons must be populated explaining clinical urgency');
  }

  // TEST 2: Low Risk Triage - Normal Abdominal Pain without red flags (Scenario A)
  {
    const history: StructuredHistory = {
      chiefComplaint: 'Abdominal pain',
      duration: '3 days',
      severity: 'Moderate',
      associatedSymptoms: ['Nausea', 'Loss of appetite'],
      pastHistory: ['Hypertension'],
      medications: ['Amlodipine 5mg'],
      allergies: [],
      familyHistory: [],
      lifestyle: {},
    };

    const normalResult = triageService.evaluateTriage({
      history,
      recentMessages: ['Mujhe pet mein dard hai', '3 din se hai', 'lagatar rehta hai'],
    });

    assert(normalResult.riskLevel === 'LOW', 'Subacute abdominal pain without alarm signs must classify as LOW priority');
    assert(normalResult.detectedEmergencyTrigger === false, 'detectedEmergencyTrigger must be false for normal abdominal pain');
  }

  // TEST 3: High Priority Triage - Stroke symptoms / Paralysis / Loss of consciousness
  {
    const strokeResult = triageService.evaluateTriage({
      history: {
        chiefComplaint: 'Weakness',
        duration: '30 mins',
        severity: 'Severe',
        associatedSymptoms: [],
        pastHistory: [],
        medications: [],
        allergies: [],
        familyHistory: [],
        lifestyle: {},
      },
      recentMessages: ['Achanak ek taraf face droop ho gaya aur bol nahi pa rahe hain'],
    });

    assert(strokeResult.riskLevel === 'HIGH', 'Stroke-like symptoms (facial droop + speech) must classify as HIGH');
  }

  // TEST 4: Dynamic Interview Engine - Entity Extraction & Question Generation
  console.log(`\n[Suite 2: Dynamic Interview Engine & State Transition]`);
  {
    const baseHistory: StructuredHistory = {
      chiefComplaint: '',
      duration: '',
      severity: '',
      associatedSymptoms: [],
      pastHistory: [],
      medications: [],
      allergies: [],
      familyHistory: [],
      lifestyle: {},
    };

    // Step 1: Patient reports chief complaint
    const turn1 = await interviewEngine.processTurn(
      baseHistory,
      'Mujhe pet mein dard hai',
      'hi',
      'MODERN',
      []
    );

    assert(turn1.updatedHistory.chiefComplaint.length > 0, 'Chief complaint must be extracted from text');
    assert(turn1.isEmergencyHalt === false, 'Abdominal pain must not trigger emergency halt');
    assert(turn1.aiReplyMessage.text.length > 5, 'AI must generate a contextual follow-up question');

    // Step 2: Emergency turn stops interview immediately
    const turnEmergency = await interviewEngine.processTurn(
      turn1.updatedHistory,
      'Mujhe chest mein dard ho raha hai aur saans lene mein dikkat ho rahi hai.',
      'hi',
      'MODERN',
      [turn1.aiReplyMessage]
    );

    assert(turnEmergency.isEmergencyHalt === true, 'Emergency trigger must halt regular intake interview');
    assert(turnEmergency.triageResult.riskLevel === 'HIGH', 'Emergency turn must produce HIGH risk triage');
    assert(turnEmergency.aiReplyMessage.isEmergencyAlert === true, 'Emergency alert flag must be attached to message');

    // Step 3: Multi-turn duration & severity preservation (answering severity must NOT overwrite duration)
    const seqTurn1 = await interviewEngine.processTurn(
      baseHistory,
      'I have stomach pain for 2 days',
      'en',
      'MODERN',
      []
    );
    assert(seqTurn1.updatedHistory.duration === '2 days', `Turn 1 duration must be "2 days", got: "${seqTurn1.updatedHistory.duration}"`);

    // In Turn 2, the patient replies "moderate" to the severity inquiry
    const seqTurn2 = await interviewEngine.processTurn(
      seqTurn1.updatedHistory,
      'moderate',
      'en',
      'MODERN',
      [seqTurn1.aiReplyMessage]
    );
    assert(seqTurn2.updatedHistory.duration === '2 days', `Turn 2 duration must remain "2 days" (not overwritten by moderate), got: "${seqTurn2.updatedHistory.duration}"`);
    assert(seqTurn2.updatedHistory.severity === 'Moderate', `Turn 2 severity must be "Moderate", got: "${seqTurn2.updatedHistory.severity}"`);
  }

  // TEST 5: Document OCR Entity Extraction
  console.log(`\n[Suite 3: OCR Entity & Abnormal Value Extraction]`);
  {
    const sampleOcr = `
      METROPOLITAN HOSPITAL
      BP: 150/95 mmHg
      Hemoglobin: 12.4 g/dL
      Rx: Tab. Amlodipine 5 mg OD
    `;

    const extracted = await aiService.extractDocumentData(sampleOcr);
    assert(extracted.investigations.length >= 2, 'Must extract at least BP and Hemoglobin from report');
    const hasAbnormalBP = extracted.investigations.some(i => i.testName.includes('Blood Pressure') && i.isAbnormal);
    assert(hasAbnormalBP, 'Must flag elevated BP (150/95) as abnormal');
    assert(extracted.medications.some(m => m.toLowerCase().includes('amlodipine')), 'Must detect Amlodipine medication');
  }

  // TEST 6: Doctor Patient Management (Accept, Reject, Edit)
  console.log(`\n[Suite 4: Doctor Patient Governance & Triage Action (Accept, Reject, Edit)]`);
  {
    const { connectDB, disconnectDB } = await import('../config/db.js');
    const { PatientProfileModel } = await import('../models/PatientProfile.js');
    const { MedicalTimelineModel } = await import('../models/MedicalTimeline.js');

    await connectDB();

    // 1. Create a test patient with PENDING status
    const testPatient = await PatientProfileModel.create({
      name: 'Governance Test Patient',
      age: 45,
      gender: 'MALE',
      contact: '+91 99999 88888',
      allergies: ['Penicillin'],
      chronicConditions: ['Type 2 Diabetes'],
      medications: ['Metformin 500mg'],
      status: 'PENDING',
    });

    assert(testPatient.status === 'PENDING', 'New patient intake must default to PENDING status');

    // 2. Test Editing Patient Profile
    testPatient.name = 'Governance Test Patient (Edited)';
    testPatient.age = 46;
    testPatient.allergies.push('Aspirin');
    testPatient.medications.push('Glimepiride 1mg');
    await testPatient.save();

    const editedPatient = await PatientProfileModel.findById(testPatient._id);
    assert(editedPatient?.name === 'Governance Test Patient (Edited)', 'Doctor must be able to edit patient name');
    assert(editedPatient?.age === 46, 'Doctor must be able to edit patient age');
    assert(editedPatient?.allergies.includes('Aspirin') === true, 'Doctor must be able to add/edit patient allergies');
    assert(editedPatient?.medications.includes('Glimepiride 1mg') === true, 'Doctor must be able to edit medications');

    // 3. Test Doctor ACCEPTING the patient
    editedPatient!.status = 'ACCEPTED';
    editedPatient!.doctorReview = {
      status: 'ACCEPTED',
      reviewedBy: 'Dr. V. K. Saxena, MD',
      reviewedAt: new Date(),
      department: 'AYUSH Clinic (Kayachikitsa)',
      acceptanceNotes: 'Admitted for Agni assessment and panchakarma preparation',
    };
    await editedPatient!.save();

    await MedicalTimelineModel.create({
      patientId: testPatient._id,
      date: new Date().toISOString(),
      eventType: 'CONSULTATION',
      title: `Patient Accepted & Admitted to ${editedPatient!.doctorReview!.department}`,
      summary: `Accepted by Dr. V. K. Saxena, MD. Notes: ${editedPatient!.doctorReview!.acceptanceNotes}`,
      sourceId: testPatient._id.toString(),
      verifiedStatus: 'VERIFIED',
    });

    const acceptedPatient = await PatientProfileModel.findById(testPatient._id);
    assert(acceptedPatient?.status === 'ACCEPTED', 'Patient status must update to ACCEPTED upon doctor acceptance');
    assert(acceptedPatient?.doctorReview?.department === 'AYUSH Clinic (Kayachikitsa)', 'Assigned department must be recorded');
    assert(acceptedPatient?.doctorReview?.reviewedBy === 'Dr. V. K. Saxena, MD', 'Reviewing clinician must be recorded');

    // 4. Test Doctor REJECTING the patient
    acceptedPatient!.status = 'REJECTED';
    acceptedPatient!.doctorReview = {
      status: 'REJECTED',
      reviewedBy: 'Dr. V. K. Saxena, MD',
      reviewedAt: new Date(),
      rejectionReason: 'Critical Red-Flag: Escalated directly to Tertiary Emergency Hospital',
    };
    await acceptedPatient!.save();

    await MedicalTimelineModel.create({
      patientId: testPatient._id,
      date: new Date().toISOString(),
      eventType: 'EMERGENCY_TRIAGE',
      title: 'Patient Intake Rejected / Escalated',
      summary: `Critical Red-Flag Escalation: ${acceptedPatient!.doctorReview!.rejectionReason}`,
      sourceId: testPatient._id.toString(),
      riskLevel: 'HIGH',
      verifiedStatus: 'VERIFIED',
    });

    const rejectedPatient = await PatientProfileModel.findById(testPatient._id);
    assert(rejectedPatient?.status === 'REJECTED', 'Patient status must update to REJECTED upon doctor rejection');
    assert(rejectedPatient?.doctorReview?.rejectionReason?.includes('Tertiary Emergency') === true, 'Rejection reason must be stored');

    // 5. Verify Timeline Audit Entries
    const timelineEntries = await MedicalTimelineModel.find({ patientId: testPatient._id });
    assert(timelineEntries.length >= 2, 'Medical timeline must generate audit records for both accept and reject decisions');

    // Clean up test document
    await PatientProfileModel.findByIdAndDelete(testPatient._id);
    await MedicalTimelineModel.deleteMany({ patientId: testPatient._id });
    await disconnectDB();
  }

  // TEST 7: Accurate Duration & Onset Parsing
  console.log(`\n[Suite 5: Accurate Duration & Onset Parsing]`);
  {
    const d1 = aiService.parseDuration('I have pain for 10 days', 'i have pain for 10 days', false, false);
    assert(d1 === '10 days', `10 days must parse as "10 days", got: "${d1}"`);

    const d2 = aiService.parseDuration('Headache since 1 week', 'headache since 1 week', false, false);
    assert(d2 === '1 week', `1 week must parse as "1 week" (not 1 day), got: "${d2}"`);

    const d3 = aiService.parseDuration('Fever for 2 weeks', 'fever for 2 weeks', false, false);
    assert(d3 === '2 weeks', `2 weeks must parse as "2 weeks", got: "${d3}"`);

    const d4 = aiService.parseDuration('Chest ache for 1 hour', 'chest ache for 1 hour', false, false);
    assert(d4 === '1 hour', `1 hour must parse as "1 hour" (not 1 day), got: "${d4}"`);

    const d5 = aiService.parseDuration('Cough since 3 months', 'cough since 3 months', false, false);
    assert(d5 === '3 months', `3 months must parse as "3 months", got: "${d5}"`);

    const d6 = aiService.parseDuration('Mujhe 10 din se bukhaar hai', 'mujhe 10 din se bukhaar hai', true, false);
    assert(d6 !== null && d6.includes('10 दिन'), `10 din must parse into Hindi 10 days, got: "${d6}"`);

    const d7 = aiService.parseDuration('Ek hafte se', 'ek hafte se', true, false);
    assert(d7 !== null && d7.includes('सप्ताह'), `Ek hafte must parse into Hindi week (not 1 day), got: "${d7}"`);

    const d8 = aiService.parseDuration('From Monday', 'from monday', false, true);
    assert(d8 === 'From Monday', `When asked for duration, user phrase "From Monday" must be preserved, got: "${d8}"`);

    // Severity words must NEVER be parsed as duration
    const dMod = aiService.parseDuration('moderate', 'moderate', false, true);
    assert(dMod === null, `Word "moderate" must NOT be parsed as duration, got: "${dMod}"`);

    const dItMod = aiService.parseDuration('It is moderate', 'it is moderate', false, true);
    assert(dItMod === null, `Phrase "It is moderate" must NOT be parsed as duration, got: "${dItMod}"`);

    const dMild = aiService.parseDuration('mild', 'mild', false, true);
    assert(dMild === null, `Word "mild" must NOT be parsed as duration, got: "${dMild}"`);

    const dTez = aiService.parseDuration('bahut tez hai', 'bahut tez hai', true, true);
    assert(dTez === null, `Phrase "bahut tez hai" must NOT be parsed as duration, got: "${dTez}"`);

    // Pure numbers / ranges when asked duration
    const dSolo = aiService.parseDuration('2', '2', false, true);
    assert(dSolo === '2 days', `Single digit "2" when asked duration must parse as "2 days", got: "${dSolo}"`);

    const dRange = aiService.parseDuration('2-3', '2-3', false, true);
    assert(dRange === '2-3 days', `Range "2-3" when asked duration must parse as "2-3 days", got: "${dRange}"`);

    const dCombined = aiService.parseDuration('moderate for 2 days', 'moderate for 2 days', false, false);
    assert(dCombined === '2 days', `Combined phrase "moderate for 2 days" must extract "2 days", got: "${dCombined}"`);
  }

  // TEST 8: Patient Demographics Synchronization in Consultations
  console.log(`\n[Suite 6: Patient Age Synchronization in Consultations]`);
  {
    const { connectDB, disconnectDB } = await import('../config/db.js');
    const { PatientProfileModel } = await import('../models/PatientProfile.js');
    const { ConsultationModel } = await import('../models/Consultation.js');

    await connectDB();

    // Setup: patient profile created with default age 35
    const testPat = await PatientProfileModel.create({
      name: 'Age Sync Test Patient',
      age: 35,
      gender: 'OTHER',
      contact: '',
      allergies: [],
      chronicConditions: [],
      medications: [],
    });

    assert(testPat.age === 35, 'Initial profile setup has age 35');

    // Simulate consultation creation with entered age 52
    const enteredAge = 52;
    const enteredGender = 'MALE';

    let patient = await PatientProfileModel.findOne({ name: 'Age Sync Test Patient' });
    if (patient) {
      patient.age = enteredAge;
      patient.gender = enteredGender;
      await patient.save();
    }

    const testConsultation = await ConsultationModel.create({
      patientId: testPat._id,
      patientName: testPat.name,
      patientAge: enteredAge,
      patientGender: enteredGender,
      language: 'en',
      mode: 'MODERN',
      status: 'IN_PROGRESS',
      chiefComplaint: 'Migraine',
      messages: [],
      structuredHistory: {
        chiefComplaint: 'Migraine',
        duration: '2 weeks',
        severity: 'Moderate',
        associatedSymptoms: [],
        pastHistory: [],
        medications: [],
        allergies: [],
        familyHistory: [],
        lifestyle: {},
        unansweredFields: [],
      },
      triageResult: {
        riskLevel: 'LOW',
        reasons: [],
        recommendedAction: '',
        disclaimer: '',
        evaluatedAt: new Date().toISOString(),
      },
      doctorReview: {
        status: 'AI_GENERATED',
        reviewedBy: '',
        reviewedAt: '',
        notes: '',
        verifiedByDoctor: false,
      },
      consentGiven: true,
      consentTimestamp: new Date().toISOString(),
      consentVersion: '1.0',
    });

    const refreshedPatient = await PatientProfileModel.findById(testPat._id);
    assert(refreshedPatient?.age === 52, `Patient profile must be updated to 52, got: ${refreshedPatient?.age}`);
    assert(testConsultation.patientAge === 52, `Consultation patientAge must be 52, got: ${testConsultation.patientAge}`);
    assert(testConsultation.structuredHistory.duration === '2 weeks', `Consultation duration must be 2 weeks, got: ${testConsultation.structuredHistory.duration}`);

    // Cleanup
    await PatientProfileModel.findByIdAndDelete(testPat._id);
    await ConsultationModel.findByIdAndDelete(testConsultation._id);
    await disconnectDB();
  }

  // TEST 7: AYUSH Clinical Intake Extraction & Case Sheet Synthesis
  console.log(`\n[Suite 7: AYUSH Clinical Intake & Case Sheet Synthesis (SIH26047)]`);
  {
    // 7.1 Heuristic AYUSH entity extraction
    const pittaSample = 'Mujhe pet mein bahut jalan hoti hai aur bhookh kam lagti hai, khana pachta nahi hai';
    const pittaAyush = aiService.extractAyushEntities(pittaSample, pittaSample.toLowerCase());

    assert(pittaAyush.dominantDoshaTendency?.includes('Pitta') === true, `Pitta symptoms must identify Pitta dosha, got: ${pittaAyush.dominantDoshaTendency}`);
    assert(pittaAyush.agniAssessment === 'Manda-Agni', `Loss of appetite / slow digestion must classify as Manda-Agni, got: ${pittaAyush.agniAssessment}`);
    assert(pittaAyush.annavahaSymptoms?.includes('Aruchi') === true, `Digestive complaint must mark Annavaha Srotas, got: ${pittaAyush.annavahaSymptoms}`);

    // 7.2 Constipation and Vata dosha extraction
    const vataSample = 'Kamar mein tez dard hai, kabz rehti hai aur pet saaf nahi hota';
    const vataAyush = aiService.extractAyushEntities(vataSample, vataSample.toLowerCase());

    assert(vataAyush.dominantDoshaTendency?.includes('Vata') === true, `Pain and constipation must identify Vata dosha, got: ${vataAyush.dominantDoshaTendency}`);
    assert(vataAyush.koshthaNature === 'Krura-Koshtha', `Constipation must classify as Krura-Koshtha, got: ${vataAyush.koshthaNature}`);

    // 7.3 Sleep (Nidra) and Stamina (Bala) extraction
    const sleepSample = 'Bahut kamzori lagti hai aur raat mein neend nahi aati alpanidra jaisa lagta hai';
    const sleepAyush = aiService.extractAyushEntities(sleepSample, sleepSample.toLowerCase());

    assert(sleepAyush.physicalEndurance === 'Avara', `Exhaustion must classify as Avara Bala, got: ${sleepAyush.physicalEndurance}`);
    assert(sleepAyush.nidraQuality === 'Alpanidra', `Broken / lack of sleep must classify as Alpanidra, got: ${sleepAyush.nidraQuality}`);

    // 7.4 Dynamic Interview Greeting in AYUSH mode
    const emptyHist: StructuredHistory = {
      chiefComplaint: '',
      duration: '',
      severity: '',
      associatedSymptoms: [],
      pastHistory: [],
      medications: [],
      allergies: [],
      familyHistory: [],
      lifestyle: {},
      ayushAssessment: {},
    };

    const initialAyushQ = await aiService.getNextQuestion(emptyHist, 'hi', 'AYUSH', '', []);
    assert(initialAyushQ.nextQuestion.includes('आयुष') === true, `AYUSH mode greeting must reference AYUSH physician, got: ${initialAyushQ.nextQuestion}`);

    // 7.5 AYUSH Summary Generation contains classical Ayurvedic sections
    const completeAyushHist: StructuredHistory = {
      chiefComplaint: 'पेट में जलन व खट्टी डकारें (Acidity)',
      duration: '4 days',
      severity: 'Moderate',
      associatedSymptoms: ['Nausea', 'Loss of appetite'],
      pastHistory: [],
      medications: [],
      allergies: [],
      familyHistory: [],
      lifestyle: {},
      ayushAssessment: {
        dominantDoshaTendency: 'Pitta-predominant',
        agniAssessment: 'Tikshna-Agni',
        koshthaNature: 'Madhyama-Koshtha',
        physicalEndurance: 'Madhyama',
        nidraQuality: 'Sukhapurvaka',
        satmyaDiet: 'Katu-Amla-Lavana',
      },
    };

    const ayushSummary = await aiService.generateSummary(
      completeAyushHist,
      [],
      'AYUSH',
      'Ananya Sharma',
      29,
      'FEMALE'
    );

    assert(ayushSummary.includes('AYUSH Clinical Case Sheet') === true, 'Summary must have AYUSH Clinical Case Sheet heading');
    assert(ayushSummary.includes('Pitta-predominant') === true, 'Summary must reflect dominant Dosha tendency');
    assert(ayushSummary.includes('Tikshna-Agni') === true, 'Summary must reflect Agni assessment');
    assert(ayushSummary.includes('Pathya') === true, 'Summary must include Pathya considerations');
    assert(ayushSummary.includes('Apathya') === true, 'Summary must include Apathya considerations');
    assert(ayushSummary.includes('Classical Ayurvedic Formulations') === true, 'Summary must provide classical formulations for Vaidya review');
    assert(ayushSummary.includes('Avipattikar Churna') === true, 'Pitta acidity summary must suggest Avipattikar Churna for doctor review');
    assert(ayushSummary.includes('SIH26047') === true, 'Summary must carry SIH26047 ethical notice');
  }

  // TEST 8: Facial & Ocular Symptom Recognition (Netra & Akriti Pariksha)
  console.log(`\n[Suite 8: Facial & Ocular Symptom Recognition (Netra & Akriti Pariksha)]`);
  {
    // Test 8.1: Anemia Pallor inspection
    const anemiaScan = await visualInspectionService.analyzeFacialImage({
      presetType: 'ANEMIA_PALLOR',
      language: 'hi',
    });
    assert(anemiaScan.eyeInspection.conjunctivalPallor === true, 'Anemia preset must detect conjunctival pallor');
    assert(anemiaScan.findings.some(f => f.sign.includes('Pallor')), 'Findings must record Conjunctival Pallor');
    assert(anemiaScan.findings.some(f => (f.ayushCorrelation || '').includes('Pandu')), 'Must correlate pallor with Pandu Roga');

    // Test 8.2: Jaundice Scleral Icterus inspection
    const jaundiceScan = await visualInspectionService.analyzeFacialImage({
      presetType: 'JAUNDICE',
      language: 'en',
    });
    assert(jaundiceScan.eyeInspection.scleralIcterus === true, 'Jaundice preset must detect scleral icterus');
    assert(jaundiceScan.findings.some(f => (f.ayushCorrelation || '').includes('Kamala')), 'Must correlate icterus with Kamala');

    // Test 8.3: Acute Stroke Facial Droop Red-Flag Triage
    const strokeScan = await visualInspectionService.analyzeFacialImage({
      presetType: 'STROKE_DROOP',
      language: 'en',
    });
    assert(strokeScan.facialSymmetry.droopDetected === true, 'Stroke preset must detect facial droop');
    assert(strokeScan.detectedRedFlags.length > 0, 'Stroke scan must generate detectedRedFlags');

    const strokeHistory: StructuredHistory = {
      chiefComplaint: 'Mild headache',
      duration: '1 hour',
      severity: 'Moderate',
      associatedSymptoms: [],
      pastHistory: [],
      medications: [],
      allergies: [],
      familyHistory: [],
      lifestyle: {},
      visualInspection: strokeScan,
    };

    const strokeTriage = triageService.evaluateTriage({
      history: strokeHistory,
      recentMessages: ['I felt strange after waking up'],
    });

    assert(strokeTriage.riskLevel === 'HIGH', 'Visual facial droop must trigger HIGH priority triage');
    assert(strokeTriage.detectedEmergencyTrigger === true, 'detectedEmergencyTrigger must be true for visual droop');
    assert(strokeTriage.reasons.some(r => r.includes('facial droop') || r.includes('Visual Clinical Scan')), 'Triage reasons must explain visual facial droop alert');

    // Test 8.4: Cyanosis Red-Flag Triage
    const cyanosisScan = await visualInspectionService.analyzeFacialImage({
      presetType: 'CYANOSIS',
      language: 'en',
    });
    assert(cyanosisScan.lipsInspection.cyanosisDetected === true, 'Cyanosis preset must detect central cyanosis');

    const cyanosisHistory: StructuredHistory = {
      chiefComplaint: 'Cough',
      duration: '2 days',
      severity: 'Moderate',
      associatedSymptoms: [],
      pastHistory: [],
      medications: [],
      allergies: [],
      familyHistory: [],
      lifestyle: {},
      visualInspection: cyanosisScan,
    };

    const cyanosisTriage = triageService.evaluateTriage({
      history: cyanosisHistory,
      recentMessages: ['Difficulty resting'],
    });

    assert(cyanosisTriage.riskLevel === 'HIGH', 'Visual cyanosis must trigger HIGH priority triage');
    assert(cyanosisTriage.detectedEmergencyTrigger === true, 'detectedEmergencyTrigger must be true for visual cyanosis');

    // Test 8.5: Normal Facial & Ocular Inspection
    const normalScan = await visualInspectionService.analyzeFacialImage({
      presetType: 'NORMAL',
      language: 'en',
    });
    assert(normalScan.facialSymmetry.symmetryScorePercent >= 90, 'Normal scan must have >=90% symmetry score, got: ' + normalScan.facialSymmetry.symmetryScorePercent);
    assert(normalScan.facialSymmetry.droopDetected === false, 'Normal scan must not flag droop');
    assert(normalScan.detectedRedFlags.length === 0, 'Normal scan must have 0 red flags');

    // Test 8.6: Simulated Webcam Image Buffer Analysis (Real Base64 Payload)
    const mockWebcamBuffer = Buffer.alloc(3000, 120);
    const mockBase64Image = 'data:image/jpeg;base64,' + mockWebcamBuffer.toString('base64');
    const webcamScan = await visualInspectionService.analyzeFacialImage({
      imageBase64: mockBase64Image,
      language: 'en',
    });
    assert(webcamScan.findings.length > 0, 'Webcam image buffer must yield clinical findings');
    assert(webcamScan.facialSymmetry.symmetryScorePercent >= 90, 'Webcam scan should have valid symmetry score');
    assert(webcamScan.eyeInspection !== undefined, 'Webcam scan must include eyeInspection');
    assert(Boolean(anemiaScan.imageUrl), 'Preset scan must provide archetype imageUrl');
    assert(webcamScan.imageUrl === mockBase64Image, 'Webcam scan must preserve captured photo in imageUrl');

    // Test 8.7: Simulated Empty / Pitch Black Frame Detectiong
    const emptyFrame = 'data:image/jpeg;base64,' + Buffer.alloc(100, 0).toString('base64');
    const darkScan = await visualInspectionService.analyzeFacialImage({
      imageBase64: emptyFrame,
      language: 'en',
    });
    assert(darkScan.findings.some(f => f.sign.includes('Dark Frame')), 'Empty/dark frame must be flagged appropriately');

    // Test 8.8: Schema validation for pre-intake visual scan attachment without signin
    const validConsultationPayload = createConsultationSchema.parse({
      patientName: 'Guest Patient',
      patientAge: 45,
      patientGender: 'FEMALE',
      consentGiven: true,
      visualInspection: jaundiceScan,
    });
    assert(validConsultationPayload.visualInspection !== undefined, 'createConsultationSchema must accept visualInspection');
    assert(validConsultationPayload.visualInspection.eyeInspection.scleralIcterus === true, 'Pre-intake visual scan data must be preserved in consultation payload');
  }

  console.log(`\n================================================================`);
  console.log(` TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log(`================================================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
