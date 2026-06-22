export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  isCustom?: boolean;
}

export const STATE_PRESETS: { [key: string]: Holiday[] } = {
  'California, USA': [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-01-19', name: 'Martin Luther King Jr. Day' },
    { date: '2026-03-31', name: 'Cesar Chavez Day' },
    { date: '2026-05-25', name: 'Memorial Day' },
    { date: '2026-06-19', name: 'Juneteenth' },
    { date: '2026-07-04', name: 'Independence Day' },
    { date: '2026-09-07', name: 'Labor Day' },
    { date: '2026-11-11', name: 'Veterans Day' },
    { date: '2026-11-26', name: 'Thanksgiving Day' },
    { date: '2026-11-27', name: 'Day After Thanksgiving' },
    { date: '2026-12-25', name: 'Christmas Day' },
  ],
  'New York, USA': [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-01-19', name: 'Martin Luther King Jr. Day' },
    { date: '2026-02-16', name: "Presidents' Day" },
    { date: '2026-05-25', name: 'Memorial Day' },
    { date: '2026-06-19', name: 'Juneteenth' },
    { date: '2026-07-04', name: 'Independence Day' },
    { date: '2026-09-07', name: 'Labor Day' },
    { date: '2026-10-12', name: 'Columbus Day' },
    { date: '2026-11-11', name: 'Veterans Day' },
    { date: '2026-11-26', name: 'Thanksgiving Day' },
    { date: '2026-12-25', name: 'Christmas Day' },
  ],
  'Delhi, India': [
    { date: '2026-01-26', name: 'Republic Day' },
    { date: '2026-03-03', name: 'Holi' },
    { date: '2026-04-02', name: 'Mahavir Jayanti' },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-05-01', name: 'Budha Purnima' },
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-09-05', name: 'Janmashtami' },
    { date: '2026-10-02', name: 'Mahatma Gandhi Birthday' },
    { date: '2026-10-21', name: 'Dussehra' },
    { date: '2026-11-08', name: 'Diwali (Deepavali)' },
    { date: '2026-11-24', name: 'Guru Nanak Birthday' },
    { date: '2026-12-25', name: 'Christmas Day' },
  ],
  'Maharashtra, India': [
    { date: '2026-01-26', name: 'Republic Day' },
    { date: '2026-02-19', name: 'Chhatrapati Shivaji Maharaj Jayanti' },
    { date: '2026-03-03', name: 'Holi' },
    { date: '2026-03-19', name: 'Gudi Padwa' },
    { date: '2026-04-10', name: 'Dr. Ambedkar Jayanti' },
    { date: '2026-05-01', name: 'Maharashtra Day' },
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-09-15', name: 'Ganesh Chaturthi' },
    { date: '2026-10-02', name: 'Mahatma Gandhi Birthday' },
    { date: '2026-10-21', name: 'Dussehra' },
    { date: '2026-11-08', name: 'Diwali (Deepavali)' },
    { date: '2026-12-25', name: 'Christmas Day' },
  ],
  'Karnataka, India': [
    { date: '2026-01-26', name: 'Republic Day' },
    { date: '2026-02-15', name: 'Maha Shivaratri' },
    { date: '2026-03-19', name: 'Ugadi' },
    { date: '2026-04-14', name: 'Dr. Ambedkar Jayanti' },
    { date: '2026-05-01', name: 'May Day (Labour Day)' },
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-09-15', name: 'Ganesh Chaturthi' },
    { date: '2026-10-02', name: 'Mahatma Gandhi Birthday' },
    { date: '2026-10-20', name: 'Ayudha Puja' },
    { date: '2026-10-21', name: 'Vijayadashami' },
    { date: '2026-11-01', name: 'Kannada Rajyotsava' },
    { date: '2026-11-08', name: 'Diwali (Deepavali)' },
    { date: '2026-12-25', name: 'Christmas Day' },
  ],
};

/**
 * Returns formatted date string like "Jun 22, 2026".
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Returns weekday name for a date string.
 */
export function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Returns calendar grid cells for a given month and year.
 * Includes pad days for previous and next month to make a complete calendar grid (multiple of 7).
 */
export function getCalendarGrid(year: number, month: number) {
  // month is 0-indexed (0 = Jan, 11 = Dec)
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 6 = Saturday

  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  const cells = [];

  // Previous month padding days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    cells.push({
      date: d,
      dateString: toDateString(d),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    cells.push({
      date: d,
      dateString: toDateString(d),
      isCurrentMonth: true,
    });
  }

  // Next month padding days to complete week (total size multiple of 7)
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({
        date: d,
        dateString: toDateString(d),
        isCurrentMonth: false,
      });
    }
  }

  return cells;
}

/**
 * Utility to format Date object into YYYY-MM-DD in local time
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Check if a date string is a weekend
 */
export function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}
