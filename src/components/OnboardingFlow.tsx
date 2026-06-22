'use client';

import React, { useState, useRef } from 'react';
import type { Subject } from '../utils/attendanceMath';

interface OnboardingFlowProps {
  onComplete: (data: {
    subjects: Subject[];
    schedule: Array<{ subjectId: string; day: string; startTime: string; endTime: string }>;
  }) => void;
}

type Step = 1 | 2 | 3 | 4;

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>(1);
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedSubjects, setParsedSubjects] = useState<Subject[]>([]);
  const [parsedSchedule, setParsedSchedule] = useState<
    Array<{ subjectId: string; day: string; startTime: string; endTime: string }>
  >([]);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) await processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) await processFile(e.target.files[0]);
  };

  const processFile = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isText = file.type === 'text/plain';
    if (!isImage && !isText) {
      setError('Supports PNG, JPG, or TXT files.');
      return;
    }

    setLoading(true);
    setError(null);
    setStep(2);

    const reader = new FileReader();
    if (isImage) {
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        await callParser(file.type, base64);
      };
    } else {
      reader.readAsText(file);
      reader.onload = async () => {
        await callParser('text/plain', reader.result as string);
      };
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      setError('Paste your schedule text first.');
      return;
    }
    setLoading(true);
    setError(null);
    setStep(2);
    await callParser('text/plain', textInput);
  };

  const callParser = async (fileType: string, content: string) => {
    try {
      const res = await fetch('/api/analyze-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType, content }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not parse the schedule.');
      }
      setParsedSubjects(data.subjects);
      setParsedSchedule(data.schedule);
      setStep(3);
    } catch (err: any) {
      setError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    setStep(4);
    setTimeout(() => {
      onComplete({ subjects: parsedSubjects, schedule: parsedSchedule });
    }, 600);
  };

  const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="onboarding">
      {/* Step indicator */}
      <div className="onboarding-steps">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`onboarding-step ${s <= step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
          />
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <>
          <h2>Import your timetable</h2>
          <p>Upload a photo of your schedule or paste it as text. We'll extract your classes automatically.</p>

          <div className="text-tabs">
            <button
              className={`text-tab ${inputMode === 'upload' ? 'active' : ''}`}
              onClick={() => setInputMode('upload')}
            >
              Upload file
            </button>
            <button
              className={`text-tab ${inputMode === 'text' ? 'active' : ''}`}
              onClick={() => setInputMode('text')}
            >
              Paste text
            </button>
          </div>

          {inputMode === 'upload' ? (
            <div
              className={`upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="upload-icon">📄</div>
              <h3>Drop your schedule here</h3>
              <p>PNG, JPG, or TXT • Tap to browse</p>
            </div>
          ) : (
            <>
              <div className="form-group">
                <textarea
                  className="input-control"
                  rows={6}
                  placeholder={"Monday\n09:00 - 10:30  Math I — Dr. Smith, Room 304\n11:00 - 12:30  Physics — Prof. Lee, Room 102\n\nWednesday\n09:00 - 10:30  Math I — Dr. Smith, Room 304"}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  style={{ resize: 'vertical', minHeight: 120, fontSize: 13 }}
                />
              </div>
              <button className="btn-primary" onClick={handleTextSubmit}>
                Analyze schedule
              </button>
            </>
          )}

          {error && (
            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--danger)' }}>
              {error}
            </div>
          )}
        </>
      )}

      {/* Step 2: Processing */}
      {step === 2 && (
        <div className="loader-screen">
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <p>Analyzing your schedule…</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>This may take a few seconds</p>
        </div>
      )}

      {/* Step 3: Preview & Edit */}
      {step === 3 && (
        <>
          <h2>Review your schedule</h2>
          <p>We detected {parsedSubjects.length} subjects and {parsedSchedule.length} class slots. Make sure everything looks right.</p>

          <div className="section-label">Subjects</div>
          <div className="preview-list">
            {parsedSubjects.map((sub) => (
              <div key={sub.id} className="preview-item">
                <div>
                  <div className="preview-item-name">{sub.name}</div>
                  <div className="preview-item-meta">
                    {sub.teacher || 'No faculty'} {sub.room ? `· ${sub.room}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-label" style={{ marginTop: 16 }}>Weekly slots</div>
          <div className="preview-list">
            {DAYS_ORDER.map((day) => {
              const slots = parsedSchedule.filter((s) => s.day === day);
              if (slots.length === 0) return null;
              return (
                <div key={day}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', padding: '8px 12px 4px' }}>
                    {day}
                  </div>
                  {slots.map((slot, i) => {
                    const subName = parsedSubjects.find((s) => s.id === slot.subjectId)?.name || slot.subjectId;
                    return (
                      <div key={i} className="preview-item">
                        <span className="preview-item-name">{subName}</span>
                        <span className="preview-item-meta">{slot.startTime} – {slot.endTime}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="onboarding-actions">
            <button className="btn-secondary" onClick={() => setStep(1)}>Re-upload</button>
            <button className="btn-primary" onClick={handleConfirm}>Confirm schedule</button>
          </div>
        </>
      )}

      {/* Step 4: Done */}
      {step === 4 && (
        <div className="loader-screen">
          <div style={{ fontSize: 40 }}>✓</div>
          <p style={{ fontWeight: 600 }}>You're all set!</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Setting up your dashboard…</p>
        </div>
      )}
    </div>
  );
}
