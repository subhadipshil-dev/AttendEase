'use client';

import React, { useState } from 'react';
import type { Subject, ClassSession, SubjectAttendanceStats } from '../utils/attendanceMath';
import { calculateSubjectStats, calculateGoal } from '../utils/attendanceMath';

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
    <div className="screen rise" style={{ animationDelay: '0ms' }}>
      {/* Header */}
      <div className="screen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 8px' }}>
        <h1 className="font-display" style={{ fontSize: '20px', fontWeight: 560 }}>Attendance Ledger</h1>
        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
          Target: {targetPercent}%
        </span>
      </div>

      {/* Target Selector Widget */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div className="flex justify-between" style={{ marginBottom: '8px' }}>
          <span className="form-label" style={{ margin: 0 }}>Register Threshold</span>
          <span className="font-mono" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--indigo-text)' }}>
            {targetPercent}% Min
          </span>
        </div>
        <input
          type="range"
          min="60"
          max="95"
          step="5"
          value={targetPercent}
          onChange={(e) => onTargetChange(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div className="flex justify-between" style={{ marginTop: '6px' }}>
          {[60, 70, 75, 80, 90].map((val) => (
            <button
              key={val}
              className="font-mono"
              style={{
                fontSize: '10px',
                color: targetPercent === val ? 'var(--indigo-text)' : 'var(--text-faint)',
                fontWeight: targetPercent === val ? 600 : 400,
              }}
              onClick={() => onTargetChange(val)}
            >
              {val}%
            </button>
          ))}
        </div>
      </div>

      {/* Subject List */}
      <div className="subject-list">
        {stats.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>Empty register</h3>
            <p>Ingest a timetable schedule to load course files.</p>
          </div>
        ) : (
          stats.map((stat) => {
            const isBelow = stat.percentage < targetPercent && stat.totalHeld > 0;
            const isActive = selectedSubject === stat.subjectId;
            const subDetail = subjects.find((s) => s.id === stat.subjectId);

            return (
              <div
                key={stat.subjectId}
                className={`subject-item ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedSubject(isActive ? null : stat.subjectId)}
              >
                <div className="subject-info">
                  <div className="subject-name">{stat.subjectName}</div>
                  <div className="subject-detail">
                    {subDetail?.teacher || 'No faculty'} {subDetail?.room ? `· Room ${subDetail.room}` : ''}
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${isBelow ? 'under' : ''}`}
                      style={{
                        width: `${Math.min(100, stat.percentage)}%`,
                        background: isBelow ? 'var(--rust)' : 'var(--indigo)',
                      }}
                    />
                  </div>
                </div>
                <div className="subject-right">
                  <div
                    className="subject-percent"
                    style={{ color: isBelow ? 'var(--rust)' : 'var(--text)' }}
                  >
                    {Math.round(stat.percentage)}%
                  </div>
                  <div className="subject-ratio">
                    {stat.attended} / {stat.totalHeld}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Analytics/Goal prediction panel */}
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
    <div className="analytics-panel card rise" style={{ marginTop: '20px' }}>
      <div className="analytics-header">
        <h2>{subject.name}</h2>
        <span className="badge">{subject.id}</span>
      </div>

      <div className="analytics-grid">
        <div className="analytics-stat">
          <div className="analytics-stat-label">Current</div>
          <div
            className="analytics-stat-value"
            style={{ color: stat.percentage < target ? 'var(--rust)' : 'var(--indigo-text)' }}
          >
            {stat.percentage.toFixed(1)}%
          </div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-label">Target</div>
          <div className="analytics-stat-value" style={{ color: 'var(--text)' }}>
            {target}%
          </div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-label">Present</div>
          <div className="analytics-stat-value" style={{ color: 'var(--indigo-text)' }}>
            {stat.attended}
          </div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-label">Absent</div>
          <div className="analytics-stat-value" style={{ color: 'var(--rust)' }}>
            {stat.absent}
          </div>
        </div>
      </div>

      {/* Stamp prediction box */}
      {stat.totalHeld === 0 ? (
        <div className="goal-box">
          No classes logged in register. Log periods to calculate projections.
        </div>
      ) : goal.impossible ? (
        <div className="goal-box negative">
          ⚠️ <strong>Impossible.</strong> Cannot reach target of <strong>{target}%</strong> — you have missed {stat.absent} class{stat.absent !== 1 ? 'es' : ''}.
        </div>
      ) : goal.action === 'attend' ? (
        <div className="goal-box negative">
          ⚠️ <strong>Required Attendance.</strong> You must attend the next <strong>{goal.count} class{goal.count !== 1 ? 'es' : ''} consecutively</strong> to restore threshold of <strong>{target}%</strong>.
        </div>
      ) : goal.action === 'skip' ? (
        <div className="goal-box positive">
          🛡️ <strong>Safe Zone.</strong> You can safely miss <strong>{goal.count} class{goal.count !== 1 ? 'es' : ''}</strong> without dropping below target of <strong>{target}%</strong>.
        </div>
      ) : (
        <div className="goal-box">
          🎯 <strong>On target.</strong> Exactly at register threshold. Attend the next class to maintain <strong>{target}%</strong>.
        </div>
      )}
    </div>
  );
}
