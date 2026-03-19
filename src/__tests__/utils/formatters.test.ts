import {
  formatDate,
  formatDuration,
  formatWeight,
  formatCalories,
  formatNumber,
} from '../../utils/formatters';

describe('formatDate', () => {
  it('formats a Date object', () => {
    const date = new Date('2026-03-19T12:00:00.000Z');
    const result = formatDate(date);
    expect(result).toContain('2026');
    expect(result).toContain('Mar');
  });

  it('formats an ISO date string', () => {
    const result = formatDate('2026-01-15');
    expect(result).toContain('2026');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });

  it('returns a non-empty string', () => {
    expect(formatDate(new Date())).toBeTruthy();
  });
});

describe('formatDuration', () => {
  it('returns "0m" for negative seconds', () => {
    expect(formatDuration(-1)).toBe('0m');
    expect(formatDuration(-100)).toBe('0m');
  });

  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(0)).toBe('0s');
  });

  it('formats minutes only (no seconds remainder)', () => {
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(120)).toBe('2m');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(75)).toBe('1m 15s');
  });

  it('formats hours only (no minutes remainder)', () => {
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(7200)).toBe('2h');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3660)).toBe('1h 1m');
    expect(formatDuration(5400)).toBe('1h 30m');
  });

  it('omits seconds when hours are present', () => {
    // 3661 = 1h 1m 1s — hours view shows only h and m
    expect(formatDuration(3661)).toBe('1h 1m');
  });
});

describe('formatWeight', () => {
  it('formats metric weight', () => {
    expect(formatWeight(80, 'metric')).toBe('80.0 kg');
    expect(formatWeight(72.5, 'metric')).toBe('72.5 kg');
  });

  it('formats imperial weight', () => {
    expect(formatWeight(176.4, 'imperial')).toBe('176.4 lbs');
    expect(formatWeight(100, 'imperial')).toBe('100.0 lbs');
  });

  it('always shows one decimal place', () => {
    expect(formatWeight(80, 'metric')).toMatch(/\d+\.\d kg/);
    expect(formatWeight(80, 'imperial')).toMatch(/\d+\.\d lbs/);
  });
});

describe('formatCalories', () => {
  it('formats whole calories', () => {
    expect(formatCalories(500)).toBe('500 kcal');
    expect(formatCalories(2500)).toBe('2500 kcal');
  });

  it('rounds decimal calories', () => {
    expect(formatCalories(500.7)).toBe('501 kcal');
    expect(formatCalories(499.1)).toBe('499 kcal');
  });

  it('handles 0', () => {
    expect(formatCalories(0)).toBe('0 kcal');
  });
});

describe('formatNumber', () => {
  it('formats numbers below 1000 without separator', () => {
    expect(formatNumber(999)).toBe('999');
  });

  it('formats large numbers with comma separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
    expect(formatNumber(45200)).toBe('45,200');
  });

  it('handles 0', () => {
    expect(formatNumber(0)).toBe('0');
  });
});
