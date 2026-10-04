import { AYUSHSectionConfig } from '../types';

/**
 * AYUSH Clinical Case-Taking Configuration Schema (SIH26047)
 * Strictly designed as an intake & clinical history observation framework.
 * Non-diagnostic and non-prescriptive.
 */
export const AYUSH_CASE_SCHEMA: AYUSHSectionConfig[] = [
  {
    sectionKey: 'prakriti_assessment',
    title: 'Prakriti & Dosha Lakshana (Constitutional Intake)',
    titleHi: 'प्रकृति एवं दोष लक्षण (शारीरिक एवं मानसिक प्रकृति)',
    description: 'Patient-reported somatic and psychological tendencies for holistic assessment.',
    descriptionHi: 'समग्र मूल्यांकन हेतु रोगी द्वारा सूचित शारीरिक और मानसिक प्रवृत्तियां।',
    fields: [
      {
        key: 'dominantDoshaTendency',
        label: 'Primary Dosha Tendency',
        labelHi: 'प्रमुख दोष प्रवृत्ति',
        type: 'select',
        options: [
          { value: 'Vata-predominant', label: 'Vata Predominant (Dry skin, variable appetite, restless)', labelHi: 'वात प्रधान (रूखी त्वचा, अनियमित भूख)' },
          { value: 'Pitta-predominant', label: 'Pitta Predominant (Warm body, sharp hunger, irritable)', labelHi: 'पित्त प्रधान (तीक्ष्ण अग्नि, ऊष्मा असहनशीलता)' },
          { value: 'Kapha-predominant', label: 'Kapha Predominant (Sturdy, steady appetite, calm)', labelHi: 'कफ प्रधान (स्थिर शरीर, मंद अग्नि, शांत स्वभाव)' },
          { value: 'Vata-Pitta', label: 'Vata-Pitta Dvandvaja', labelHi: 'वात-पित्त द्वन्द्वज' },
          { value: 'Pitta-Kapha', label: 'Pitta-Kapha Dvandvaja', labelHi: 'पित्त-कफ द्वन्द्वज' },
          { value: 'Vata-Kapha', label: 'Vata-Kapha Dvandvaja', labelHi: 'वात-कफ द्वन्द्वज' },
          { value: 'Tridosha-balanced', label: 'Sama Prakriti (Balanced)', labelHi: 'सम प्रकृति (संतुलित)' },
        ],
        description: 'Self-reported metabolic and physiological pattern.',
        descriptionHi: 'रोगी द्वारा स्वयं सूचित चयापचय एवं शारीरिक स्वभाव।',
      },
      {
        key: 'agniAssessment',
        label: 'Agni (Digestive Fire Capacity)',
        labelHi: 'अग्नि (पाचन क्षमता)',
        type: 'select',
        options: [
          { value: 'Sama-Agni', label: 'Sama Agni (Normal balanced digestion)', labelHi: 'सम अग्नि (संतुलित पाचन)' },
          { value: 'Vishama-Agni', label: 'Vishama Agni (Irregular digestion, bloating, gas)', labelHi: 'विषम अग्नि (अनियमित पाचन, गैस, पेट फूलना)' },
          { value: 'Tikshna-Agni', label: 'Tikshna Agni (Hyperactive digestion, acidity, burning)', labelHi: 'तीक्ष्ण अग्नि (अति-तीव्र पाचन, अम्लता, जलन)' },
          { value: 'Manda-Agni', label: 'Manda Agni (Sluggish digestion, heaviness after meals)', labelHi: 'मन्द अग्नि (सुस्त पाचन, भोजन के बाद भारीपन)' },
        ],
        description: 'Assessment of digestive power and post-prandial symptoms.',
        descriptionHi: 'पाचन क्षमता और भोजनोपरांत लक्षणों का अवलोकन।',
      },
      {
        key: 'koshthaNature',
        label: 'Koshtha (Bowel / Elimination Pattern)',
        labelHi: 'कोष्ठ (मलत्याग की प्रकृति)',
        type: 'select',
        options: [
          { value: 'Mrudu-Koshtha', label: 'Mrudu (Soft, frequent, prone to loose motions with milk/oil)', labelHi: 'मृदु कोष्ठ (सुगम मलत्याग, आसानी से दस्त होना)' },
          { value: 'Madhyama-Koshtha', label: 'Madhyama (Regular, normal evacuation once daily)', labelHi: 'मध्यम कोष्ठ (नियमित, सामान्य मलत्याग)' },
          { value: 'Krura-Koshtha', label: 'Krura (Hard, dry stools, constipation tendency)', labelHi: 'क्रूर कोष्ठ (कठिन मल, कब्ज की प्रवृत्ति)' },
        ],
        description: 'Bowel movement regularity and sensitivity to dietary laxatives.',
        descriptionHi: 'मलत्याग की नियमितता एवं खानपान के प्रति संवेदनशीलता।',
      },
    ],
  },
  {
    sectionKey: 'bala_ojas_assessment',
    title: 'Bala & Dhatu Poshan (Vitality & Resilience)',
    titleHi: 'बल एवं धातु पोषण (शारीरिक शक्ति एवं सहनशीलता)',
    description: 'Evaluation of physical endurance, sleep architecture, and energy vitality.',
    descriptionHi: 'शारीरिक सहनशक्ति, निद्रा प्रणाली और ऊर्जा स्तर का मूल्यांकन।',
    fields: [
      {
        key: 'physicalEndurance',
        label: 'Sharirika Bala (Physical Strength)',
        labelHi: 'शारीरिक बल',
        type: 'select',
        options: [
          { value: 'Pravara', label: 'Pravara Bala (High stamina, quick recovery)', labelHi: 'प्रवर बल (उत्कृष्ट शक्ति, त्वरित पुनर्प्राप्ति)' },
          { value: 'Madhyama', label: 'Madhyama Bala (Moderate stamina)', labelHi: 'मध्यम बल (सामान्य शक्ति)' },
          { value: 'Avara', label: 'Avara Bala (Easily fatigued, low endurance)', labelHi: 'अवर बल (शीघ्र थकान, कम सहनशक्ति)' },
        ],
        description: 'Ability to perform physical exertion without undue fatigue.',
        descriptionHi: 'शारीरिक श्रम करने की क्षमता।',
      },
      {
        key: 'nidraQuality',
        label: 'Nidra (Sleep Pattern & Quality)',
        labelHi: 'निद्रा (नींद की गुणवत्ता)',
        type: 'select',
        options: [
          { value: 'Sukhapurvaka', label: 'Restful 6-8 hrs, waking refreshed', labelHi: 'सुखपूर्वक गाढ़ी नींद (6-8 घंटे)' },
          { value: 'Alpanidra', label: 'Disturbed / broken sleep, difficulty falling asleep', labelHi: 'अल्पनिद्रा / बीच-बीच में टूटने वाली नींद' },
          { value: 'Atinidra', label: 'Excessive sleepiness, lethargy during day', labelHi: 'अतिनिद्रा / दिन में अत्यधिक सुस्ती' },
          { value: 'Swapna-bhuyishtha', label: 'Restless with vivid disturbing dreams', labelHi: 'अशांतिपूर्ण नींद / अत्यधिक स्वप्न' },
        ],
        description: 'Circadian sleep cycle and restful waking state.',
        descriptionHi: 'नींद की गहराई और प्रातः ताजगी का स्तर।',
      },
      {
        key: 'satmyaDiet',
        label: 'Ahara Satmya (Habitual Dietary Preference)',
        labelHi: 'आहार सात्म्य (भोजन की अनुकूलता)',
        type: 'select',
        options: [
          { value: 'Shad-Rasa-Balanced', label: 'Balanced all six tastes', labelHi: 'षड्रस युक्त संतुलित आहार' },
          { value: 'Katu-Amla-Lavana', label: 'High spicy, sour & salty intake', labelHi: 'अत्यधिक तीखा, खट्टा एवं नमकीन' },
          { value: 'Madhura-Snigdha', label: 'High sweet, heavy & oily foods', labelHi: 'अत्यधिक मीठा, भारी एवं तैलीय' },
          { value: 'Ruksha-Sheeta', label: 'Cold, dry, raw or irregular junk food', labelHi: 'रूखा, ठंडा, अनियमित जंक फ़ूड' },
        ],
        description: 'Habitual dietary taste profile.',
        descriptionHi: 'दैनिक भोजन में प्रमुख स्वादों का अनुपात।',
      },
    ],
  },
  {
    sectionKey: 'srotas_clinical_intake',
    title: 'Srotas & Symptom Channel Observations',
    titleHi: 'स्रोतस एवं संबंधित लक्षण अवलोकन',
    description: 'Systemic functional channel indications correlating with chief complaints.',
    descriptionHi: 'मुख्य समस्या से जुड़े स्रोतस लक्षण।',
    fields: [
      {
        key: 'annavahaSymptoms',
        label: 'Annavaha Srotas (Gastrointestinal Tract)',
        labelHi: 'अन्नवह स्रोतस (पाचन तंत्र)',
        type: 'text',
        description: 'e.g. Aruchi (loss of taste), Chhardi (nausea/vomiting), Vidaha (burning)',
        descriptionHi: 'उदा. अरुचि (भूख न लगना), छर्दि (उल्टी/जी मिचलाना), विदाह (जलन)',
      },
      {
        key: 'pranavahaSymptoms',
        label: 'Pranavaha Srotas (Respiratory Channels)',
        labelHi: 'प्राणवह स्रोतस (श्वसन तंत्र)',
        type: 'text',
        description: 'e.g. Kasa (cough), Shwasa (breathlessness), Peenasa (rhinitis)',
        descriptionHi: 'उदा. कास (खांसी), श्वास (सांस फूलना), पीनस (जुकाम)',
      },
    ],
  },
];
