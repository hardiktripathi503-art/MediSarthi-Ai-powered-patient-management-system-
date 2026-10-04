import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ShieldCheck, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onAgree: () => void;
  onCancel: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ isOpen, onAgree, onCancel }) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all scale-100">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-ayush-700 to-emerald-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{t('consent.title')}</h3>
              <p className="text-xs text-emerald-100">{t('consent.version')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed space-y-1">
              <p className="font-semibold text-amber-950">
                {language === 'hi'
                  ? 'महत्वपूर्ण सूचना (क्लिनिकल सुरक्षा सीमा):'
                  : 'Important Notice (Clinical Safety Boundary):'}
              </p>
              <p>{t('consent.body')}</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {language === 'hi'
                  ? 'यह प्रणाली केवल जानकारी संकलन और डॉक्टर के पूर्वावलोकन हेतु है।'
                  : 'This tool performs structured information intake for your examining doctor.'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {language === 'hi'
                  ? 'अंतिम निदान एवं पर्चा योग्य चिकित्सक द्वारा ही निर्धारित किया जाएगा।'
                  : 'Final clinical diagnosis and prescription remain the sole responsibility of the medical doctor.'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            {t('consent.cancel')}
          </button>

          <button
            type="button"
            onClick={onAgree}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-ayush-700 to-ayush-600 hover:from-ayush-800 hover:to-ayush-700 text-white shadow-md shadow-ayush-700/20 hover:shadow-lg transition-all"
          >
            {t('consent.agree')}
          </button>
        </div>
      </div>
    </div>
  );
};
