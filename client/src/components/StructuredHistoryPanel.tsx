import React from 'react';
import {
  FileText,
  Clock,
  Activity,
  Pill,
  ShieldCheck,
  Sparkles,
  Leaf,
  Scan,
  Eye,
} from 'lucide-react';
import { StructuredHistory, IntakeMode, RiskLevel } from '@shared/types';
import { useLanguage } from '../i18n/LanguageContext';

interface StructuredHistoryPanelProps {
  history: StructuredHistory;
  mode: IntakeMode;
  riskLevel?: RiskLevel;
}

export const StructuredHistoryPanel: React.FC<StructuredHistoryPanelProps> = ({
  history,
  mode,
  riskLevel = 'LOW',
}) => {
  const { t } = useLanguage();

  const filledCount = [
    history.chiefComplaint,
    history.duration,
    history.severity,
    history.associatedSymptoms?.length,
    history.pastHistory?.length || history.medications?.length,
  ].filter(Boolean).length;

  const completionPercent = Math.min(100, Math.round((filledCount / 5) * 100));

  return (
    <div className="bg-white dark:bg-obsidian-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-sm p-5 sm:p-6 space-y-4 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 leading-tight">
              {t('intake.structuredPanelTitle')}
            </h4>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live EHR Stream
            </span>
          </div>
        </div>

        {/* Risk Badge */}
        <span
          className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase font-mono tracking-wider ${
            riskLevel === 'HIGH'
              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
              : riskLevel === 'MEDIUM'
              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
          }`}
        >
          {riskLevel}
        </span>
      </div>

      {/* Intake Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
          <span>{t('intake.progress')}</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{completionPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-obsidian-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Structured Fields Grid */}
      <div className="space-y-3 text-xs">
        {/* Chief Complaint */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-obsidian-850 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 font-semibold">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('intake.chiefComplaint')}</span>
          </div>
          <p className="font-bold text-slate-900 dark:text-white text-sm">
            {history.chiefComplaint || (
              <span className="text-slate-400 dark:text-slate-500 italic font-normal">Listening for primary complaint...</span>
            )}
          </p>
        </div>

        {/* Duration & Severity */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-obsidian-850 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              <span>{t('intake.duration')}</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-white">
              {history.duration || <span className="text-slate-400 dark:text-slate-500 italic font-normal">Not stated</span>}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-obsidian-850 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>{t('intake.severity')}</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-white">
              {history.severity || <span className="text-slate-400 dark:text-slate-500 italic font-normal">Not stated</span>}
            </p>
          </div>
        </div>

        {/* Associated Symptoms */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-obsidian-850 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">{t('intake.symptoms')}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              {history.associatedSymptoms?.length || 0} identified
            </span>
          </div>
          {history.associatedSymptoms && history.associatedSymptoms.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {history.associatedSymptoms.map((sym, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-obsidian-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium shadow-2xs"
                >
                  {sym}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 italic">None reported yet</p>
          )}
        </div>

        {/* Medications & History */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-obsidian-850 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 font-semibold">
            <Pill className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('intake.medications')} & History</span>
          </div>
          <div className="space-y-1 text-slate-800 dark:text-slate-200">
            <div>
              <span className="text-slate-400 dark:text-slate-500 mr-1">Meds:</span>
              <span className="font-medium">
                {history.medications?.length ? history.medications.join(', ') : 'None reported'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 mr-1">Past:</span>
              <span className="font-medium">
                {history.pastHistory?.length ? history.pastHistory.join(', ') : 'None reported'}
              </span>
            </div>
          </div>
        </div>

        {/* AYUSH Assessment Preview if AYUSH Mode */}
        {mode === 'AYUSH' && (
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/60 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/50 dark:border-emerald-800/40">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>AYUSH Clinical Profile (SIH26047)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white dark:bg-obsidian-850 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                Ayurvedic Intake
              </span>
            </div>

            {/* Dosha & Agni Badges Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-850 border border-emerald-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                  Dominant Dosha
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] border ${
                    (history.ayushAssessment?.dominantDoshaTendency || '').includes('Pitta')
                      ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : (history.ayushAssessment?.dominantDoshaTendency || '').includes('Vata')
                      ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                      : (history.ayushAssessment?.dominantDoshaTendency || '').includes('Kapha')
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                  }`}
                >
                  {history.ayushAssessment?.dominantDoshaTendency || 'Evaluating...'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-850 border border-emerald-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                  Agni (Digestive Fire)
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] flex items-center gap-1">
                  🔥 {history.ayushAssessment?.agniAssessment || 'Evaluating...'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-850 border border-emerald-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                  Koshtha (Elimination)
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                  {history.ayushAssessment?.koshthaNature || 'Madhyama'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-850 border border-emerald-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                  Bala & Nidra
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                  {history.ayushAssessment?.physicalEndurance || 'Madhyama'} • {history.ayushAssessment?.nidraQuality || 'Sukhapurvaka'}
                </span>
              </div>
            </div>

            {/* Srotas Indicators if detected */}
            {(history.ayushAssessment?.annavahaSymptoms || history.ayushAssessment?.pranavahaSymptoms) && (
              <div className="p-2 rounded-xl bg-white/70 dark:bg-obsidian-850/70 border border-emerald-100 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5">
                {history.ayushAssessment?.annavahaSymptoms && (
                  <div><strong className="text-emerald-700 dark:text-emerald-300">Annavaha:</strong> {history.ayushAssessment.annavahaSymptoms}</div>
                )}
                {history.ayushAssessment?.pranavahaSymptoms && (
                  <div><strong className="text-emerald-700 dark:text-emerald-300">Pranavaha:</strong> {history.ayushAssessment.pranavahaSymptoms}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Visual Inspection Panel (Netra & Akriti Pariksha) */}
        {history.visualInspection && (
          <div className="p-4 rounded-2xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200/90 dark:border-cyan-800/60 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-cyan-200/50 dark:border-cyan-800/40">
              <div className="flex items-center gap-2 text-cyan-900 dark:text-cyan-200 font-bold text-xs">
                <Scan className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Visual Clinical Findings (Netra & Akriti)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white dark:bg-obsidian-850 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-mono">
                Facial AI
              </span>
            </div>

            {/* Captured Photo Preview */}
            {history.visualInspection.imageUrl && (
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-obsidian-850 border border-cyan-100 dark:border-slate-800">
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-cyan-300 dark:border-cyan-700 bg-slate-900 shrink-0">
                  <img
                    src={history.visualInspection.imageUrl}
                    alt="Captured clinical face"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 text-[10px]">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                    Captured Optical Frame
                  </span>
                  <span className="text-slate-400 font-mono block">
                    {new Date(history.visualInspection.capturedAt).toLocaleTimeString()}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                    ✓ Verified Clinical Frame
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* Eye Finding Badge */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-850 border border-cyan-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                  Netra (Eyes)
                </span>
                <span className="font-bold text-[11px] flex items-center gap-1">
                  {history.visualInspection.eyeInspection.scleralIcterus ? (
                    <span className="text-amber-600 dark:text-amber-400">🟡 Scleral Icterus</span>
                  ) : history.visualInspection.eyeInspection.conjunctivalPallor ? (
                    <span className="text-sky-600 dark:text-sky-400">⚪ Conjunctival Pallor</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">🟢 Clear Sclera</span>
                  )}
                </span>
              </div>

              {/* Facial Symmetry Badge */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-obsidian-850 border border-cyan-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                  Akriti (Symmetry)
                </span>
                <span
                  className={`font-bold text-[11px] ${
                    history.visualInspection.facialSymmetry.droopDetected
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {history.visualInspection.facialSymmetry.droopDetected
                    ? '🚨 Asymmetric Droop'
                    : `Symmetric (${history.visualInspection.facialSymmetry.symmetryScorePercent}%)`}
                </span>
              </div>
            </div>

            {/* Overall Findings Text */}
            <p className="text-[11px] text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-obsidian-850/70 p-2.5 rounded-xl border border-cyan-100 dark:border-slate-800 leading-snug">
              {history.visualInspection.overallObservation}
            </p>
          </div>
        )}
      </div>

      {/* Safety Notice Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>Doctor verification required before EHR entry.</span>
      </div>
    </div>
  );
};
