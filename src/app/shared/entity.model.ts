export type EntityId = string;
export type Version = number;

export interface Entity {
    id: EntityId,
    version: Version
}
