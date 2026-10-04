import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { UserRole, LanguageCode } from '@shared/types';
import {
  Stethoscope,
  User as UserIcon,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  Award,
  LogOut,
} from 'lucide-react';
import { MediSaarthiLogo } from '../components/MediSaarthiLogo';

export const AuthPage: React.FC = () => {
  const { user, login, signup, logout, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'LOGIN' or 'SIGNUP'
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  // Selected Role: 'PATIENT' or 'DOCTOR'
  const [selectedRole, setSelectedRole] = useState<UserRole>('PATIENT');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('General Medicine (MD)');
  const [preferredLang, setPreferredLang] = useState<LanguageCode>(language);
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check query params (e.g. ?mode=signup&role=doctor)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get('mode');
    const roleParam = params.get('role');

    if (modeParam === 'signup') setAuthMode('SIGNUP');
    if (modeParam === 'login') setAuthMode('LOGIN');
    if (roleParam === 'doctor') setSelectedRole('DOCTOR');
    if (roleParam === 'patient') setSelectedRole('PATIENT');
  }, [location]);

  // Instant 1-Click Demo Login
  const handleInstantDemoLogin = async (role: 'DOCTOR' | 'PATIENT') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const demoEmail = role === 'DOCTOR' ? 'dr.saxena@medisaarthi.in' : 'rahul.sharma@example.com';
    const demoPassword = role === 'DOCTOR' ? 'Doctor@123' : 'Patient@123';
    setEmail(demoEmail);
    setPassword(demoPassword);
    setSelectedRole(role);

    try {
      const res = await login(demoEmail, demoPassword);
      if (res.success && res.user) {
        setIsLoading(false);
        const destination = res.user.role === 'DOCTOR' ? '/doctor' : '/intake';
        navigate(destination, { replace: true });
      } else {
        setIsLoading(false);
        setErrorMessage(res.error || 'Demo login failed');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Demo login failed');
    }
  };

  // Pre-fill demo credentials
  const handleQuickDemoFill = (role: 'DOCTOR' | 'PATIENT') => {
    setErrorMessage(null);
    setAuthMode('LOGIN');
    setSelectedRole(role);

    if (role === 'DOCTOR') {
      setEmail('dr.saxena@medisaarthi.in');
      setPassword('Doctor@123');
      setSuccessMessage('Loaded Dr. V. K. Saxena (MD Physician) credentials');
    } else {
      setEmail('rahul.sharma@example.com');
      setPassword('Patient@123');
      setSuccessMessage('Loaded Rahul Sharma (Patient) credentials');
    }

    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (authMode === 'LOGIN') {
        const res = await login(email.trim(), password);
        if (res.success && res.user) {
          setIsLoading(false);
          const destination = res.user.role === 'DOCTOR' ? '/doctor' : '/intake';
          navigate(destination, { replace: true });
          return;
        } else {
          setIsLoading(false);
          setErrorMessage(res.error || 'Login failed. Please verify email and password.');
        }
      } else {
        // Sign up
        if (!name.trim()) {
          setErrorMessage('Please enter your full name.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }

        const fullName =
          selectedRole === 'DOCTOR' && !name.toLowerCase().startsWith('dr.')
            ? `Dr. ${name.trim()} (${doctorSpecialty})`
            : name.trim();

        const res = await signup({
          name: fullName,
          email: email.trim(),
          password,
          role: selectedRole,
          language: preferredLang,
        });

        if (res.success && res.user) {
          setIsLoading(false);
          const destination = res.user.role === 'DOCTOR' ? '/doctor' : '/intake';
          navigate(destination, { replace: true });
          return;
        } else {
          setIsLoading(false);
          setErrorMessage(res.error || 'Sign-up failed. This email may already be registered.');
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If already authenticated, show status card with easy Sign Out & Switch Account
  if (isAuthenticated && user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-fade-in text-center space-y-6">
        <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl space-y-5 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            {user.role === 'DOCTOR' ? <Stethoscope className="w-8 h-8" /> : <UserIcon className="w-8 h-8" />}
          </div>

          <div>
            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono">
              {user.role} ACCOUNT ACTIVE • SECURE SESSION
            </span>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-3">{user.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">{user.email}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-obsidian-850 border border-slate-200 dark:border-slate-800 text-left flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Your medical data is protected.</strong> All consultations and scan results are safely stored under your profile. Signing out will completely purge active session caches from this browser.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {user.role === 'DOCTOR' ? (
              <button
                type="button"
                onClick={() => navigate('/doctor')}
                className="w-full py-3.5 rounded-2xl bg-clinical-600 hover:bg-clinical-500 text-white font-bold text-sm shadow-md shadow-clinical-600/25 transition-all flex items-center justify-center gap-2"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Go to Doctor Review Dashboard</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/intake')}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
              >
                <HeartPulse className="w-4 h-4" />
                <span>Start Patient Clinical Intake</span>
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                await logout();
                setSuccessMessage('Successfully signed out. Device and medical session data secured.');
                setTimeout(() => setSuccessMessage(null), 3000);
              }}
              className="w-full py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:text-rose-800 font-bold text-xs border border-rose-200 dark:border-rose-900/60 transition-all flex items-center justify-center gap-2 shadow-xs hover:scale-[1.01]"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out & Switch Account (लॉग आउट और खाता बदलें)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-16 space-y-6 animate-fade-in">
      {/* Brand Header */}
      <div className="text-center space-y-3 flex flex-col items-center">
        <MediSaarthiLogo size="lg" showText={false} />
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-300 text-xs font-bold">
          <span>MediSaarthi Clinical Authentication</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          {authMode === 'LOGIN' ? 'Welcome Back' : 'Create Your Account'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {authMode === 'LOGIN'
            ? 'Sign in to access your clinical dashboard or voice interview history'
            : 'Register as a Patient or Certified Healthcare Provider'}
        </p>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-6 transition-colors">
        {/* Role Toggle Selector (Patient vs Doctor) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Select Your Role (भूमिका चुनें)
          </label>
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-obsidian-850 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedRole('PATIENT')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${
                selectedRole === 'PATIENT'
                  ? 'bg-white dark:bg-obsidian-750 text-emerald-700 dark:text-emerald-400 shadow-md ring-1 ring-slate-900/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Patient (मरीज़)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('DOCTOR')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${
                selectedRole === 'DOCTOR'
                  ? 'bg-white dark:bg-obsidian-750 text-clinical-600 dark:text-cyan-400 shadow-md ring-1 ring-slate-900/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor / Physician (चिकित्सक)</span>
            </button>
          </div>
        </div>

        {/* Mode Selector Tab (Sign In vs Sign Up) */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setAuthMode('LOGIN');
              setErrorMessage(null);
            }}
            className={`flex-1 pb-3 text-xs sm:text-sm font-black transition-all border-b-2 ${
              authMode === 'LOGIN'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Sign In (लॉगिन)
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('SIGNUP');
              setErrorMessage(null);
            }}
            className={`flex-1 pb-3 text-xs sm:text-sm font-black transition-all border-b-2 ${
              authMode === 'SIGNUP'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Create Account (नया खाता)
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field (Sign Up only) */}
          {authMode === 'SIGNUP' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {selectedRole === 'DOCTOR' ? 'Doctor Full Name' : 'Full Name (पूरा नाम)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={selectedRole === 'DOCTOR' ? 'e.g. Dr. Rajesh Kumar' : 'e.g. Rahul Sharma'}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-obsidian-850 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Doctor Specialty Field (Sign Up for Doctor only) */}
          {authMode === 'SIGNUP' && selectedRole === 'DOCTOR' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Medical Qualification / Specialization
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Award className="w-4 h-4" />
                </div>
                <select
                  value={doctorSpecialty}
                  onChange={(e) => setDoctorSpecialty(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-obsidian-850 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-clinical-500 transition-all"
                >
                  <option value="General Medicine (MD)">General Medicine (MD)</option>
                  <option value="Internal Medicine (MBBS)">Internal Medicine (MBBS)</option>
                  <option value="BAMS Ayurveda Specialist">BAMS (Ayurveda Specialist)</option>
                  <option value="Cardiology (DM)">Cardiology (DM)</option>
                  <option value="Pediatrics (MD)">Pediatrics (MD)</option>
                  <option value="Emergency Medicine">Emergency Medicine (DEM)</option>
                </select>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Email Address (ईमेल)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole === 'DOCTOR' ? 'doctor@hospital.org' : 'patient@example.com'}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-obsidian-850 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Password (पासवर्ड)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-obsidian-850 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4 ${
              selectedRole === 'DOCTOR'
                ? 'bg-gradient-to-r from-clinical-600 to-teal-600 hover:from-clinical-500 hover:to-teal-500 shadow-clinical-600/25'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              <>
                <span>
                  {authMode === 'LOGIN'
                    ? selectedRole === 'DOCTOR'
                      ? 'Doctor Sign In (लॉगिन)'
                      : 'Patient Sign In (लॉगिन)'
                    : 'Register Account (खाता बनाएं)'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Hackathon Demo Evaluator Accounts */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>1-Click Test Accounts:</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Live Atlas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleInstantDemoLogin('DOCTOR')}
              className="p-3.5 rounded-2xl bg-cyan-50/80 dark:bg-obsidian-850 hover:bg-cyan-100/90 dark:hover:bg-cyan-950/40 border border-cyan-200/80 dark:border-cyan-800/80 text-left transition-all group shadow-2xs hover:scale-[1.01] active:scale-95"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-clinical-700 dark:text-cyan-300 flex items-center gap-1">
                  <span>🩺 Dr. V. K. Saxena (MD)</span>
                </span>
                <span className="text-[10px] font-mono font-black text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform bg-cyan-100 dark:bg-cyan-900/60 px-2 py-0.5 rounded-full">
                  Sign In →
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1 truncate">
                dr.saxena@medisaarthi.in
              </p>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleInstantDemoLogin('PATIENT')}
              className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-obsidian-850 hover:bg-emerald-100/90 dark:hover:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-left transition-all group shadow-2xs hover:scale-[1.01] active:scale-95"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <span>🧑‍🦱 Rahul Sharma (Patient)</span>
                </span>
                <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                  Sign In →
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1 truncate">
                rahul.sharma@example.com
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
