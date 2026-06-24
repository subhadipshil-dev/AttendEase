'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedSubjects, setParsedSubjects] = useState<Subject[]>([]);
  const [parsedSchedule, setParsedSchedule] = useState<
    Array<{ subjectId: string; day: string; startTime: string; endTime: string }>
  >([]);

  // Typewriter Log States
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

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

    setError(null);
    setLogs([]);
    setStep(2);

    const reader = new FileReader();
    if (isImage) {
      addLog('Ingesting document image bytes...');
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        await callParserWithLogs(file.type, base64);
      };
    } else {
      addLog('Reading schedule source text...');
      reader.readAsText(file);
      reader.onload = async () => {
        await callParserWithLogs('text/plain', reader.result as string);
      };
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      setError('Paste your schedule text first.');
      return;
    }
    setError(null);
    setLogs([]);
    setStep(2);
    addLog('Ingesting raw schedule text input...');
    await callParserWithLogs('text/plain', textInput);
  };

  const callParserWithLogs = async (fileType: string, content: string) => {
    let timers: NodeJS.Timeout[] = [];
    
    // Simulate typewriter logs alongside real network request
    const pushLogDelayed = (msg: string, delay: number) => {
      const t = setTimeout(() => addLog(msg), delay);
      timers.push(t);
    };

    pushLogDelayed('Parsing document headers and layout schema...', 400);
    pushLogDelayed('Contacting NVIDIA NIM endpoint...', 1000);
    pushLogDelayed('Initializing model: meta/llama-3.2-11b-vision-instruct...', 1600);
    pushLogDelayed('Running vision processing pipeline (OCR + parsing)...', 2400);
    pushLogDelayed('Extracting academic registry structures...', 3500);
    pushLogDelayed('Mapping classroom subjects and weekly slots...', 4600);

    try {
      const fetchPromise = fetch('/api/analyze-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType, content }),
      });

      // Wait for both the minimum simulated animation time (5.5s) and the API request to complete
      const [res] = await Promise.all([
        fetchPromise,
        new Promise((resolve) => setTimeout(resolve, 5500))
      ]);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not parse the schedule.');
      }

      addLog(`Extracted ${data.subjects.length} subjects and ${data.schedule.length} class slots successfully.`);
      addLog('Timetable registry complete. Preparing preview...');
      
      setParsedSubjects(data.subjects);
      setParsedSchedule(data.schedule);

      // Short delay for the user to read final success logs
      setTimeout(() => {
        setStep(3);
      }, 1000);

    } catch (err: any) {
      timers.forEach(clearTimeout);
      setError(err.message || 'Verification failure during register analysis.');
      setStep(1);
    }
  };

  const handleConfirm = () => {
    setStep(4);
    setTimeout(() => {
      onComplete({ subjects: parsedSubjects, schedule: parsedSchedule });
    }, 1500); // Allow time for stamp drop animation
  };

  const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="onboarding screen rise" style={{ paddingBottom: '32px' }}>
      {/* Step indicator */}
      {step < 4 && (
        <div className="onboarding-steps" style={{ marginTop: '10px' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`onboarding-step ${s <= step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
            />
          ))}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="rise" style={{ animationDelay: '0ms' }}>
          <div className="eyebrow" style={{ color: 'var(--indigo-text)' }}>Step 01 / Registry Ingestion</div>
          <h2 className="font-display" style={{ marginTop: '6px', fontSize: '23px', fontWeight: 560 }}>
            Timetable Ingestion
          </h2>
          <p className="greeting-sub" style={{ marginTop: '4px', marginBottom: '24px' }}>
            Ingest your timetable file or raw text. The parser will construct the register entries.
          </p>

          <div className="text-tabs" style={{ marginBottom: '20px' }}>
            <button
              className={`text-tab ${inputMode === 'upload' ? 'active' : ''}`}
              onClick={() => setInputMode('upload')}
            >
              Upload Register Image
            </button>
            <button
              className={`text-tab ${inputMode === 'text' ? 'active' : ''}`}
              onClick={() => setInputMode('text')}
            >
              Paste Timetable Text
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
              <div className="upload-icon">🖋️</div>
              <h3>Drop timetable file here</h3>
              <p>Supports PNG, JPG, or TXT • Tap to browse</p>
            </div>
          ) : (
            <div className="rise" style={{ animationDelay: '50ms' }}>
              <div className="form-group">
                <label className="form-label">Timetable Text</label>
                <textarea
                  className="input-control"
                  rows={6}
                  placeholder={"Monday\n09:00 - 10:30  Mathematics I — Dr. Smith, Room 304\n11:00 - 12:30  Physics I — Prof. Lee, Room 102"}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  style={{
                    resize: 'none',
                    minHeight: 140,
                    fontSize: '12.5px',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: '1.5',
                  }}
                />
              </div>
              <button className="btn-primary" onClick={handleTextSubmit} style={{ marginTop: '8px' }}>
                Analyze Registry Ingestion
              </button>
            </div>
          )}

          {error && (
            <div className="card" style={{ marginTop: 20, padding: 14, borderColor: 'var(--rust)', background: 'rgba(201, 107, 69, 0.05)' }}>
              <div style={{ fontSize: 13, color: 'var(--rust)', fontWeight: 500 }}>
                ⚠️ Ingestion Error: {error}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Ingestion Typewriter Logging */}
      {step === 2 && (
        <div className="rise" style={{ textAlign: 'center', marginTop: '20px' }}>
          <div className="eyebrow" style={{ color: 'var(--indigo-text)' }}>Step 02 / Register Parsing</div>
          <h2 className="font-display" style={{ marginTop: '6px', fontSize: '23px', fontWeight: 560 }}>
            Analyzing Registry...
          </h2>
          <p className="greeting-sub" style={{ marginTop: '4px' }}>
            Converting visual schedule grid to ledger records.
          </p>

          <div ref={logContainerRef} className="typewriter-log">
            {logs.map((line, idx) => (
              <div key={idx} className="log-line">
                {line}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', gap: '8px', alignItems: 'center' }}>
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
              Contacting NIM services...
            </span>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Edit */}
      {step === 3 && (
        <div className="rise" style={{ animationDelay: '0ms' }}>
          <div className="eyebrow" style={{ color: 'var(--indigo-text)' }}>Step 03 / Verify Registry</div>
          <h2 className="font-display" style={{ marginTop: '6px', fontSize: '23px', fontWeight: 560 }}>
            Verify Ingested Data
          </h2>
          <p className="greeting-sub" style={{ marginTop: '4px', marginBottom: '20px' }}>
            Review parsed entries. Verify that days, room assignments, and course IDs align correctly.
          </p>

          <div className="section-label">Constructed Course Cards</div>
          <div className="preview-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', marginBottom: '20px', overflowY: 'auto' }}>
            {parsedSubjects.map((sub) => (
              <div key={sub.id} className="card" style={{ padding: '10px 14px', background: 'var(--surface-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 500, fontSize: '13.5px' }}>{sub.name}</div>
                  <span className="badge" style={{ fontSize: '9.5px' }}>{sub.id}</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {sub.teacher || 'No faculty'} {sub.room ? `· Room ${sub.room}` : ''}
                </div>
              </div>
            ))}
          </div>

          <div className="section-label">Weekly Schedule Slots</div>
          <div className="preview-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
            {DAYS_ORDER.map((day) => {
              const slots = parsedSchedule.filter((s) => s.day === day);
              if (slots.length === 0) return null;
              return (
                <div key={day} style={{ marginBottom: '8px' }}>
                  <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 4px 6px' }}>
                    {day}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {slots.map((slot, i) => {
                      const subName = parsedSubjects.find((s) => s.id === slot.subjectId)?.name || slot.subjectId;
                      return (
                        <div key={i} className="card" style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 500 }}>{subName}</span>
                          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {slot.startTime} – {slot.endTime}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="onboarding-actions" style={{ marginTop: '20px' }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>Re-upload</button>
            <button className="btn-primary" onClick={handleConfirm}>Confirm Register Data</button>
          </div>
        </div>
      )}

      {/* Step 4: Done Stamp Drop */}
      {step === 4 && (
        <div className="stamp-container">
          <div className="stamp-ink">REGISTERED</div>
          <p className="font-display" style={{ fontWeight: 560, marginTop: '24px', fontSize: '18px' }}>
            Registry Active
          </p>
          <p className="greeting-sub" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
            Setting up your academic ledger dashboard...
          </p>
        </div>
      )}
    </div>
  );
}
