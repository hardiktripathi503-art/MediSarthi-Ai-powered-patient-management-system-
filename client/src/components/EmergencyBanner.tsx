import React from 'react';
import { AlertOctagon, PhoneCall, ShieldAlert } from 'lucide-react';
import { TriageResult } from '@shared/types';
import { useLanguage } from '../i18n/LanguageContext';

interface EmergencyBannerProps {
  triageResult: TriageResult;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ triageResult }) => {
  const { t, language } = useLanguage();

  if (triageResult.riskLevel !== 'HIGH') return null;

  return (
    <div className="w-full bg-gradient-to-r from-emergency-600 via-rose-600 to-red-700 text-white rounded-2xl p-5 sm:p-6 shadow-xl shadow-emergency-600/25 border border-emergency-500 animate-pulse-glow">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md shrink-0">
            <AlertOctagon className="w-7 h-7 text-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-white text-emergency-700">
                🔴 HIGH PRIORITY TRIAGE
              </span>
              <span className="text-xs text-emergency-100 font-medium hidden sm:inline">
                {language === 'hi' ? 'सामान्य पूछताछ रोकी गई' : 'Interview Questioning Halted'}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-bold mt-1 leading-snug">
              {t('triage.highAlert')}
            </h4>
            <p className="text-xs sm:text-sm text-emergency-100 mt-1 max-w-2xl">
              {triageResult.reasons.join('. ') || t('triage.highAlertDesc')}
            </p>
          </div>
        </div>

        {/* Emergency Call to Action */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <a
            href="tel:108"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-emergency-700 font-bold text-sm shadow-md transition-transform hover:scale-105"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call 108 / 112 (Ambulance)</span>
          </a>
        </div>
      </div>

      {/* Actionable recommendation */}
      <div className="mt-4 pt-3 border-t border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-emergency-50">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-white" />
          <span className="font-semibold">Recommended Action:</span>
          <span>{triageResult.recommendedAction}</span>
        </div>
        <p className="italic opacity-80">{triageResult.disclaimer}</p>
      </div>
    </div>
  );
};
