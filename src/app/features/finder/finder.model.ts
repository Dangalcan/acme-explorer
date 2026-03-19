import { DifficultyLevel } from "../trips/trip.model";

export interface PriceRange {
    min?: number;
    max?: number;
}

export interface DateRange {
    from?: Date;
    to?: Date;
}

export interface Finder {
    explorerId: string;
    keyword?: string;
    priceRange?: PriceRange;
    dateRange?: DateRange;
    difficulty?: DifficultyLevel;
    maxResults?: Number;
    cachedTripIds?: string[];
    cacheTimeHours?: Number;
}
