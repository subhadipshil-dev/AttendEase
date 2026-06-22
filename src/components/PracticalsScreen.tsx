'use client';

import React, { useState } from 'react';
import type { Subject } from '../utils/attendanceMath';
import { toDateString, formatDate } from '../utils/dateUtils';

export interface PracticalSubmission {
  id: string;
  title: string;
  subjectId: string;
  dueDate: string;
  description?: string;
  completed: boolean;
}

interface PracticalsScreenProps {
  subjects: Subject[];
  submissions: PracticalSubmission[];
  onAdd: (sub: Omit<PracticalSubmission, 'id' | 'completed'>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PracticalsScreen({
  subjects,
  submissions,
  onAdd,
  onToggle,
  onDelete,
}: PracticalsScreenProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState(toDateString(new Date()));
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) return;
    onAdd({ title, subjectId, dueDate, description: description.trim() || undefined });
    setTitle('');
    setDescription('');
    setShowAdd(false);
  };

  const getDaysLeft = (d: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(d);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / 86400000);
  };

  const sorted = [...submissions].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const pending = submissions.filter((s) => !s.completed).length;

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Practicals</h1>
        <button className="btn-secondary btn-sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {pending > 0 && (
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
          {pending} pending submission{pending !== 1 ? 's' : ''}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <form className="inline-add" onSubmit={handleSubmit}>
          <h3>New submission</h3>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              placeholder="Chemistry Record"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <input
              placeholder="Any details…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="inline-add-actions">
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save</button>
          </div>
        </form>
      )}

      {/* Task list */}
      <div className="task-list">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No submissions</h3>
            <p>Add practical assignments to track deadlines.</p>
          </div>
        ) : (
          sorted.map((sub) => {
            const days = getDaysLeft(sub.dueDate);
            const subjectName = subjects.find((s) => s.id === sub.subjectId)?.name || '';

            let badgeClass = '';
            let badgeText = '';

            if (sub.completed) {
              badgeClass = 'done';
              badgeText = 'Done';
            } else if (days < 0) {
              badgeClass = 'overdue';
              badgeText = `${Math.abs(days)}d overdue`;
            } else if (days === 0) {
              badgeClass = 'overdue';
              badgeText = 'Due today';
            } else if (days === 1) {
              badgeClass = 'tomorrow';
              badgeText = 'Tomorrow';
            }

            let dueClass = '';
            if (!sub.completed) {
              if (days <= 0) dueClass = 'urgent';
              else if (days <= 2) dueClass = 'soon';
            }

            return (
              <div key={sub.id} className={`task-row ${sub.completed ? 'completed' : ''}`}>
                <div
                  className={`task-check ${sub.completed ? 'checked' : ''}`}
                  onClick={() => onToggle(sub.id)}
                >
                  {sub.completed ? '✓' : ''}
                </div>
                <div className="task-body">
                  <div className="task-title">{sub.title}</div>
                  <div className={`task-due ${dueClass}`}>
                    {subjectName} · {sub.completed ? 'Completed' : days < 0 ? `Overdue by ${Math.abs(days)} days` : days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`}
                  </div>
                </div>
                {badgeText && <span className={`task-badge ${badgeClass}`}>{badgeText}</span>}
                <button className="task-delete" onClick={() => onDelete(sub.id)}>×</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
