import { Entity } from "./entity.model";

export type ActorRole = 'administrator' | 'manager' | 'explorer';

export interface Actor extends Entity {
    name: string;
    surname: string;
    email: string;
    phone?: string;
    address?: string;
    role: ActorRole;
}
