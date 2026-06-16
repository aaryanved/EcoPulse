import {
  formatDate,
  formatRelativeTime,
  getMonthLabel,
  getWeekRange,
  getMonthRange,
  toISODate,
  getLast12Months,
} from '../date';

describe('formatDate', () => {
  const fixed = new Date('2024-06-15T12:00:00Z');

  it('formats in short style (month + day)', () => {
    const result = formatDate(fixed, 'short');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/15/);
    expect(result).not.toMatch(/2024/);
  });

  it('formats in medium style (month + day + year)', () => {
    const result = formatDate(fixed, 'medium');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });

  it('accepts a date string as input', () => {
    const result = formatDate('2024-06-15', 'short');
    expect(result).toBeTruthy();
  });

  it('defaults to medium style', () => {
    const result = formatDate(fixed);
    expect(result).toMatch(/2024/);
  });
});

describe('formatRelativeTime', () => {
  it('returns "Just now" for times under 1 minute ago', () => {
    const recent = new Date(Date.now() - 30 * 1000);
    expect(formatRelativeTime(recent)).toBe('Just now');
  });

  it('returns minutes ago for times under 1 hour', () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    expect(formatRelativeTime(thirtyMinsAgo)).toBe('30m ago');
  });

  it('returns hours ago for times under 24 hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
  });

  it('returns "Yesterday" for times 24–48 hours ago', () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
    expect(formatRelativeTime(yesterday)).toBe('Yesterday');
  });

  it('returns days ago for times under 7 days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
  });

  it('falls back to a formatted date for times 7+ days ago', () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(oldDate);
    // Should not contain "ago" or "Yesterday"
    expect(result).not.toMatch(/ago/);
    expect(result).not.toBe('Yesterday');
  });

  it('accepts a date string as input', () => {
    const result = formatRelativeTime(new Date().toISOString());
    expect(result).toBe('Just now');
  });
});

describe('getMonthLabel', () => {
  it('returns month and year as a readable string', () => {
    const result = getMonthLabel(new Date('2024-06-01'));
    expect(result).toMatch(/June/);
    expect(result).toMatch(/2024/);
  });
});

describe('getWeekRange', () => {
  it('start is a Sunday', () => {
    const { start } = getWeekRange(new Date('2024-06-15')); // Saturday
    expect(start.getDay()).toBe(0);
  });

  it('end is a Saturday', () => {
    const { end } = getWeekRange(new Date('2024-06-15'));
    expect(end.getDay()).toBe(6);
  });

  it('start is at midnight', () => {
    const { start } = getWeekRange(new Date('2024-06-15'));
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
  });

  it('end is at end of day', () => {
    const { end } = getWeekRange(new Date('2024-06-15'));
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
  });

  it('range spans exactly 7 calendar days (Sunday through Saturday)', () => {
    const { start, end } = getWeekRange(new Date('2024-06-15'));
    expect(end.getDate() - start.getDate()).toBe(6);
    expect(end.getDay()).toBe(6); // Saturday
    expect(start.getDay()).toBe(0); // Sunday
  });
});

describe('getMonthRange', () => {
  it('start is the first day of the month at midnight', () => {
    const { start } = getMonthRange(new Date('2024-06-15'));
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
  });

  it('end is the last day of the month', () => {
    const { end } = getMonthRange(new Date('2024-06-15'));
    expect(end.getDate()).toBe(30); // June has 30 days
    expect(end.getHours()).toBe(23);
  });

  it('handles months with 31 days', () => {
    const { end } = getMonthRange(new Date('2024-01-15'));
    expect(end.getDate()).toBe(31);
  });

  it('handles February in a leap year', () => {
    const { end } = getMonthRange(new Date('2024-02-10')); // 2024 is a leap year
    expect(end.getDate()).toBe(29);
  });

  it('handles February in a non-leap year', () => {
    const { end } = getMonthRange(new Date('2023-02-10'));
    expect(end.getDate()).toBe(28);
  });
});

describe('toISODate', () => {
  it('returns a YYYY-MM-DD formatted string', () => {
    const result = toISODate(new Date('2024-06-15T00:00:00Z'));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('does not include time component', () => {
    const result = toISODate(new Date('2024-06-15T14:30:00Z'));
    expect(result).not.toContain('T');
    expect(result).not.toContain(':');
  });
});

describe('getLast12Months', () => {
  it('returns exactly 12 entries', () => {
    expect(getLast12Months()).toHaveLength(12);
  });

  it('each entry has label, year, and month fields', () => {
    const months = getLast12Months();
    for (const m of months) {
      expect(m).toHaveProperty('label');
      expect(m).toHaveProperty('year');
      expect(m).toHaveProperty('month');
    }
  });

  it('months are in ascending chronological order', () => {
    const months = getLast12Months();
    for (let i = 1; i < months.length; i++) {
      const prev = months[i - 1];
      const curr = months[i];
      const prevTime = new Date(prev.year, prev.month - 1).getTime();
      const currTime = new Date(curr.year, curr.month - 1).getTime();
      expect(currTime).toBeGreaterThan(prevTime);
    }
  });

  it('last entry is the current month', () => {
    const now = new Date();
    const months = getLast12Months();
    const last = months[months.length - 1];
    expect(last.year).toBe(now.getFullYear());
    expect(last.month).toBe(now.getMonth() + 1);
  });

  it('months are in range 1–12', () => {
    const months = getLast12Months();
    for (const m of months) {
      expect(m.month).toBeGreaterThanOrEqual(1);
      expect(m.month).toBeLessThanOrEqual(12);
    }
  });
});
