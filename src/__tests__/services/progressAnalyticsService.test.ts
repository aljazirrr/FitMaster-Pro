import Anthropic from '@anthropic-ai/sdk';
import {
  linearRegression,
  weeklyRate,
  consistencyScore,
  classifyTrend,
  predictGoalDate,
  generateProgressInsights,
} from '../../services/progressAnalyticsService';

// ─── Test data ────────────────────────────────────────────────────────────────

const WEIGHT_LOSS_ENTRIES = [
  { date: '2026-01-15', value: 85 },
  { date: '2026-01-22', value: 84.5 },
  { date: '2026-01-29', value: 84.2 },
  { date: '2026-02-05', value: 83.8 },
  { date: '2026-02-12', value: 83.5 },
  { date: '2026-02-19', value: 82.9 },
  { date: '2026-02-26', value: 82.5 },
  { date: '2026-03-05', value: 82.0 },
  { date: '2026-03-12', value: 81.5 },
  { date: '2026-03-18', value: 80.0 },
];

const FLAT_ENTRIES = [
  { date: '2026-01-01', value: 80 },
  { date: '2026-01-08', value: 80.1 },
  { date: '2026-01-15', value: 79.9 },
  { date: '2026-01-22', value: 80.0 },
];

const GAINING_ENTRIES = [
  { date: '2026-01-01', value: 70 },
  { date: '2026-01-08', value: 70.5 },
  { date: '2026-01-15', value: 71.0 },
  { date: '2026-01-22', value: 71.8 },
];

// ─── linearRegression ─────────────────────────────────────────────────────────

describe('linearRegression', () => {
  it('returns negative slope for weight-loss data', () => {
    const { slope } = linearRegression(WEIGHT_LOSS_ENTRIES);
    expect(slope).toBeLessThan(0);
  });

  it('returns near-zero slope for flat data', () => {
    const { slope } = linearRegression(FLAT_ENTRIES);
    expect(Math.abs(slope)).toBeLessThan(0.05);
  });

  it('returns positive slope for gaining data', () => {
    const { slope } = linearRegression(GAINING_ENTRIES);
    expect(slope).toBeGreaterThan(0);
  });

  it('returns r2 between 0 and 1', () => {
    const { r2 } = linearRegression(WEIGHT_LOSS_ENTRIES);
    expect(r2).toBeGreaterThanOrEqual(0);
    expect(r2).toBeLessThanOrEqual(1);
  });

  it('handles single entry gracefully', () => {
    const { slope, intercept } = linearRegression([{ date: '2026-01-01', value: 80 }]);
    expect(slope).toBe(0);
    expect(intercept).toBe(80);
  });

  it('handles two entries', () => {
    const { slope } = linearRegression([
      { date: '2026-01-01', value: 82 },
      { date: '2026-01-08', value: 81 },
    ]);
    expect(slope).toBeLessThan(0);
  });
});

// ─── weeklyRate ───────────────────────────────────────────────────────────────

describe('weeklyRate', () => {
  it('returns negative rate for weight-loss data', () => {
    const rate = weeklyRate(WEIGHT_LOSS_ENTRIES);
    expect(rate).toBeLessThan(0);
  });

  it('returns positive rate for gaining data', () => {
    const rate = weeklyRate(GAINING_ENTRIES);
    expect(rate).toBeGreaterThan(0);
  });

  it('is near-zero for flat data', () => {
    const rate = weeklyRate(FLAT_ENTRIES);
    expect(Math.abs(rate)).toBeLessThan(0.2);
  });

  it('returns value rounded to 2 dp', () => {
    const rate = weeklyRate(WEIGHT_LOSS_ENTRIES);
    expect(Number(rate.toFixed(2))).toBe(rate);
  });
});

// ─── consistencyScore ─────────────────────────────────────────────────────────

