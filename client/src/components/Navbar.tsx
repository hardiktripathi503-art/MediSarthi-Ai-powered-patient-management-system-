import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import {
  Activity,
  HeartPulse,
  Languages,
  Stethoscope,
  Sparkles,
  Menu,
  X,
  Sun,
  Moon,
  Zap,
  LogIn,
  LogOut,
  User as UserIcon,
  Scan,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { MediSaarthiLogo } from './MediSaarthiLogo';

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signoutNotice, setSignoutNotice] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await logout();
    const msg =
      language === 'hi'
        ? 'सफलतापूर्वक लॉग आउट हो गए। आपका चिकित्सा डेटा सुरक्षित है।'
        : 'Signed out securely. Your medical session data is cleared.';
    setSignoutNotice(msg);
    setTimeout(() => setSignoutNotice(null), 4000);
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-obsidian-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-glass-dark transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo with Custom Emblem */}
          <Link to="/" className="flex items-center gap-3 group">
            <MediSaarthiLogo size="md" showText={true} />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-obsidian-900/90 rounded-2xl border border-slate-200/70 dark:border-slate-800/80">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive('/')
                  ? 'bg-white dark:bg-obsidian-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-900/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('nav.home')}
            </Link>

            <Link
              to="/intake"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive('/intake')
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('nav.patientIntake')}</span>
            </Link>

            <Link
              to="/doctor"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                location.pathname.startsWith('/doctor')
                  ? 'bg-clinical-600 text-white shadow-md shadow-clinical-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('nav.doctorDashboard')}</span>
            </Link>

            <Link
              to="/intake?action=scan"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                location.search.includes('action=scan')
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-md shadow-cyan-600/25'
                  : 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border border-cyan-200 dark:border-cyan-800/80 shadow-2xs hover:scale-105'
              }`}
            >
              <Scan className="w-3.5 h-3.5 text-cyan-500" />
              <span>{language === 'hi' ? '📸 नेत्र AI स्कैन' : '📸 Face & Eye Scan'}</span>
            </Link>
          </div>

          {/* Right Controls: Theme Toggle & Language Selector */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button (Cool Dark / Light) */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-amber-400 hover:scale-105 transition-all shadow-xs"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-obsidian-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-white dark:bg-obsidian-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === 'hi'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* User Profile / Login Button */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <Link
                  to={user.role === 'DOCTOR' ? '/doctor' : '/intake'}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-obsidian-900 hover:bg-slate-200 dark:hover:bg-obsidian-850 border border-slate-200 dark:border-slate-800 transition-all text-xs font-bold group shadow-2xs"
                  title={`Signed in as ${user.name} (${user.role})`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-xs ${
                      user.role === 'DOCTOR' ? 'bg-clinical-600' : 'bg-emerald-600'
                    }`}
                  >
                    {user.role === 'DOCTOR' ? 'Dr' : 'Pt'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="max-w-[110px] truncate text-slate-800 dark:text-slate-100 font-extrabold leading-none">
                      {user.name.replace(/^(Dr\.\s*)/i, '')}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider font-semibold">
                      {user.role}
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  title={language === 'hi' ? 'सुरक्षित रूप से लॉग आउट करें' : 'Sign Out Securely'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 shadow-2xs hover:scale-105 active:scale-95 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>{language === 'hi' ? 'लॉग आउट' : 'Sign Out'}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 hover:scale-[1.02] transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'लॉगिन' : 'Sign In'}</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-amber-400"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-obsidian-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-obsidian-950/95 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-6 space-y-3 backdrop-blur-xl">
          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-obsidian-900"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/intake"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-obsidian-900"
            >
              {t('nav.patientIntake')}
            </Link>
            <Link
              to="/doctor"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-obsidian-900"
            >
              {t('nav.doctorDashboard')}
            </Link>
            <Link
              to="/intake?action=scan"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100"
            >
              {language === 'hi' ? '📸 नेत्र AI लक्षण स्कैन' : '📸 Face & Eye Symptom Scan'}
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Language:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  language === 'en'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  language === 'hi'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Mobile Auth Button */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            {isAuthenticated && user ? (
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs ${
                      user.role === 'DOCTOR' ? 'bg-clinical-600' : 'bg-emerald-600'
                    }`}
                  >
                    {user.role === 'DOCTOR' ? 'Dr' : 'Pt'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase font-bold">
                        {user.role} ACCOUNT
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>Protected</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'सुरक्षित लॉग आउट करें (Sign Out)' : 'Sign Out Securely'}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-center gap-2 shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>{language === 'hi' ? 'लॉगिन / नया खाता बनाएं' : 'Sign In / Register'}</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Floating toast notification when user signs out */}
      {signoutNotice && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-950 text-emerald-100 rounded-2xl shadow-2xl border border-emerald-500/40 text-xs font-bold backdrop-blur-xl animate-fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{signoutNotice}</span>
        </div>
      )}
    </nav>
  );
};
