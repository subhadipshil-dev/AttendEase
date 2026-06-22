'use client';

import React, { useState } from 'react';
import { STATE_PRESETS, toDateString, formatDate } from '../utils/dateUtils';
import type { Holiday } from '../utils/dateUtils';

interface ProfileScreenProps {
  holidays: Holiday[];
  onLoadPreset: (name: string, holidays: Holiday[]) => void;
  onAddHoliday: (h: Holiday) => void;
  onRemoveHoliday: (date: string) => void;
  onResetAll: () => void;
}

export default function ProfileScreen({
  holidays,
  onLoadPreset,
  onAddHoliday,
  onRemoveHoliday,
  onResetAll,
}: ProfileScreenProps) {
  const [preset, setPreset] = useState('');
  const [customDate, setCustomDate] = useState(toDateString(new Date()));
  const [customName, setCustomName] = useState('');
  const [showAddHoliday, setShowAddHoliday] = useState(false);

  const handleLoadPreset = () => {
    if (!preset) return;
    const list = STATE_PRESETS[preset];
    if (list) onLoadPreset(preset, list);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onAddHoliday({ date: customDate, name: customName.trim(), isCustom: true });
    setCustomName('');
    setShowAddHoliday(false);
  };

  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Settings</h1>
      </div>

      {/* Holiday presets */}
      <div className="settings-section mt-16">
        <div className="settings-label">Holiday Presets</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Select region…</option>
            {Object.keys(STATE_PRESETS).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            className="btn-primary btn-sm"
            onClick={handleLoadPreset}
            disabled={!preset}
            style={{ opacity: preset ? 1 : 0.5, flexShrink: 0 }}
          >
            Load
          </button>
        </div>
      </div>

      {/* Holidays list */}
      <div className="settings-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="settings-label">Holidays ({sorted.length})</div>
          <button
            style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}
            onClick={() => setShowAddHoliday(!showAddHoliday)}
          >
            {showAddHoliday ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {showAddHoliday && (
          <form
            className="inline-add"
            onSubmit={handleAddCustom}
            style={{ marginBottom: 8 }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                style={{ width: 'auto', flex: '0 0 140px' }}
                required
              />
              <input
                placeholder="Holiday name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary btn-sm" style={{ flexShrink: 0 }}>Add</button>
            </div>
          </form>
        )}

        {sorted.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-3)', padding: '16px 0', textAlign: 'center' }}>
            No holidays configured. Load a preset or add custom dates.
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {sorted.map((h) => (
              <div key={h.date} className="holiday-row">
                <span className="holiday-date">{formatDate(h.date)}</span>
                <span className="holiday-name">
                  {h.name}
                  {h.isCustom && <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 4 }}>Custom</span>}
                </span>
                <button className="holiday-remove" onClick={() => onRemoveHoliday(h.date)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="settings-section mt-24">
        <div className="settings-label">Data</div>
        <button className="btn-secondary btn-danger" style={{ width: '100%' }} onClick={onResetAll}>
          Reset all data
        </button>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, textAlign: 'center' }}>
          This will clear your schedule, attendance, and submissions.
        </div>
      </div>
    </div>
  );
}
