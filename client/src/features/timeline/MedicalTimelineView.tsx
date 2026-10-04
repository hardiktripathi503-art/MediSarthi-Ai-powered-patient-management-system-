import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  FileCheck2,
  FileText,
  AlertOctagon,
  ShieldCheck,
  Stethoscope,
  FlaskConical,
  Filter,
} from 'lucide-react';
import { TimelineEvent } from '@shared/types';
import { useLanguage } from '../../i18n/LanguageContext';

interface MedicalTimelineViewProps {
  events: TimelineEvent[];
}

export const MedicalTimelineView: React.FC<MedicalTimelineViewProps> = ({ events }) => {
  const { t, language } = useLanguage();
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredEvents = events.filter((ev) => {
    if (filterType === 'ALL') return true;
    return ev.eventType === filterType;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'EMERGENCY_TRIAGE':
        return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case 'LAB_TEST':
        return <FlaskConical className="w-5 h-5 text-blue-600" />;
      case 'PRESCRIPTION':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'CONSULTATION':
      default:
        return <Stethoscope className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getRiskBadge = (risk?: string) => {
    if (!risk) return null;
    const styles =
      risk === 'HIGH'
        ? 'bg-red-100 text-red-700 border-red-200'
        : risk === 'MEDIUM'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-emerald-100 text-emerald-800 border-emerald-200';

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles}`}>
        {risk}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6 transition-colors">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('timeline.title')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('timeline.subtitle')}</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 mr-1 shrink-0" />
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'CONSULTATION', label: 'Intakes' },
            { id: 'LAB_TEST', label: 'Lab Tests' },
            { id: 'PRESCRIPTION', label: 'Prescriptions' },
            { id: 'EMERGENCY_TRIAGE', label: 'Emergency Alerts' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterType(item.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === item.id
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-obsidian-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-obsidian-750'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Node Chain */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
          No medical timeline events found for this filter.
        </div>
      ) : (
        <div className="relative pl-6 space-y-8 before:absolute before:left-[17px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {filteredEvents.map((event) => (
            <div key={event.id} className="relative group">
              {/* Timeline marker icon */}
              <div className="absolute -left-6 top-1 w-8 h-8 rounded-full bg-white dark:bg-obsidian-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs group-hover:border-emerald-500 transition-colors">
                {getEventIcon(event.eventType)}
              </div>

              {/* Event Card */}
              <div className="ml-5 p-4 rounded-2xl bg-slate-50/80 dark:bg-obsidian-850 hover:bg-slate-50 dark:hover:bg-obsidian-800 border border-slate-200/80 dark:border-slate-800 transition-all shadow-2xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{event.title}</span>
                    {getRiskBadge(event.riskLevel)}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{event.date}</span>
                    </div>

                    {/* Verification Status */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        event.verifiedStatus === 'VERIFIED'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      <FileCheck2 className="w-3 h-3" />
                      <span>{event.verifiedStatus || 'AI Generated'}</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {event.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
