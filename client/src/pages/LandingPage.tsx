import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  HeartPulse,
  Activity,
  Mic,
  Stethoscope,
  ShieldAlert,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Languages,
  Leaf,
  Zap,
  ShieldCheck,
  Radio,
  Pill,
  FlaskConical,
  Thermometer,
  Plus,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="space-y-16 pb-24 aurora-bg-light dark:aurora-bg-dark transition-colors duration-300">
      {/* Hero Section with Medicine Motifs */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Soft Medical Gradient Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Compact Floating Medicine Capsule (Top-Left Background) */}
        <div className="hidden xl:flex absolute left-8 top-16 items-center gap-2 py-1.5 px-2.5 rounded-xl bg-white/90 dark:bg-obsidian-900/90 border border-emerald-200/70 dark:border-emerald-800/70 shadow-sm backdrop-blur-md animate-float-slow pointer-events-none z-10">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-2xs">
            <Pill className="w-3.5 h-3.5 rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-900 dark:text-white">Amlodipine 5mg</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">Rx Prescribed • OD</p>
          </div>
        </div>

        {/* Compact Floating Medical Vitals (Top-Right Background) */}
        <div className="hidden xl:flex absolute right-8 top-20 items-center gap-2 py-1.5 px-2.5 rounded-xl bg-white/90 dark:bg-obsidian-900/90 border border-cyan-200/70 dark:border-cyan-800/70 shadow-sm backdrop-blur-md animate-float-reverse pointer-events-none z-10">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-500 text-white flex items-center justify-center shadow-2xs">
            <HeartPulse className="w-3.5 h-3.5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-900 dark:text-white">BP 120/80</span>
              <span className="px-1 py-0.2 rounded text-[8px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">Normal</span>
            </div>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">SpO2: 99% • Vitals</p>
          </div>
        </div>

        {/* Subtle Floating Capsule Motif Left */}
        <div className="hidden lg:block absolute left-20 bottom-12 w-4 h-8 rounded-full border border-emerald-400/30 bg-gradient-to-b from-emerald-400/15 via-emerald-300/5 to-transparent rotate-45 animate-float-reverse pointer-events-none opacity-40" />

        {/* Subtle Floating Capsule Motif Right */}
        <div className="hidden lg:block absolute right-20 bottom-16 w-3.5 h-7 rounded-full border border-cyan-400/30 bg-gradient-to-b from-cyan-400/15 via-cyan-300/5 to-transparent -rotate-12 animate-float-slow pointer-events-none opacity-40" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Medical Clinical Protocol Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-300 text-xs font-bold shadow-xs">
            <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
            <span className="font-mono">Clinical AI Intake & Autonomous Triage</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">Ayush & Healthcare Protocol</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
            <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 dark:from-sky-400 dark:via-blue-300 dark:to-cyan-200 bg-clip-text text-transparent inline-block">
              AI Multilingual Intake &
            </span> <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent inline-block">
              Autonomous Clinical Triage
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Converts patient voice & text in <span className="text-emerald-700 dark:text-emerald-400 font-bold">Hindi, English & Devanagari</span> into structured clinical history, halts on cardiorespiratory red-flags, extracts OCR lab values, and delivers verified summaries to doctors.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/intake"
              className="px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm shadow-lg shadow-emerald-600/25 hover:shadow-neon-emerald hover:scale-[1.02] transition-all flex items-center gap-2 group"
            >
              <Activity className="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
              <span>{t('landing.startIntake')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/doctor"
              className="px-6 py-4 rounded-2xl bg-white dark:bg-obsidian-900 hover:bg-slate-50 dark:hover:bg-obsidian-800 text-slate-800 dark:text-slate-100 font-bold text-sm border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center gap-2"
            >
              <Stethoscope className="w-4 h-4 text-clinical-600 dark:text-cyan-400" />
              <span>{t('landing.doctorPortal')}</span>
            </Link>
          </div>

          {/* Medical Pill Badges - Small & Compact */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 shadow-2xs">
              <Pill className="w-2.5 h-2.5 text-emerald-600" />
              <span>Pharmacotherapy & Safety</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-[10px] font-semibold text-cyan-800 dark:text-cyan-300 shadow-2xs">
              <Stethoscope className="w-2.5 h-2.5 text-cyan-600" />
              <span>SOCRATES Clinical Inquiry</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[10px] font-semibold text-teal-800 dark:text-teal-300 shadow-2xs">
              <Leaf className="w-2.5 h-2.5 text-teal-600" />
              <span>AYUSH Prakriti Profiling</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[10px] font-semibold text-rose-800 dark:text-rose-300 shadow-2xs">
              <ShieldAlert className="w-2.5 h-2.5 text-rose-500" />
              <span>Deterministic Red-Flag Triage</span>
            </span>
          </div>

          {/* Animated Medical ECG Pulse Line */}
          <div className="relative py-1 max-w-md mx-auto overflow-hidden opacity-75">
            <svg viewBox="0 0 500 40" className="w-full h-7 stroke-emerald-500/80 fill-none" preserveAspectRatio="none">
              <path
                d="M0,20 L100,20 L110,20 L120,5 L130,35 L140,10 L150,25 L160,20 L250,20 L260,20 L270,5 L280,35 L290,10 L300,25 L310,20 L400,20 L410,20 L420,5 L430,35 L440,10 L450,25 L460,20 L500,20"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Non-Diagnostic Disclaimer */}
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xl mx-auto italic pt-1">
            ⚠️ {t('app.disclaimer')}
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 dark:from-sky-400 dark:via-blue-300 dark:to-cyan-200 bg-clip-text text-transparent inline-block">
              {t('landing.howItWorksTitle')}
            </span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            From natural voice interaction to verified EHR clinical timeline in 6 seamless steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '1',
              title: t('landing.step1'),
              desc: t('landing.step1Desc'),
              icon: <Mic className="w-6 h-6 text-emerald-500" />,
            },
            {
              step: '2',
              title: t('landing.step2'),
              desc: t('landing.step2Desc'),
              icon: <Sparkles className="w-6 h-6 text-teal-400" />,
            },
            {
              step: '3',
              title: t('landing.step3'),
              desc: t('landing.step3Desc'),
              icon: <Activity className="w-6 h-6 text-cyan-400" />,
            },
            {
              step: '4',
              title: t('landing.step4'),
              desc: t('landing.step4Desc'),
              icon: <ShieldAlert className="w-6 h-6 text-rose-500" />,
            },
            {
              step: '5',
              title: t('landing.step5'),
              desc: t('landing.step5Desc'),
              icon: <FileSpreadsheet className="w-6 h-6 text-violet-400" />,
            },
            {
              step: '6',
              title: t('landing.step6'),
              desc: t('landing.step6Desc'),
              icon: <Stethoscope className="w-6 h-6 text-sky-400" />,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="p-6 rounded-3xl bg-white dark:bg-obsidian-900/80 border border-slate-200/90 dark:border-slate-800/80 shadow-sm hover:shadow-xl dark:hover:border-slate-700 transition-all space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-obsidian-800 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="text-3xl font-black text-slate-200 dark:text-slate-800 font-mono">
                  0{item.step}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{item.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Differentiators */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-100/80 dark:bg-obsidian-900/60 rounded-3xl p-8 space-y-6 border border-slate-200 dark:border-slate-800/80">
          <div className="text-center space-y-1">
            <h3 className="text-xl font-black">
              <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 dark:from-sky-400 dark:via-blue-300 dark:to-cyan-200 bg-clip-text text-transparent inline-block">
                Key Healthcare & AI Innovations
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Engineered specifically to avoid generic chatbot behavior and deliver true clinical utility.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-5 bg-white dark:bg-obsidian-850 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                <Languages className="w-4 h-4 text-emerald-500" />
                <span>Multilingual Hindi & English</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Full UI translation, real-time message translator toggle, and native Hindi Devanagari speech recognition.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-obsidian-850 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Deterministic Red-Flag Triage</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Critical life-threatening symptom combinations halt questioning immediately with 108/112 emergency CTA.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-obsidian-850 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                <Leaf className="w-4 h-4 text-teal-500" />
                <span>AYUSH Case Intake Mode</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Configurable Prakriti, Agni, Koshtha, and Bala observational parameters adhering to non-diagnostic boundaries.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-obsidian-850 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                <Calendar className="w-4 h-4 text-cyan-500" />
                <span>Medical Timeline & OCR</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Tesseract OCR extracts lab metrics (BP, Hb) and automatically constructs chronological longitudinal records.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
