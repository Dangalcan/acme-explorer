import { Entity } from "../../shared/entity.model";


export const REVIEW_VALIDATION = {
    rating:  { min: 1, max: 5 },
    comment: { maxLength: 1000 },
} as const;

export interface Review extends Entity {
    tripId: string;
    explorerId: string;
    rating: Number;
    comment?: string;
    createdAt: Date;
}
