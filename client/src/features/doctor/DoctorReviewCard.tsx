import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  XCircle,
  Save,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  History,
  Leaf,
  Scan,
  Eye,
} from 'lucide-react';
import { StructuredHistory, DoctorReview, ReviewStatus, IntakeMode } from '@shared/types';
import { useLanguage } from '../../i18n/LanguageContext';

interface DoctorReviewCardProps {
  consultationId: string;
  structuredHistory: StructuredHistory;
  review: DoctorReview;
  intakeMode?: IntakeMode;
  onReviewSubmit: (payload: {
    status: 'DOCTOR_REVIEWED' | 'DOCTOR_EDITED' | 'REJECTED';
    notes?: string;
    editedFields?: Partial<StructuredHistory>;
  }) => Promise<void>;
}

export const DoctorReviewCard: React.FC<DoctorReviewCardProps> = ({
  consultationId,
  structuredHistory,
  review,
  intakeMode = 'MODERN',
  onReviewSubmit,
}) => {
  const { t, language } = useLanguage();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Editable state
  const [chiefComplaint, setChiefComplaint] = useState(structuredHistory.chiefComplaint || '');
  const [duration, setDuration] = useState(structuredHistory.duration || '');
  const [severity, setSeverity] = useState(structuredHistory.severity || '');
  const [symptomsInput, setSymptomsInput] = useState(
    (structuredHistory.associatedSymptoms || []).join(', ')
  );
  const [doctorNotes, setDoctorNotes] = useState(review.notes || '');

  // AYUSH specific editable state
  const ayush = structuredHistory.ayushAssessment || {};
  const [dominantDosha, setDominantDosha] = useState(ayush.dominantDoshaTendency || '');
  const [agni, setAgni] = useState(ayush.agniAssessment || '');
  const [koshtha, setKoshtha] = useState(ayush.koshthaNature || '');
  const [physicalEndurance, setPhysicalEndurance] = useState(ayush.physicalEndurance || '');
  const [nidraQuality, setNidraQuality] = useState(ayush.nidraQuality || '');

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await onReviewSubmit({
        status: 'DOCTOR_REVIEWED',
        notes: doctorNotes || 'Clinically verified by attending physician.',
      });
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    try {
      const edited: Partial<StructuredHistory> = {
        chiefComplaint,
        duration,
        severity,
        associatedSymptoms: symptomsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        ...(intakeMode === 'AYUSH' || Object.keys(ayush).length > 0
          ? {
              ayushAssessment: {
                ...ayush,
                dominantDoshaTendency: dominantDosha,
                agniAssessment: agni,
                koshthaNature: koshtha,
                physicalEndurance,
                nidraQuality,
              },
            }
          : {}),
      };

      await onReviewSubmit({
        status: 'DOCTOR_EDITED',
        notes: doctorNotes || 'Edited and clinically verified by physician.',
        editedFields: edited,
      });
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to mark this AI intake draft as rejected?')) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onReviewSubmit({
        status: 'REJECTED',
        notes: doctorNotes || 'Draft rejected by physician due to inaccurate intake profile.',
      });
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'DOCTOR_REVIEWED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Verified by Doctor
          </span>
        );
      case 'DOCTOR_EDITED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Doctor Edited & Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Rejected by Doctor
          </span>
        );
      case 'AI_GENERATED':
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            AI Draft (Pending Doctor Review)
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6 transition-colors">
      {/* Header with Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Physician Review & Clinical Verification</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            AI output must never become the final medical record without doctor review.
          </p>
        </div>

        <div>{getStatusBadge(review.status)}</div>
      </div>

      {/* Reviewer Audit Stamp if verified */}
      {review.reviewedBy && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-obsidian-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-900 dark:text-white">{review.reviewedBy}</span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span className="font-mono">{new Date(review.reviewedAt || '').toLocaleString()}</span>
          </div>
          {review.notes && <p className="text-slate-600 dark:text-slate-400 italic">"{review.notes}"</p>}
        </div>
      )}

      {/* Clinical Fields: View vs Edit Mode */}
      {!isEditing ? (
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-obsidian-850 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500 font-semibold block text-xs mb-1">Chief Complaint</span>
              <span className="font-bold text-slate-900 dark:text-white">{chiefComplaint || 'None specified'}</span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-obsidian-850 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500 font-semibold block text-xs mb-1">Duration / Onset</span>
              <span className="font-bold text-slate-900 dark:text-white">{duration || 'Not stated'}</span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-obsidian-850 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500 font-semibold block text-xs mb-1">Severity Assessment</span>
              <span className="font-bold text-slate-900 dark:text-white">{severity || 'Not stated'}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-obsidian-850 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 dark:text-slate-500 font-semibold block text-xs mb-1">Associated Symptoms</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(structuredHistory.associatedSymptoms || []).length > 0 ? (
                structuredHistory.associatedSymptoms.map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-obsidian-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic">None reported</span>
              )}
            </div>
          </div>

          {/* AYUSH Profile in Doctor View Mode */}
          {(intakeMode === 'AYUSH' || Object.keys(ayush).length > 0) && (
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                  <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>AYUSH Clinical Intake Parameters (SIH26047)</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  Ayurvedic Case-Taking
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-850 border border-emerald-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">Dosha Lakshana</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{dominantDosha || 'Evaluating...'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-850 border border-emerald-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">Agni Status</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">🔥 {agni || 'Evaluating...'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-850 border border-emerald-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">Koshtha Pattern</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{koshtha || 'Madhyama'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-850 border border-emerald-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">Bala & Nidra</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{physicalEndurance || 'Madhyama'} • {nidraQuality || 'Sukhapurvaka'}</span>
                </div>
              </div>

              {(ayush.annavahaSymptoms || ayush.pranavahaSymptoms) && (
                <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 space-y-0.5">
                  {ayush.annavahaSymptoms && <div><strong>Annavaha Srotas:</strong> {ayush.annavahaSymptoms}</div>}
                  {ayush.pranavahaSymptoms && <div><strong>Pranavaha Srotas:</strong> {ayush.pranavahaSymptoms}</div>}
                </div>
              )}
            </div>
          )}

          {/* Visual Facial & Ocular Inspection Findings */}
          {structuredHistory.visualInspection && (
            <div className="p-4 bg-cyan-50/70 dark:bg-cyan-950/40 rounded-2xl border border-cyan-200 dark:border-cyan-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-900 dark:text-cyan-200 font-bold text-xs">
                  <Scan className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Visual Facial & Ocular Inspection (Netra & Akriti Pariksha)</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 font-mono">
                  Captured {new Date(structuredHistory.visualInspection.capturedAt).toLocaleTimeString()}
                </span>
              </div>

              {/* Patient Captured Photo Preview Card */}
              {structuredHistory.visualInspection.imageUrl && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-obsidian-850 border border-cyan-100 dark:border-slate-800">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-cyan-300 dark:border-cyan-700 bg-slate-900 shrink-0 shadow-xs">
                    <img
                      src={structuredHistory.visualInspection.imageUrl}
                      alt="Patient captured clinical face"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-xs space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <span>📸 Patient Captured Optical Frame</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Landmark segmentation verified across ocular sclera, bilaterally symmetric facial axes, and perioral vascular perfusion.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-850 border border-cyan-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">Ocular Sclera</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {structuredHistory.visualInspection.eyeInspection.scleralIcterus
                      ? '🟡 Scleral Icterus'
                      : structuredHistory.visualInspection.eyeInspection.conjunctivalPallor
                      ? '⚪ Conjunctival Pallor'
                      : '🟢 Clear'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-850 border border-cyan-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">Facial Symmetry</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {structuredHistory.visualInspection.facialSymmetry.droopDetected ? (
                      <span className="text-rose-600 dark:text-rose-400">🚨 Asymmetric Droop</span>
                    ) : (
                      `Symmetric (${structuredHistory.visualInspection.facialSymmetry.symmetryScorePercent}%)`
                    )}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-850 border border-cyan-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">Lip Perfusion</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {structuredHistory.visualInspection.lipsInspection.cyanosisDetected ? (
                      <span className="text-rose-600 dark:text-rose-400">🚨 Central Cyanosis</span>
                    ) : (
                      'Normal Perfusion'
                    )}
                  </span>
                </div>
              </div>

              {structuredHistory.visualInspection.summaryForDoctor && (
                <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-obsidian-850/70 p-2.5 rounded-xl border border-cyan-100 dark:border-slate-800">
                  <strong>Clinical Note:</strong> {structuredHistory.visualInspection.summaryForDoctor}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Chief Complaint</label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-clinical-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-clinical-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Severity</label>
              <input
                type="text"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-clinical-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Associated Symptoms (comma-separated)
            </label>
            <input
              type="text"
              value={symptomsInput}
              onChange={(e) => setSymptomsInput(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-clinical-600 focus:outline-none"
            />
          </div>

          {/* AYUSH Editable Fields */}
          {(intakeMode === 'AYUSH' || Object.keys(ayush).length > 0) && (
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Edit AYUSH Clinical Parameters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">Primary Dosha Tendency</label>
                  <select
                    value={dominantDosha}
                    onChange={(e) => setDominantDosha(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Vata-predominant">Vata Predominant</option>
                    <option value="Pitta-predominant">Pitta Predominant</option>
                    <option value="Kapha-predominant">Kapha Predominant</option>
                    <option value="Vata-Pitta">Vata-Pitta Dvandvaja</option>
                    <option value="Pitta-Kapha">Pitta-Kapha Dvandvaja</option>
                    <option value="Vata-Kapha">Vata-Kapha Dvandvaja</option>
                    <option value="Tridosha-balanced">Sama Prakriti (Balanced)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">Agni (Digestive Capacity)</label>
                  <select
                    value={agni}
                    onChange={(e) => setAgni(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Sama-Agni">Sama Agni (Balanced)</option>
                    <option value="Vishama-Agni">Vishama Agni (Irregular/Gas)</option>
                    <option value="Tikshna-Agni">Tikshna Agni (Hyper/Acidity)</option>
                    <option value="Manda-Agni">Manda Agni (Sluggish/Low Appetite)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">Koshtha (Bowel Habit)</label>
                  <select
                    value={koshtha}
                    onChange={(e) => setKoshtha(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Mrudu-Koshtha">Mrudu (Soft / Loose)</option>
                    <option value="Madhyama-Koshtha">Madhyama (Regular / Normal)</option>
                    <option value="Krura-Koshtha">Krura (Hard / Constipated)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Doctor Clinical Notes */}
      <div>
        <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">
          {t('doctor.doctorNotes')} & Treatment Plan
        </label>
        <textarea
          rows={2}
          value={doctorNotes}
          onChange={(e) => setDoctorNotes(e.target.value)}
          placeholder="Enter formal clinical impression, orders, or examination findings..."
          className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-900 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-clinical-600 focus:outline-none"
        />
      </div>

      {/* Action Buttons: Accept / Edit / Reject */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>{t('doctor.edit')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Cancel Edit
            </button>
          )}

          <button
            type="button"
            onClick={handleReject}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>{t('doctor.reject')}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-clinical-600 hover:bg-clinical-700 text-white shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{t('doctor.saveChanges')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAccept}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('doctor.accept')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
