import { Injectable, computed, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Application } from './application.model';
import { Trip } from '../trips/trip.model';
import { AuthService } from '../../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly storageKey = 'acme-explorer-applications';
  private readonly fallbackExplorerId = 'dALmY94uwtRtkt4jnWywUMV5Rz82';

  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly allApplications = signal<Application[]>([
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

  readonly applications = computed(() => this.allApplications());

  readonly currentExplorerId = computed(
    () => this.getCurrentUserUid() ?? this.fallbackExplorerId,
  );

  constructor() {
    if (this.isBrowser()) {
      this.allApplications.set(this.loadFromStorage(this.allApplications()));

      effect(() => {
        localStorage.setItem(this.storageKey, JSON.stringify(this.allApplications()));
      });
    }
  }

  applyForTrip(trip: Trip, comments?: string): boolean {
    const explorerId = this.currentExplorerId();
    if (!explorerId || this.hasTripStarted(trip)) return false;

    if (this.hasActiveApplicationForTrip(trip.id)) return false;

    const normalizedComments = comments?.trim();

    const newApplication: Application = {
      id: crypto.randomUUID(),
      version: 0,
      tripId: trip.id,
      explorerId,
      createdAt: new Date(),
      status: 'PENDING',
      comments: normalizedComments ? normalizedComments : undefined,
    };

    this.allApplications.update((applications) => [...applications, newApplication]);
    return true;
  }

  canApplyForTrip(trip: Trip): boolean {
    const explorerId = this.currentExplorerId();
    if (!explorerId || this.hasTripStarted(trip)) return false;

    return !this.hasActiveApplicationForTrip(trip.id);
  }

  hasActiveApplicationForTrip(tripId: string): boolean {
    const explorerId = this.currentExplorerId();
    if (!explorerId) return false;

    return this.applications().some(
      (application) =>
        application.tripId === tripId &&
        application.explorerId === explorerId &&
        application.status !== 'CANCELLED' &&
        application.status !== 'REJECTED',
    );
  }

  cancelApplication(applicationId: string): boolean {
    return this.updateCurrentExplorerApplication(applicationId, (application) => {
      if (application.status !== 'PENDING' && application.status !== 'DUE') return application;
      return {
        ...application,
        status: 'CANCELLED',
        version: application.version + 1,
      };
    });
  }

  payApplication(applicationId: string): boolean {
    return this.updateCurrentExplorerApplication(applicationId, (application) => {
      if (application.status !== 'DUE') return application;
      return {
        ...application,
        status: 'ACCEPTED',
        version: application.version + 1,
      };
    });
  }

  markApplicationAsDue(applicationId: string): boolean {
    return this.updateApplication(applicationId, (application) => {
      if (application.status !== 'PENDING') return application;
      return {
        ...application,
        status: 'DUE',
        rejectionReason: undefined,
        version: application.version + 1,
      };
    });
  }

  rejectApplication(applicationId: string, rejectionReason: string): boolean {
    const normalizedReason = rejectionReason.trim();
    if (!normalizedReason) return false;

    return this.updateApplication(applicationId, (application) => {
      if (application.status !== 'PENDING' && application.status !== 'DUE') return application;
      return {
        ...application,
        status: 'REJECTED',
        rejectionReason: normalizedReason,
        version: application.version + 1,
      };
    });
  }

  private hasTripStarted(trip: Trip): boolean {
    return new Date(trip.startDate).getTime() <= Date.now();
  }

  private updateCurrentExplorerApplication(
    applicationId: string,
    updater: (application: Application) => Application,
  ): boolean {
    const explorerId = this.currentExplorerId();
    if (!explorerId) return false;

    return this.updateApplication(
      applicationId,
      updater,
      (application) => application.explorerId === explorerId,
    );
  }

  private updateApplication(
    applicationId: string,
    updater: (application: Application) => Application,
    predicate?: (application: Application) => boolean,
  ): boolean {
    let hasUpdated = false;

    this.allApplications.update((applications) =>
      applications.map((application) => {
        if (application.id !== applicationId) {
          return application;
        }

        if (predicate && !predicate(application)) {
          return application;
        }

        const updatedApplication = updater(application);
        if (updatedApplication !== application) {
          hasUpdated = true;
        }

        return updatedApplication;
      }),
    );

    return hasUpdated;
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getCurrentUserUid(): string | null {
    const currentUser = this.authService.currentUser as unknown;

    if (typeof currentUser === 'function') {
      const signalUser = (currentUser as () => { uid?: string } | null | undefined)();
      return signalUser?.uid ?? null;
    }

    if (currentUser && typeof currentUser === 'object' && 'uid' in currentUser) {
      const plainUser = currentUser as { uid?: string };
      return plainUser.uid ?? null;
    }

    return null;
  }

  private loadFromStorage(fallback: Application[]): Application[] {
    if (!this.isBrowser()) return fallback;

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return fallback;

      const parsed = JSON.parse(raw) as Array<Omit<Application, 'createdAt'> & { createdAt: string }>;
      if (!Array.isArray(parsed)) return fallback;

      return parsed.map((application) => ({
        ...application,
        createdAt: new Date(application.createdAt),
      }));
    } catch {
      return fallback;
    }
  }
}
