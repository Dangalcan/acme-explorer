import { Entity } from "../../shared/entity.model";

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface TripLocation {
    city: string;
    country: string;
}

export interface TripCancellation {
    reason: string;
    cancelledAt: Date;
}

export interface Trip extends Entity {
    ticker: string;
    title: string;
    description: string;
    price: number;
    location: TripLocation;
    difficulty: DifficultyLevel;
    maxParticipants: number;
    startDate: Date;
    endDate: Date;
    pictures?: string[];
    cancellation?: TripCancellation;
}
