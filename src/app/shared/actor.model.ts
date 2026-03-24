import { Entity } from "./entity.model";

export const ACTOR_VALIDATION = {
    name:        { maxLength: 100 },
    surname:     { maxLength: 100 },
    phoneNumber: { pattern: /^\+?[1-9]\d{1,14}$/ },
    address:     { maxLength: 250 },
    password:    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/ },
} as const;

export interface Actor extends Entity {
    name: string;
    surname: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    password: string;
}

export interface Manager extends Actor {
    role: 'manager';
}

export interface Administrator extends Actor {
    role: 'administrator';
}

export interface Explorer extends Actor {
    role: 'explorer';
}

export type AnyActor = Manager | Administrator | Explorer;
