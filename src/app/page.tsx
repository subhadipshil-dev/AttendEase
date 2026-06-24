'use client';

import React, { useState, useEffect } from 'react';
import type { Subject, ClassSession } from '../utils/attendanceMath';
import type { Holiday } from '../utils/dateUtils';
import LandingPage from '../components/LandingPage';
import OnboardingFlow from '../components/OnboardingFlow';
import HomeScreen from '../components/HomeScreen';
import AttendanceScreen from '../components/AttendanceScreen';
import ScheduleScreen from '../components/ScheduleScreen';
import PracticalsScreen, { PracticalSubmission } from '../components/PracticalsScreen';
import ProfileScreen from '../components/ProfileScreen';

type Tab = 'home' | 'attendance' | 'schedule' | 'practicals' | 'profile';

interface NavItem {
  id: Tab;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.8 2.8L16 9.5" />
      </svg>
    ),
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4.5" width="18" height="16" rx="2" />
        <path d="M16 2.5v4M8 2.5v4M3 10h18" />
      </svg>
    ),
  },
  {
    id: 'practicals',
    label: 'Practicals',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2.5v6.2L4.3 17a2 2 0 0 0 1.8 3h11.8a2 2 0 0 0 1.8-3L15 8.7V2.5" />
        <path d="M9 2.5h6" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="10" r="3" />
        <path d="M6.8 18.5c1-2.8 2.8-4 5.2-4s4.2 1.2 5.2 4" />
      </svg>
    ),
  },
];

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedule, setSchedule] = useState<Array<{ subjectId: string; day: string; startTime: string; endTime: string }>>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [submissions, setSubmissions] = useState<PracticalSubmission[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [targetPercent, setTargetPercent] = useState(75);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [mounted, setMounted] = useState(false);
  const [startedSetup, setStartedSetup] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const s1 = localStorage.getItem('ae_subjects');
      const s2 = localStorage.getItem('ae_schedule');
      const s3 = localStorage.getItem('ae_sessions');
      const s4 = localStorage.getItem('ae_submissions');
      const s5 = localStorage.getItem('ae_holidays');
      const s6 = localStorage.getItem('ae_target');
      if (s1) setSubjects(JSON.parse(s1));
      if (s2) setSchedule(JSON.parse(s2));
      if (s3) setSessions(JSON.parse(s3));
      if (s4) setSubmissions(JSON.parse(s4));
      if (s5) setHolidays(JSON.parse(s5));
      if (s6) setTargetPercent(Number(s6));
    } catch {}
    setMounted(true);
  }, []);

  // Persist
  useEffect(() => { if (mounted) localStorage.setItem('ae_subjects', JSON.stringify(subjects)); }, [subjects, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem('ae_schedule', JSON.stringify(schedule)); }, [schedule, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem('ae_sessions', JSON.stringify(sessions)); }, [sessions, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem('ae_submissions', JSON.stringify(submissions)); }, [submissions, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem('ae_holidays', JSON.stringify(holidays)); }, [holidays, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem('ae_target', String(targetPercent)); }, [targetPercent, mounted]);

  // Handlers
  const logAttendance = (date: string, subjectId: string, status: ClassSession['status']) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => !(s.date === date && s.subjectId === subjectId));
      return [...filtered, { id: `${date}-${subjectId}`, subjectId, date, status }];
    });
  };

  const onUploadComplete = (data: { subjects: Subject[]; schedule: Array<{ subjectId: string; day: string; startTime: string; endTime: string }> }) => {
    setSubjects(data.subjects);
    setSchedule(data.schedule);
  };

  const addSubmission = (sub: Omit<PracticalSubmission, 'id' | 'completed'>) => {
    setSubmissions((prev) => [...prev, { ...sub, id: `sub-${Date.now()}`, completed: false }]);
  };

  const toggleSubmission = (id: string) => {
    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const deleteSubmission = (id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  };

  const loadPreset = (name: string, list: Holiday[]) => {
    setHolidays((prev) => {
      const others = prev.filter((h) => !list.some((l) => l.date === h.date));
      return [...others, ...list];
    });
  };

  const addHoliday = (h: Holiday) => {
    setHolidays((prev) => [...prev.filter((x) => x.date !== h.date), h]);
  };

  const removeHoliday = (date: string) => {
    setHolidays((prev) => prev.filter((h) => h.date !== date));
  };

  const resetAll = () => {
    if (window.confirm('Reset all registry data? This cannot be undone.')) {
      setSubjects([]);
      setSchedule([]);
      setSessions([]);
      setSubmissions([]);
      setHolidays([]);
      setStartedSetup(false);
      localStorage.clear();
    }
  };

  if (!mounted) {
    return (
      <div className="app">
        <div className="loader-screen">
          <div className="font-display" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>
            Loading Ledger...
          </div>
        </div>
      </div>
    );
  }

  const isSetup = subjects.length > 0 && schedule.length > 0;

  return (
    <div className="app">
      {!isSetup ? (
        !startedSetup ? (
          <LandingPage onStart={() => setStartedSetup(true)} />
        ) : (
          <OnboardingFlow onComplete={onUploadComplete} />
        )
      ) : (
        <>
          {activeTab === 'home' && (
            <HomeScreen
              subjects={subjects}
              schedule={schedule}
              sessions={sessions}
              holidays={holidays}
              onLogAttendance={logAttendance}
              onNavigate={(tab) => setActiveTab(tab as Tab)}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceScreen
              subjects={subjects}
              sessions={sessions}
              targetPercent={targetPercent}
              onTargetChange={setTargetPercent}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleScreen
              subjects={subjects}
              schedule={schedule}
              sessions={sessions}
              holidays={holidays}
              onLogAttendance={logAttendance}
            />
          )}

          {activeTab === 'practicals' && (
            <PracticalsScreen
              subjects={subjects}
              submissions={submissions}
              onAdd={addSubmission}
              onToggle={toggleSubmission}
              onDelete={deleteSubmission}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              holidays={holidays}
              onLoadPreset={loadPreset}
              onAddHoliday={addHoliday}
              onRemoveHoliday={removeHoliday}
              onResetAll={resetAll}
            />
          )}

          {/* Bottom Navigation */}
          <nav className="bottom-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <div className="active-indicator" />
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
