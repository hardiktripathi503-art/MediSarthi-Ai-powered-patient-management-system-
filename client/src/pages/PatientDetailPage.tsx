import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Consultation, MedicalDocument, TimelineEvent, PatientProfile } from '@shared/types';
import { DoctorReviewCard } from '../features/doctor/DoctorReviewCard';
import { DocumentUploadModal } from '../features/documents/DocumentUploadModal';
import { MedicalTimelineView } from '../features/timeline/MedicalTimelineView';
import { EmergencyBanner } from '../components/EmergencyBanner';
import { EditPatientModal } from '../components/EditPatientModal';
import { PatientReviewModal } from '../components/PatientReviewModal';
import {
  FileText,
  Clock,
  Activity,
  History,
  AlertOctagon,
  Languages,
  CheckCircle2,
  Leaf,
  ChevronLeft,
  Upload,
  MessageSquare,
  FileCheck,
  Printer,
  Download,
  Edit3,
  UserCheck,
  UserX,
  Building2,
  Ban,
  ShieldCheck,
  Lock,
  LogIn,
  LogOut,
  Stethoscope,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../auth/AuthContext';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'TRANSCRIPT' | 'DOCUMENTS' | 'TIMELINE'>(
    'SUMMARY'
  );
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);
  const [reviewModalMode, setReviewModalMode] = useState<'ACCEPT' | 'REJECT' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryTranslation, setSummaryTranslation] = useState<string | null>(null);
  const [isTranslatingSummary, setIsTranslatingSummary] = useState(false);

  const handleToggleSummaryTranslate = async () => {
    if (summaryTranslation) {
      setSummaryTranslation(null);
      return;
    }
    if (!consultation || !consultation.aiSummary) return;

    setIsTranslatingSummary(true);
    try {
      const hasDevanagari = /[\u0900-\u097F]/.test(consultation.aiSummary);
      const targetLang = hasDevanagari ? 'en' : 'hi';
      const res = await api.translate(consultation.aiSummary, targetLang);
      if (res && res.translatedText) {
        setSummaryTranslation(res.translatedText);
      }
    } catch (err) {
      console.error('Summary translation error:', err);
    } finally {
      setIsTranslatingSummary(false);
    }
  };

  const fetchDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const consRes = await api.getConsultation(id);
      if (consRes.success && consRes.data) {
        setConsultation(consRes.data);
        const patientId = consRes.data.patientId;
        const [patRes, docRes, timeRes] = await Promise.all([
          api.getPatient(patientId),
          api.getPatientDocuments(patientId),
          api.getPatientTimeline(patientId),
        ]);
        if (patRes.success && patRes.data?.patient) {
          setPatientProfile(patRes.data.patient);
        }
        if (docRes.success && docRes.data) {
          setDocuments(docRes.data);
        }
        if (timeRes.success && timeRes.data) {
          setTimeline(timeRes.data);
        }
      } else {
        // Fallback: Check if ID corresponds directly to a patient
        const patRes = await api.getPatient(id);
        if (patRes.success && patRes.data?.patient) {
          setPatientProfile(patRes.data.patient);
          if (patRes.data.consultations && patRes.data.consultations.length > 0) {
            setConsultation(patRes.data.consultations[0]);
          }
          if (patRes.data.documents) {
            setDocuments(patRes.data.documents);
          }
          if (patRes.data.timeline) {
            setTimeline(patRes.data.timeline);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching patient records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Only fetch clinical records when authenticated as DOCTOR
  useEffect(() => {
    if (isAuthenticated && user?.role === 'DOCTOR') {
      fetchDetails();
    } else {
      setConsultation(null);
      setPatientProfile(null);
      setDocuments([]);
      setTimeline([]);
      setIsLoading(false);
    }
  }, [id, isAuthenticated, user]);

  // Data Safety: Instantly purge patient data upon signout
  useEffect(() => {
    const handleLogout = () => {
      setConsultation(null);
      setPatientProfile(null);
      setDocuments([]);
      setTimeline([]);
      navigate('/login');
    };
    window.addEventListener('medisaarthi:logout', handleLogout);
    return () => window.removeEventListener('medisaarthi:logout', handleLogout);
  }, [navigate]);

  const handleEditPatientSave = async (updatedData: Partial<PatientProfile>) => {
    if (!patientProfile?.id) return;
    try {
      const res = await api.updatePatient(patientProfile.id, updatedData);
      if (res.success && res.data) {
        setPatientProfile(res.data);
        fetchDetails();
      }
    } catch (err) {
      console.error('Error saving patient profile edits:', err);
    }
  };

  const handlePatientReviewConfirm = async (payload: any) => {
    if (!patientProfile?.id) return;
    try {
      const res = await api.reviewPatient(patientProfile.id, payload);
      if (res.success && res.data) {
        setPatientProfile(res.data);
        fetchDetails();
      }
    } catch (err) {
      console.error('Error submitting patient review decision:', err);
    }
  };

  const handleReviewSubmit = async (payload: {
    status: 'DOCTOR_REVIEWED' | 'DOCTOR_EDITED' | 'REJECTED';
    notes?: string;
    editedFields?: any;
  }) => {
    if (!id) return;
    try {
      const res = await api.reviewConsultation(id, payload);
      if (res.success && res.data) {
        setConsultation(res.data);
      }
    } catch (err) {
      console.error('Error saving doctor review:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-slate-500 mt-4">Verifying physician credentials...</p>
      </div>
    );
  }

  // Security Lock: Doctor auth required to inspect confidential patient file
  if (!isAuthenticated || user?.role !== 'DOCTOR') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 animate-fade-in text-center space-y-6">
        <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl space-y-6 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-cyan-600/30">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-mono">
              Confidential Patient Record
            </span>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 pt-1">
              Physician Authorization Required
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              This patient clinical file contains diagnostic history, AI triage findings, and prescriptions. Doctor sign-in is required to view.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/login?role=doctor')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-600/25 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In as Doctor (डॉक्टर लॉगिन)</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                const res = await login('dr.saxena@medisaarthi.in', 'Doctor@123');
                if (res.success) {
                  await fetchDetails();
                }
              }}
              className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-750 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Stethoscope className="w-4 h-4 text-cyan-500" />
              <span>Demo 1-Click Doctor Sign In (Dr. V. K. Saxena)</span>
            </button>

            <Link
              to="/intake"
              className="block text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors pt-1"
            >
              Return to Patient Intake &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading verified clinical records...</p>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Patient consultation record not found</h3>
        <button
          type="button"
          onClick={() => navigate('/doctor')}
          className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-obsidian-800 text-white text-xs font-bold"
        >
          Return to Doctor Portal
        </button>
      </div>
    );
  }

  const isHighRisk = consultation.triageResult.riskLevel === 'HIGH';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 transition-colors">
      {/* Back Link & Quick Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/doctor')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Triage Queue</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            title="Sign Out of Doctor Session"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-bold shadow-2xs transition-all hover:scale-105 active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>{language === 'hi' ? 'लॉग आउट' : 'Sign Out'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEditPatientOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-obsidian-850 hover:bg-slate-50 dark:hover:bg-obsidian-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs transition-all"
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-500" />
            <span>Edit Patient</span>
          </button>

          <button
            type="button"
            onClick={() => setReviewModalMode('ACCEPT')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs shadow-emerald-500/25 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{patientProfile?.status === 'ACCEPTED' ? 'Update Admission' : 'Accept Patient'}</span>
          </button>

          <button
            type="button"
            onClick={() => setReviewModalMode('REJECT')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{patientProfile?.status === 'REJECTED' ? 'Edit Rejection' : 'Reject Patient'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDocModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-obsidian-850 hover:bg-slate-50 dark:hover:bg-obsidian-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            <span>Upload Medical Document</span>
          </button>
        </div>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        patientId={consultation.patientId}
        onUploadSuccess={() => fetchDetails()}
      />

      {/* Edit Patient Modal */}
      <EditPatientModal
        isOpen={isEditPatientOpen}
        onClose={() => setIsEditPatientOpen(false)}
        patient={
          patientProfile || {
            id: consultation.patientId,
            name: consultation.patientName,
            age: consultation.patientAge,
            gender: consultation.patientGender as any,
            contact: '',
            allergies: consultation.structuredHistory?.allergies || [],
            chronicConditions: consultation.structuredHistory?.pastHistory || [],
            medications: consultation.structuredHistory?.medications || [],
            status: 'PENDING',
            createdAt: consultation.createdAt,
          }
        }
        onSave={handleEditPatientSave}
      />

      {/* Patient Review (Accept / Reject) Modal */}
      <PatientReviewModal
        isOpen={reviewModalMode !== null}
        onClose={() => setReviewModalMode(null)}
        mode={reviewModalMode || 'ACCEPT'}
        patient={
          patientProfile || {
            id: consultation.patientId,
            name: consultation.patientName,
            age: consultation.patientAge,
            gender: consultation.patientGender as any,
            contact: '',
            allergies: [],
            chronicConditions: [],
            medications: [],
            status: 'PENDING',
            createdAt: consultation.createdAt,
          }
        }
        onConfirm={handlePatientReviewConfirm}
      />

      {/* High Priority Emergency Banner if Red Flag */}
      {isHighRisk && (
        <div className="animate-fade-in">
          <EmergencyBanner triageResult={consultation.triageResult} />
        </div>
      )}

      {/* Patient Intake Status Banner */}
      <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
              patientProfile?.status === 'ACCEPTED'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20'
                : patientProfile?.status === 'REJECTED'
                ? 'bg-gradient-to-tr from-rose-600 to-red-500 shadow-rose-500/20'
                : 'bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-amber-500/20'
            }`}
          >
            {patientProfile?.status === 'ACCEPTED' ? (
              <UserCheck className="w-6 h-6" />
            ) : patientProfile?.status === 'REJECTED' ? (
              <UserX className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Patient Intake Status:
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-black uppercase font-mono tracking-wide ${
                  patientProfile?.status === 'ACCEPTED'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : patientProfile?.status === 'REJECTED'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                }`}
              >
                {patientProfile?.status === 'ACCEPTED'
                  ? 'Accepted / Admitted'
                  : patientProfile?.status === 'REJECTED'
                  ? 'Intake Rejected / Escalated'
                  : 'Pending Doctor Intake Review'}
              </span>
              {patientProfile?.doctorReview?.department && (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-obsidian-850 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{patientProfile.doctorReview.department}</span>
                </span>
              )}
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1.5">
              {patientProfile?.status === 'ACCEPTED' ? (
                <>
                  Confirmed by <span className="font-semibold text-slate-900 dark:text-white">{patientProfile.doctorReview?.reviewedBy || 'Doctor'}</span>
                  {patientProfile.doctorReview?.reviewedAt && (
                    <span className="text-slate-400 ml-1">
                      on {new Date(patientProfile.doctorReview.reviewedAt).toLocaleString()}
                    </span>
                  )}
                  {patientProfile.doctorReview?.acceptanceNotes && (
                    <span className="block mt-1 font-medium text-emerald-700 dark:text-emerald-300 italic">
                      "{patientProfile.doctorReview.acceptanceNotes}"
                    </span>
                  )}
                </>
              ) : patientProfile?.status === 'REJECTED' ? (
                <>
                  Intake decision by <span className="font-semibold text-slate-900 dark:text-white">{patientProfile.doctorReview?.reviewedBy || 'Doctor'}</span>
                  {patientProfile.doctorReview?.reviewedAt && (
                    <span className="text-slate-400 ml-1">
                      on {new Date(patientProfile.doctorReview.reviewedAt).toLocaleString()}
                    </span>
                  )}
                  {patientProfile.doctorReview?.rejectionReason && (
                    <span className="block mt-1 font-medium text-rose-700 dark:text-rose-300">
                      Reason: {patientProfile.doctorReview.rejectionReason}
                    </span>
                  )}
                </>
              ) : (
                'Review patient vitals, chief complaint, and clinical history, then choose to Accept into OPD/Ward or Reject/Escalate.'
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setReviewModalMode('ACCEPT')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{patientProfile?.status === 'ACCEPTED' ? 'Update Admission' : 'Accept Patient'}</span>
          </button>
          <button
            type="button"
            onClick={() => setReviewModalMode('REJECT')}
            className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-300 dark:border-rose-850 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{patientProfile?.status === 'REJECTED' ? 'Edit Rejection' : 'Reject Patient'}</span>
          </button>
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 dark:from-obsidian-800 dark:to-obsidian-700 text-white flex items-center justify-center font-bold text-2xl shadow-md">
            {consultation.patientName[0]}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">{consultation.patientName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300 font-mono">
                {consultation.patientAge} Years • {consultation.patientGender}
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase font-mono ${
                  isHighRisk
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    : consultation.triageResult.riskLevel === 'MEDIUM'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                }`}
              >
                {consultation.triageResult.riskLevel} Risk
              </span>
              {consultation.mode === 'AYUSH' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                  <Leaf className="w-3 h-3 text-emerald-500" />
                  AYUSH Intake
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Language: <span className="font-semibold uppercase font-mono">{consultation.language}</span> • Case ID:{' '}
              <span className="font-mono text-slate-400 dark:text-slate-500">{consultation.id}</span>
            </p>
          </div>
        </div>

        {/* Demographics & Chronic Overview */}
        <div className="flex flex-wrap gap-4 text-xs border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-0.5">Pre-existing Conditions</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {consultation.structuredHistory.pastHistory?.length
                ? consultation.structuredHistory.pastHistory.join(', ')
                : 'None recorded'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-0.5">Current Medication</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {consultation.structuredHistory.medications?.length
                ? consultation.structuredHistory.medications.join(', ')
                : 'None reported'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-0.5">Drug Allergies</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {consultation.structuredHistory.allergies?.length
                ? consultation.structuredHistory.allergies.join(', ')
                : 'NKDA'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'SUMMARY', label: 'Clinical Summary & Doctor Review', icon: <FileCheck className="w-4 h-4" /> },
          { id: 'TRANSCRIPT', label: 'Conversational Transcript', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'DOCUMENTS', label: `Documents & OCR (${documents.length})`, icon: <FileText className="w-4 h-4" /> },
          { id: 'TIMELINE', label: `Medical Timeline (${timeline.length})`, icon: <History className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-obsidian-850'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT 1: SUMMARY & VERIFICATION */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-6">
          {/* AI Clinical Summary Note */}
          <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                      {consultation.mode === 'AYUSH' ? 'AYUSH Clinical Case Sheet & Note' : 'AI-Generated Clinical Summary Note'}
                    </h3>
                    {consultation.mode === 'AYUSH' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 font-mono">
                        <Leaf className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        AYUSH Mode
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Synthesized from patient voice & conversational intake</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-800 hover:bg-slate-100 dark:hover:bg-obsidian-750 text-slate-800 dark:text-slate-200 shadow-2xs"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-500" />
                  <span>प्रिंट / Export PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleSummaryTranslate}
                  disabled={isTranslatingSummary || !consultation.aiSummary}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    summaryTranslation
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>
                    {isTranslatingSummary
                      ? 'अनुवाद हो रहा है...'
                      : summaryTranslation
                      ? 'मूल अंग्रेज़ी देखें (View English)'
                      : 'हिंदी में अनुवाद (Translate to Hindi)'}
                  </span>
                </button>

                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                  {new Date(consultation.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {summaryTranslation && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
                <Languages className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>🌐 यह सारांश हिंदी अनुवाद में प्रदर्शित है (Displaying Hindi Translation)</span>
              </div>
            )}

            <div className="prose prose-sm max-w-none text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed text-xs sm:text-sm bg-slate-50 dark:bg-obsidian-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 font-sans">
              {summaryTranslation || consultation.aiSummary || 'Intake summary generation in progress...'}
            </div>
          </div>

          {/* Doctor Review & Verification Card */}
          <DoctorReviewCard
            consultationId={consultation.id}
            structuredHistory={consultation.structuredHistory}
            review={consultation.doctorReview}
            intakeMode={consultation.mode}
            onReviewSubmit={handleReviewSubmit}
          />
        </div>
      )}

      {/* TAB CONTENT 2: TRANSCRIPT */}
      {activeTab === 'TRANSCRIPT' && (
        <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Intake Audio & Chat Transcript</h3>
          <div className="space-y-3">
            {consultation.messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-2xl text-xs space-y-1.5 ${
                  m.sender === 'AI'
                    ? 'bg-slate-50 dark:bg-obsidian-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 font-medium'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                  <span className="font-bold uppercase tracking-wider">{m.sender} ({m.language})</span>
                  <span className="font-mono">{new Date(m.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: DOCUMENTS */}
      {activeTab === 'DOCUMENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Uploaded Medical Documents & Lab OCR Data</h3>
            <button
              type="button"
              onClick={() => setIsDocModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md"
            >
              + Upload New Document
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-sm">
              No medical documents uploaded yet. Click above to upload a prescription or lab report for OCR analysis.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300 font-mono">
                        {doc.documentType}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">{doc.fileName}</h4>
                    </div>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {doc.verificationStatus}
                    </span>
                  </div>

                  {/* Flagged Abnormalities */}
                  {doc.structuredData?.potentialAbnormalities?.length > 0 && (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                      <span className="font-bold">Flagged Metrics:</span>
                      <p>{doc.structuredData.potentialAbnormalities.join(', ')}</p>
                    </div>
                  )}

                  {/* Investigations Table */}
                  {doc.structuredData?.investigations?.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Extracted Lab Values:</span>
                      <div className="space-y-1.5">
                        {doc.structuredData.investigations.map((inv, idx) => (
                          <div key={idx} className="flex justify-between bg-slate-50 dark:bg-obsidian-850 p-2 rounded-xl text-[11px] border border-slate-100 dark:border-slate-800">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{inv.testName}</span>
                            <span className={`font-bold ${inv.isAbnormal ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                              {inv.value} {inv.isAbnormal && '⚠️'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: MEDICAL TIMELINE */}
      {activeTab === 'TIMELINE' && (
        <MedicalTimelineView events={timeline} />
      )}
    </div>
  );
};
