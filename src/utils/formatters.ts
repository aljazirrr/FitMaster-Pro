/**
 * Format a date string or Date object to a readable format.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format duration in seconds to a human-readable string.
 * e.g. 5000 => "1h 23m"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return '0m';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }
  return `${secs}s`;
}

/**
 * Format weight with unit.
 */
export function formatWeight(value: number, unit: 'metric' | 'imperial'): string {
  if (unit === 'imperial') {
    return `${value.toFixed(1)} lbs`;
  }
  return `${value.toFixed(1)} kg`;
}

/**
 * Format calorie value.
 */
export function formatCalories(value: number): string {
  return `${Math.round(value)} kcal`;
}

/**
 * Format a number with comma separators.
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}
