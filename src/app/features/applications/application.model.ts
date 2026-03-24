import { Entity } from "../../shared/entity.model";

export type AppStatus = 'PENDING' | 'REJECTED' | 'DUE' | 'ACCEPTED' | 'CANCELLED';

export const APPLICATION_DEFAULTS = {
    status: 'PENDING' as AppStatus,
} as const;

export const APPLICATION_VALIDATION = {
    comments:        { maxLength: 1000 },
    rejectionReason: { maxLength: 1000 },
} as const;

export interface Application extends Entity {
    tripId: string;
    explorerId: string;
    createdAt: Date;
    status: AppStatus;
    comments?: string;
    rejectionReason?: string;
}