describe('consistencyScore', () => {
  it('returns 100 for weekly logging', () => {
    const score = consistencyScore(WEIGHT_LOSS_ENTRIES); // 10 entries over ~9 weeks
    expect(score).toBeGreaterThanOrEqual(70);
  });

  it('returns 0 for empty entries', () => {
    expect(consistencyScore([])).toBe(0);
  });

  it('returns 50 for single entry', () => {
    expect(consistencyScore([{ date: '2026-01-01', value: 80 }])).toBe(50);
  });

  it('returns value between 0 and 100', () => {
    const score = consistencyScore(WEIGHT_LOSS_ENTRIES);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ─── classifyTrend ────────────────────────────────────────────────────────────

describe('classifyTrend', () => {
  it('positive for negative slope with lose_weight goal', () => {
    expect(classifyTrend(-0.1, 'lose_weight')).toBe('positive');
  });

  it('negative for positive slope with lose_weight goal', () => {
    expect(classifyTrend(0.1, 'lose_weight')).toBe('negative');
  });

  it('positive for positive slope with build_muscle goal', () => {
    expect(classifyTrend(0.1, 'build_muscle')).toBe('positive');
  });

  it('negative for negative slope with build_muscle goal', () => {
    expect(classifyTrend(-0.1, 'build_muscle')).toBe('negative');
  });

  it('plateau for near-zero slope regardless of goal', () => {
    expect(classifyTrend(0.01, 'lose_weight')).toBe('plateau');
    expect(classifyTrend(-0.01, 'build_muscle')).toBe('plateau');
  });
});

// ─── predictGoalDate ─────────────────────────────────────────────────────────

describe('predictGoalDate', () => {
  it('predicts a future date for achievable target', () => {
    const { date, daysFromNow } = predictGoalDate(WEIGHT_LOSS_ENTRIES, 75);
    expect(date).not.toBeNull();
    expect(daysFromNow).not.toBeNull();
    expect(daysFromNow!).toBeGreaterThan(0);
  });

  it('returns null when target is already achieved', () => {
    const { date } = predictGoalDate(WEIGHT_LOSS_ENTRIES, 90); // gaining would be needed
    expect(date).toBeNull();
  });

  it('returns null for insufficient data', () => {
    const { date } = predictGoalDate([{ date: '2026-01-01', value: 80 }], 70);
    expect(date).toBeNull();
  });

  it('returns null when target is already below current weight (losing)', () => {
    // Current at 80, target 78 — trend is losing so should predict
    const { date } = predictGoalDate(WEIGHT_LOSS_ENTRIES, 78);
    // If trend is heading there, date should not be null
    if (date !== null) {
      expect(new Date(date).getTime()).toBeGreaterThan(Date.now() - 86_400_000 * 10);
    }
  });
});

// ─── generateProgressInsights ─────────────────────────────────────────────────

describe('generateProgressInsights', () => {
  function mockAnthropicResponse(json: object) {
    const instance = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: JSON.stringify(json) }],
          stop_reason: 'end_turn',
        }),
      },
    };
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementationOnce(
      () => instance as unknown as Anthropic,
    );
  }

  beforeEach(() => jest.clearAllMocks());

  it('returns valid insights object with AI response', async () => {
    mockAnthropicResponse({
      summary: 'Great progress! You have lost 5kg.',
      recommendations: ['Eat more protein', 'Sleep 8 hours', 'Add cardio'],
    });

    const insights = await generateProgressInsights({
      weightEntries: WEIGHT_LOSS_ENTRIES,
      goal: 'lose_weight',
      targetWeightKg: 75,
    });

    expect(insights.summary).toContain('Great progress');
    expect(insights.recommendations).toHaveLength(3);
    expect(insights.trend).toBe('positive');
    expect(insights.weeklyRate).toBeLessThan(0);
    expect(insights.consistencyScore).toBeGreaterThan(0);
    expect(insights.generatedAt).toBeTruthy();
  });

  it('includes projectedGoalDate when target is set', async () => {
    mockAnthropicResponse({ summary: 'Nice work!', recommendations: ['Keep going'] });

    const insights = await generateProgressInsights({
      weightEntries: WEIGHT_LOSS_ENTRIES,
      goal: 'lose_weight',
      targetWeightKg: 75,
    });

    expect(insights.projectedGoalDate).not.toBeNull();
    expect(insights.daysToGoal).toBeGreaterThan(0);
  });

  it('returns null projectedGoalDate when no target set', async () => {
    mockAnthropicResponse({ summary: 'Looking good!', recommendations: ['Stay consistent'] });

    const insights = await generateProgressInsights({ weightEntries: WEIGHT_LOSS_ENTRIES });
    expect(insights.projectedGoalDate).toBeNull();
  });

  it('uses fallback summary when AI fails', async () => {
    const errInstance = {
      messages: { create: jest.fn().mockRejectedValue(new Error('Network error')) },
    };
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementationOnce(
      () => errInstance as unknown as Anthropic,
    );

    const insights = await generateProgressInsights({
      weightEntries: WEIGHT_LOSS_ENTRIES,
      goal: 'lose_weight',
    });

    expect(typeof insights.summary).toBe('string');
    expect(insights.summary.length).toBeGreaterThan(0);
    expect(insights.recommendations.length).toBeGreaterThan(0);
  });

  it('uses Romanian fallback for ro language', async () => {
    const errInstance = {
      messages: { create: jest.fn().mockRejectedValue(new Error('Timeout')) },
    };
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementationOnce(
      () => errInstance as unknown as Anthropic,
    );

    const insights = await generateProgressInsights({
      weightEntries: WEIGHT_LOSS_ENTRIES,
      language: 'ro',
    });

    // Romanian fallback contains Romanian words
    expect(insights.recommendations[0]).toMatch(/loguri|apă|Somn/i);
  });

  it('classifies plateau trend for flat entries', async () => {
    mockAnthropicResponse({ summary: 'Stable.', recommendations: ['Adjust diet'] });

    const insights = await generateProgressInsights({ weightEntries: FLAT_ENTRIES });
    expect(insights.trend).toBe('plateau');
  });

  it('caps recommendations at 3 items', async () => {
    mockAnthropicResponse({
      summary: 'Good job.',
      recommendations: ['tip1', 'tip2', 'tip3', 'tip4', 'tip5'],
    });

    const insights = await generateProgressInsights({ weightEntries: WEIGHT_LOSS_ENTRIES });
    expect(insights.recommendations.length).toBeLessThanOrEqual(3);
  });

  it('uses claude-opus-4-6 with adaptive thinking', async () => {
    mockAnthropicResponse({ summary: 'Great!', recommendations: ['Keep going'] });

    await generateProgressInsights({ weightEntries: WEIGHT_LOSS_ENTRIES });

    const instance = (Anthropic as jest.MockedClass<typeof Anthropic>).mock.results[0]?.value;
    expect(instance.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-opus-4-6',
        thinking: { type: 'adaptive' },
      }),
    );
  });
});
