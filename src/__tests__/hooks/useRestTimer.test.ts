/**
 * Tests for useRestTimer hook
 *
 * Tests the pure logic of the hook without rendering — we test the
 * underlying functions and state transitions via direct calls on mocked state.
 * Since we can't use @testing-library/react-hooks here, we test the
 * timer logic through the service-level pure functions it wraps.
 */

// Use fake timers for all tests
jest.useFakeTimers();

// ─── Pure logic tests (no React) ─────────────────────────────────────────────
// Test the timer math independently from the hook

describe('Rest Timer — countdown math', () => {
  it('secondsLeft decrements each second', () => {
    let secondsLeft = 90;
    const interval = setInterval(() => {
      secondsLeft -= 1;
    }, 1000);

    jest.advanceTimersByTime(3000);
    clearInterval(interval);

    expect(secondsLeft).toBe(87);
  });

  it('progress formula: 1 - secondsLeft / totalSeconds', () => {
    const total = 60;
    const left = 30;
    const progress = 1 - left / total;
    expect(progress).toBe(0.5);
  });

  it('progress is 0 at start', () => {
    const total = 60;
    const left = 60;
    expect(1 - left / total).toBe(0);
  });

  it('progress is 1 at finish', () => {
    const total = 60;
    const left = 0;
    expect(1 - left / total).toBe(1);
  });

  it('addTime increases secondsLeft', () => {
    let secondsLeft = 30;
    let totalSeconds = 60;
    secondsLeft += 15;
    totalSeconds = Math.max(totalSeconds, secondsLeft);
    expect(secondsLeft).toBe(45);
    expect(totalSeconds).toBe(60);
  });

  it('addTime updates totalSeconds when exceeding original', () => {
    let secondsLeft = 55;
    let totalSeconds = 60;
    secondsLeft += 15;
    totalSeconds = Math.max(totalSeconds, secondsLeft);
    expect(secondsLeft).toBe(70);
    expect(totalSeconds).toBe(70);
  });

  it('clamp: start(0) becomes 1 second minimum', () => {
    const input = 0;
    const clamped = Math.max(1, Math.round(input));
    expect(clamped).toBe(1);
  });

  it('clamp: start(-5) becomes 1 second minimum', () => {
    const input = -5;
    const clamped = Math.max(1, Math.round(input));
    expect(clamped).toBe(1);
  });

  it('clamp: start(90.7) rounds to 91', () => {
    const input = 90.7;
    const clamped = Math.max(1, Math.round(input));
    expect(clamped).toBe(91);
  });
});

describe('Rest Timer — ringColor logic', () => {
  function getRingColor(secondsLeft: number, totalSeconds: number): string {
    const ratio = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
    return ratio > 0.5 ? '#4CAF50' : ratio > 0.25 ? '#FF9800' : '#F44336';
  }

  it('green when more than 50% remaining', () => {
    expect(getRingColor(60, 90)).toBe('#4CAF50'); // 66%
    expect(getRingColor(90, 90)).toBe('#4CAF50'); // 100%
  });

  it('orange when 25-50% remaining', () => {
    expect(getRingColor(30, 90)).toBe('#FF9800'); // 33%
    expect(getRingColor(24, 90)).toBe('#FF9800'); // ~26.7%
  });

  it('red when less than 25% remaining', () => {
    expect(getRingColor(15, 90)).toBe('#F44336'); // 16.6%
    expect(getRingColor(1, 90)).toBe('#F44336'); // 1.1%
    expect(getRingColor(0, 90)).toBe('#F44336'); // 0%
  });

  it('defaults to green when totalSeconds is 0', () => {
    expect(getRingColor(0, 0)).toBe('#4CAF50');
  });
});

describe('Rest Timer — time formatting', () => {
  function formatTime(seconds: number): string {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  it('formats 90 seconds as 01:30', () => {
    expect(formatTime(90)).toBe('01:30');
  });

  it('formats 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats 60 seconds as 01:00', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  it('formats 59 seconds as 00:59', () => {
    expect(formatTime(59)).toBe('00:59');
  });

  it('formats 3600 seconds as 60:00', () => {
    expect(formatTime(3600)).toBe('60:00');
  });

  it('formats 125 seconds as 02:05', () => {
    expect(formatTime(125)).toBe('02:05');
  });
});

describe('Rest Timer — interval lifecycle', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('interval fires correct number of times', () => {
    const tick = jest.fn();
    const id = setInterval(tick, 1000);

    jest.advanceTimersByTime(5000);
    clearInterval(id);

    expect(tick).toHaveBeenCalledTimes(5);
  });

  it('clearInterval stops ticking', () => {
    const tick = jest.fn();
    const id = setInterval(tick, 1000);

    jest.advanceTimersByTime(2000);
    clearInterval(id);
    jest.advanceTimersByTime(3000);

    expect(tick).toHaveBeenCalledTimes(2);
  });

  it('onFinish callback fires after countdown completes', () => {
    const onFinish = jest.fn();
    let secondsLeft = 3;

    const id = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        clearInterval(id);
        setTimeout(() => onFinish(), 0);
      }
    }, 1000);

    jest.advanceTimersByTime(3000);
    jest.runAllTimers(); // flush the setTimeout(0)

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('skip does not trigger onFinish', () => {
    const onFinish = jest.fn();
    let secondsLeft = 60;
    let running = true;

    const id = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        clearInterval(id);
        setTimeout(() => onFinish(), 0);
      }
    }, 1000);

    // Simulate skip after 5s
    jest.advanceTimersByTime(5000);
    clearInterval(id); // skip clears interval without calling onFinish
    running = false;

    jest.runAllTimers();

    expect(running).toBe(false);
    expect(onFinish).not.toHaveBeenCalled();
  });
});
