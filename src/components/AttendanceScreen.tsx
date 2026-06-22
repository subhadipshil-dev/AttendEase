'use client';

import React, { useState } from 'react';
import type { Subject, ClassSession, SubjectAttendanceStats } from '../utils/attendanceMath';
import { calculateSubjectStats, calculateGoal } from '../utils/attendanceMath';

const SUBJECT_COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316'];

interface AttendanceScreenProps {
  subjects: Subject[];
  sessions: ClassSession[];
  targetPercent: number;
  onTargetChange: (t: number) => void;
}

export default function AttendanceScreen({
  subjects,
  sessions,
  targetPercent,
  onTargetChange,
}: AttendanceScreenProps) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const stats = calculateSubjectStats(subjects, sessions);

  const selectedStat = stats.find((s) => s.subjectId === selectedSubject);
  const selectedSub = subjects.find((s) => s.id === selectedSubject);

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Attendance</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Target</span>
          <select
            value={targetPercent}
            onChange={(e) => onTargetChange(Number(e.target.value))}
            style={{ width: 'auto', padding: '4px 8px', fontSize: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            {[60, 65, 70, 75, 80, 85, 90, 95].map((v) => (
              <option key={v} value={v}>{v}%</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subject list */}
      <div className="subject-list mt-16">
        {stats.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No subjects yet</h3>
            <p>Import your timetable to start tracking attendance.</p>
          </div>
        ) : (
          stats.map((stat, i) => {
            const color = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
            const isBelow = stat.percentage < targetPercent && stat.totalHeld > 0;
            const isActive = selectedSubject === stat.subjectId;

            return (
              <div
                key={stat.subjectId}
                className={`subject-item ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedSubject(isActive ? null : stat.subjectId)}
                style={isActive ? { borderColor: 'var(--primary)' } : {}}
              >
                <div className="subject-color" style={{ background: color }} />
                <div className="subject-info">
                  <div className="subject-name">{stat.subjectName}</div>
                  <div className="subject-detail">
                    {subjects.find((s) => s.id === stat.subjectId)?.teacher || 'No faculty'}
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(100, stat.percentage)}%`,
                        background: isBelow ? 'var(--danger)' : color,
                      }}
                    />
                  </div>
                </div>
                <div className="subject-right">
                  <div
                    className="subject-percent"
                    style={{ color: isBelow ? 'var(--danger)' : 'var(--text)' }}
                  >
                    {stat.percentage.toFixed(0)}%
                  </div>
                  <div className="subject-ratio">
                    {stat.attended}/{stat.totalHeld}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Analytics panel for selected subject */}
      {selectedStat && selectedSub && (
        <AnalyticsPanel stat={selectedStat} subject={selectedSub} target={targetPercent} />
      )}
    </div>
  );
}

function AnalyticsPanel({
  stat,
  subject,
  target,
}: {
  stat: SubjectAttendanceStats;
  subject: Subject;
  target: number;
}) {
  const goal = calculateGoal(stat.attended, stat.totalHeld, target);

  return (
    <div className="analytics-panel">
      <div className="analytics-header">
        <h2>{subject.name}</h2>
        <button
          className="btn-secondary btn-sm"
          style={{ fontSize: 11 }}
        >
          {subject.teacher || 'No faculty'}
        </button>
      </div>

      <div className="analytics-grid">
        <div className="analytics-stat">
          <div className="analytics-stat-label">Current</div>
          <div
            className="analytics-stat-value"
            style={{ color: stat.percentage < target ? 'var(--danger)' : 'var(--success)' }}
          >
            {stat.percentage.toFixed(1)}%
          </div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-label">Target</div>
          <div className="analytics-stat-value" style={{ color: 'var(--primary)' }}>
            {target}%
          </div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-label">Present</div>
          <div className="analytics-stat-value text-success">{stat.attended}</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-label">Absent</div>
          <div className="analytics-stat-value text-danger">{stat.absent}</div>
        </div>
      </div>

      {/* Goal feedback — the core feature */}
      {stat.totalHeld === 0 ? (
        <div className="goal-box">
          No classes logged yet. Mark attendance to see your goal projection.
        </div>
      ) : goal.impossible ? (
        <div className="goal-box negative">
          Cannot reach <strong>{target}%</strong> — you've already missed {stat.absent} class{stat.absent !== 1 ? 'es' : ''}.
        </div>
      ) : goal.action === 'attend' ? (
        <div className="goal-box negative">
          You need to <strong>attend the next {goal.count} class{goal.count !== 1 ? 'es' : ''} consecutively</strong> to reach <strong>{target}%</strong>.
        </div>
      ) : goal.action === 'skip' ? (
        <div className="goal-box positive">
          You can safely <strong>miss {goal.count} class{goal.count !== 1 ? 'es' : ''}</strong> without dropping below <strong>{target}%</strong>.
        </div>
      ) : (
        <div className="goal-box">
          You're exactly at your target. <strong>Attend your next class</strong> to maintain {target}%.
        </div>
      )}
    </div>
  );
}
