'use client';

import React, { useState } from 'react';
import type { Subject, ClassSession } from '../utils/attendanceMath';
import { getCalendarGrid, toDateString, getDayOfWeek } from '../utils/dateUtils';
import type { Holiday } from '../utils/dateUtils';

const SUBJECT_COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316'];

interface ScheduleScreenProps {
  subjects: Subject[];
  schedule: Array<{ subjectId: string; day: string; startTime: string; endTime: string }>;
  sessions: ClassSession[];
  holidays: Holiday[];
  onLogAttendance: (date: string, subjectId: string, status: ClassSession['status']) => void;
}

type ViewMode = 'month' | 'week' | 'day';

export default function ScheduleScreen({
  subjects,
  schedule,
  sessions,
  holidays,
  onLogAttendance,
}: ScheduleScreenProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toDateString(today));
  const [view, setView] = useState<ViewMode>('month');

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const calendarCells = getCalendarGrid(year, month);
  const selectedDayName = getDayOfWeek(selectedDate);
  const daySlots = schedule.filter((s) => s.day === selectedDayName);
  const dayHoliday = holidays.find((h) => h.date === selectedDate);

  const formatTime12 = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const getSubjectColor = (subjectId: string) => {
    const idx = subjects.findIndex((s) => s.id === subjectId);
    return SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
  };

  const hasClassOnDate = (dateStr: string) => {
    const dayName = getDayOfWeek(dateStr);
    return schedule.some((s) => s.day === dayName);
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Schedule</h1>
      </div>

      {/* View mode toggles */}
      <div className="calendar-toggles">
        {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
          <button
            key={v}
            className={`calendar-toggle ${view === v ? 'active' : ''}`}
            onClick={() => setView(v)}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Calendar nav */}
      <div className="calendar-nav">
        <h2>{MONTHS[month]} {year}</h2>
        <div className="calendar-nav-btns">
          <button className="calendar-nav-btn" onClick={prevMonth}>‹</button>
          <button className="calendar-nav-btn" onClick={nextMonth}>›</button>
        </div>
      </div>

      {/* Calendar grid */}
      {view === 'month' && (
        <>
          <div className="calendar-weekdays">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="calendar-weekday">{d}</div>
            ))}
          </div>
          <div className="calendar-days">
            {calendarCells.map((cell, i) => {
              const ds = cell.dateString;
              const isToday = toDateString(today) === ds;
              const isSelected = selectedDate === ds && !isToday;
              const hasClass = cell.isCurrentMonth && hasClassOnDate(ds);

              return (
                <div
                  key={i}
                  className={`calendar-cell ${!cell.isCurrentMonth ? 'other' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => cell.isCurrentMonth && setSelectedDate(ds)}
                >
                  {cell.date.getDate()}
                  {hasClass && !isToday && <div className="has-class" />}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Day schedule */}
      <div className="day-schedule mt-16">
        <div className="section-label">
          {selectedDate === toDateString(today) ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>

        {dayHoliday ? (
          <div className="day-schedule-item">
            <div className="day-schedule-info">
              <div className="day-schedule-name">🎉 {dayHoliday.name}</div>
              <div className="day-schedule-time">Holiday — no classes</div>
            </div>
          </div>
        ) : daySlots.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <p>No classes on {selectedDayName}s</p>
          </div>
        ) : (
          daySlots.map((slot, i) => {
            const sub = subjects.find((s) => s.id === slot.subjectId);
            const session = sessions.find((s) => s.date === selectedDate && s.subjectId === slot.subjectId);
            return (
              <div key={i} className="day-schedule-item">
                <div className="day-schedule-color" style={{ background: getSubjectColor(slot.subjectId) }} />
                <div className="day-schedule-info">
                  <div className="day-schedule-name">{sub?.name || slot.subjectId}</div>
                  <div className="day-schedule-time">
                    {formatTime12(slot.startTime)} – {formatTime12(slot.endTime)}
                    {sub?.teacher ? ` · ${sub.teacher}` : ''}
                    {sub?.room ? ` · ${sub.room}` : ''}
                  </div>
                </div>
                {session ? (
                  <span
                    className="task-badge"
                    style={{
                      background:
                        session.status === 'present' ? 'rgba(34,197,94,0.12)' :
                        session.status === 'absent' ? 'rgba(239,68,68,0.12)' :
                        'rgba(245,158,11,0.12)',
                      color:
                        session.status === 'present' ? 'var(--success)' :
                        session.status === 'absent' ? 'var(--danger)' :
                        'var(--warning)',
                    }}
                  >
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                ) : (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="action-btn present btn-sm"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={(e) => { e.stopPropagation(); sub && onLogAttendance(selectedDate, sub.id, 'present'); }}
                    >
                      ✓
                    </button>
                    <button
                      className="action-btn absent btn-sm"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={(e) => { e.stopPropagation(); sub && onLogAttendance(selectedDate, sub.id, 'absent'); }}
                    >
                      ✗
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
