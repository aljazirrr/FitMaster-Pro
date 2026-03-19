import Anthropic from '@anthropic-ai/sdk';
import { generateAIWorkoutPlan, type AIPlanParams } from '../../services/aiPlanService';
import { Equipment } from '../../types/exercise';

// Access the mock helpers attached to the constructor
const AnthropicMock = Anthropic as typeof Anthropic & {
  _createMockStream: (text: string) => ReturnType<typeof Anthropic.prototype.messages.stream>;
  _createErrorStream: (msg: string) => ReturnType<typeof Anthropic.prototype.messages.stream>;
  _getMockPlan: () => Record<string, unknown>;
};

// ─── Default params ───────────────────────────────────────────────────────────

const DEFAULT_PARAMS: AIPlanParams = {
  goal: 'build_muscle',
  experience: 'intermediate',
  daysPerWeek: 4,
  equipment: [Equipment.Barbell, Equipment.Dumbbell, Equipment.Cable],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStreamMock(): jest.Mock {
  const instance = (Anthropic as jest.MockedClass<typeof Anthropic>).mock.results[0]?.value;
  return instance?.messages?.stream as jest.Mock;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('generateAIWorkoutPlan', () => {
  it('returns a valid WorkoutPlan for standard params', async () => {
    const plan = await generateAIWorkoutPlan(DEFAULT_PARAMS);

    expect(plan.name).toBeTruthy();
    expect(plan.level).toBe('intermediate');
    expect(plan.daysPerWeek).toBe(4);
    expect(plan.weeks).toHaveLength(4);
    expect(plan.createdBy).toBe('AI');
  });

  it('each week has exactly daysPerWeek training days', async () => {
    const plan = await generateAIWorkoutPlan(DEFAULT_PARAMS);
    plan.weeks.forEach((week) => {
      expect(week.days.length).toBeLessThanOrEqual(DEFAULT_PARAMS.daysPerWeek);
      expect(week.days.length).toBeGreaterThan(0);
    });
  });

  it('exercises have required fields', async () => {
    const plan = await generateAIWorkoutPlan(DEFAULT_PARAMS);
    const day1 = plan.weeks[0].days[0];
    day1.exercises.forEach((ex) => {
      expect(ex.exerciseId).toBeTruthy();
      expect(ex.sets).toBeGreaterThan(0);
      expect(ex.reps).toBeGreaterThanOrEqual(0);
      expect(ex.restSeconds).toBeGreaterThan(0);
    });
  });

  it('calls Anthropic messages.stream with claude-opus-4-6', async () => {
    await generateAIWorkoutPlan(DEFAULT_PARAMS);
    const streamMock = getStreamMock();
    expect(streamMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-opus-4-6' }),
    );
  });

  it('passes adaptive thinking in the request', async () => {
    await generateAIWorkoutPlan(DEFAULT_PARAMS);
    const streamMock = getStreamMock();
    expect(streamMock).toHaveBeenCalledWith(
      expect.objectContaining({ thinking: { type: 'adaptive' } }),
    );
  });

  it('invokes onProgress callback with streamed text', async () => {
    const onProgress = jest.fn();
    await generateAIWorkoutPlan(DEFAULT_PARAMS, onProgress);
    expect(onProgress).toHaveBeenCalled();
    // The mock emits the entire JSON as one chunk
    const combinedArgs = onProgress.mock.calls.map(([c]) => c).join('');
    expect(combinedArgs.length).toBeGreaterThan(0);
  });

  it('generates plan name from goal when building muscle', async () => {
    const plan = await generateAIWorkoutPlan({ ...DEFAULT_PARAMS, goal: 'build_muscle' });
    expect(plan.name).toBeTruthy();
    expect(typeof plan.name).toBe('string');
  });

  it('throws on invalid JSON from stream', async () => {
    const instance = new (Anthropic as jest.MockedClass<typeof Anthropic>)();
    (instance.messages.stream as jest.Mock).mockReturnValueOnce(
      AnthropicMock._createMockStream('this is not json at all'),
    );
    // Re-instantiate via module — override the mock for this test
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementationOnce(
      () => instance as unknown as Anthropic,
    );

    await expect(generateAIWorkoutPlan(DEFAULT_PARAMS)).rejects.toThrow();
  });

  it('throws when AI response has no JSON object', async () => {
    const noJsonInstance = {
      messages: {
        stream: jest.fn(() => AnthropicMock._createMockStream('Claude says: hello world!')),
      },
    };
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementationOnce(
      () => noJsonInstance as unknown as Anthropic,
    );

    await expect(generateAIWorkoutPlan(DEFAULT_PARAMS)).rejects.toThrow(
      'No JSON object found in AI response',
    );
  });

  it('strips markdown code fences from response', async () => {
    const mockPlan = AnthropicMock._getMockPlan();
    const fencedText = '```json\n' + JSON.stringify(mockPlan) + '\n```';
    const fencedInstance = {
      messages: {
        stream: jest.fn(() => AnthropicMock._createMockStream(fencedText)),
      },
    };
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementationOnce(
      () => fencedInstance as unknown as Anthropic,
    );

    const plan = await generateAIWorkoutPlan(DEFAULT_PARAMS);
    expect(plan.name).toBeTruthy();
    expect(plan.weeks).toHaveLength(4);
  });

  it('fills default id when AI omits it', async () => {
    const mockPlan = { ...AnthropicMock._getMockPlan() } as Record<string, unknown>;
    delete mockPlan.id;
    const noIdInstance = {
      messages: {
        stream: jest.fn(() => AnthropicMock._createMockStream(JSON.stringify(mockPlan))),
      },
    };
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementationOnce(
      () => noIdInstance as unknown as Anthropic,
    );

    const plan = await generateAIWorkoutPlan(DEFAULT_PARAMS);
    expect(plan.id).toMatch(/^ai-plan-\d+/);
  });

  it('re-throws API errors from the stream', async () => {
    const errorInstance = {
      messages: {
        stream: jest.fn(() => AnthropicMock._createErrorStream('Rate limit exceeded')),
      },
    };
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementationOnce(
      () => errorInstance as unknown as Anthropic,
    );

    await expect(generateAIWorkoutPlan(DEFAULT_PARAMS)).rejects.toThrow('Rate limit exceeded');
  });
});

describe('useWorkoutStore — saved plans', () => {
  // Import after mocks are established
  let useWorkoutStore: typeof import('../../stores/useWorkoutStore').useWorkoutStore;

  beforeEach(async () => {
    jest.resetModules();
    const mod = await import('../../stores/useWorkoutStore');
    useWorkoutStore = mod.useWorkoutStore;
    useWorkoutStore.setState({ savedPlans: [] });
  });

  const makePlan = (id: string) =>
    ({
      id,
      name: `Plan ${id}`,
      nameRo: `Plan ${id}`,
      description: 'Test',
      descriptionRo: 'Test',
      level: 'intermediate' as const,
      daysPerWeek: 4,
      category: 'hypertrophy',
      createdBy: 'AI',
      weeks: [],
    });

  it('saves a generated plan', () => {
    useWorkoutStore.getState().saveGeneratedPlan(makePlan('p1'));
    expect(useWorkoutStore.getState().savedPlans).toHaveLength(1);
    expect(useWorkoutStore.getState().savedPlans[0].id).toBe('p1');
  });

  it('prepends new plans (most recent first)', () => {
    useWorkoutStore.getState().saveGeneratedPlan(makePlan('p1'));
    useWorkoutStore.getState().saveGeneratedPlan(makePlan('p2'));
    expect(useWorkoutStore.getState().savedPlans[0].id).toBe('p2');
  });

  it('replaces a plan with the same id', () => {
    useWorkoutStore.getState().saveGeneratedPlan(makePlan('p1'));
    const updated = { ...makePlan('p1'), name: 'Updated Plan' };
    useWorkoutStore.getState().saveGeneratedPlan(updated);
    const plans = useWorkoutStore.getState().savedPlans;
    expect(plans).toHaveLength(1);
    expect(plans[0].name).toBe('Updated Plan');
  });

  it('removes a generated plan by id', () => {
    useWorkoutStore.getState().saveGeneratedPlan(makePlan('p1'));
    useWorkoutStore.getState().saveGeneratedPlan(makePlan('p2'));
    useWorkoutStore.getState().removeGeneratedPlan('p1');
    const plans = useWorkoutStore.getState().savedPlans;
    expect(plans).toHaveLength(1);
    expect(plans[0].id).toBe('p2');
  });

  it('does not throw when removing non-existent plan', () => {
    expect(() => useWorkoutStore.getState().removeGeneratedPlan('does-not-exist')).not.toThrow();
  });
});
