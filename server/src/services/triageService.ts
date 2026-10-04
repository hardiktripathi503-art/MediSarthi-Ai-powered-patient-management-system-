import { StructuredHistory, TriageResult } from '../../../shared/types/index.js';

interface TriageEvaluationInput {
  history: StructuredHistory;
  recentMessages: string[];
}

export class TriageService {
  /**
   * Deterministic safety patterns that MANDATE immediate HIGH triage.
   * Covers both English and conversational Hindi/Hinglish phrasing.
   */
  private checkDeterministicEmergencyRules(text: string, history: StructuredHistory): TriageResult | null {
    const lower = text.toLowerCase();
    const symptoms = (history.associatedSymptoms || []).map(s => s.toLowerCase());
    const complaint = (history.chiefComplaint || '').toLowerCase();

    // 1. CHEST PAIN + BREATHING DIFFICULTY (Acute Coronary Syndrome / Pulmonary Emergency)
    const hasChestPain =
      lower.includes('chest') ||
      lower.includes('chhati') ||
      lower.includes('seene') ||
      lower.includes('heart') ||
      lower.includes('सीना') ||
      lower.includes('सीने') ||
      lower.includes('छाती') ||
      lower.includes('हृदय') ||
      lower.includes('दिल') ||
      complaint.includes('chest') ||
      complaint.includes('seene') ||
      complaint.includes('सीना') ||
      complaint.includes('सीने') ||
      complaint.includes('छाती');

    const hasBreathingDifficulty =
      lower.includes('saans') ||
      lower.includes('breath') ||
      lower.includes('sans lene') ||
      lower.includes('dyspnea') ||
      lower.includes('suffocat') ||
      lower.includes('सांस') ||
      lower.includes('साँस') ||
      lower.includes('श्वास') ||
      lower.includes('सांस फूल') ||
      lower.includes('दम घुट') ||
      symptoms.some(s =>
        s.includes('breath') ||
        s.includes('saans') ||
        s.includes('सांस') ||
        s.includes('श्वास')
      );

    if (hasChestPain && hasBreathingDifficulty) {
      return {
        riskLevel: 'HIGH',
        reasons: [
          'Acute chest discomfort reported concurrently with breathing difficulty (dyspnea) / सीने में दर्द और सांस लेने में कठिनाई',
          'High clinical concern for acute cardiorespiratory emergency (e.g. Acute Coronary Syndrome or Pulmonary Embolism)',
        ],
        recommendedAction: 'Immediate Emergency Clinical Evaluation / Call 108/112',
        disclaimer: 'This is an automated safety triage alert, NOT a clinical diagnosis. Immediate physician intervention is essential.',
        detectedEmergencyTrigger: true,
        evaluatedAt: new Date().toISOString(),
      };
    }

    // 2. LOSS OF CONSCIOUSNESS / SYNCOPE
    const hasUnconsciousness =
      lower.includes('behosh') ||
      lower.includes('unconscious') ||
      lower.includes('fainted') ||
      lower.includes('blackout') ||
      lower.includes('chhod gaya') ||
      lower.includes('बेहोश') ||
      lower.includes('मूर्छा') ||
      lower.includes('अचेत') ||
      lower.includes('होश उड़');

    if (hasUnconsciousness) {
      return {
        riskLevel: 'HIGH',
        reasons: [
          'Loss of consciousness or altered sensorium reported / बेहोशी या चेतना का ह्रास',
          'Potential acute neurological, cardiac, or severe metabolic compromise',
        ],
        recommendedAction: 'Immediate Emergency Clinical Evaluation',
        disclaimer: 'This is an automated safety triage alert, NOT a clinical diagnosis.',
        detectedEmergencyTrigger: true,
        evaluatedAt: new Date().toISOString(),
      };
    }

    // 3. STROKE SIGNS (FAST: Facial drooping, arm weakness, slurred speech)
    const hasStrokeSigns =
      lower.includes('paralysis') ||
      lower.includes('lakwa') ||
      (lower.includes('face') && lower.includes('droop')) ||
      (lower.includes('speech') && lower.includes('slur')) ||
      lower.includes('bol nahi pa rahe') ||
      lower.includes('लकवा') ||
      lower.includes('पक्षाघात') ||
      lower.includes('मुंह टेढ़ा') ||
      lower.includes('आवाज लड़खड़ा') ||
      lower.includes('बोल नहीं पा रहे');

    if (hasStrokeSigns) {
      return {
        riskLevel: 'HIGH',
        reasons: [
          'Acute focal neurological deficit suggestive of potential cerebrovascular event (stroke) / पक्षाघात अथवा स्ट्रोक के लक्षण',
          'Time-critical clinical emergency',
        ],
        recommendedAction: 'Immediate Comprehensive Stroke Center / Emergency Room Transfer',
        disclaimer: 'This is an automated safety triage alert, NOT a clinical diagnosis.',
        detectedEmergencyTrigger: true,
        evaluatedAt: new Date().toISOString(),
      };
    }

    // 4. SEVERE ACTIVE HEMORRHAGE / BLEEDING
    const bleedingTerms = ['khoon', 'bleeding', 'खून', 'रक्तस्राव', 'रक्त बह रहा'];
    const severeTerms = ['bahut', 'severe', 'profuse', 'ruk nahi', 'बहुत', 'रुक नहीं', 'भारी'];
    const hasSevereBleeding =
      bleedingTerms.some(t => lower.includes(t)) &&
      severeTerms.some(t => lower.includes(t));

    if (hasSevereBleeding) {
      return {
        riskLevel: 'HIGH',
        reasons: [
          'Uncontrolled or profuse active hemorrhage reported / अत्यधिक अनियंत्रित रक्तस्राव',
          'Risk of hypovolemic shock',
        ],
        recommendedAction: 'Immediate Emergency Trauma / Surgical Assessment',
        disclaimer: 'This is an automated safety triage alert, NOT a clinical diagnosis.',
        detectedEmergencyTrigger: true,
        evaluatedAt: new Date().toISOString(),
      };
    }

    // 5. SEVERE UNRESPONSIVE RESPIRATORY DISTRESS
    const isSevereRespiratoryOnly =
      (lower.includes('saans ruk') || lower.includes('gasping') || lower.includes('cannot breathe') || lower.includes('choking') || lower.includes('सांस रुक') || lower.includes('दम घुट रहा')) &&
      !hasChestPain;

    if (isSevereRespiratoryOnly) {
      return {
        riskLevel: 'HIGH',
        reasons: [
          'Severe acute respiratory distress or acute airway compromise',
        ],
        recommendedAction: 'Immediate Emergency Airway & Oxygenation Support',
        disclaimer: 'This is an automated safety triage alert, NOT a clinical diagnosis.',
        detectedEmergencyTrigger: true,
        evaluatedAt: new Date().toISOString(),
      };
    }

    // 6. VISUAL INSPECTION RED FLAGS (Acute Facial Droop / Stroke or Central Cyanosis)
    if (history.visualInspection) {
      const vis = history.visualInspection;
      if (
        vis.facialSymmetry?.droopDetected ||
        (vis.detectedRedFlags || []).some((rf) =>
          rf.toLowerCase().includes('droop') || rf.toLowerCase().includes('stroke') || rf.toLowerCase().includes('asymmetry')
        )
      ) {
        return {
          riskLevel: 'HIGH',
          reasons: [
            'Visual Clinical Scan Alert: Acute unilateral facial droop / hemifacial asymmetry detected (FAST criteria positive) / चेहरे में लटकन व पक्षाघात लक्षण',
            'High clinical urgency for acute cerebrovascular accident (Stroke / CVA) evaluation',
          ],
          recommendedAction: 'Immediate Emergency Neurology / Comprehensive Stroke Center Evaluation',
          disclaimer: 'This is an automated safety triage alert, NOT a clinical diagnosis. Immediate emergency care mandated.',
          detectedEmergencyTrigger: true,
          evaluatedAt: new Date().toISOString(),
        };
      }

      if (
        vis.lipsInspection?.cyanosisDetected ||
        (vis.detectedRedFlags || []).some((rf) =>
          rf.toLowerCase().includes('cyanosis') || rf.toLowerCase().includes('hypox')
        )
      ) {
        return {
          riskLevel: 'HIGH',
          reasons: [
            'Visual Clinical Scan Alert: Central cyanosis (bluish lip discoloration) detected / होंठों पर नीलापन (ऑक्सीजन की भारी कमी)',
            'Critical clinical concern for arterial hypoxemia or acute cardiorespiratory compromise',
          ],
          recommendedAction: 'Immediate Emergency Oxygenation & Cardiorespiratory Resuscitation',
          disclaimer: 'This is an automated safety triage alert, NOT a clinical diagnosis.',
          detectedEmergencyTrigger: true,
          evaluatedAt: new Date().toISOString(),
        };
      }
    }

    // No immediate emergency trigger detected
    return null;
  }

