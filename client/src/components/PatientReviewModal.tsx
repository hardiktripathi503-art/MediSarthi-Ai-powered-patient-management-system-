import React, { useState, useEffect } from 'react';
import { PatientProfile } from '@shared/types';
import { X, CheckCircle, Ban, AlertCircle, Building2, FileText, UserCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface PatientReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile | null;
  mode: 'ACCEPT' | 'REJECT';
  onConfirm: (payload: {
    action: 'ACCEPT' | 'REJECT';
    notes?: string;
    rejectionReason?: string;
    acceptanceNotes?: string;
    department?: string;
    reviewedBy?: string;
  }) => Promise<void>;
}

const DEPARTMENTS = [
  'General Medicine OPD',
  'AYUSH Clinic (Kayachikitsa / Panchakarma)',
  'Pediatrics OPD',
  'Cardiology Outpatient Clinic',
  'Emergency Observation Unit',
  'Geriatric & Chronic Care Ward',
];

const REJECTION_REASONS = [
  'Critical Red-Flag: Escalated directly to Tertiary Emergency Hospital',
  'Outside Outpatient Scope: Requires immediate inpatient ICU admission',
  'Duplicate or Incomplete Patient Registration Record',
  'Patient Discharged / Left OPD Without Clinical Examination',
  'Other Clinical Administrative Reason',
];

export const PatientReviewModal: React.FC<PatientReviewModalProps> = ({
  isOpen,
  onClose,
  patient,
  mode,
  onConfirm,
}) => {
  const { user } = useAuth();
  const doctorName = user?.name || 'Dr. V. K. Saxena, MD';

  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setErrorMsg('');
      if (mode === 'ACCEPT') {
        setDepartment(DEPARTMENTS[0]);
      } else {
        setSelectedReason(REJECTION_REASONS[0]);
      }
    }
  }, [isOpen, mode]);

  if (!isOpen || !patient) return null;

  const isAccept = mode === 'ACCEPT';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (isAccept) {
        await onConfirm({
          action: 'ACCEPT',
          department,
          acceptanceNotes: notes.trim(),
          notes: notes.trim(),
          reviewedBy: doctorName,
        });
      } else {
        const fullReason = notes.trim()
          ? `${selectedReason} - ${notes.trim()}`
          : selectedReason;
        await onConfirm({
          action: 'REJECT',
          rejectionReason: fullReason,
          notes: fullReason,
          reviewedBy: doctorName,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit clinical decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                isAccept
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/25'
                  : 'bg-gradient-to-tr from-rose-600 to-red-500 shadow-rose-500/25'
              }`}
            >
              {isAccept ? <CheckCircle className="w-6 h-6" /> : <Ban className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {isAccept ? 'Accept & Admit Patient' : 'Reject / Escalate Patient Intake'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {patient.name} ({patient.age}y, {patient.gender})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5 text-xs">
          {/* Reviewing Doctor Badge */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-obsidian-850 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold">
              <UserCheck className="w-4 h-4 text-cyan-500" />
              <span>Reviewing Clinician:</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{doctorName}</span>
          </div>

          {isAccept ? (
            <>
              {/* Department selection */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Assign Clinical Department / OPD Ward *</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-850 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Acceptance Notes */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Doctor Intake Instructions & Nursing Notes (Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Admitted to OPD Room 3 for physical palpation. Monitor vitals Q2H."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-850 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          ) : (
            <>
              {/* Rejection Reason Selection */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Clinical Justification for Rejection / Escalation *</span>
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                >
                  {REJECTION_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Clinical Notes */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Specific Rejection Remarks / Transfer Details (Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Chest pain with ST-segment elevation on monitor. Arranged 108 emergency ambulance to AIIMS ICU."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-850 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-obsidian-800 font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-white font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50 transition-all ${
                isAccept
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 shadow-rose-500/25'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isAccept ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Patient Acceptance</span>
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  <span>Confirm Patient Rejection</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
