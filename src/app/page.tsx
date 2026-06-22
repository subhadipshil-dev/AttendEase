'use client';

import React, { useState, useEffect } from 'react';
import type { Subject, ClassSession } from '../utils/attendanceMath';
import type { Holiday } from '../utils/dateUtils';
import OnboardingFlow from '../components/OnboardingFlow';
import HomeScreen from '../components/HomeScreen';
import AttendanceScreen from '../components/AttendanceScreen';
import ScheduleScreen from '../components/ScheduleScreen';
import PracticalsScreen, { PracticalSubmission } from '../components/PracticalsScreen';
import ProfileScreen from '../components/ProfileScreen';

type Tab = 'home' | 'schedule' | 'attendance' | 'practicals' | 'profile';

const NAV_ITEMS: { id: Tab; icon: string; label: string }[] = [
  { id: 'home', icon: '⌂', label: 'Home' },
  { id: 'schedule', icon: '▦', label: 'Schedule' },
  { id: 'attendance', icon: '◉', label: 'Attendance' },
  { id: 'practicals', icon: '☰', label: 'Practicals' },
  { id: 'profile', icon: '⚙', label: 'Settings' },
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
    if (window.confirm('Reset all data? This cannot be undone.')) {
      setSubjects([]);
      setSchedule([]);
      setSessions([]);
      setSubmissions([]);
      setHolidays([]);
      localStorage.clear();
    }
  };

  if (!mounted) {
    return (
      <div className="app">
        <div className="loader-screen" style={{ minHeight: '100vh' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const isSetup = subjects.length === 0 || schedule.length === 0;

  return (
    <div className="app">
      {isSetup ? (
        <OnboardingFlow onComplete={onUploadComplete} />
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
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
