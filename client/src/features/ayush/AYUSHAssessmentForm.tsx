import React, { useEffect, useState, useRef } from 'react';
import { Leaf, Info, Check, ShieldCheck, Save, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { AYUSH_CASE_SCHEMA } from '@shared/config/ayushSchema';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/api';

interface AYUSHAssessmentFormProps {
  consultationId?: string;
  initialValues?: Record<string, string>;
  onChange?: (values: Record<string, string>) => void;
  readOnly?: boolean;
}

export const AYUSHAssessmentForm: React.FC<AYUSHAssessmentFormProps> = ({
  consultationId,
  initialValues = {},
  onChange,
  readOnly = false,
}) => {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const [formData, setFormData] = useState<Record<string, string>>(initialValues);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  // Calculate completion percentage
  const totalFields = AYUSH_CASE_SCHEMA.reduce((acc, sec) => acc + sec.fields.length, 0);
  const filledFields = Object.values(formData).filter((v) => v && v.trim().length > 0).length;
  const completionPercent = Math.min(100, Math.round((filledFields / totalFields) * 100));

  const saveToBackend = async (dataToSave: Record<string, string>) => {
    if (!consultationId) return;
    setIsSaving(true);
    try {
      const res = await api.updateAyushAssessment(consultationId, dataToSave);
      if (res.success) {
        setSaveSuccess(true);
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to auto-save AYUSH assessment:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    if (readOnly) return;
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    if (onChange) onChange(updated);

    // Auto-save debounce (1.2 seconds)
    if (consultationId) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        saveToBackend(updated);
      }, 1200);
    }
  };

  const handleManualSave = async () => {
    if (readOnly || !consultationId) return;
    await saveToBackend(formData);
  };

  const handleSyncFromAI = () => {
    if (readOnly) return;
    const merged = { ...formData, ...initialValues };
    setFormData(merged);
    if (onChange) onChange(merged);
    if (consultationId) saveToBackend(merged);
  };

  return (
    <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-emerald-200/90 dark:border-emerald-900/60 shadow-sm p-5 sm:p-6 space-y-6 transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-emerald-100 dark:border-emerald-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 shadow-xs">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                {isHi ? 'आयुष क्लिनिकल केस प्रोफाइल' : 'AYUSH Clinical Case Profile'}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                SIH26047
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isHi
                ? 'प्रकृति, अग्नि, कोष्ठ, बल एवं स्रोतस अवलोकन मानक'
                : 'Prakriti, Agni, Koshtha, Bala & Srotas Case-Taking Framework'}
            </p>
          </div>
        </div>

        {/* Status & Save Button */}
        <div className="flex items-center gap-2">
          {lastSavedTime && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline-block">
              Saved {lastSavedTime}
            </span>
          )}

          {consultationId && !readOnly && (
            <button
              type="button"
              onClick={handleManualSave}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? (isHi ? 'सहेज रहे हैं...' : 'Saving...') : saveSuccess ? (isHi ? 'सहेजा गया' : 'Saved to EHR') : (isHi ? 'सहेजें' : 'Save Form')}</span>
            </button>
          )}

          {!readOnly && Object.keys(initialValues).length > 0 && (
            <button
              type="button"
              onClick={handleSyncFromAI}
              title="Sync AI-extracted observations into form"
              className="p-1.5 rounded-xl text-xs bg-slate-100 dark:bg-obsidian-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}
        </div>
      </div>

      {/* Completion Meter */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
          <span>{isHi ? 'केस प्रोफाइल पूर्णता' : 'AYUSH Profile Completeness'}</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {filledFields} / {totalFields} ({completionPercent}%)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-obsidian-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {AYUSH_CASE_SCHEMA.map((section) => (
          <div key={section.sectionKey} className="space-y-3">
            <div className="border-l-4 border-emerald-500 pl-3">
              <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                {isHi ? section.titleHi : section.title}
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHi ? section.descriptionHi : section.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {section.fields.map((field) => {
                const currentValue = formData[field.key] || '';

                return (
                  <div
                    key={field.key}
                    className="space-y-1.5 bg-slate-50/80 dark:bg-obsidian-850 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isHi ? field.labelHi : field.label}
                      </label>
                      {currentValue && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </div>

                    {field.type === 'select' && field.options ? (
                      <select
                        disabled={readOnly}
                        value={currentValue}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 dark:disabled:bg-obsidian-800 disabled:text-slate-500"
                      >
                        <option value="">
                          {isHi ? '-- अवलोकन चुनें --' : '-- Select observation --'}
                        </option>
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {isHi ? opt.labelHi : opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled={readOnly}
                        value={currentValue}
                        placeholder={isHi ? field.descriptionHi : field.description}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 dark:disabled:bg-obsidian-800 disabled:text-slate-500"
                      />
                    )}

                    <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                      {isHi ? field.descriptionHi : field.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Ethical Boundaries Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-obsidian-850 p-3 rounded-2xl">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>
          {isHi
            ? 'वैधानिक सूचना: यह आयुष केस प्रोफाइल विशुद्ध रूप से अवलोकन एवं केस-टेकिंग डेटा है। किसी नैदानिक निदान अथवा औषधि निर्धारण हेतु अधिकृत वैद्य/चिकित्सक की सीधी जांच अनिवार्य है।'
            : 'Statutory Notice: These parameters represent descriptive case-taking observations for clinical review and do not constitute verified diagnoses or therapeutic prescriptions.'}
        </span>
      </div>
    </div>
  );
};

