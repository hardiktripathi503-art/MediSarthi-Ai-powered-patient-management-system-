import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Flame,
  Activity,
  AlertOctagon,
  Stethoscope,
  ArrowRight,
  CheckCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Leaf,
} from 'lucide-react';

export const DemoPage: React.FC = () => {
  const navigate = useNavigate();
  const { setLanguage } = useLanguage();

  const handleLaunchScenarioA = () => {
    setLanguage('hi');
    navigate('/intake?scenario=normal');
  };

  const handleLaunchScenarioB = () => {
    setLanguage('hi');
    navigate('/intake?scenario=emergency');
  };

  const handleLaunchAyushDemo = () => {
    setLanguage('hi');
    navigate('/intake?scenario=ayush');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in transition-colors">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 text-xs font-bold">
          <Flame className="w-4 h-4 text-amber-500 animate-bounce" />
          <span>SIH 2026 Problem Statement SIH26047 Evaluation Hub</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          MediSaarthi Live Demonstration Suite
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Explore the two judge evaluation scenarios designed to test multilingual voice processing, dynamic interview adaptation, deterministic red-flag triage, and physician verification.
        </p>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scenario A: Normal Case */}
        <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md p-6 sm:p-8 space-y-6 flex flex-col justify-between hover:border-emerald-500 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono">
                Scenario A — Normal Routine Intake
              </span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">Target: LOW RISK</span>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Rahul Sharma (42, Male)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Known Hypertension on Amlodipine 5 mg</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-obsidian-850 border border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-white block">Evaluator Flow:</span>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>Patient speaks/types: <em>"Mujhe pet mein dard hai."</em></li>
                <li>System dynamically inquires: <em>"Dard kab se hai?"</em></li>
                <li>Patient responds: <em>"3 din se, lagatar rehta hai."</em></li>
                <li>System extracts: Abdominal pain, 3 days duration, moderate severity, nausea.</li>
                <li>Triage evaluates: <strong className="text-emerald-600 dark:text-emerald-400">LOW RISK</strong> (Routine consultation).</li>
                <li>Summarizes case for doctor review in Hindi/English.</li>
              </ol>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLaunchScenarioA}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-neon-emerald transition-all flex items-center justify-center gap-2"
          >
            <span>Launch Scenario A (Normal)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scenario B: High Risk Emergency Case */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 dark:from-obsidian-900 dark:to-obsidian-950 rounded-3xl border border-rose-500/40 text-white shadow-xl p-6 sm:p-8 space-y-6 flex flex-col justify-between hover:border-rose-500 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                Scenario B — High-Risk Red Flag
              </span>
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                CRITICAL TRIAGE
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Sunita Devi (58, Female)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Acute chest discomfort and breathlessness</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2 text-xs text-slate-200">
              <span className="font-bold text-white block">Evaluator Flow:</span>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>Patient reports: <em>"Mujhe chest mein dard ho raha hai aur saans lene mein dikkat ho rahi hai."</em></li>
                <li>Red-flag safety rule triggers immediately: Concurrent chest pain + dyspnea.</li>
                <li>Deterministic Triage: <strong className="text-rose-400">HIGH RISK</strong>.</li>
                <li>System <strong>halts routine questioning</strong> immediately.</li>
                <li>Displays emergency hotline banner (108 / 112) & alerts doctor dashboard.</li>
              </ol>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLaunchScenarioB}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm shadow-md shadow-rose-600/30 hover:shadow-neon-rose transition-all flex items-center justify-center gap-2 relative z-10"
          >
            <span>Launch Scenario B (Emergency Halt)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scenario C: AYUSH Case Taking Mode */}
      <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md p-6 sm:p-8 space-y-4 hover:border-emerald-500 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Scenario C — AYUSH Case-Taking Mode
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Priya Patel (29 F)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluates Prakriti, Agni (digestive fire), and Koshtha parameters under clinical supervision.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLaunchAyushDemo}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <span>Launch AYUSH Intake</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
