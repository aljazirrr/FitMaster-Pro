import client from './api';
import { ENDPOINTS } from '../constants/api';
import type { WorkoutSession, PersonalRecord } from '../types/workout';

export interface SaveWorkoutPayload {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  exercises: WorkoutSession['exercises'];
}

const workoutService = {
  /**
   * Fetch the user's full workout history from the backend.
   */
  async getHistory(): Promise<WorkoutSession[]> {
    return client.get<WorkoutSession[]>(ENDPOINTS.workouts.list);
  },

  /**
   * Fetch a single completed workout by ID.
   */
  async getById(id: string): Promise<WorkoutSession> {
    return client.get<WorkoutSession>(ENDPOINTS.workouts.byId(id));
  },

  /**
   * Persist a completed workout session to the backend.
   * Called automatically after `finishWorkout()` in the store.
   */
  async save(session: SaveWorkoutPayload): Promise<WorkoutSession> {
    return client.post<WorkoutSession>(ENDPOINTS.workouts.create, session);
  },

  /**
   * Delete a workout from the backend history.
   */
  async delete(id: string): Promise<void> {
    return client.delete<void>(ENDPOINTS.workouts.byId(id));
  },

  /**
   * Fetch the user's personal records for all exercises.
   */
  async getPersonalRecords(): Promise<PersonalRecord[]> {
    return client.get<PersonalRecord[]>(ENDPOINTS.workouts.personalRecords);
  },
};

export default workoutService;
