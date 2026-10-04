import {
  StructuredHistory,
  TriageResult,
  LanguageCode,
  IntakeMode,
  Message,
} from '../../../shared/types/index.js';
import { aiService, NextQuestionResult } from './aiService.js';
import { triageService } from './triageService.js';

export interface ProcessTurnResult {
  updatedHistory: StructuredHistory;
  triageResult: TriageResult;
  aiReplyMessage: Message;
  isComplete: boolean;
  isEmergencyHalt: boolean;
}

export class InterviewEngine {
  /**
   * Process a conversational patient turn
   */
  public async processTurn(
    currentHistory: StructuredHistory,
    incomingMessageText: string,
    language: LanguageCode,
    mode: IntakeMode,
    conversationHistory: Message[]
  ): Promise<ProcessTurnResult> {
    const isHindi = language === 'hi';

    // 1. Evaluate Red-Flag / Triage with Deterministic Safety Rules
    const patientMessages = conversationHistory
      .filter((m) => m.sender === 'PATIENT')
      .map((m) => m.text);
    const recentMessages = [...patientMessages, incomingMessageText];
    const preliminaryTriage = triageService.evaluateTriage({
      history: currentHistory,
      recentMessages,
    });

    // 2. Immediate Emergency Check: If HIGH PRIORITY, halt normal interview!
    if (preliminaryTriage.riskLevel === 'HIGH' && preliminaryTriage.detectedEmergencyTrigger) {
      // Extract what we can for the structured history
      const { extractedInfo } = await aiService.getNextQuestion(
        currentHistory,
        language,
        mode,
        incomingMessageText
      );

      const mergedHistory: StructuredHistory = {
        ...currentHistory,
        ...extractedInfo,
        associatedSymptoms: Array.from(
          new Set([...(currentHistory.associatedSymptoms || []), ...(extractedInfo.associatedSymptoms || [])])
        ),
      };

      const emergencyAlertText = isHindi
        ? `🔴 **उच्च प्राथमिकता चेतावनी (EMERGENCY ALERT)**\n\nआपके द्वारा बताए गए लक्षणों (सीने में दर्द/सांस में कठिनाई) में तत्काल चिकित्सीय हस्तक्षेप की आवश्यकता हो सकती है। सामान्य पूछताछ रोक दी गई है।\n\nकृपया तुरंत निकटतम आपातकालीन कक्ष में जाएं या आपातकालीन सेवा (108 / 112) पर संपर्क करें। यह मामला डॉक्टर के डैशबोर्ड पर प्राथमिक अलर्ट के साथ भेज दिया गया है।`
        : `🔴 **HIGH PRIORITY CLINICAL ALERT**\n\nUrgent cardiorespiratory or emergent symptoms have been detected. Routine intake questioning has been halted.\n\nPlease seek immediate clinical evaluation or emergency services (108 / 112) without delay. This intake has been flagged to the physician dashboard with urgent priority.`;

      const aiReplyMessage: Message = {
        id: `msg_${Date.now()}_emergency`,
        sender: 'AI',
        text: emergencyAlertText,
        language,
        timestamp: new Date().toISOString(),
        isEmergencyAlert: true,
      };

      return {
        updatedHistory: mergedHistory,
        triageResult: preliminaryTriage,
        aiReplyMessage,
        isComplete: true,
        isEmergencyHalt: true,
      };
    }

    // 3. Normal Dynamic Interview Turn
    const aiStep: NextQuestionResult = await aiService.getNextQuestion(
      currentHistory,
      language,
      mode,
      incomingMessageText,
      conversationHistory
    );

    // Merge newly extracted fields with existing state
    const updatedHistory: StructuredHistory = {
      ...currentHistory,
      chiefComplaint: aiStep.extractedInfo.chiefComplaint || currentHistory.chiefComplaint,
      duration: aiStep.extractedInfo.duration || currentHistory.duration,
      severity: aiStep.extractedInfo.severity || currentHistory.severity,
      associatedSymptoms: Array.from(
        new Set([
          ...(currentHistory.associatedSymptoms || []),
          ...(aiStep.extractedInfo.associatedSymptoms || []),
        ])
      ),
      pastHistory: Array.from(
        new Set([...(currentHistory.pastHistory || []), ...(aiStep.extractedInfo.pastHistory || [])])
      ),
      medications: Array.from(
        new Set([...(currentHistory.medications || []), ...(aiStep.extractedInfo.medications || [])])
      ),
      allergies: Array.from(
        new Set([...(currentHistory.allergies || []), ...(aiStep.extractedInfo.allergies || [])])
      ),
      lifestyle: {
        ...currentHistory.lifestyle,
        ...aiStep.extractedInfo.lifestyle,
      },
      ayushAssessment: {
        ...currentHistory.ayushAssessment,
        ...aiStep.extractedInfo.ayushAssessment,
      },
    };

    // Recalculate triage with updated history
    const finalTriage = triageService.evaluateTriage({
      history: updatedHistory,
      recentMessages,
    });

    const aiReplyMessage: Message = {
      id: `msg_${Date.now()}_ai`,
      sender: 'AI',
      text: aiStep.nextQuestion,
      language,
      timestamp: new Date().toISOString(),
      isEmergencyAlert: false,
    };

    return {
      updatedHistory,
      triageResult: finalTriage,
      aiReplyMessage,
      isComplete: aiStep.isComplete,
      isEmergencyHalt: false,
    };
  }
}

export const interviewEngine = new InterviewEngine();