  /**
   * Main Triage Assessment method
   */
  public evaluateTriage(input: TriageEvaluationInput): TriageResult {
    const combinedText = [
      input.history.chiefComplaint,
      ...(input.history.associatedSymptoms || []),
      ...input.recentMessages,
    ].join(' ');

    // 1. Mandatory Deterministic Safety Evaluation First
    const deterministicEmergency = this.checkDeterministicEmergencyRules(combinedText, input.history);
    if (deterministicEmergency) {
      return deterministicEmergency;
    }

    // 2. Medium Risk Patterns
    const lower = combinedText.toLowerCase();
    const isMedium =
      (lower.includes('fever') || lower.includes('bukhar')) &&
      (lower.includes('tez') || lower.includes('high') || lower.includes('chills') || lower.includes('dardi')) ||
      (lower.includes('vomit') || lower.includes('ulti')) && (lower.includes('bar bar') || lower.includes('frequent')) ||
      input.history.severity === 'Severe';

    if (isMedium) {
      return {
        riskLevel: 'MEDIUM',
        reasons: [
          'Elevated symptom severity or high systemic response reported (e.g. high febrile episode or acute distress)',
          'Requires prompt same-day medical consultation',
        ],
        recommendedAction: 'Priority Same-Day Clinical Consultation',
        disclaimer: 'This is an automated triage classification. Definitive clinical evaluation by a medical doctor is required.',
        detectedEmergencyTrigger: false,
        evaluatedAt: new Date().toISOString(),
      };
    }

    // 3. Default: Low Risk (Subacute or mild symptoms)
    return {
      riskLevel: 'LOW',
      reasons: [
        'Subacute, localized, or mild symptom pattern without acute hemodynamic or respiratory compromise',
        'Standard clinical intake workflow applicable',
      ],
      recommendedAction: 'Routine Outpatient Consultation & Clinical Review',
      disclaimer: 'This is an automated triage classification. Definitive clinical evaluation by a medical doctor is required.',
      detectedEmergencyTrigger: false,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const triageService = new TriageService();
