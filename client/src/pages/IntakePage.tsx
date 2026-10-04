import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import {
  Consultation,
  Message,
  StructuredHistory,
  TriageResult,
  IntakeMode,
  LanguageCode,
  VisualInspectionResult,
} from '@shared/types';
import { VoiceInput } from '../components/VoiceInput';
import { ConsentModal } from '../components/ConsentModal';
import { EmergencyBanner } from '../components/EmergencyBanner';
import { StructuredHistoryPanel } from '../components/StructuredHistoryPanel';
import { DocumentUploadModal } from '../features/documents/DocumentUploadModal';
import { AYUSHAssessmentForm } from '../features/ayush/AYUSHAssessmentForm';
import { LiveVoiceModal } from '../components/LiveVoiceModal';
import { speechService } from '../services/speechService';
import {
  Send,
  Bot,
  User,
  Activity,
  Upload,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Leaf,
  Stethoscope,
  ChevronRight,
  Flame,
  AlertCircle,
  Languages,
  Pill,
  Plus,
  Volume2,
  VolumeX,
  Mic,
  Camera,
  Eye,
  Scan,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { FacialSymptomScannerModal } from '../features/vision/FacialSymptomScannerModal';

export const IntakePage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const isHi = language === 'hi';
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Intake State
  const [patientName, setPatientName] = useState(() => (user && user.role === 'PATIENT' ? user.name : 'Rahul Sharma'));
  const [patientAge, setPatientAge] = useState(42);
  const [patientGender, setPatientGender] = useState('MALE');
  const [intakeMode, setIntakeMode] = useState<IntakeMode>('MODERN');

  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [showAyushForm, setShowAyushForm] = useState(false);
  const [translationsMap, setTranslationsMap] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});
  const [isLiveVoiceModalOpen, setIsLiveVoiceModalOpen] = useState(false);
  const [isVisualScannerOpen, setIsVisualScannerOpen] = useState(false);
  const [preIntakeVisualScan, setPreIntakeVisualScan] = useState<VisualInspectionResult | null>(() => {
    try {
      const saved = sessionStorage.getItem('medisaarthi_pre_intake_scan');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const updatePreIntakeVisualScan = (result: VisualInspectionResult | null) => {
    setPreIntakeVisualScan(result);
    try {
      if (result) {
        sessionStorage.setItem('medisaarthi_pre_intake_scan', JSON.stringify(result));
      } else {
        sessionStorage.removeItem('medisaarthi_pre_intake_scan');
      }
    } catch {
      // Ignore sessionStorage restriction
    }
  };

  // Data Safety: Instantly purge all active consultation data, messages, and scans upon signout
  useEffect(() => {
    const handleLogoutPurge = () => {
      speechService.stopSpeaking();
      setConsultation(null);
      setMessages([]);
      setPreIntakeVisualScan(null);
      setInputText('');
      setTranslationsMap({});
      setIsAiTyping(false);
      setConsentModalOpen(false);
      setIsDocModalOpen(false);
      setShowAyushForm(false);
      setIsLiveVoiceModalOpen(false);
      setIsVisualScannerOpen(false);
      setPatientName('Rahul Sharma');
      try {
        sessionStorage.removeItem('medisaarthi_pre_intake_scan');
      } catch {
        // Ignore
      }
    };

    window.addEventListener('medisaarthi:logout', handleLogoutPurge);
    return () => {
      window.removeEventListener('medisaarthi:logout', handleLogoutPurge);
    };
  }, []);

  // Sync patient name with authenticated user profile
  useEffect(() => {
    if (user && user.role === 'PATIENT') {
      setPatientName(user.name);
    } else if (!user && !consultation) {
      setPatientName('Rahul Sharma');
    }
  }, [user]);

  const [currentlySpeakingMsgId, setCurrentlySpeakingMsgId] = useState<string | null>(null);

  const handleToggleSpeakMessage = (msgId: string, text: string) => {
    if (currentlySpeakingMsgId === msgId) {
      speechService.stopSpeaking();
      setCurrentlySpeakingMsgId(null);
    } else {
      setCurrentlySpeakingMsgId(msgId);
      speechService.speak(text, language, {
        onEnd: () => setCurrentlySpeakingMsgId(null),
        onError: () => setCurrentlySpeakingMsgId(null),
      });
    }
  };

  const handleCloseScannerModal = () => {
    setIsVisualScannerOpen(false);
    if (searchParams.get('action') === 'scan') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      navigate({ search: newParams.toString() ? `?${newParams.toString()}` : '' }, { replace: true });
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSwitchChatLanguage = async (newLang: LanguageCode) => {
    setLanguage(newLang);
    if (consultation) {
      setConsultation((prev) => (prev ? { ...prev, language: newLang } : null));
      try {
        await api.updateConsultationLanguage(consultation.id, newLang);
      } catch (err) {
        console.warn('Failed to sync consultation language:', err);
      }
    }
  };

  const handleToggleTranslate = async (msgId: string, text: string) => {
    if (translationsMap[msgId]) {
      setTranslationsMap((prev) => {
        const next = { ...prev };
        delete next[msgId];
        return next;
      });
      return;
    }

    setIsTranslating((prev) => ({ ...prev, [msgId]: true }));
    try {
      const hasDevanagari = /[\u0900-\u097F]/.test(text);
      const targetLang: LanguageCode = hasDevanagari ? 'en' : 'hi';
      const res = await api.translate(text, targetLang);
      if (res && res.translatedText) {
        setTranslationsMap((prev) => ({ ...prev, [msgId]: res.translatedText }));
      }
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  // Handle URL Demo scenarios query param (?scenario=normal or ?scenario=emergency)
  useEffect(() => {
    const scenario = searchParams.get('scenario');
    if (scenario === 'emergency') {
      setPatientName('Sunita Devi');
      setPatientAge(58);
      setPatientGender('FEMALE');
      setLanguage('hi');
      setIntakeMode('MODERN');
    } else if (scenario === 'normal') {
      setPatientName('Rahul Sharma');
      setPatientAge(42);
      setPatientGender('MALE');
      setLanguage('hi');
      setIntakeMode('MODERN');
    } else if (scenario === 'ayush') {
      setPatientName('Priya Patel');
      setPatientAge(29);
      setPatientGender('FEMALE');
      setLanguage('hi');
      setIntakeMode('AYUSH');
    }

    // Auto-open Face & Eye visual scanner if action=scan is requested
    if (searchParams.get('action') === 'scan') {
      setIsVisualScannerOpen(true);
    }
  }, [searchParams, setLanguage]);

  // Load existing profile demographics for logged-in patient if not in a preset demo scenario
  useEffect(() => {
    if (user && user.role === 'PATIENT' && !searchParams.get('scenario')) {
      setPatientName(user.name);
      api.listPatients(user.name).then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          const profile = res.data.find((p: any) => p.name.toLowerCase() === user.name.toLowerCase());
          if (profile) {
            if (profile.age) setPatientAge(profile.age);
            if (profile.gender) setPatientGender(profile.gender);
          }
        }
      }).catch((err) => console.warn('Could not prefill patient profile:', err));
    }
  }, [user, searchParams]);

  // Start Consultation after consent
  const handleInitiateIntake = () => {
    setConsentModalOpen(true);
  };

  const handleConsentAgreed = async () => {
    setConsentModalOpen(false);
    setIsAiTyping(true);

    try {
      const res = await api.createConsultation({
        patientName,
        patientAge: Number(patientAge),
        patientGender,
        language,
        mode: intakeMode,
        consentGiven: true,
        consentVersion: '1.0',
        visualInspection: preIntakeVisualScan,
      });

      if (res.success && res.data) {
        setConsultation(res.data);
        setMessages(res.data.messages);

        // If patient completed a visual scan before starting intake, attach findings immediately!
        if (preIntakeVisualScan) {
          try {
            const detectedPreset = preIntakeVisualScan.eyeInspection.scleralIcterus
              ? 'JAUNDICE'
              : preIntakeVisualScan.eyeInspection.conjunctivalPallor
              ? 'ANEMIA_PALLOR'
              : preIntakeVisualScan.facialSymmetry.droopDetected
              ? 'STROKE_DROOP'
              : preIntakeVisualScan.lipsInspection.cyanosisDetected
              ? 'CYANOSIS'
              : 'NORMAL';

            const visRes = await api.analyzeVisualSymptoms(res.data.id, {
              imageBase64: preIntakeVisualScan.imageUrl,
              presetType: detectedPreset,
              language,
            });

            if (visRes.success && visRes.data?.consultation) {
              setConsultation(visRes.data.consultation);
              setMessages(visRes.data.consultation.messages);
            }
          } catch (e) {
            console.warn('Could not attach pre-intake visual scan to consultation:', e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to create consultation:', err);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !consultation) return;

    setInputText('');

    // Append patient message immediately
    const tempPatientMsg: Message = {
      id: `temp_${Date.now()}`,
      sender: 'PATIENT',
      text,
      language,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempPatientMsg]);
    setIsAiTyping(true);

    try {
      const res = await api.postMessage(consultation.id, text, language);
      if (res.success && res.data) {
        setConsultation(res.data.consultation);
        setMessages(res.data.consultation.messages);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    if (transcript && transcript.trim().length > 0) {
      setInputText(transcript);
      handleSendMessage(transcript);
    }
  };

  const handleCompleteIntake = async () => {
    if (!consultation) return;
    try {
      const res = await api.completeConsultation(consultation.id);
      if (res.success && res.data) {
        setConsultation(res.data);
      }
    } catch (err) {
      console.error('Error completing intake:', err);
    }
  };

  const isEmergencyHalted = consultation?.status === 'HALTED_EMERGENCY';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Consent Modal */}
      <ConsentModal
        isOpen={consentModalOpen}
        onAgree={handleConsentAgreed}
        onCancel={() => setConsentModalOpen(false)}
      />

      {/* Document Upload Modal */}
      {consultation && (
        <DocumentUploadModal
          patientId={consultation.patientId}
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          onUploadSuccess={(doc) => {
            // Update consultation structured history with extracted medications if available
            if (doc.structuredData?.medications?.length) {
              setConsultation((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  structuredHistory: {
                    ...prev.structuredHistory,
                    medications: Array.from(
                      new Set([...prev.structuredHistory.medications, ...doc.structuredData.medications])
                    ),
                  },
                };
              });
            }
          }}
        />
      )}

      {/* Live Voice Consultation Modal */}
      {consultation && (
        <LiveVoiceModal
          isOpen={isLiveVoiceModalOpen}
          onClose={() => setIsLiveVoiceModalOpen(false)}
          language={language}
          onSwitchLanguage={handleSwitchChatLanguage}
          currentAiQuestion={
            [...messages].reverse().find((m) => m.sender === 'AI')?.text || ''
          }
          onSendPatientVoiceMessage={async (text) => {
            await handleSendMessage(text);
          }}
          isAiProcessing={isAiTyping}
        />
      )}

      {/* Facial & Ocular Symptom Scanner Modal */}
      <FacialSymptomScannerModal
        isOpen={isVisualScannerOpen}
        onClose={handleCloseScannerModal}
        consultationId={consultation?.id}
        existingResult={consultation?.structuredHistory?.visualInspection || preIntakeVisualScan}
        language={language}
        onInspectionComplete={async (result) => {
          if (consultation?.id) {
            const res = await api.getConsultation(consultation.id);
            if (res.success && res.data) {
              setConsultation(res.data);
              setMessages(res.data.messages);
            }
          } else if (result) {
            updatePreIntakeVisualScan(result);
          }
        }}
      />

      {/* SCREEN 1: Pre-Intake Setup Form */}
      {!consultation ? (
        <div className="max-w-2xl mx-auto bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-10 space-y-8 animate-fade-in transition-colors">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                <Activity className="w-6 h-6" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-sm">
                <Pill className="w-6 h-6 rotate-45" />
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              <Plus className="w-3 h-3 text-emerald-600" />
              <span>Rx Clinical Intake & Telehealth Desk</span>
            </div>

            {/* Account Data Protection Status Banner */}
            <div className="pt-1">
              {user ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    Logged in as <strong className="text-slate-900 dark:text-white">{user.name}</strong> ({user.role})
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="text-rose-600 dark:text-rose-400 font-bold hover:underline inline-flex items-center gap-1"
                    title="Sign Out to secure this device"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>{language === 'hi' ? 'लॉग आउट' : 'Sign Out'}</span>
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Guest Mode (Local session only)</span>
                  <span className="text-amber-300 dark:text-amber-700">•</span>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-amber-900 dark:text-amber-200 font-black hover:underline inline-flex items-center gap-1"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>{language === 'hi' ? 'लॉगिन करें' : 'Sign In'}</span>
                  </button>
                </div>
              )}
            </div>

            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{t('intake.newConsultation')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Please provide demographic details to configure your AI clinical intake interview.
            </p>
          </div>

          {/* Quick AI Visual Symptom Scan Shortcut */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              preIntakeVisualScan
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                : 'bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-emerald-500/10 border-cyan-300 dark:border-cyan-800/80'
            } flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs`}
          >
            <div className="flex items-center gap-3 text-center sm:text-left">
              {preIntakeVisualScan?.imageUrl ? (
                <div
                  onClick={() => setIsVisualScannerOpen(true)}
                  className="relative w-11 h-11 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md shrink-0 cursor-pointer group bg-slate-900"
                  title="Click to view captured photo"
                >
                  <img
                    src={preIntakeVisualScan.imageUrl}
                    alt="Captured face photo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  </div>
                </div>
              ) : (
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                    preIntakeVisualScan
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'bg-gradient-to-tr from-cyan-600 to-teal-500 text-white shadow-cyan-500/20'
                  }`}
                >
                  {preIntakeVisualScan ? <CheckCircle2 className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                </div>
              )}
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {language === 'hi' ? '📸 नेत्र व चेहरा लक्षण परीक्षण (Netra AI)' : '📸 Visual Face & Eye Scan (Netra AI)'}
                  </h4>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase font-mono ${
                      preIntakeVisualScan
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                    }`}
                  >
                    {preIntakeVisualScan ? (language === 'hi' ? 'स्कैन संपन्न' : 'Scan Ready') : 'New'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {preIntakeVisualScan
                    ? `${language === 'hi' ? 'दर्ज निष्कर्ष' : 'Recorded findings'}: ${
                        preIntakeVisualScan.findings.map((f) => f.sign).join(', ') || 'Normal findings'
                      }`
                    : language === 'hi'
                    ? 'आंखों के कंजंक्टाइवा (पीलिया/एनीमिया), स्ट्रोक समरूपता व होंठों की त्वरित जांच'
                    : 'Screen for Jaundice, Anemia Pallor, Facial Stroke Droop, or Cyanosis before intake'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsVisualScannerOpen(true)}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all shrink-0 hover:scale-105 ${
                preIntakeVisualScan
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 shadow-cyan-500/25'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>
                {preIntakeVisualScan
                  ? language === 'hi'
                    ? 'पुनः जांचें / देखें'
                    : 'View / Rescan'
                  : language === 'hi'
                  ? 'कैमरा खोलें'
                  : 'Open Camera Scanner'}
              </span>
            </button>
          </div>

          {/* Prominent Pre-Intake Face Scanning Clinical Data Card (Visible without signin) */}
          {preIntakeVisualScan && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-emerald-500/10 border-2 border-cyan-400/50 dark:border-cyan-700/60 space-y-4 shadow-lg animate-fade-in">
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-cyan-200/60 dark:border-cyan-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/25">
                    <Scan className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {language === 'hi' ? '📸 चेहरा व नेत्र परीक्षण परिणाम' : '📸 Face & Eye Scan Clinical Findings'}
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        {language === 'hi' ? 'स्कैन सत्यापित' : 'Scan Verified'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      Captured: {new Date(preIntakeVisualScan.capturedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsVisualScannerOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-obsidian-850 hover:bg-slate-100 dark:hover:bg-obsidian-800 text-cyan-800 dark:text-cyan-300 font-bold text-xs border border-cyan-200 dark:border-cyan-800 shadow-xs flex items-center gap-1 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'बड़ा देखें / पुनः स्कैन' : 'View Full / Rescan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePreIntakeVisualScan(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title={language === 'hi' ? 'हटाएं' : 'Remove Scan'}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Red Flag Warning Alert if any */}
              {preIntakeVisualScan.detectedRedFlags && preIntakeVisualScan.detectedRedFlags.length > 0 && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4" />
                    <span>{language === 'hi' ? 'आपातकालीन चेतावनी चिन्ह' : 'Urgent Clinical Warning'}</span>
                  </div>
                  <ul className="list-disc list-inside font-semibold">
                    {preIntakeVisualScan.detectedRedFlags.map((rf, i) => (
                      <li key={i}>{rf}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Card Body: Photo + Key Clinical Landmark Zones */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                {/* Captured Photo Frame */}
                {preIntakeVisualScan.imageUrl && (
                  <div
                    onClick={() => setIsVisualScannerOpen(true)}
                    className="sm:col-span-4 relative aspect-4/3 rounded-2xl overflow-hidden border-2 border-cyan-400/80 dark:border-cyan-600/80 shadow-md cursor-pointer group bg-slate-950 flex items-center justify-center"
                    title="Click to view high-resolution photo"
                  >
                    <img
                      src={preIntakeVisualScan.imageUrl}
                      alt="Captured face clinical photo"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-900/90 text-white text-[10px] font-bold border border-cyan-400/60 shadow-lg">
                        🔍 Enlarge Photo
                      </span>
                    </div>
                  </div>
                )}

                {/* Organ Inspection Metrics */}
                <div className={`${preIntakeVisualScan.imageUrl ? 'sm:col-span-8' : 'sm:col-span-12'} space-y-2`}>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Eye Inspection */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-900 border border-cyan-100 dark:border-slate-800 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Netra (Eyes)
                      </span>
                      <span className="font-bold text-xs">
                        {preIntakeVisualScan.eyeInspection.scleralIcterus ? (
                          <span className="text-amber-600 dark:text-amber-400">🟡 Scleral Icterus</span>
                        ) : preIntakeVisualScan.eyeInspection.conjunctivalPallor ? (
                          <span className="text-sky-600 dark:text-sky-400">⚪ Conjunctival Pallor</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">🟢 Clear Sclera</span>
                        )}
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {preIntakeVisualScan.eyeInspection.notes}
                      </p>
                    </div>

                    {/* Facial Symmetry */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-900 border border-cyan-100 dark:border-slate-800 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Akriti (Symmetry)
                      </span>
                      <span className="font-bold text-xs flex items-center justify-between">
                        <span
                          className={
                            preIntakeVisualScan.facialSymmetry.droopDetected
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {preIntakeVisualScan.facialSymmetry.droopDetected ? '🚨 Asymmetric Droop' : 'Symmetric'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          {preIntakeVisualScan.facialSymmetry.symmetryScorePercent}%
                        </span>
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {preIntakeVisualScan.facialSymmetry.notes}
                      </p>
                    </div>
                  </div>

                  {/* AI Observation */}
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-obsidian-900/80 border border-cyan-100 dark:border-slate-800 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      AI Clinical Observation:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-snug font-medium text-[11px]">
                      {preIntakeVisualScan.overallObservation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Findings Tags with Ayush Correlations */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Detected Clinical Signs & Ayush Correlations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {preIntakeVisualScan.findings.map((f, i) => (
                    <div
                      key={i}
                      className={`px-2 py-1 rounded-xl text-[10px] font-semibold border flex items-center gap-1.5 ${
                        f.isRedFlag
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                          : 'bg-white dark:bg-obsidian-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{f.sign}</span>
                      <span className="font-mono text-cyan-600 dark:text-cyan-400">({f.confidence}%)</span>
                      {f.ayushCorrelation && (
                        <span className="text-emerald-700 dark:text-emerald-300 font-normal">
                          • {f.ayushCorrelation}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-cyan-200/50 dark:border-cyan-800/30 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {language === 'hi' ? 'यह डेटा डॉक्टर सारथी परामर्श में स्वतः शामिल होगा' : 'This face scanning data is ready to link with Dr. Saarthi'}
                </span>
                <span className="font-mono text-[10px]">Netra AI Ready</span>
              </div>
            </div>
          )}

          {/* Quick Patient Profiles */}
          <div className="bg-slate-50 dark:bg-obsidian-850 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              👤 Sample Patient Profiles:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setPatientName('Rahul Sharma');
                  setPatientAge(42);
                  setPatientGender('MALE');
                  setLanguage('hi');
                  setIntakeMode('MODERN');
                }}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700 hover:border-emerald-600 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs"
              >
                Rahul Sharma (General Triage)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPatientName('Sunita Devi');
                  setPatientAge(58);
                  setPatientGender('FEMALE');
                  setLanguage('hi');
                  setIntakeMode('MODERN');
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 hover:border-rose-400 text-rose-800 dark:text-rose-300 text-xs font-semibold shadow-2xs"
              >
                Sunita Devi (Cardiac Concern)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPatientName('Priya Patel');
                  setPatientAge(29);
                  setPatientGender('FEMALE');
                  setLanguage('hi');
                  setIntakeMode('AYUSH');
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-400 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-2xs"
              >
                Priya Patel (AYUSH Holistic)
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t('intake.fullName')}</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-850 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="e.g. Rahul Sharma"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t('intake.age')}</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-850 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t('intake.gender')}</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-850 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="MALE">{t('intake.male')}</option>
                  <option value="FEMALE">{t('intake.female')}</option>
                  <option value="OTHER">{t('intake.other')}</option>
                </select>
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t('nav.language')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-3 rounded-xl font-bold border transition-all text-center ${
                    language === 'en'
                      ? 'bg-white dark:bg-obsidian-800 border-slate-900 dark:border-white text-slate-900 dark:text-white shadow-sm ring-2 ring-slate-900/10 dark:ring-white/20'
                      : 'bg-slate-50 dark:bg-obsidian-850 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`p-3 rounded-xl font-bold border transition-all text-center ${
                    language === 'hi'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-800 dark:text-emerald-300 shadow-sm ring-2 ring-emerald-600/20'
                      : 'bg-slate-50 dark:bg-obsidian-850 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
              </div>
            </div>

            {/* Mode Selection */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t('intake.mode')}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIntakeMode('MODERN')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    intakeMode === 'MODERN'
                      ? 'bg-clinical-50 dark:bg-cyan-950/40 border-clinical-600 dark:border-cyan-500 text-clinical-900 dark:text-cyan-300 ring-2 ring-clinical-600/20 shadow-sm'
                      : 'bg-slate-50 dark:bg-obsidian-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-obsidian-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-0.5">
                    <Stethoscope className="w-4 h-4 text-clinical-600 dark:text-cyan-400" />
                    <span>{t('intake.modernMode')}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Standard clinical history protocol</p>
                </button>

                <button
                  type="button"
                  onClick={() => setIntakeMode('AYUSH')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    intakeMode === 'AYUSH'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-600/20 shadow-sm'
                      : 'bg-slate-50 dark:bg-obsidian-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-obsidian-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-0.5">
                    <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('intake.ayushMode')}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Prakriti, Agni & Koshtha assessment</p>
                </button>
              </div>
            </div>
          </div>

          {/* Begin Button */}
          <button
            type="button"
            onClick={handleInitiateIntake}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-ayush-700 to-ayush-600 hover:from-ayush-800 hover:to-ayush-700 text-white font-bold text-sm shadow-lg shadow-ayush-700/20 hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <span>{t('intake.startChat')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* SCREEN 2: Active Dynamic Conversational Interview */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Chat Conversation Stream */}
          <div className="lg:col-span-8 bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-[78vh] transition-colors">
            {/* Chat Header */}
            <div className="bg-slate-950 dark:bg-obsidian-950 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-neon-emerald">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-white">
                      Dr. Saarthi (एआई क्लिनिकल डॉक्टर)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      <span>MD AI Physician</span>
                    </span>
                    <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 items-center gap-1">
                      <Pill className="w-2.5 h-2.5 text-cyan-400 rotate-45" />
                      <span>Clinical Rx</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-slate-300 font-medium">
                      मरीज़: {consultation.patientName} ({consultation.patientAge}y, {consultation.patientGender})
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">{consultation.mode} Protocol</span>
                    <span>•</span>
                    <div className="flex items-center gap-1 bg-slate-800 dark:bg-obsidian-800 p-0.5 rounded-lg border border-slate-700">
                      <Languages className="w-3 h-3 text-emerald-400 ml-1" />
                      <button
                        type="button"
                        onClick={() => handleSwitchChatLanguage('en')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                          language === 'en'
                            ? 'bg-white text-slate-950 shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchChatLanguage('hi')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                          language === 'hi'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        हिन्दी
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Real-time Live Voice Intake Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setIsLiveVoiceModalOpen(true)}
                  title="Open Hands-Free Real-Time Voice Consultation"
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-neon-emerald hover:scale-105"
                >
                  <Mic className="w-3.5 h-3.5 animate-pulse" />
                  <span className="hidden md:inline">🎙️ Live Voice Intake</span>
                  <span className="md:hidden">Voice</span>
                </button>

                {/* Facial & Eye Visual Scan Button */}
                <button
                  type="button"
                  onClick={() => setIsVisualScannerOpen(true)}
                  title="Scan Face & Eyes for Jaundice, Pallor, Stroke Droop, or Cyanosis"
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-neon-cyan hover:scale-105"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">📸 Face & Eye Scan</span>
                  <span className="md:hidden">Scan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(true)}
                  title="Upload Prescription / Lab Report"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 dark:bg-obsidian-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Upload Doc</span>
                </button>

                {consultation.status === 'IN_PROGRESS' && (
                  <button
                    type="button"
                    onClick={handleCompleteIntake}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    {t('intake.endConsultation')}
                  </button>
                )}

                {consultation.status === 'COMPLETED' && !isEmergencyHalted && (
                  <button
                    type="button"
                    onClick={() => navigate(`/doctor/patient/${consultation.id}`)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold transition-all shadow-neon-emerald flex items-center gap-1.5"
                  >
                    <span>{language === 'hi' ? 'डॉक्टर सारांश देखें →' : 'View Doctor Summary →'}</span>
                  </button>
                )}

                {isEmergencyHalted && (
                  <button
                    type="button"
                    onClick={() => navigate(`/doctor/patient/${consultation.id}`)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-neon-rose"
                  >
                    View Doctor Review →
                  </button>
                )}
              </div>
            </div>

            {/* Emergency Banner (Visible when High Risk Triage triggered) */}
            {isEmergencyHalted && (
              <div className="p-4 bg-red-50 dark:bg-rose-950/40 border-b border-red-200 dark:border-rose-900/60 shrink-0">
                <EmergencyBanner triageResult={consultation.triageResult} />
              </div>
            )}

            {/* Visual Inspection Status Pill Banner if captured */}
            {consultation.structuredHistory?.visualInspection && (
              <div className="mx-4 mt-3 p-3 rounded-2xl bg-cyan-50/90 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between gap-2 text-xs shrink-0 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {consultation.structuredHistory.visualInspection.imageUrl ? (
                    <div
                      onClick={() => setIsVisualScannerOpen(true)}
                      className="w-10 h-10 rounded-xl overflow-hidden border-2 border-cyan-400/70 shadow-xs shrink-0 cursor-pointer hover:scale-105 transition-transform bg-slate-900"
                      title={language === 'hi' ? 'कैप्चर की गई फोटो देखें' : 'View captured photo'}
                    >
                      <img
                        src={consultation.structuredHistory.visualInspection.imageUrl}
                        alt="Captured face thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <Scan className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  )}
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-cyan-900 dark:text-cyan-200">
                        {language === 'hi' ? 'नेत्र एवं मुखाकृति परीक्षण:' : 'Visual Face & Eye Inspection:'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-200/60 dark:bg-cyan-900/60 text-cyan-900 dark:text-cyan-300">
                        Verified Photo
                      </span>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate block max-w-sm sm:max-w-md">
                      {consultation.structuredHistory.visualInspection.findings.map((f) => f.sign).join(', ') || 'Normal findings recorded'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVisualScannerOpen(true)}
                  className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white dark:bg-obsidian-850 border border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-50 transition-colors shrink-0"
                >
                  {language === 'hi' ? 'फोटो व विवरण' : 'View Photo & Findings'}
                </button>
              </div>
            )}

            {/* Chat Transcript Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-obsidian-950/60">
              {messages.map((msg) => {
                const isAi = msg.sender === 'AI';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAi && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white flex items-center justify-center shrink-0 mb-1 shadow-neon-emerald">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-5 py-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                        msg.isEmergencyAlert
                          ? 'bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 text-rose-950 dark:text-rose-100 font-medium'
                          : isAi
                          ? 'bg-white dark:bg-obsidian-850 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                      }`}
                    >
                      {isAi && !msg.isEmergencyAlert && (
                        <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Stethoscope className="w-3 h-3" />
                          <span>Dr. Saarthi (Clinical Intake)</span>
                        </div>
                      )}
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* Live Translated Card */}
                      {translationsMap[msg.id] && (
                        <div
                          className={`mt-2.5 pt-2 border-t text-xs rounded-2xl p-3 transition-all ${
                            isAi
                              ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-800 text-slate-700 dark:text-slate-200'
                              : 'border-emerald-500/60 bg-emerald-950/80 text-emerald-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider mb-1 opacity-80">
                            <Languages className="w-3 h-3 text-emerald-400" />
                            <span>
                              {/[\u0900-\u097F]/.test(msg.text)
                                ? 'English Translation (अंग्रेज़ी अनुवाद)'
                                : 'हिन्दी अनुवाद (Hindi Translation)'}
                            </span>
                          </div>
                          <p className="font-medium leading-relaxed">{translationsMap[msg.id]}</p>
                        </div>
                      )}

                      {/* Action row with Audio TTS Playback, Translate toggle & timestamp */}
                      <div className="flex items-center justify-between gap-3 mt-2 pt-1.5 border-t border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-1.5">
                          {isAi && (
                            <button
                              type="button"
                              onClick={() => handleToggleSpeakMessage(msg.id, msg.text)}
                              title={currentlySpeakingMsgId === msg.id ? 'Stop audio' : 'Listen to Dr. Saarthi'}
                              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ${
                                currentlySpeakingMsgId === msg.id
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                                  : 'bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {currentlySpeakingMsgId === msg.id ? (
                                <>
                                  <VolumeX className="w-2.5 h-2.5 text-rose-600 animate-pulse" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Listen (सुनें)</span>
                                </>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleTranslate(msg.id, msg.text)}
                            disabled={isTranslating[msg.id]}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ${
                              isAi
                                ? 'bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-700 text-slate-600 dark:text-slate-300'
                                : 'bg-emerald-800/80 hover:bg-emerald-900 text-emerald-100'
                            }`}
                          >
                            <Languages className="w-2.5 h-2.5" />
                            <span>
                              {isTranslating[msg.id]
                                ? 'अनुवाद हो रहा है...'
                                : translationsMap[msg.id]
                                ? (/[ \u0900-\u097F]/.test(msg.text) ? 'मूल हिंदी देखें (Original)' : 'Show Original')
                                : /[\u0900-\u097F]/.test(msg.text)
                                ? '🌐 Translate to English'
                                : '🌐 हिन्दी अनुवाद (Hindi)'}
                            </span>
                          </button>
                        </div>

                        <span
                          className={`text-[10px] ${
                            isAi ? 'text-slate-400 dark:text-slate-500' : 'text-emerald-100'
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {!isAi && (
                      <div className="w-8 h-8 rounded-xl bg-slate-800 dark:bg-obsidian-800 text-white flex items-center justify-center shrink-0 mb-1 shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* AI Typing Indicator */}
              {isAiTyping && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-obsidian-850 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-100" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-200" />
                  </div>
                </div>
              )}

              {/* Consultation Completed Card */}
              {consultation.status === 'COMPLETED' && !isEmergencyHalted && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 text-slate-800 dark:text-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-neon-emerald">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                        {language === 'hi' ? 'क्लिनिकल इंटरव्यू संपन्न (Consultation Intake Completed)' : 'Clinical Intake Interview Completed'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'hi' ? 'डॉ. सारथी ने आपकी विस्तृत मेडिकल रिपोर्ट तैयार कर ली है।' : 'Dr. Saarthi has synthesized your full clinical EHR summary.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/doctor/patient/${consultation.id}`)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>{language === 'hi' ? 'डॉक्टर समीक्षा देखें' : 'View Doctor EHR Note'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Dynamic Stage-Aware Clinical Quick Chips */}
            {(() => {
              const patientTurns = messages.filter((m) => m.sender === 'PATIENT').length;
              let chips: Array<{ label: string; text: string; isDanger?: boolean }> = [];

              if (patientTurns === 0) {
                chips = [
                  { label: language === 'hi' ? '1. पेट में दर्द' : '1. Stomach Pain', text: language === 'hi' ? 'मुझे पेट में बहुत दर्द हो रहा है' : 'I am experiencing severe stomach pain' },
                  { label: language === 'hi' ? '2. सिरदर्द और चक्कर' : '2. Headache & Dizziness', text: language === 'hi' ? 'मुझे बहुत तेज सिरदर्द और चक्कर आ रहे हैं' : 'I have a severe throbbing headache and feeling dizzy' },
                  { label: language === 'hi' ? '3. बुखार और खांसी' : '3. Fever & Cough', text: language === 'hi' ? 'मुझे 101 डिग्री बुखार और खांसी है' : 'I have high fever and persistent cough' },
                  { label: language === 'hi' ? '4. कमर/पीठ दर्द' : '4. Back Pain', text: language === 'hi' ? 'मेरी कमर में तेज दर्द है, झुकने में तकलीफ है' : 'I have intense lower back pain after lifting something' },
                  { label: language === 'hi' ? '🚨 सीने में दर्द + सांस में दिक्कत' : '🚨 Chest Pain + Dyspnea', text: language === 'hi' ? 'मुझे सीने में दर्द हो रहा है और सांस लेने में बहुत दिक्कत हो रही है' : 'I have severe acute chest pain and difficulty breathing', isDanger: true },
                ];
              } else if (patientTurns === 1) {
                chips = [
                  { label: language === 'hi' ? '2 दिन से है' : 'Since 2 days', text: language === 'hi' ? 'यह दर्द 2 दिन से लगातार बना हुआ है' : 'I have had this discomfort for the last 2 days' },
                  { label: language === 'hi' ? 'कल रात से' : 'Since last night', text: language === 'hi' ? 'यह कल रात से अचानक शुरू हुआ' : 'It started suddenly last night' },
                  { label: language === 'hi' ? 'आज सुबह से' : 'Since this morning', text: language === 'hi' ? 'यह आज सुबह उठने के बाद से हो रहा है' : 'It began this morning after waking up' },
                  { label: language === 'hi' ? '1 हफ्ते से' : 'For 1 week', text: language === 'hi' ? 'यह पिछले 1 हफ्ते से रुक-रुक कर हो रहा है' : 'It has been intermittent for about 1 week' },
                ];
              } else if (patientTurns === 2) {
                chips = [
                  { label: language === 'hi' ? 'बहुत तेज दर्द (Severe)' : 'Severe Intensity', text: language === 'hi' ? 'बहुत तेज असहनीय दर्द है, सोने में भी दिक्कत है' : 'It is severe and unbearable, keeping me awake at night' },
                  { label: language === 'hi' ? 'मध्यम दर्द (Moderate)' : 'Moderate Intensity', text: language === 'hi' ? 'मध्यम दर्द है लेकिन काम करने में परेशानी हो रही है' : 'It is moderate, uncomfortable but manageable' },
                  { label: language === 'hi' ? 'हल्का दर्द (Mild)' : 'Mild Intensity', text: language === 'hi' ? 'हल्का-हल्का दर्द और भारीपन बना रहता है' : 'It is a mild dull ache that lingers' },
                ];
              } else if (patientTurns === 3) {
                chips = [
                  { label: language === 'hi' ? 'कोई उल्टी/बुखार नहीं' : 'No Nausea/Fever', text: language === 'hi' ? 'नहीं, कोई उल्टी, बुखार या चक्कर नहीं है' : 'No, I have no nausea, fever, vomiting, or dizziness' },
                  { label: language === 'hi' ? 'उल्टी जैसा लग रहा है' : 'Nausea / Vomiting', text: language === 'hi' ? 'हां, जी मिचला रहा है और उल्टी जैसी लग रही है' : 'Yes, I feel nauseous and had one episode of vomiting' },
                  { label: language === 'hi' ? 'भूख बिल्कुल नहीं है' : 'Loss of Appetite', text: language === 'hi' ? 'खाना खाने का बिल्कुल मन नहीं करता, अरुचि है' : 'I have completely lost my appetite and feel weak' },
                ];
              } else if (patientTurns === 4) {
                chips = [
                  { label: language === 'hi' ? 'कोई बीमारी/दवा नहीं' : 'No Chronic Illness/Meds', text: language === 'hi' ? 'मुझे पहले से कोई बीमारी नहीं है और कोई नियमित दवा नहीं लेता' : 'I have no chronic medical conditions and take no regular medications' },
                  { label: language === 'hi' ? 'BP है, Amlodipine लेता हूँ' : 'Hypertension (Amlodipine)', text: language === 'hi' ? 'मुझे उच्च रक्तचाप (BP) है, एम्लोडिपिन 5mg रोजाना लेता हूँ' : 'I have hypertension and take Amlodipine 5mg daily' },
                  { label: language === 'hi' ? 'शुगर (Diabetes) है' : 'Diabetes Mellitus', text: language === 'hi' ? 'मुझे डायबिटीज (शुगर) है, मेटफॉर्मिन लेता हूँ' : 'I have Type 2 Diabetes and take Metformin' },
                  { label: language === 'hi' ? 'आज पैरासिटामोल ली थी' : 'Took Paracetamol Today', text: language === 'hi' ? 'आज सुबह एक पैरासिटामोल 650mg ली थी' : 'I took a Paracetamol 650mg tablet earlier today' },
                ];
              } else {
                chips = [
                  { label: language === 'hi' ? 'कोई एलर्जी नहीं है' : 'No Known Allergies', text: language === 'hi' ? 'मुझे किसी दवा या खाने से कोई एलर्जी नहीं है' : 'I have no known allergies to any medicines or foods' },
                  { label: language === 'hi' ? 'पेनिसिलिन से एलर्जी' : 'Allergic to Penicillin', text: language === 'hi' ? 'मुझे पेनिसिलिन एंटीबायोटिक से एलर्जी है' : 'I am allergic to Penicillin antibiotics' },
                  { label: language === 'hi' ? 'पाचन ठीक रहता है' : 'Normal Digestion', text: language === 'hi' ? 'पाचन और नींद सामान्य रहती है' : 'Digestion and sleep patterns are normal' },
                ];
              }

              return (
                <div className="bg-slate-100/80 dark:bg-obsidian-900 px-3 py-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[10px] shrink-0">
                  <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                    <span>{language === 'hi' ? 'सुझाव:' : 'Suggestions:'}</span>
                  </span>
                  {chips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(chip.text)}
                      disabled={isEmergencyHalted || isAiTyping}
                      className={`px-2 py-0.5 rounded-lg whitespace-nowrap shadow-2xs font-medium text-[10px] transition-all ${
                        chip.isDanger
                          ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50'
                          : 'bg-white dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-obsidian-750 hover:border-emerald-500'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Chat Input Bar */}
            <div className="p-3 sm:p-4 bg-white dark:bg-obsidian-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Input Button with Real-time Interim Streaming */}
                <VoiceInput
                  language={language}
                  onTranscript={handleVoiceTranscript}
                  onInterimTranscript={(interim) => setInputText(interim)}
                  disabled={isEmergencyHalted || isAiTyping}
                />

                {/* Facial & Eye Visual Scan Button */}
                <button
                  type="button"
                  onClick={() => setIsVisualScannerOpen(true)}
                  disabled={isEmergencyHalted || isAiTyping}
                  title="Scan Face & Eyes for Symptoms (Netra & Akriti Pariksha)"
                  className="p-3 sm:p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 transition-all shadow-2xs hover:scale-105 disabled:opacity-50 shrink-0"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400" />
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={inputText}
                  disabled={isEmergencyHalted || isAiTyping}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isEmergencyHalted
                      ? 'Routine intake halted. Seeking clinical evaluation...'
                      : language === 'hi'
                      ? 'अपनी भाषा में बोलें या लिखें (हिन्दी, English या Hinglish)...'
                      : 'Speak or type in Hindi, English, or Hinglish...'
                  }
                  className="flex-1 p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-850 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 dark:disabled:bg-obsidian-800 placeholder-slate-400 dark:placeholder-slate-500"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isEmergencyHalted || isAiTyping}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/25"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>
                    {language === 'hi'
                      ? 'डॉ. सारथी हिन्दी, English और Hinglish दोनों भाषाएं समझते हैं'
                      : 'Dr. Saarthi speaks & understands Hindi, English & Hinglish'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Languages className="w-3 h-3 text-emerald-400" />
                  <span>AI Multilingual Engine</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Structured Clinical History & AYUSH Module */}
          <div className="lg:col-span-4 space-y-4">
            <StructuredHistoryPanel
              history={consultation.structuredHistory}
              mode={consultation.mode}
              riskLevel={consultation.triageResult.riskLevel}
            />

            {/* AYUSH Observational Form Expandable (if AYUSH Mode) */}
            {consultation.mode === 'AYUSH' && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowAyushForm(!showAyushForm)}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold text-xs flex items-center justify-between transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isHi ? 'आयुष क्लिनिकल केस प्रोफाइल फॉर्म (SIH26047)' : 'AYUSH Clinical Case Profile Form (SIH26047)'}</span>
                  </div>
                  <span className="font-mono">{showAyushForm ? (isHi ? 'छुपाएं ▲' : 'Hide ▲') : (isHi ? 'देखें ▼' : 'Expand ▼')}</span>
                </button>

                {showAyushForm && (
                  <div className="mt-3">
                    <AYUSHAssessmentForm
                      consultationId={consultation.id}
                      initialValues={consultation.structuredHistory.ayushAssessment || {}}
                      onChange={(values) => {
                        setConsultation((prev) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            structuredHistory: {
                              ...prev.structuredHistory,
                              ayushAssessment: values,
                            },
                          };
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
