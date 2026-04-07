import { Injectable, signal } from '@angular/core';
import { Application } from './application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  readonly applications = signal<Application[]>([
    {
      id: 'a1',
      version: 0,
      tripId: '1',
      explorerId: 'dALmY94uwtRtkt4jnWywUMV5Rz82',
      createdAt: new Date('2026-03-16T10:30:00Z'),
      status: 'PENDING',
      comments: 'I have previous mountain trekking experience and can adapt to weather changes.',
    },
    {
      id: 'a2',
      version: 0,
      tripId: '2',
      explorerId: 'dALmY94uwtRtkt4jnWywUMV5Rz82',
      createdAt: new Date('2026-03-12T09:20:00Z'),
      status: 'REJECTED',
      comments: 'Flexible dates and available for all pre-trip briefings.',
      rejectionReason: 'Required vaccination document is missing.',
    },
    {
      id: 'a3',
      version: 0,
      tripId: '3',
      explorerId: 'explorer-2',
      createdAt: new Date('2026-03-20T15:10:00Z'),
      status: 'ACCEPTED',
      comments: 'Interested in culture-focused itinerary and temple visits.',
    },
    {
      id: 'a4',
      version: 0,
      tripId: '4',
      explorerId: 'dALmY94uwtRtkt4jnWywUMV5Rz82',
      createdAt: new Date('2026-03-01T11:45:00Z'),
      status: 'CANCELLED',
      comments: 'I cancelled due to a schedule conflict with work.',
    },
  ]);
}
