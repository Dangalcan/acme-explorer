import { Entity } from "../../shared/entity.model";

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Review extends Entity {
    tripId: string;
    explorerId: string;
    rating: Rating;
    comment?: string;
    createdAt: Date;
}
