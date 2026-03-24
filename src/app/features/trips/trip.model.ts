import { Entity } from "../../shared/entity.model";

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export const TRIP_VALIDATION = {
    ticker:          { pattern: /^\d{2}(?:(?:0[13578]|1[02])(0[1-9]|[12][0-9]|3[01])|(?:0[469]|11)(0[1-9]|[12][0-9]|30)|02(0[1-9]|1[0-9]|2[0-9]))-[A-Z]{4}$/ },
    title:           { maxLength: 100 },
    description:     { maxLength: 1000 },
    maxParticipants: { min: 1 },
    stages:          { minLength: 1 },
} as const;

export const STAGE_VALIDATION = {
    title:       { maxLength: 100 },
    description: { maxLength: 1000 },
    price:       { min: 0 },
} as const;

export const TRIP_CANCELLATION_VALIDATION = {
    reason: { maxLength: 1000 },
} as const;

export const TRIP_LOCATION_VALIDATION = {
    city:    { maxLength: 100 },
    country: { maxLength: 100 },
} as const;

export interface TripLocation {
    city: string;
    country: string;
}

export interface TripCancellation {
    reason: string;
    cancelledAt: Date;
}

export interface Stage extends Entity {
    title: string;
    description: string;
    price: number;
}

export interface Picture {
    url: string;
}

export interface Trip extends Entity {
    /** Automatically generated */
    ticker: string;
    title: string;
    description: string;
    difficultyLevel: DifficultyLevel;
    maxParticipants: number;
    startDate: Date;
    endDate: Date;
    cancellation?: TripCancellation;
    location?: TripLocation;
    pictures?: Picture[];
    /** Derived: sum of stages prices */
    totalPrice?: number;
    /** Derived: maxParticipants minus accepted applications */
    availablePlaces?: number;
    /** Derived: average of all reviews ratings */
    averageRating?: number;
    stages: Stage[];
    managerId: string;
}
