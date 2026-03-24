import {
  getSetCompleteMessage,
  getWorkoutStartMessage,
  generateWorkoutSummary,
  generateOnDemandCoachTip,
} from '../../services/voiceCoachService';

// Mock the AI server client — services proxy through the backend, not Anthropic directly
jest.mock('../../services/aiServerClient', () => ({
  callAI: jest.fn(),
}));

import { callAI } from '../../services/aiServerClient';
const mockCallAI = callAI as jest.MockedFunction<typeof callAI>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Tier 1: Static messages ──────────────────────────────────────────────────

describe('getSetCompleteMessage', () => {
  it('returns a non-empty string in English', () => {
    const msg = getSetCompleteMessage({ exerciseName: 'bench-press', setIndex: 0, weight: 80, reps: 10 }, 'en');
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string in Romanian', () => {
    const msg = getSetCompleteMessage({ exerciseName: 'bench-press', setIndex: 0, weight: 80, reps: 10 }, 'ro');
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('returns a PR message when isPR is true', () => {
    const msg = getSetCompleteMessage({ exerciseName: 'squat', setIndex: 0, weight: 120, reps: 5, isPR: true }, 'en');
    // PR messages include "PR" or "RECORD"
    expect(msg.toUpperCase()).toMatch(/PR|RECORD/);
  });

  it('returns a Romanian PR message when isPR is true and language is ro', () => {
    const msg = getSetCompleteMessage({ exerciseName: 'squat', setIndex: 0, weight: 120, reps: 5, isPR: true }, 'ro');
    expect(msg.toUpperCase()).toMatch(/RECORD/);
  });

  it('returns different messages across calls (randomised pool)', () => {
    const results = new Set(
      Array.from({ length: 20 }, () =>
        getSetCompleteMessage({ exerciseName: 'deadlift', setIndex: 0, weight: 140, reps: 5 }, 'en'),
      ),
    );
    // Pool has 6 messages — should get at least 2 unique with 20 draws
    expect(results.size).toBeGreaterThanOrEqual(2);
  });
});

describe('getWorkoutStartMessage', () => {
  it('returns a non-empty English string', () => {
    const msg = getWorkoutStartMessage('en');
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(5);
  });

  it('returns a non-empty Romanian string', () => {
    const msg = getWorkoutStartMessage('ro');
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(5);
  });
});

// ─── Tier 2: AI messages ──────────────────────────────────────────────────────

describe('generateWorkoutSummary', () => {
  it('returns the AI-generated text', async () => {
    mockCallAI.mockResolvedValueOnce('Amazing workout! You completed 12 sets in 45 minutes. Recovery starts now!');
    const result = await generateWorkoutSummary({
      workoutName: 'Push Day',
      totalSets: 15,
      completedSets: 12,
      durationSeconds: 2700,
      topExercise: 'Bench Press',
    });
    expect(result).toContain('Amazing workout!');
  });

  it('calls callAI with /ai/voice-coach endpoint and maxTokens: 256', async () => {
    mockCallAI.mockResolvedValueOnce('Great job!');
    await generateWorkoutSummary({
      workoutName: 'Leg Day',
      totalSets: 10,
      completedSets: 10,
      durationSeconds: 3600,
    });
    expect(mockCallAI).toHaveBeenCalledWith(
      '/ai/voice-coach',
      expect.objectContaining({ maxTokens: 256 }),
    );
  });

  it('returns fallback when API throws', async () => {
    mockCallAI.mockRejectedValueOnce(new Error('Network error'));
    const result = await generateWorkoutSummary({
      workoutName: 'Pull Day',
      totalSets: 8,
      completedSets: 5,
      durationSeconds: 1800,
    });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns Romanian fallback for ro language', async () => {
    mockCallAI.mockRejectedValueOnce(new Error('Timeout'));
    const result = await generateWorkoutSummary({
      workoutName: 'Antrenament Push',
      totalSets: 10,
      completedSets: 9,
      durationSeconds: 3000,
      language: 'ro',
    });
    expect(result).toContain('Bravo');
  });

  it('includes newPRs in prompt when provided', async () => {
    mockCallAI.mockResolvedValueOnce('PR celebration!');
    await generateWorkoutSummary({
      workoutName: 'Push Day',
      totalSets: 10,
      completedSets: 10,
      durationSeconds: 2400,
      newPRs: ['Bench Press', 'Overhead Press'],
    });
    const calledPrompt = mockCallAI.mock.calls[0][1].prompt as string;
    expect(calledPrompt).toContain('Bench Press');
  });
});

describe('generateOnDemandCoachTip', () => {
  it('returns the AI-generated tip', async () => {
    mockCallAI.mockResolvedValueOnce('Keep your chest up and drive through your heels!');
    const tip = await generateOnDemandCoachTip({
      exerciseName: 'Squat',
      setsCompleted: 2,
      totalSets: 4,
      weight: 100,
      reps: 8,
      workoutDurationSeconds: 900,
    });
    expect(tip).toContain('chest');
  });

  it('calls callAI with /ai/voice-coach endpoint and maxTokens: 128', async () => {
    mockCallAI.mockResolvedValueOnce('Great form!');
    await generateOnDemandCoachTip({
      exerciseName: 'Deadlift',
      setsCompleted: 1,
      totalSets: 3,
      weight: 150,
      reps: 5,
      workoutDurationSeconds: 600,
    });
    expect(mockCallAI).toHaveBeenCalledWith(
      '/ai/voice-coach',
      expect.objectContaining({ maxTokens: 128 }),
    );
  });

  it('returns a fallback string on API error', async () => {
    mockCallAI.mockRejectedValueOnce(new Error('Timeout'));
    const tip = await generateOnDemandCoachTip({
      exerciseName: 'Row',
      setsCompleted: 1,
      totalSets: 3,
      weight: 80,
      reps: 10,
      workoutDurationSeconds: 300,
    });
    expect(typeof tip).toBe('string');
    expect(tip.length).toBeGreaterThan(0);
  });

  it('generates Romanian prompt for ro language', async () => {
    mockCallAI.mockResolvedValueOnce('Menține spatele drept!');
    await generateOnDemandCoachTip({
      exerciseName: 'Deadlift',
      setsCompleted: 2,
      totalSets: 4,
      weight: 120,
      reps: 6,
      workoutDurationSeconds: 1200,
      language: 'ro',
    });
    const calledPrompt = mockCallAI.mock.calls[0][1].prompt as string;
    expect(calledPrompt).toContain('Deadlift');
    // Romanian prompt contains Romanian words
    expect(calledPrompt).toMatch(/antrenor|sfat|serii/i);
  });
});
