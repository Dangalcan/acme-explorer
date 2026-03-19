import { Entity } from "../../shared/entity.model";

export interface FavouriteList extends Entity {
    explorerId: string;
    name: string;
    tripIds?: string[];
}
