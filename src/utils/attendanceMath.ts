export interface ClassSession {
  id: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'holiday' | 'cancelled';
}

export interface Subject {
  id: string;
  name: string;
  teacher?: string;
  room?: string;
}

export interface SubjectAttendanceStats {
  subjectId: string;
  subjectName: string;
  attended: number;
  absent: number;
  holiday: number;
  cancelled: number;
  totalHeld: number;
  percentage: number;
}

/**
 * Calculates attendance statistics for each subject based on logged sessions.
 */
export function calculateSubjectStats(
  subjects: Subject[],
  sessions: ClassSession[]
): SubjectAttendanceStats[] {
  return subjects.map((subject) => {
    const subjectSessions = sessions.filter((s) => s.subjectId === subject.id);
    
    let attended = 0;
    let absent = 0;
    let holiday = 0;
    let cancelled = 0;

    subjectSessions.forEach((s) => {
      if (s.status === 'present') attended++;
      else if (s.status === 'absent') absent++;
      else if (s.status === 'holiday') holiday++;
      else if (s.status === 'cancelled') cancelled++;
    });

    const totalHeld = attended + absent;
    const percentage = totalHeld === 0 ? 100 : (attended / totalHeld) * 100;

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      attended,
      absent,
      holiday,
      cancelled,
      totalHeld,
      percentage,
    };
  });
}

/**
 * Calculates overall attendance statistics across all subjects.
 */
export function calculateOverallStats(stats: SubjectAttendanceStats[]) {
  let totalAttended = 0;
  let totalHeld = 0;

  stats.forEach((s) => {
    totalAttended += s.attended;
    totalHeld += s.totalHeld;
  });

  const percentage = totalHeld === 0 ? 100 : (totalAttended / totalHeld) * 100;

  return {
    attended: totalAttended,
    totalHeld,
    percentage,
  };
}

/**
 * Calculates how many consecutive classes need to be attended or can be skipped
 * to reach or maintain a target attendance percentage.
 */
export interface GoalResult {
  action: 'attend' | 'skip' | 'maintain';
  count: number;
  currentPercentage: number;
  targetPercentage: number;
  impossible: boolean;
}

export function calculateGoal(
  attended: number,
  totalHeld: number,
  targetPercent: number
): GoalResult {
  const currentPercentage = totalHeld === 0 ? 100 : (attended / totalHeld) * 100;
  const target = targetPercent / 100;

  // Edge case: Target is 100%
  if (targetPercent === 100) {
    if (attended === totalHeld) {
      return { action: 'maintain', count: 0, currentPercentage, targetPercentage: targetPercent, impossible: false };
    } else {
      return { action: 'attend', count: 0, currentPercentage, targetPercentage: targetPercent, impossible: true };
    }
  }

  // If current attendance is below target, find classes to attend
  if (currentPercentage < targetPercent) {
    // Formula: (A + x) / (H + x) >= T  =>  x >= (T*H - A) / (1 - T)
    const required = Math.ceil((target * totalHeld - attended) / (1 - target));
    return {
      action: 'attend',
      count: Math.max(0, required),
      currentPercentage,
      targetPercentage: targetPercent,
      impossible: false,
    };
  } 
  
  // If current attendance is above or equal to target, find classes we can skip
  // Formula: A / (H + y) >= T  =>  y <= (A - T*H) / T
  if (target === 0) {
    return {
      action: 'skip',
      count: Infinity,
      currentPercentage,
      targetPercentage: targetPercent,
      impossible: false,
    };
  }

  const allowedToSkip = Math.floor((attended - target * totalHeld) / target);
  return {
    action: allowedToSkip > 0 ? 'skip' : 'maintain',
    count: Math.max(0, allowedToSkip),
    currentPercentage,
    targetPercentage: targetPercent,
    impossible: false,
  };
}
