import { StructuredHistory, Message, IntakeMode } from '../../../shared/types/index.js';

export function buildSummaryPrompt(
  history: StructuredHistory,
  messages: Message[],
  mode: IntakeMode,
  patientName: string,
  age: number,
  gender: string
): string {
  return `
You are a senior clinical summarization assistant for MediSaarthi.
Compile a concise, highly organized, professional clinical intake note for the examining doctor.

PATIENT DEMOGRAPHICS:
Name: ${patientName}
Age: ${age}
Gender: ${gender}
Intake Mode: ${mode}

COLLECTED STRUCTURED CLINICAL DATA:
${JSON.stringify(history, null, 2)}

CONVERSATION TRANSCRIPT:
${messages.map(m => `[${m.sender}] (${m.language}): ${m.text}`).join('\n')}

INSTRUCTIONS:
1. Provide a succinct paragraph summarizing the present illness history (HPI).
2. Highlight chief complaint, onset/duration, severity, character, aggravating/relieving factors.
3. List pertinent positives and pertinent negatives.
4. Note existing chronic conditions and active medications.
${mode === 'AYUSH' ? '5. Summarize AYUSH observations (Dosha/Prakriti tendencies, Agni status, Koshtha pattern) purely as clinical intake observations.' : ''}
6. Always include a clear disclaimer: "AI-generated clinical history. Requires doctor review and clinical verification."

OUTPUT FORMAT:
Respond with a clear, markdown-formatted clinical note ready for display in the doctor's EHR review card.
`;
}
