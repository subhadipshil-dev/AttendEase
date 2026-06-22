'use client';

import React from 'react';
import type { Subject, ClassSession } from '../utils/attendanceMath';
import { calculateSubjectStats, calculateOverallStats, calculateGoal } from '../utils/attendanceMath';
import { toDateString, formatDate, getDayOfWeek } from '../utils/dateUtils';
import type { Holiday } from '../utils/dateUtils';

interface HomeScreenProps {
  subjects: Subject[];
  schedule: Array<{ subjectId: string; day: string; startTime: string; endTime: string }>;
  sessions: ClassSession[];
  holidays: Holiday[];
  onLogAttendance: (date: string, subjectId: string, status: ClassSession['status']) => void;
  onNavigate: (tab: string) => void;
}

export default function HomeScreen({
  subjects,
  schedule,
  sessions,
  holidays,
  onLogAttendance,
  onNavigate,
}: HomeScreenProps) {
  const todayStr = toDateString(new Date());
  const todayDay = getDayOfWeek(todayStr);
  const todayHoliday = holidays.find((h) => h.date === todayStr);

  const subjectStats = calculateSubjectStats(subjects, sessions);
  const overall = calculateOverallStats(subjectStats);

  const todaySlots = schedule.filter((s) => s.day === todayDay);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Determine which classes are done/current/upcoming
  const enrichedSlots = todaySlots.map((slot) => {
    const subject = subjects.find((s) => s.id === slot.subjectId);
    const session = sessions.find((s) => s.date === todayStr && s.subjectId === slot.subjectId);
    const [sh, sm] = slot.startTime.split(':').map(Number);
    const [eh, em] = slot.endTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    let timeStatus: 'done' | 'current' | 'upcoming' = 'upcoming';
    if (currentMinutes >= endMin) timeStatus = 'done';
    else if (currentMinutes >= startMin) timeStatus = 'current';

    return { ...slot, subject, session, startMin, endMin, timeStatus };
  });

  // Next class
  const nextClass = enrichedSlots.find((s) => s.timeStatus === 'upcoming' || s.timeStatus === 'current');
  const nextClassMinutes = nextClass ? nextClass.startMin - currentMinutes : 0;

  const remaining = enrichedSlots.filter((s) => s.timeStatus === 'upcoming').length;

  // Time formatting
  const formatTime12 = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="screen">
      {/* Greeting */}
      <div className="greeting">
        <div className="greeting-sub">{getGreeting()}</div>
        <div className="greeting-name">Subhadip</div>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value" style={{ color: overall.percentage >= 75 ? 'var(--success)' : 'var(--danger)' }}>
            {overall.percentage.toFixed(0)}%
          </div>
          <div className="stat-label">Attendance</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{todaySlots.length}</div>
          <div className="stat-label">Classes Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{remaining}</div>
          <div className="stat-label">Remaining</div>
        </div>
      </div>

      {/* Next class card */}
      {todayHoliday ? (
        <div className="next-class">
          <div className="next-class-subject">🎉 Holiday — {todayHoliday.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            No classes today. Enjoy your day off!
          </div>
        </div>
      ) : nextClass && nextClass.subject ? (
        <div className="next-class">
          <div className="next-class-header">
            <div className="next-class-subject">{nextClass.subject.name}</div>
            <div className="next-class-time-badge">
              {nextClass.timeStatus === 'current'
                ? 'Happening now'
                : nextClassMinutes <= 0
                ? 'Starting soon'
                : `In ${nextClassMinutes} min`}
            </div>
          </div>
          <div className="next-class-meta">
            <span>👤 {nextClass.subject.teacher || 'TBA'}</span>
            <span>📍 {nextClass.subject.room || 'TBA'}</span>
          </div>
          <button className="btn-primary" onClick={() => onNavigate('schedule')}>
            View full schedule
          </button>
        </div>
      ) : todaySlots.length === 0 ? (
        <div className="next-class">
          <div className="next-class-subject">No classes today</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            {todayDay === 'Saturday' || todayDay === 'Sunday' ? 'It\u0027s the weekend!' : 'Nothing scheduled for today.'}
          </div>
        </div>
      ) : (
        <div className="next-class">
          <div className="next-class-subject">All done for today ✓</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            You've finished all {todaySlots.length} classes.
          </div>
        </div>
      )}

      {/* Today timeline */}
      {todaySlots.length > 0 && !todayHoliday && (
        <>
          <div className="section-label">Today's timeline</div>
          <div className="timeline">
            {enrichedSlots.map((slot, i) => {
              const currentStatus = slot.session?.status || null;
              return (
                <div key={i} className="timeline-item">
                  <div className="timeline-time">{formatTime12(slot.startTime)}</div>
                  <div className="timeline-track">
                    <div
                      className={`timeline-dot ${
                        slot.timeStatus === 'done' ? 'done' : slot.timeStatus === 'current' ? 'active' : ''
                      }`}
                    />
                    {i < enrichedSlots.length - 1 && <div className="timeline-line" />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-subject">{slot.subject?.name || slot.subjectId}</div>
                    <div className="timeline-detail">
                      {slot.subject?.teacher || 'TBA'} · {slot.subject?.room || 'TBA'} · {formatTime12(slot.startTime)} – {formatTime12(slot.endTime)}
                    </div>
                    <div className="timeline-actions">
                      <button
                        className={`action-btn present ${currentStatus === 'present' ? 'selected' : ''}`}
                        onClick={() => slot.subject && onLogAttendance(todayStr, slot.subject.id, 'present')}
                      >
                        Present
                      </button>
                      <button
                        className={`action-btn absent ${currentStatus === 'absent' ? 'selected' : ''}`}
                        onClick={() => slot.subject && onLogAttendance(todayStr, slot.subject.id, 'absent')}
                      >
                        Absent
                      </button>
                      <button
                        className={`action-btn cancelled ${currentStatus === 'cancelled' ? 'selected' : ''}`}
                        onClick={() => slot.subject && onLogAttendance(todayStr, slot.subject.id, 'cancelled')}
                      >
                        Cancelled
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
