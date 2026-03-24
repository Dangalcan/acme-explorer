import { Entity } from "../../shared/entity.model";

export const FAVOURITE_LIST_VALIDATION = {
    name: { maxLength: 100 },
} as const;

export interface FavouriteList extends Entity {
    explorerId: string;
    name: string;
    tripIds?: string[];
}
