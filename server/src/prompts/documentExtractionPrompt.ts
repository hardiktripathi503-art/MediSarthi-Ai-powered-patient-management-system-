export function buildDocumentExtractionPrompt(rawOcrText: string): string {
  return `
You are a medical document OCR extraction specialist for MediSaarthi.
Analyze the following raw OCR text extracted from an uploaded medical document (such as a lab test report, prescription, discharge summary, or radiology note).

RAW OCR TEXT:
---
${rawOcrText}
---

TASK:
1. Extract diagnosed or mentioned medical conditions.
2. Extract prescribed or mentioned medications with dosage/frequency if detectable.
3. Extract laboratory or diagnostic investigation values (e.g. Hemoglobin, Blood Pressure, Blood Sugar, Platelets, Creatinine, etc.).
4. Flag any lab values that appear outside standard reference ranges (e.g., elevated BP >= 140/90, low Hb < 12 g/dL, high fasting glucose >= 126 mg/dL).
5. Highlight potential abnormalities for doctor's clinical review.

OUTPUT FORMAT:
Respond ONLY with a JSON object strictly matching this schema:
{
  "diagnoses": ["Hypertension", "Type 2 Diabetes", etc.],
  "medications": ["Amlodipine 5mg OD", "Metformin 500mg BD", etc.],
  "investigations": [
    {
      "testName": "Blood Pressure",
      "value": "150/95 mmHg",
      "referenceRange": "< 120/80 mmHg",
      "isAbnormal": true,
      "notes": "Elevated systolic and diastolic blood pressure"
    },
    {
      "testName": "Hemoglobin (Hb)",
      "value": "12.4 g/dL",
      "referenceRange": "13.0 - 17.0 g/dL",
      "isAbnormal": true,
      "notes": "Mildly low"
    }
  ],
  "potentialAbnormalities": [
    "BP elevated (150/95 mmHg)",
    "Mild anemia indicator"
  ]
}
`;
}
