'use client';

import React, { useState } from 'react';
import { calculateGoal } from '../utils/attendanceMath';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  // Simulator state
  const [simAttended, setSimAttended] = useState(12);
  const [simHeld, setSimHeld] = useState(15);
  const [simTarget, setSimTarget] = useState(75);

  const pct = simHeld === 0 ? 100 : (simAttended / simHeld) * 100;
  const goal = calculateGoal(simAttended, simHeld, simTarget);

  // SVG stamp progress path calculations
  const r = 64;
  const circumference = 2 * Math.PI * r; // 402.12
  const strokeDashoffset = circumference - (Math.min(100, pct) / 100) * circumference;

  return (
    <div className="screen rise" style={{ paddingBottom: '32px' }}>
      {/* Brand header */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <div className="eyebrow" style={{ color: 'var(--indigo-text)' }}>Registry Ingestion</div>
        <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 600, marginTop: '8px', lineHeight: '1.2' }}>
          AttendEase
        </h1>
        <p className="greeting-sub" style={{ maxWidth: '300px', margin: '8px auto 0', fontSize: '13px' }}>
          A digitized academic register and prediction ledger. Plan your classes and safeguard your attendance.
        </p>
      </div>

      {/* Main visual - stamp card mockup */}
      <div className="card stamp-card" style={{ marginTop: '28px' }}>
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
              stroke="var(--indigo)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.6s var(--ease)' }}
            />
          </svg>
          <div className="ring-label">
            <div className="ring-pct">
              {Math.round(pct)}
              <sup>%</sup>
            </div>
            <div className="ring-sub">Attendance</div>
          </div>
        </div>

        {/* Dynamic simulator feedback */}
        <div className="stamp-caption" style={{ minHeight: '40px' }}>
          {simHeld === 0 ? (
            <span>No classes logged yet.</span>
          ) : goal.impossible ? (
            <span style={{ color: 'var(--rust)' }}>
              Cannot reach target of <b>{simTarget}%</b>.
            </span>
          ) : goal.action === 'skip' ? (
            <span>
              Holding steady. You can safely <b>skip the next {goal.count} class{goal.count !== 1 ? 'es' : ''}</b>.
            </span>
          ) : goal.action === 'attend' ? (
            <span style={{ color: 'var(--rust)' }}>
              Below target! You must attend <b>{goal.count} class{goal.count !== 1 ? 'es' : ''} consecutively</b>.
            </span>
          ) : (
            <span>
              At target. <b>Attend your next class</b> to maintain {simTarget}%.
            </span>
          )}
        </div>
      </div>

      {/* Interactive Simulator Widget */}
      <div className="card" style={{ marginTop: '20px', padding: '18px' }}>
        <h3 className="font-display" style={{ fontSize: '15px', fontWeight: 560, marginBottom: '14px' }}>
          Try the Ledger Simulator
        </h3>

        <div className="form-group">
          <div className="flex justify-between" style={{ marginBottom: '6px' }}>
            <span className="form-label" style={{ margin: 0 }}>Classes Attended ({simAttended})</span>
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Slide to adjust</span>
          </div>
          <input
            type="range"
            min="0"
            max={simHeld}
            value={simAttended}
            onChange={(e) => setSimAttended(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div className="form-group" style={{ marginTop: '14px' }}>
          <div className="flex justify-between" style={{ marginBottom: '6px' }}>
            <span className="form-label" style={{ margin: 0 }}>Total Classes Held ({simHeld})</span>
          </div>
          <input
            type="range"
            min="1"
            max="40"
            value={simHeld}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSimHeld(val);
              if (simAttended > val) setSimAttended(val);
            }}
            style={{ width: '100%' }}
          />
        </div>

        <div className="form-group" style={{ marginTop: '14px', marginBottom: 0 }}>
          <span className="form-label">Target Attendance ({simTarget}%)</span>
          <div className="flex gap-8" style={{ marginTop: '8px' }}>
            {[65, 75, 80, 85].map((t) => (
              <button
                key={t}
                type="button"
                className={`action-btn ${simTarget === t ? 'selected present' : ''}`}
                style={{ padding: '6px', fontSize: '12px' }}
                onClick={() => setSimTarget(t)}
              >
                {t}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Button to start onboarding */}
      <div style={{ marginTop: '28px' }}>
        <button className="btn-primary" onClick={onStart}>
          Initialize Timetable Registry
        </button>
      </div>

      {/* App features list */}
      <div style={{ marginTop: '32px', borderTop: '0.5px solid var(--hairline)', paddingTop: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '16px', color: 'var(--indigo-text)' }}>✏️</span>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '13px' }}>AI Schedule Scanner</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Upload or paste your timetable image/text. Our AI parses classes, timings, and rooms instantly.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '16px', color: 'var(--indigo-text)' }}>📅</span>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '13px' }}>Academic Ledger</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                A structured calendar tracking hold/holiday/cancelled states. Log attendance directly.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '16px', color: 'var(--indigo-text)' }}>📝</span>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '13px' }}>Practical Submissions</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Keep laboratory record deadlines sorted by priority and class dates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
