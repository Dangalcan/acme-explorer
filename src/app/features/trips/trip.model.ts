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

export interface Stage {
    title: string;
    description: string;
    price: number;
}

export interface Trip extends Entity {
    /** Automatically generated */
    ticker: string;
    title: string;
    description: string;
    /** Automatically computed as the sum of stages prices */
    price: number;
    stages: Stage[];
    location: TripLocation;
    difficulty: DifficultyLevel;
    maxParticipants: number;
    startDate: Date;
    endDate: Date;
    pictures?: string[];
    cancellation?: TripCancellation;
    managerId: string;
}
