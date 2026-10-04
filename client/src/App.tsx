import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { AuthProvider } from './auth/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { IntakePage } from './pages/IntakePage';
import { DoctorDashboardPage } from './pages/DoctorDashboardPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { DemoPage } from './pages/DemoPage';
import { AuthPage } from './pages/AuthPage';
import { ShieldCheck } from 'lucide-react';
import { MediSaarthiLogo } from './components/MediSaarthiLogo';

const AppContent: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col medical-cross-pattern text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300"
      style={{ backgroundColor: theme === 'dark' ? '#060910' : '#EEF2F6' }}
    >
      {/* Top Navigation */}
      <Navbar />

      {/* Main Viewport */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/doctor" element={<DoctorDashboardPage />} />
          <Route path="/doctor/patient/:id" element={<PatientDetailPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Clinical Disclaimer & SIH Footer */}
      <footer className="bg-white dark:bg-obsidian-900/90 border-t border-slate-200/90 dark:border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8 mt-auto backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <MediSaarthiLogo size="xs" animate={false} />
            <span className="font-extrabold text-slate-800 dark:text-white">MediSaarthi</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">SIH26047</span>
          </div>

          <div className="flex items-center gap-1.5 text-center text-[11px] text-slate-400 dark:text-slate-500 max-w-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Clinical decision support & triage intake only. Does not replace physician diagnosis or definitive treatment.
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
            Smart India Hackathon 2026
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
