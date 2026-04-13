import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  deleteField,
} from 'firebase/firestore';
import { Application } from './application.model';
import { Trip } from '../trips/trip.model';
import { AuthService } from '../../core/services/auth.service';
import { db } from '../../infrastructure/firebase.config';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly allApplications = signal<Application[]>([]);
  private readonly applicationsCollection = collection(db, 'applications');
  private readonly tripsCollection = collection(db, 'trips');

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly applications = computed(() => this.allApplications());

  readonly currentExplorerId = computed(() => this.getCurrentUserUid());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        this.authService.currentUser();
        this.authService.currentRole();
        void this.loadApplications();
      });
    }
  }

  async refresh(): Promise<void> {
    await this.loadApplications();
  }

  async applyForTrip(trip: Trip, comments?: string): Promise<boolean> {
    const explorerId = this.currentExplorerId();
    if (!explorerId || this.hasTripStarted(trip) || this.isTripSoldOut(trip)) return false;

    if (this.hasActiveApplicationForTrip(trip.id)) return false;

    const normalizedComments = comments?.trim();
    const newApplication: Omit<Application, 'id'> = {
      version: 0,
      tripId: trip.id,
      explorerId,
      createdAt: new Date(),
      status: 'PENDING',
      ...(normalizedComments ? { comments: normalizedComments } : {}),
    };

    try {
      await addDoc(this.applicationsCollection, newApplication);
      await this.loadApplications();
      return true;
    } catch (error) {
      console.error('Error creating application', error);
      this.error.set('Could not create the application.');
      return false;
    }
  }

  canApplyForTrip(trip: Trip): boolean {
    const explorerId = this.currentExplorerId();
    if (!explorerId || this.hasTripStarted(trip) || this.isTripSoldOut(trip)) return false;

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

  async cancelApplication(applicationId: string): Promise<boolean> {
    return this.updateCurrentExplorerApplication(applicationId, async (application) => {
      if (application.status !== 'PENDING' && application.status !== 'DUE') return false;
      await updateDoc(doc(db, 'applications', applicationId), {
        status: 'CANCELLED',
        version: application.version + 1,
      });
      return true;
    });
  }

  async payApplication(applicationId: string): Promise<boolean> {
    return this.updateCurrentExplorerApplication(applicationId, async (application) => {
      if (application.status !== 'DUE') return false;
      await updateDoc(doc(db, 'applications', applicationId), {
        status: 'ACCEPTED',
        version: application.version + 1,
      });
      return true;
    });
  }

  async markApplicationAsDue(applicationId: string): Promise<boolean> {
    return this.updateApplication(applicationId, async (application) => {
      if (application.status !== 'PENDING') return false;
      await updateDoc(doc(db, 'applications', applicationId), {
        status: 'DUE',
        rejectionReason: deleteField(),
        version: application.version + 1,
      });
      return true;
    });
  }

  async rejectApplication(applicationId: string, rejectionReason: string): Promise<boolean> {
    const normalizedReason = rejectionReason.trim();
    if (!normalizedReason) return false;

    return this.updateApplication(applicationId, async (application) => {
      if (application.status !== 'PENDING') return false;
      await updateDoc(doc(db, 'applications', applicationId), {
        status: 'REJECTED',
        rejectionReason: normalizedReason,
        version: application.version + 1,
      });
      return true;
    });
  }

  private hasTripStarted(trip: Trip): boolean {
    return new Date(trip.startDate).getTime() <= Date.now();
  }

  private isTripSoldOut(trip: Trip): boolean {
    return trip.availablePlaces !== undefined && trip.availablePlaces <= 0;
  }

  private async updateCurrentExplorerApplication(
    applicationId: string,
    updater: (application: Application) => Promise<boolean>,
  ): Promise<boolean> {
    const explorerId = this.currentExplorerId();
    if (!explorerId) return false;

    return this.updateApplication(
      applicationId,
      updater,
      (application) => application.explorerId === explorerId,
    );
  }

  private async updateApplication(
    applicationId: string,
    updater: (application: Application) => Promise<boolean>,
    predicate?: (application: Application) => boolean,
  ): Promise<boolean> {
    const currentApplication = this.allApplications().find((application) => application.id === applicationId);
    if (!currentApplication) return false;
    if (predicate && !predicate(currentApplication)) return false;

    const updated = await updater(currentApplication);
    if (updated) {
      await this.loadApplications();
    }
    return updated;
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

  private async loadApplications(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const user = this.authService.currentUser();
      const role = this.authService.currentRole();

      if (!user || !role) {
        this.allApplications.set([]);
        return;
      }

      if (role === 'administrator') {
        const snapshot = await getDocs(query(this.applicationsCollection));
        this.allApplications.set(snapshot.docs.map((applicationDoc) => this.toApplication(applicationDoc.id, applicationDoc.data())));
        return;
      }

      if (role === 'explorer') {
        const snapshot = await getDocs(query(this.applicationsCollection, where('explorerId', '==', user.uid)));
        this.allApplications.set(snapshot.docs.map((applicationDoc) => this.toApplication(applicationDoc.id, applicationDoc.data())));
        return;
      }

      const managedTripIds = await this.getManagedTripIds(user.uid);
      if (managedTripIds.length === 0) {
        this.allApplications.set([]);
        return;
      }

      const chunks = this.chunk(managedTripIds, 10);
      const snapshots = await Promise.all(
        chunks.map((tripIds) => getDocs(query(this.applicationsCollection, where('tripId', 'in', tripIds)))),
      );

      const mapped = snapshots
        .flatMap((snapshot) => snapshot.docs)
        .map((applicationDoc) => this.toApplication(applicationDoc.id, applicationDoc.data()));

      this.allApplications.set(mapped);
    } catch (error) {
      console.error('Error loading applications', error);
      this.error.set('Could not load applications from Firestore.');
      this.allApplications.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async getManagedTripIds(managerUid: string): Promise<string[]> {
    const snapshot = await getDocs(query(this.tripsCollection, where('managerId', '==', managerUid)));
    return snapshot.docs.map((tripDoc) => tripDoc.id);
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  private toApplication(id: string, data: Record<string, unknown>): Application {
    return {
      id,
      version: this.toNumber(data['version']),
      tripId: String(data['tripId'] ?? ''),
      explorerId: String(data['explorerId'] ?? ''),
      createdAt: this.toDate(data['createdAt']),
      status: this.toStatus(data['status']),
      comments: typeof data['comments'] === 'string' ? data['comments'] : undefined,
      rejectionReason: typeof data['rejectionReason'] === 'string' ? data['rejectionReason'] : undefined,
    };
  }

  private toDate(value: unknown): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate();
    }
    return new Date();
  }

  private toNumber(value: unknown): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toStatus(value: unknown): Application['status'] {
    if (value === 'PENDING' || value === 'REJECTED' || value === 'DUE' || value === 'ACCEPTED' || value === 'CANCELLED') {
      return value;
    }
    return 'PENDING';
  }
}
