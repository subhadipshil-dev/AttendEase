'use client';

import React, { useState, useEffect } from 'react';
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
  const [timeStr, setTimeStr] = useState('');

  // Setup client date strings to prevent hydration mismatch
  useEffect(() => {
    const d = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    setTimeStr(`${days[d.getDay()]} · ${d.getDate()} ${months[d.getMonth()]}`);
  }, []);

  const todayStr = toDateString(new Date());
  const todayDay = getDayOfWeek(todayStr);
  const todayHoliday = holidays.find((h) => h.date === todayStr);

  const subjectStats = calculateSubjectStats(subjects, sessions);
  const overall = calculateOverallStats(subjectStats);

  const todaySlots = schedule.filter((s) => s.day === todayDay);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Determine done/current/upcoming classes
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

  // Calculate sum of bunks left or classes needed to attend
  let totalBunksLeft = 0;
  let totalNeededAttend = 0;
  subjectStats.forEach((stat) => {
    const goal = calculateGoal(stat.attended, stat.totalHeld, 75);
    if (goal.action === 'skip') {
      totalBunksLeft += goal.count === Infinity ? 0 : goal.count;
    } else if (goal.action === 'attend') {
      totalNeededAttend += goal.count;
    }
  });

  // Calculate this month's stats
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonthSessions = sessions.filter((s) => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const thisMonthAttended = thisMonthSessions.filter((s) => s.status === 'present').length;
  const thisMonthHeld = thisMonthSessions.filter((s) => s.status === 'present' || s.status === 'absent').length;
  const thisMonthPct = thisMonthHeld === 0 ? 100 : (thisMonthAttended / thisMonthHeld) * 100;

  // Format times
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

  // SVG stamp circle path calculations
  const r = 64;
  const circumference = 2 * Math.PI * r; // ~402.12
  const strokeDashoffset = circumference - (Math.min(100, overall.percentage) / 100) * circumference;

  return (
    <div className="screen rise" style={{ animationDelay: '0ms' }}>
      {/* Date & Greeting */}
      <div>
        <div className="eyebrow">{timeStr || 'Today'}</div>
        <div className="greeting-name">{getGreeting()}</div>
        <div className="greeting-sub">
          Semester 1 · {overall.totalHeld} classes logged in register
        </div>
      </div>

      {/* Stamp Progress Card */}
      <div className="card stamp-card rise" style={{ animationDelay: '70ms' }}>
        <div className="ring-wrap">
          <svg viewBox="0 0 158 158">
            <circle
              cx="79"
              cy="79"
              r="71"
              fill="none"
              stroke="var(--hairline-soft)"
              strokeWidth="3"
              strokeDasharray="0.1 8.4"
              strokeLinecap="round"
            />
            <circle
              cx="79"
              cy="79"
              r="64"
              fill="none"
              stroke="var(--hairline)"
              strokeWidth="3"
            />
            <circle
              cx="79"
              cy="79"
              r="64"
              fill="none"
              stroke={overall.percentage >= 75 ? 'var(--indigo)' : 'var(--rust)'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.6s var(--ease)' }}
            />
          </svg>
          <div className="ring-label">
            <div className="ring-pct" style={{ color: overall.percentage >= 75 ? 'var(--text)' : 'var(--rust)' }}>
              {Math.round(overall.percentage)}
              <sup>%</sup>
            </div>
            <div className="ring-sub">Attendance</div>
          </div>
        </div>

        <div className="stamp-caption">
          {overall.percentage >= 75 ? (
            <span>
              Holding steady, <b>{(overall.percentage - 75).toFixed(0)} points</b> above the 75% minimum
            </span>
          ) : (
            <span style={{ color: 'var(--rust)' }}>
              Below target register. Keep attendance above 75% minimum!
            </span>
          )}
        </div>

        <div className="stat-row">
          <div className="stat">
            <div className="stat-value" style={totalNeededAttend > 0 ? { color: 'var(--rust)' } : {}}>
              {totalNeededAttend > 0 ? `+${totalNeededAttend}` : totalBunksLeft}
            </div>
            <div className="stat-label">{totalNeededAttend > 0 ? 'Must attend' : 'Bunks left'}</div>
          </div>
          <div className="stat">
            <div className="stat-value">{Math.round(thisMonthPct)}%</div>
            <div className="stat-label">This month</div>
          </div>
        </div>
      </div>

      {/* Next Class / Period Panel */}
      {todayHoliday ? (
        <div className="card bell-card rise" style={{ animationDelay: '140ms', borderColor: 'var(--indigo)' }}>
          <div className="bell-time">🎉<br/>OFF</div>
          <div className="bell-mid">
            <div className="bell-subject">Holiday</div>
            <div className="bell-room">{todayHoliday.name}</div>
          </div>
          <div className="bell-chip">No Class</div>
        </div>
      ) : nextClass && nextClass.subject ? (
        <div className="card bell-card rise" style={{ animationDelay: '140ms' }}>
          <div className="bell-time">
            {nextClass.startTime}
            <br />
            {nextClass.endTime}
          </div>
          <div className="bell-mid">
            <div className="bell-subject">{nextClass.subject.name}</div>
            <div className="bell-room">
              Room {nextClass.subject.room || 'TBA'} · {nextClass.subject.teacher || 'TBA'}
            </div>
          </div>
          <div className="bell-chip">
            {nextClass.timeStatus === 'current'
              ? 'Now'
              : nextClassMinutes <= 0
              ? 'Starting'
              : `in ${nextClassMinutes}m`}
          </div>
        </div>
      ) : todaySlots.length === 0 ? (
        <div className="card bell-card rise" style={{ animationDelay: '140ms' }}>
          <div className="bell-time">☕<br/>FREE</div>
          <div className="bell-mid">
            <div className="bell-subject">No periods scheduled</div>
            <div className="bell-room">
              {todayDay === 'Saturday' || todayDay === 'Sunday' ? 'Enjoy your weekend!' : 'Nothing logged for today'}
            </div>
          </div>
          <div className="bell-chip">Free day</div>
        </div>
      ) : (
        <div className="card bell-card rise" style={{ animationDelay: '140ms' }}>
          <div className="bell-time">✓<br/>DONE</div>
          <div className="bell-mid">
            <div className="bell-subject">Registry complete</div>
            <div className="bell-room">Finished all {todaySlots.length} logged classes</div>
          </div>
          <div className="bell-chip">Finished</div>
        </div>
      )}

      {/* Timeline Section */}
      {todaySlots.length > 0 && !todayHoliday && (
        <div className="rise" style={{ animationDelay: '200ms' }}>
          <div className="section-head">
            <div className="section-title">Today</div>
            <div className="section-meta">{todaySlots.length} periods</div>
          </div>

          <div className="timeline">
            {enrichedSlots.map((slot, i) => {
              const currentStatus = slot.session?.status || null;
              const isNow = slot.timeStatus === 'current';
              const isDone = slot.timeStatus === 'done';

              return (
                <div key={i} className="t-row">
                  <div className="t-time">{slot.startTime}</div>
                  <div className="t-dot-wrap">
                    <div
                      className={`t-dot ${isNow ? 'now' : ''} ${isDone && !currentStatus ? 'hollow' : ''}`}
                      style={
                        currentStatus === 'present'
                          ? { background: 'var(--indigo)' }
                          : currentStatus === 'absent'
                          ? { background: 'var(--rust)' }
                          : currentStatus === 'cancelled'
                          ? { background: 'var(--text-faint)' }
                          : {}
                      }
                    />
                  </div>
                  <div className="t-body">
                    <div className="t-subject">
                      {slot.subject?.name || slot.subjectId}
                      {isNow && <span className="t-now-tag">Now</span>}
                    </div>
                    <div className="t-room">
                      Room {slot.subject?.room || 'TBA'} · {slot.subject?.teacher || 'TBA'}
                    </div>

                    <div className="t-actions">
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
        </div>
      )}
    </div>
  );
}
