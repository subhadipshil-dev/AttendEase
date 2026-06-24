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
    <div className="screen rise" style={{ animationDelay: '0ms' }}>
      {/* Header */}
      <div className="screen-header">
        <h1 className="font-display" style={{ fontSize: '20px', fontWeight: 560 }}>Settings</h1>
      </div>

      {/* Holiday Presets Card */}
      <div className="settings-section mt-16 rise" style={{ animationDelay: '50ms' }}>
        <div className="settings-label">Holiday Presets</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Select region...</option>
            {Object.keys(STATE_PRESETS).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            className="btn-primary btn-sm"
            onClick={handleLoadPreset}
            disabled={!preset}
            style={{ opacity: preset ? 1 : 0.5, flexShrink: 0, width: 'auto' }}
          >
            Load
          </button>
        </div>
      </div>

      {/* Holidays List Card */}
      <div className="settings-section rise" style={{ animationDelay: '100ms' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div className="settings-label" style={{ margin: 0 }}>Holidays ({sorted.length})</div>
          <button
            style={{ fontSize: 12, color: 'var(--indigo-text)', fontWeight: 500 }}
            onClick={() => setShowAddHoliday(!showAddHoliday)}
          >
            {showAddHoliday ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {showAddHoliday && (
          <form
            className="inline-add"
            onSubmit={handleAddCustom}
            style={{ marginBottom: 12 }}
          >
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                placeholder="Holiday name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '4px' }}>
              Add Holiday
            </button>
          </form>
        )}

        {sorted.length === 0 ? (
          <div className="card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-faint)' }}>
            No holidays configured in registry. Load a preset above or add dates manually.
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {sorted.map((h) => (
              <div key={h.date} className="holiday-row">
                <span className="holiday-date">{formatDate(h.date)}</span>
                <span className="holiday-name">
                  {h.name}
                  {h.isCustom && (
                    <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-faint)', marginLeft: 8 }}>
                      Custom
                    </span>
                  )}
                </span>
                <button className="holiday-remove" onClick={() => onRemoveHoliday(h.date)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="settings-section mt-24 rise" style={{ animationDelay: '150ms' }}>
        <div className="settings-label" style={{ color: 'var(--rust)' }}>Danger Zone</div>
        <div className="card" style={{ padding: '18px', borderColor: 'var(--rust)' }}>
          <button className="btn-secondary btn-danger" style={{ width: '100%' }} onClick={onResetAll}>
            Reset registry data
          </button>
          <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '8px', textAlign: 'center', lineHeight: '1.4' }}>
            Warning: This action clears all schedule details, logs, practical tasks, and holidays from local memory.
          </div>
        </div>
      </div>
    </div>
  );
}
