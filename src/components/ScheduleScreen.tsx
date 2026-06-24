'use client';

import React, { useState } from 'react';
import type { Subject, ClassSession } from '../utils/attendanceMath';
import { getCalendarGrid, toDateString, getDayOfWeek } from '../utils/dateUtils';
import type { Holiday } from '../utils/dateUtils';

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

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const calendarCells = getCalendarGrid(year, month);
  const selectedDayName = getDayOfWeek(selectedDate);
  const daySlots = schedule.filter((s) => s.day === selectedDayName);
  const dayHoliday = holidays.find((h) => h.date === selectedDate);

  const getWeekDays = (selectedDateStr: string) => {
    const selected = new Date(selectedDateStr + 'T00:00:00');
    const startOfWeek = new Date(selected);
    startOfWeek.setDate(selected.getDate() - selected.getDay()); // Sunday

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push({
        date: d,
        dateString: toDateString(d),
      });
    }
    return days;
  };

  const weekCells = getWeekDays(selectedDate);

  const hasClassOnDate = (dateStr: string) => {
    const dayName = getDayOfWeek(dateStr);
    return schedule.some((s) => s.day === dayName);
  };

  return (
    <div className="screen rise" style={{ animationDelay: '0ms' }}>
      {/* Header */}
      <div className="screen-header">
        <h1 className="font-display" style={{ fontSize: '20px', fontWeight: 560 }}>Academic Schedule</h1>
      </div>

      {/* View Segmented Toggle */}
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

      {/* Navigation and Calendar grids */}
      {view !== 'day' && (
        <div className="rise" style={{ animationDelay: '50ms' }}>
          <div className="calendar-nav">
            <h2>
              {MONTHS[month]} {year}
            </h2>
            {view === 'month' && (
              <div className="calendar-nav-btns">
                <button className="calendar-nav-btn" onClick={prevMonth}>
                  ‹
                </button>
                <button className="calendar-nav-btn" onClick={nextMonth}>
                  ›
                </button>
              </div>
            )}
          </div>

          <div className="calendar-weekdays">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="calendar-weekday">
                {d}
              </div>
            ))}
          </div>

          {view === 'month' ? (
            <div className="calendar-days">
              {calendarCells.map((cell, i) => {
                const ds = cell.dateString;
                const isToday = toDateString(today) === ds;
                const isSelected = selectedDate === ds && !isToday;
                const hasClass = cell.isCurrentMonth && hasClassOnDate(ds);

                return (
                  <div
                    key={i}
                    className={`calendar-cell ${!cell.isCurrentMonth ? 'other' : ''} ${
                      isToday ? 'today' : ''
                    } ${isSelected ? 'selected' : ''}`}
                    onClick={() => cell.isCurrentMonth && setSelectedDate(ds)}
                  >
                    {cell.date.getDate()}
                    {hasClass && <div className="has-class" />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="calendar-days">
              {weekCells.map((cell, i) => {
                const ds = cell.dateString;
                const isToday = toDateString(today) === ds;
                const isSelected = selectedDate === ds && !isToday;
                const hasClass = hasClassOnDate(ds);

                return (
                  <div
                    key={i}
                    className={`calendar-cell ${isToday ? 'today' : ''} ${
                      isSelected ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedDate(ds)}
                  >
                    {cell.date.getDate()}
                    {hasClass && <div className="has-class" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Date Day Schedule */}
      <div className="day-schedule rise" style={{ animationDelay: '100ms' }}>
        <div className="section-label" style={{ marginBottom: '12px' }}>
          {selectedDate === toDateString(today)
            ? 'Today'
            : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
        </div>

        {dayHoliday ? (
          <div className="day-schedule-item">
            <div className="day-schedule-info">
              <div className="day-schedule-name">🎉 {dayHoliday.name}</div>
              <div className="day-schedule-time">Holiday — register is suspended</div>
            </div>
          </div>
        ) : daySlots.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <p>No periods scheduled for {selectedDayName}s</p>
          </div>
        ) : (
          daySlots.map((slot, i) => {
            const sub = subjects.find((s) => s.id === slot.subjectId);
            const session = sessions.find(
              (s) => s.date === selectedDate && s.subjectId === slot.subjectId
            );
            const currentStatus = session?.status || null;

            return (
              <div
                key={i}
                className="day-schedule-item flex-col"
                style={{ alignItems: 'stretch' }}
              >
                <div className="flex justify-between items-center">
                  <div className="day-schedule-info">
                    <div className="day-schedule-name">{sub?.name || slot.subjectId}</div>
                    <div className="day-schedule-time">
                      {slot.startTime} – {slot.endTime} {sub?.room ? `· Room ${sub.room}` : ''}
                    </div>
                  </div>
                  <span
                    className="font-mono"
                    style={{ fontSize: '11px', color: 'var(--text-faint)', alignSelf: 'flex-start' }}
                  >
                    {sub?.teacher || ''}
                  </span>
                </div>

                {/* Direct logger buttons in Schedule page */}
                <div className="t-actions" style={{ marginTop: '10px' }}>
                  <button
                    className={`action-btn present ${currentStatus === 'present' ? 'selected' : ''}`}
                    onClick={() => sub && onLogAttendance(selectedDate, sub.id, 'present')}
                  >
                    Present
                  </button>
                  <button
                    className={`action-btn absent ${currentStatus === 'absent' ? 'selected' : ''}`}
                    onClick={() => sub && onLogAttendance(selectedDate, sub.id, 'absent')}
                  >
                    Absent
                  </button>
                  <button
                    className={`action-btn cancelled ${currentStatus === 'cancelled' ? 'selected' : ''}`}
                    onClick={() => sub && onLogAttendance(selectedDate, sub.id, 'cancelled')}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
