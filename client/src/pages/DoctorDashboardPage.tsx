import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Consultation, PatientProfile } from '@shared/types';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../auth/AuthContext';
import { EditPatientModal } from '../components/EditPatientModal';
import { PatientReviewModal } from '../components/PatientReviewModal';
import {
  Users,
  Calendar,
  AlertOctagon,
  FileCheck,
  Stethoscope,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Languages,
  Clock,
  ShieldAlert,
  ChevronRight,
  Activity,
  CheckCircle2,
  Ban,
  Edit3,
  UserCheck,
  UserX,
  Building2,
  Phone,
  AlertTriangle,
  Pill,
  Lock,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const DoctorDashboardPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, logout, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'CONSULTATIONS' | 'PATIENTS'>('CONSULTATIONS');

  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [reviewModalMode, setReviewModalMode] = useState<'ACCEPT' | 'REJECT' | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [consultRes, analyticRes, patientRes] = await Promise.all([
        api.listConsultations(),
        api.getDashboardAnalytics(),
        api.listPatients(),
      ]);

      if (consultRes.success && consultRes.data) {
        setConsultations(consultRes.data);
      }
      if (analyticRes.success && analyticRes.data) {
        setAnalytics(analyticRes.data);
      }
      if (patientRes.success && patientRes.data) {
        setPatients(patientRes.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Only load clinical records when authenticated as DOCTOR
  useEffect(() => {
    if (isAuthenticated && user?.role === 'DOCTOR') {
      loadData();
    } else {
      setConsultations([]);
      setPatients([]);
      setAnalytics(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Data Safety: Instantly purge all clinical records from memory when signing out
  useEffect(() => {
    const handleLogout = () => {
      setConsultations([]);
      setPatients([]);
      setAnalytics(null);
      navigate('/login');
    };
    window.addEventListener('medisaarthi:logout', handleLogout);
    return () => window.removeEventListener('medisaarthi:logout', handleLogout);
  }, [navigate]);

  const handleEditPatientSave = async (updatedData: Partial<PatientProfile>) => {
    if (!selectedPatient?.id) return;
    try {
      const res = await api.updatePatient(selectedPatient.id, updatedData);
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      console.error('Error updating patient:', err);
    }
  };

  const handlePatientReviewConfirm = async (payload: any) => {
    if (!selectedPatient?.id) return;
    try {
      const res = await api.reviewPatient(selectedPatient.id, payload);
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      console.error('Error reviewing patient:', err);
    }
  };

  const filteredConsultations = consultations.filter((c) => {
    if (filterRisk !== 'ALL' && c.triageResult.riskLevel !== filterRisk) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        (c.patientName || '').toLowerCase().includes(q) ||
        (c.chiefComplaint || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredPatients = patients.filter((p) => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.contact || '').toLowerCase().includes(q) ||
        (p.chronicConditions || []).some((c) => c.toLowerCase().includes(q)) ||
        (p.allergies || []).some((a) => a.toLowerCase().includes(q)) ||
        (p.status || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const highPriorityAlerts = consultations.filter(
    (c) => c.triageResult.riskLevel === 'HIGH'
  );

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-slate-500 mt-4">Verifying certified doctor credentials...</p>
      </div>
    );
  }

  // Security Lock Screen: Prevent unauthorized access to patient health data
  if (!isAuthenticated || user?.role !== 'DOCTOR') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 animate-fade-in text-center space-y-6">
        <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl space-y-6 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-cyan-600/30">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-mono">
              Clinical Security Protection
            </span>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 pt-1">
              Doctor Authorization Required
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Patient health records, triage queues, and prescriptions are protected. Please sign in with your verified doctor account to access this clinical desk.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/login?role=doctor')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-600/25 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In as Doctor (डॉक्टर लॉगिन)</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                const res = await login('dr.saxena@medisaarthi.in', 'Doctor@123');
                if (res.success) {
                  await loadData();
                }
              }}
              className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-750 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Stethoscope className="w-4 h-4 text-cyan-500" />
              <span>Demo 1-Click Doctor Sign In (Dr. V. K. Saxena)</span>
            </button>

            <Link
              to="/intake"
              className="block text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors pt-1"
            >
              Return to Patient Intake &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-colors">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 dark:bg-obsidian-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">{t('doctor.title')}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                {user.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              AI-assisted intake triage review & EHR verification portal • Verified Physician Session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Link
            to="/intake"
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all"
          >
            + Start New Intake
          </Link>

          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            title="Sign Out of Doctor Dashboard and clear clinical data"
            className="px-4 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>{language === 'hi' ? 'लॉग आउट' : 'Sign Out'}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white dark:bg-obsidian-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase">{t('doctor.totalPatients')}</span>
            <Users className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {analytics?.summaryCards?.totalPatients || consultations.length || 0}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Active registered profiles</p>
        </div>

        {/* Intakes Today */}
        <div className="bg-white dark:bg-obsidian-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase">{t('doctor.todayConsultations')}</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {analytics?.summaryCards?.totalConsultations || consultations.length || 0}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Completed & in-progress</p>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white dark:bg-obsidian-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase">{t('doctor.pendingReviews')}</span>
            <FileCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {analytics?.summaryCards?.pendingReviews ?? consultations.filter(c => c.doctorReview.status === 'AI_GENERATED').length}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Awaiting doctor confirmation</p>
        </div>

        {/* High Priority Alerts */}
        <div className="bg-rose-50/50 dark:bg-rose-950/30 p-5 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-1 transition-all">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
            <span className="text-xs font-bold uppercase">{t('doctor.highAlerts')}</span>
            <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {highPriorityAlerts.length}
          </p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">Emergency red-flags flagged</p>
        </div>
      </div>

      {/* Critical Red-Flag Alerts Banner (if any) */}
      {highPriorityAlerts.length > 0 && (
        <div className="bg-rose-50/90 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-sm">
              <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span>Critical Red-Flag Triage Cases Requiring Urgent Action ({highPriorityAlerts.length})</span>
            </div>
            <span className="text-xs text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Live Triage Monitor
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highPriorityAlerts.map((alertCase) => (
              <div
                key={alertCase.id}
                onClick={() => navigate(`/doctor/patient/${alertCase.id}`)}
                className="bg-white dark:bg-obsidian-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/80 hover:border-rose-500 cursor-pointer shadow-sm transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {alertCase.patientName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 uppercase font-mono">
                    HIGH RISK
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {alertCase.chiefComplaint || 'Acute symptoms'}
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 italic">
                  {alertCase.triageResult.reasons[0]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Triage Risk Stratification (Pie Chart) */}
        <div className="bg-white dark:bg-obsidian-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Triage Risk Distribution</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Total Stratified: {consultations.length}</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.triageDistribution || [
                    { name: 'LOW', value: 3, color: '#10b981' },
                    { name: 'MEDIUM', value: 1, color: '#f59e0b' },
                    { name: 'HIGH', value: 1, color: '#ef4444' },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Language & Intake Mode Distribution (Bar Chart) */}
        <div className="bg-white dark:bg-obsidian-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Multilingual & AYUSH Intake Breakdown</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Clinical Metrics</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Hindi (हिन्दी)', count: consultations.filter(c => c.language === 'hi').length || 3 },
                  { name: 'English', count: consultations.filter(c => c.language === 'en').length || 2 },
                  { name: 'AYUSH Mode', count: consultations.filter(c => c.mode === 'AYUSH').length || 1 },
                  { name: 'Modern Mode', count: consultations.filter(c => c.mode === 'MODERN').length || 4 },
                ]}
              >
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Master Clinical Table with View Tabs */}
      <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6 transition-colors">
        {/* Table View Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-obsidian-850 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('CONSULTATIONS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'CONSULTATIONS'
                  ? 'bg-white dark:bg-obsidian-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Consultations & Triage Queue ({consultations.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PATIENTS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'PATIENTS'
                  ? 'bg-white dark:bg-obsidian-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-cyan-500" />
              <span>Patient Directory & Admissions ({patients.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  activeTab === 'CONSULTATIONS'
                    ? 'Search patient or symptom...'
                    : 'Search name, contact, allergies...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-obsidian-850 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-56"
              />
            </div>

            {/* Risk Filters (only for consultations view) */}
            {activeTab === 'CONSULTATIONS' && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-obsidian-850 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => (
                  <button
                    key={risk}
                    type="button"
                    onClick={() => setFilterRisk(risk)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      filterRisk === risk
                        ? 'bg-white dark:bg-obsidian-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {risk}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {activeTab === 'PATIENTS' ? (
          /* Patients Master Table */
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-xs text-left divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-obsidian-850 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Patient Profile</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Chronic Conditions</th>
                  <th className="px-4 py-3.5">Drug Allergies</th>
                  <th className="px-4 py-3.5">Intake Status</th>
                  <th className="px-4 py-3.5 text-right">Doctor Clinical Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-obsidian-900">
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-obsidian-850/70 transition-colors"
                  >
                    {/* Patient Demographics */}
                    <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
                          {patient.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{patient.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {patient.age} Yrs • {patient.gender}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {patient.contact || <span className="text-slate-400 italic">No contact phone</span>}
                    </td>

                    {/* Chronic Conditions */}
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 max-w-xs">
                      {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {patient.chronicConditions.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None reported</span>
                      )}
                    </td>

                    {/* Drug Allergies */}
                    <td className="px-4 py-3.5">
                      {patient.allergies && patient.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {patient.allergies.map((a, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">NKDA</span>
                      )}
                    </td>

                    {/* Intake Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono tracking-wider ${
                          patient.status === 'ACCEPTED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : patient.status === 'REJECTED'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {patient.status || 'PENDING'}
                      </span>
                      {patient.doctorReview?.department && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-emerald-500" />
                          <span>{patient.doctorReview.department}</span>
                        </div>
                      )}
                    </td>

                    {/* Doctor Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Accept Button */}
                        <button
                          type="button"
                          title="Accept / Admit Patient"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatient(patient);
                            setReviewModalMode('ACCEPT');
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                            patient.status === 'ACCEPTED'
                              ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{patient.status === 'ACCEPTED' ? 'Admitted' : 'Accept'}</span>
                        </button>

                        {/* Reject Button */}
                        <button
                          type="button"
                          title="Reject / Escalate Patient"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatient(patient);
                            setReviewModalMode('REJECT');
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                            patient.status === 'REJECTED'
                              ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-xs'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-300 dark:border-rose-800'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{patient.status === 'REJECTED' ? 'Rejected' : 'Reject'}</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          title="Edit Patient Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatient(patient);
                            setIsEditModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-cyan-500" />
                          <span>Edit</span>
                        </button>

                        {/* View Details Link */}
                        <button
                          type="button"
                          title="View Full Clinical Chart"
                          onClick={() => navigate(`/doctor/patient/${patient.id}`)}
                          className="p-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 text-xs font-bold transition-all border border-cyan-200 dark:border-cyan-800"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Consultations Master Table */
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-xs text-left divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-obsidian-850 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">{t('doctor.patientCol')}</th>
                  <th className="px-4 py-3.5">{t('doctor.complaintCol')}</th>
                  <th className="px-4 py-3.5">{t('doctor.riskCol')}</th>
                  <th className="px-4 py-3.5">{t('doctor.statusCol')}</th>
                  <th className="px-4 py-3.5">{t('doctor.dateCol')}</th>
                  <th className="px-4 py-3.5 text-right">{t('doctor.actionCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-obsidian-900">
                {filteredConsultations.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/doctor/patient/${item.id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-obsidian-850/70 cursor-pointer transition-colors"
                  >
                    {/* Patient Info */}
                    <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span>{item.patientName}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal font-mono">
                          ({item.patientAge}y, {item.patientGender[0]})
                        </span>
                        {item.mode === 'AYUSH' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            AYUSH
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Complaint */}
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate font-medium">
                      {item.chiefComplaint || 'Intake in progress...'}
                    </td>

                    {/* Risk Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono ${
                          item.triageResult.riskLevel === 'HIGH'
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : item.triageResult.riskLevel === 'MEDIUM'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        {item.triageResult.riskLevel}
                      </span>
                    </td>

                    {/* Doctor Review Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.doctorReview.status === 'DOCTOR_REVIEWED' ||
                          item.doctorReview.status === 'DOCTOR_EDITED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : item.doctorReview.status === 'REJECTED'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {item.doctorReview.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>

                    {/* Action Link */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1">
                        <span>Review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Patient Modal */}
      <EditPatientModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
        onSave={handleEditPatientSave}
      />

      {/* Patient Review (Accept / Reject) Modal */}
      <PatientReviewModal
        isOpen={reviewModalMode !== null}
        onClose={() => {
          setReviewModalMode(null);
          setSelectedPatient(null);
        }}
        mode={reviewModalMode || 'ACCEPT'}
        patient={selectedPatient}
        onConfirm={handlePatientReviewConfirm}
      />
    </div>
  );
};
