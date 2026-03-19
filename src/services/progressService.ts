import client from './api';
import { ENDPOINTS } from '../constants/api';
import type { BodyMeasurements } from '../types/user';

export interface WeightEntry {
  date: string;
  value: number;
}

export interface MeasurementEntry {
  date: string;
  measurements: BodyMeasurements;
}

export interface PhotoEntry {
  date: string;
  uri: string;
}

const progressService = {
  // ── Weight ──────────────────────────────────────────────────────────────────

  /**
   * Fetch all weight entries for the current user, sorted oldest → newest.
   */
  async getWeightHistory(): Promise<WeightEntry[]> {
    return client.get<WeightEntry[]>(ENDPOINTS.progress.weight);
  },

  /**
   * Log a new weight entry for today.
   */
  async addWeight(value: number): Promise<WeightEntry> {
    return client.post<WeightEntry>(ENDPOINTS.progress.weight, { value });
  },

  // ── Measurements ────────────────────────────────────────────────────────────

  /**
   * Fetch all body measurement snapshots, sorted newest → oldest.
   */
  async getMeasurements(): Promise<MeasurementEntry[]> {
    return client.get<MeasurementEntry[]>(ENDPOINTS.progress.measurements);
  },

  /**
   * Log a new body measurement snapshot for today.
   */
  async addMeasurement(measurements: BodyMeasurements): Promise<MeasurementEntry> {
    return client.post<MeasurementEntry>(ENDPOINTS.progress.measurements, {
      measurements,
    });
  },

  // ── Photos ──────────────────────────────────────────────────────────────────

  /**
   * Fetch all progress photos, sorted newest → oldest.
   */
  async getPhotos(): Promise<PhotoEntry[]> {
    return client.get<PhotoEntry[]>(ENDPOINTS.progress.photos);
  },

  /**
   * Upload a progress photo URI.
   * In production this should use a multipart form upload or a signed S3 URL.
   */
  async addPhoto(uri: string): Promise<PhotoEntry> {
    return client.post<PhotoEntry>(ENDPOINTS.progress.photos, { uri });
  },
};

export default progressService;
