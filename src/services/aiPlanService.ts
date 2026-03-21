/**
 * aiPlanService — AI-powered workout plan generation using Claude claude-opus-4-6.
 * AI calls are proxied through the FitMaster backend server.
 */
import { streamAI } from './aiServerClient';
import type { WorkoutPlan, WorkoutLevel } from '../types/workout';
import type { FitnessGoal } from '../types/user';
import { Equipment } from '../types/exercise';

// ─── Request params ───────────────────────────────────────────────────────────

export interface AIPlanParams {
  goal: FitnessGoal;
  experience: WorkoutLevel;
  daysPerWeek: number;
  equipment: Equipment[];
  focusAreas?: string[];
  language?: 'en' | 'ro';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function goalLabel(goal: FitnessGoal): string {
  const map: Record<FitnessGoal, string> = {
    lose_weight: 'weight loss and fat burning',
    build_muscle: 'muscle hypertrophy and strength',
    maintain: 'maintaining current fitness',
    improve_endurance: 'cardiovascular endurance',
    flexibility: 'flexibility and mobility',
  };
  return map[goal];
}

function equipmentLabel(eq: Equipment): string {
  const map: Record<Equipment, string> = {
    [Equipment.Barbell]: 'barbell',
    [Equipment.Dumbbell]: 'dumbbells',
    [Equipment.Machine]: 'machines',
    [Equipment.Cable]: 'cables',
    [Equipment.Bodyweight]: 'bodyweight only',
    [Equipment.Kettlebell]: 'kettlebells',
    [Equipment.Bands]: 'resistance bands',
    [Equipment.Smith]: 'smith machine',
    [Equipment.EzBar]: 'EZ bar',
    [Equipment.TrapBar]: 'trap bar',
    [Equipment.Other]: 'other equipment',
  };
  return map[eq];
}

function buildPrompt(params: AIPlanParams): string {
  const eqList =
    params.equipment.length > 0
      ? params.equipment.map(equipmentLabel).join(', ')
      : 'bodyweight only';

  const focusNote =
    params.focusAreas && params.focusAreas.length > 0
      ? `The user also wants to focus on: ${params.focusAreas.join(', ')}.`
      : '';

  return `You are an expert personal trainer. Create a personalised 4-week workout plan with the following requirements:

- **Goal:** ${goalLabel(params.goal)}
- **Experience level:** ${params.experience}
- **Training days per week:** ${params.daysPerWeek}
- **Available equipment:** ${eqList}
${focusNote}

Return ONLY a valid JSON object matching this TypeScript interface (no markdown fences, no extra text):

{
  "id": string,            // unique slug, e.g. "ai-hypertrophy-4day-001"
  "name": string,          // English plan name
  "nameRo": string,        // Romanian plan name
  "description": string,   // 2-3 sentence English description
  "descriptionRo": string, // Romanian description
  "level": "beginner" | "intermediate" | "advanced",
  "daysPerWeek": number,
  "category": string,      // e.g. "hypertrophy", "strength", "fat_loss", "endurance"
  "createdBy": "AI",
  "weeks": [
    {
      "weekNumber": number,
      "days": [
        {
          "dayNumber": number,
          "name": string,  // e.g. "Push Day", "Upper Body"
          "exercises": [
            {
              "exerciseId": string,   // kebab-case id, e.g. "bench-press", "squat"
              "sets": number,
              "reps": number,         // use 0 for time-based (store seconds in restSeconds)
              "restSeconds": number
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- Include exactly ${params.daysPerWeek} training days per week (rest days are NOT included in "days" array).
- Provide 4 weeks total.
- Week 1 is the base; weeks 2-4 progressively add volume or intensity.
- Use only exercises that can be performed with: ${eqList}.
- exerciseId must be a stable kebab-case identifier (e.g. "bench-press", "lat-pulldown", "goblet-squat").
- Keep reps realistic for the goal: strength → 3-6 reps, hypertrophy → 8-15, endurance → 15-25.
- restSeconds: strength → 120-180, hypertrophy → 60-90, endurance → 30-60.`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Generate a personalised workout plan using Claude claude-opus-4-6 with adaptive thinking.
 *
 * @throws `Error` if the API call fails or the response cannot be parsed as a WorkoutPlan.
 */
export async function generateAIWorkoutPlan(
  params: AIPlanParams,
  onProgress?: (chunk: string) => void,
): Promise<WorkoutPlan> {
  const prompt = buildPrompt(params);
  const fullText = await streamAI('/ai/workout-plan', { prompt }, onProgress, 120_000);
  return parsePlanJSON(fullText, params);
}

// ─── JSON parser ──────────────────────────────────────────────────────────────

function parsePlanJSON(rawText: string, params: AIPlanParams): WorkoutPlan {
  // Strip any accidental markdown fences Claude might add
  let cleaned = rawText.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\n?([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  // Find the outermost JSON object
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in AI response');
  }
  cleaned = cleaned.slice(start, end + 1);

  let parsed: Partial<WorkoutPlan>;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${(e as Error).message}`);
  }

  // Validate required fields
  if (!parsed.name || !parsed.weeks || !Array.isArray(parsed.weeks)) {
    throw new Error('AI response is missing required fields (name, weeks)');
  }

  // Normalise and fill defaults
  return {
    id: parsed.id ?? `ai-plan-${Date.now()}`,
    name: parsed.name,
    nameRo: parsed.nameRo ?? parsed.name,
    description: parsed.description ?? '',
    descriptionRo: parsed.descriptionRo ?? parsed.description ?? '',
    level: (parsed.level as WorkoutLevel) ?? params.experience,
    daysPerWeek: parsed.daysPerWeek ?? params.daysPerWeek,
    category: parsed.category ?? 'general',
    createdBy: 'AI',
    weeks: parsed.weeks,
  };
}
