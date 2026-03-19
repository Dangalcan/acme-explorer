import { Entity } from "../../shared/entity.model";

export type ApplicationStatus = 'PENDING' | 'REJECTED' | 'DUE' | 'ACCEPTED' | 'CANCELLED';

export interface Application extends Entity {
    tripId: string;
    explorerId: string;
    createdAt: Date;
    status: ApplicationStatus;
    comments?: string;
    rejectionReason?: string;
}
