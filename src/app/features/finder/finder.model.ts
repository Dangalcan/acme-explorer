import { Entity } from "../../shared/entity.model";
import { DifficultyLevel } from "../trips/trip.model";

export const FINDER_DEFAULTS = {
    cacheTimeHours: 1,
    maxResults:     10,
} as const;

export const FINDER_VALIDATION = {
    keyword:        { maxLength: 32 },
    minPrice:       { min: 0 },
    maxPrice:       { min: 0 },
    cacheTimeHours: { min: 1, max: 24 },
    maxResults:     { min: 1, max: 50 },
} as const;

export interface Finder extends Entity {
    explorerId: string;
    keyword?: string;
    minPrice?: number;
    maxPrice?: number;
    startDate?: Date;
    endDate?: Date;
    difficulty?: DifficultyLevel;
    cacheTimeHours: number;
    cachedAt?: Date;
    maxResults: number;
}
