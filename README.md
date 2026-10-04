# MediSaarthi | AI-Powered Multilingual AYUSH Patient Intake & Clinical History System

[![SIH 2026](https://img.shields.io/badge/Smart%20India%20Hackathon-2026-brightgreen?style=for-the-badge)](https://sih.gov.in)
[![Problem Statement](https://img.shields.io/badge/Problem%20Statement-SIH26047-blue?style=for-the-badge)](https://sih.gov.in)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20TypeScript%20%7C%20MongoDB-emerald?style=for-the-badge)](https://nodejs.org)
[![Triage Safety](https://img.shields.io/badge/Triage%20Safety-Deterministic%20Rules%20%2B%20AI-red?style=for-the-badge)](https://sih.gov.in)

> **Clinical Decision Support Notice:**  
> MediSaarthi provides **clinical intake and triage assistance only**. It does **NOT** provide definitive medical diagnoses, prescribe treatments, or replace licensed healthcare practitioners. The medical doctor remains the ultimate decision-maker.

---

## 📑 Executive Summary

In fast-paced hospital outpatient departments (OPDs) and rural AYUSH healthcare centers across India, doctors face extreme time pressure (often under 2–3 minutes per consultation). Crucial patient medical history, previous pharmacotherapy, and acute warning signs frequently go unrecorded or unnoticed.

**MediSaarthi** bridges this gap by converting patient voice and text conversations in native languages (Hindi, English) into structured clinical history and longitudinal health records. It combines:
1. **Dynamic Adaptive Interview Engine:** Asks targeted follow-ups rather than rigid 40-question questionnaires.
2. **Deterministic Red-Flag Triage:** Immediately halts routine questioning and triggers emergency notifications when critical cardiorespiratory patterns (e.g. chest pain + dyspnea) are reported.
3. **Medical Document OCR Pipeline:** Automatically extracts vitals, medications, and laboratory values from prescriptions and test reports using Tesseract OCR.
4. **Interactive Medical Timeline:** Chronologically structures past consultations, lab reports, and prescriptions.
5. **Configurable AYUSH Case-Taking Mode:** Organizes holistic constitutional parameters (Prakriti, Agni, Koshtha, Bala) strictly adhering to SIH26047 specifications.
6. **Physician Verification Workflow:** Doctors inspect AI summaries with one-click **Accept**, **Edit**, or **Reject** capabilities and a complete audit trail.

---

## 🏛️ System Architecture

```
                               ┌────────────────────────┐
                               │   Patient / Doctor     │
                               │   Web / Mobile UI      │
                               └───────────┬────────────┘
                                           │ (Voice / Text)
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           VITE + REACT + TYPESCRIPT CLIENT                        │
│                                                                                   │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌───────────────────────┐  │
│  │   VoiceInput.tsx    │    │  LanguageContext    │    │ StructuredHistory     │  │
│  │  (Web Speech API)   │    │  (Hindi / English)  │    │      Panel.tsx        │  │
│  └─────────────────────┘    └─────────────────────┘    └───────────────────────┘  │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌───────────────────────┐  │
│  │ EmergencyBanner.tsx │    │ MedicalTimeline.tsx │    │ DoctorReviewCard.tsx  │  │
│  └─────────────────────┘    └─────────────────────┘    └───────────────────────┘  │
└──────────────────────────────────────────┬────────────────────────────────────────┘
                                           │ REST API (/api)
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                         NODE.JS + EXPRESS.JS + TYPESCRIPT                         │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                      Deterministic Triage Safety Engine                     │  │
│  │   (Chest pain + Dyspnea -> HIGH PRIORITY; Halts routine questioning)       │  │
│  └──────────────────────────────────────┬──────────────────────────────────────┘  │
│                                         │                                         │
│  ┌─────────────────────────────────┐    │    ┌─────────────────────────────────┐  │
│  │     Dynamic Interview Engine    │    │    │     Tesseract OCR Pipeline      │  │
│  │   - Tracks Structured State     │    │    │   - Prescriptions & Lab Reports │  │
│  │   - Computes Missing Fields     │    │    │   - Flags Abnormal Lab Values   │  │
│  └────────────────┬────────────────┘    │    └────────────────┬────────────────┘  │
│                   │                     │                     │                   │
│                   ▼                     │                     ▼                   │
│  ┌─────────────────────────────────┐    │    ┌─────────────────────────────────┐  │
│  │       AI Abstraction Layer      │    │    │     AYUSH Config Schema         │  │
│  │   (Live LLM + Demo Fallback)    │    │    │   (Prakriti, Agni, Koshtha)     │  │
│  └─────────────────────────────────┘    │    └─────────────────────────────────┘  │
└──────────────────────────────────────────┬────────────────────────────────────────┘
                                           │
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                               DATABASE LAYER                                      │
│                                                                                   │
│   • MongoDB Atlas / Local MongoDB URI                                             │
│   • Embedded In-Memory MongoDB Server (Automatic Zero-Config Out-of-the-box)      │
│   • Mongoose Models: User, PatientProfile, Consultation, Document, Timeline, Log  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, React Router v6 |
| **Backend** | Node.js (v20 LTS), Express.js, TypeScript, tsx watch |
| **Database** | MongoDB, Mongoose, MongoMemoryServer (Zero-config out-of-the-box fallback) |
| **AI & Triage** | Modular Prompt Architecture, Deterministic Triage Engine, LLM API Abstraction |
| **Speech** | Web Speech API (BCP-47 `hi-IN` & `en-IN`), SpeechService Abstraction |
| **OCR** | Tesseract.js Optical Character Recognition pipeline |
| **Security** | Helmet, CORS, JWT authentication, bcrypt password hashing, Zod validation |

---

## 📁 Repository Structure

```
/Users/divyaprakashtiwari/MediSaarthi/
├── client/                              # Vite + React Frontend
│   ├── src/
│   │   ├── components/                  # Navbar, VoiceInput, ConsentModal, EmergencyBanner
│   │   ├── features/
│   │   │   ├── doctor/                  # DoctorReviewCard (Accept, Edit, Reject)
│   │   │   ├── timeline/                # MedicalTimelineView (Chronological events)
│   │   │   ├── documents/               # DocumentUploadModal (OCR & lab extraction)
│   │   │   └── ayush/                   # AYUSHAssessmentForm (Configurable schema UI)
│   │   ├── i18n/                        # en.json, hi.json, LanguageContext.tsx
│   │   ├── pages/                       # LandingPage, IntakePage, DoctorDashboard, PatientDetail, DemoPage
│   │   ├── services/                    # api.ts, speechService.ts
│   │   ├── App.tsx                      # Router & layout
│   │   └── index.css                    # Tailwind design system
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── server/                              # Node.js + Express Backend
│   ├── src/
│   │   ├── config/                      # db.ts (Mongoose + in-memory fallback)
│   │   ├── controllers/                 # auth, patient, consultation, document, timeline, analytics
│   │   ├── middleware/                  # auth, errorHandler, upload
│   │   ├── models/                      # User, PatientProfile, Consultation, Document, Timeline, AuditLog
│   │   ├── prompts/                     # interviewer, triage, summary, documentExtraction, ayush
│   │   ├── routes/                      # api.ts REST router
│   │   ├── seed/                        # seedRunner.ts (Populates 5 patients, 3 doctors, demo cases)
│   │   ├── services/                    # aiService, interviewEngine, triageService, documentService
│   │   ├── tests/                       # runTests.ts (Unit & scenario test runner)
│   │   └── index.ts                     # Express server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                              # Shared cross-cutting definitions
│   ├── config/ayushSchema.ts            # Official AYUSH case-taking profile schema
│   ├── schemas/index.ts                 # Zod validation schemas
│   └── types/index.ts                   # TypeScript interfaces
│
├── .env.example                         # Environment configuration template
├── package.json                         # Root monorepo script coordinator
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18.0.0 or higher, tested on v20.18.0 LTS)
- npm (v9 or higher)

### 1. Clone & Install Dependencies
Run from the root directory:
```bash
npm install
```
This automatically installs all dependencies across both `server` and `client` workspaces.

### 2. Environment Variables
Create `.env` inside `server/` (or copy from `.env.example`):
```bash
cp .env.example server/.env
```
Default `.env` configuration:
```env
PORT=5001
NODE_ENV=development

# Database Configuration (Leave empty to use automatic embedded In-Memory MongoDB)
# MONGODB_URI=mongodb://127.0.0.1:27017/medisaarthi
MONGODB_URI=

# JWT Authentication
JWT_SECRET=medisaarthi_super_secure_jwt_secret_sih2026

# AI LLM Provider (Optional - Defaults to High-Fidelity Demo Mode if empty)
AI_API_KEY=
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1

OCR_ENABLED=true
DEMO_MODE=true
```

> 💡 **Zero-Config Database:** If no `MONGODB_URI` is supplied or external MongoDB is unavailable, the backend automatically initializes an in-memory MongoDB server (`mongodb-memory-server`) and pre-seeds it. You can evaluate the entire application out-of-the-box!

---

## 🚀 Running the Application

### Option A: Run Everything Concurrently (Recommended)
From the project root:
```bash
npm run dev
```
- **Backend API:** `http://localhost:5001`
- **Frontend App:** `http://localhost:5173`

### Option B: Run Services Separately
Terminal 1 (Backend):
```bash
npm run dev --workspace=server
```
Terminal 2 (Frontend):
```bash
npm run dev --workspace=client
```

---

## 🧪 Automated Testing

MediSaarthi includes automated clinical and unit tests verifying deterministic red-flag triage, dynamic interview transitions, and OCR entity extraction:

```bash
npm test
```
Or directly on the server:
```bash
npm run test --workspace=server
```

**Test Verification Highlights:**
- ✅ **Test 1:** Chest pain + breathing difficulty in Hindi/Hinglish triggers **HIGH** triage alert.
- ✅ **Test 2:** Normal abdominal pain without alarm signs classifies as **LOW** priority.
- ✅ **Test 3:** Stroke symptoms (facial droop, slurred speech) classify as **HIGH**.
- ✅ **Test 4:** Dynamic Interview Engine extracts chief complaint and halts on emergency.
- ✅ **Test 5:** OCR extraction flags elevated BP (150/95) and detects medications.

---

## 🎯 Evaluator Walkthrough Guide (SIH Demo)

MediSaarthi has a dedicated **SIH Evaluation Hub** accessible directly at `http://localhost:5173/demo`.

### Scenario A — Normal Clinical Intake (Rahul Sharma, 42 M)
1. Navigate to `http://localhost:5173/demo` and click **"Launch Scenario A (Normal)"**.
2. Review patient details: Rahul Sharma, 42, Male, Hindi language.
3. Click **"परामर्श प्रारंभ करें"** (Begin Consultation).
4. Review and accept the clinical consent modal.
5. In the chat input, say or click:  
   👉 *"Mujhe pet mein dard hai."*
6. Observe AI response asking for duration:  
   👉 *"यह दर्द या समस्या आपको कब से महसूस हो रही है?"*
7. Respond with:  
   👉 *"3 din se hai, lagatar rehta hai."*
8. Check the **Live Structured History Panel** on the right side:
   - Chief Complaint: *पेट में दर्द (Abdominal pain)*
   - Duration: *3 days*
   - Severity: *Moderate*
   - Associated Symptoms: *Nausea, Loss of appetite*
   - Triage Category: **LOW RISK**
9. Complete consultation and switch to **Doctor Dashboard** to review the EHR summary note and click **[ Accept ]** or **[ Edit ]**.

---

### Scenario B — High Risk Red Flag Emergency (Sunita Devi, 58 F)
1. Navigate to `http://localhost:5173/demo` and click **"Launch Scenario B (Emergency)"**.
2. Click **"परामर्श प्रारंभ करें"** and agree to consent.
3. In the chat, speak or enter the emergency test input:  
   👉 *"Mujhe chest mein dard ho raha hai aur saans lene mein dikkat ho rahi hai."*
4. **Immediate System Reaction:**
   - 🔴 **HIGH PRIORITY ALERT** banner appears instantly.
   - Routine questioning is **HALTED**.
   - Reasons displayed: *Acute chest discomfort reported concurrently with dyspnea; concern for Acute Coronary Syndrome*.
   - Ambulance Call CTA: **Call 108 / 112**.
5. Click **"View Doctor Review"**:
   - The Doctor Dashboard displays the patient under the **Critical Red-Flag Alerts** banner.
   - Attending physician reviews the case, adds emergency physician orders, and stamps the clinical record with an audit signature.

---

## 🌿 AYUSH Case-Taking Mode

MediSaarthi implements a dedicated **AYUSH Clinical Intake Profile** adhering to SIH26047 specifications:
- **Prakriti & Dosha Lakshana:** Vata, Pitta, Kapha, and Dvandvaja constitutional tendencies.
- **Agni Assessment:** Sama Agni, Vishama Agni, Tikshna Agni, Manda Agni.
- **Koshtha Nature:** Mrudu, Madhyama, Krura bowel patterns.
- **Bala & Dhatu Poshan:** Physical stamina and vitality indicators.
- **Nidra & Satmya:** Sleep quality and habitual dietary tastes (Shad-Rasa).

> ⚠️ **Strict Medical Boundary:** All AYUSH fields are presented strictly as observational case-taking parameters for the examining AYUSH medical practitioner and are never presented as automated medical validations.

---

## 🔒 Security & Data Governance

1. **Password Encryption:** Sensitive credentials hashed using `bcryptjs` with salt rounds = 10.
2. **Stateless JWT:** Authenticated sessions secured via cryptographically signed JWT tokens.
3. **Role-Based Access Control (RBAC):** Distinct permissions enforced across `PATIENT`, `DOCTOR`, and `ADMIN` roles.
4. **Input Sanitization & Validation:** All incoming REST payloads validated through strict `Zod` schemas.
5. **Rate Limiting & Headers:** Protected via `express-rate-limit` and `helmet` security headers.
6. **Audit Trail Logging:** Every physician review (status transition, edits, reviewer ID, timestamp) is recorded in immutable `AuditLog` records.

---

## 🌟 Future Roadmap

- Integration with **ABHA (Ayushman Bharat Health Account)** and ABDM M1/M2/M3 standards.
- Expansion of speech recognition to additional Indian regional languages (Tamil, Telugu, Bengali, Marathi, Gujarati).
- Offline-first progressive web app (PWA) caching for remote rural clinic deployments.
- Edge OCR acceleration for lower-end mobile devices.

---

## 👥 Team & Acknowledgments

Developed with dedication for the **Smart India Hackathon (SIH 2026)** — Problem Statement **SIH26047**.
Designed to accelerate clinical workflows and safeguard patient outcomes across India.
