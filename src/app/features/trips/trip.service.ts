import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase.config';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationService } from '../applications/application.service';
import { ReviewService } from './review.service';
import { Trip } from './trip.model';

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly applicationService = inject(ApplicationService);
  private readonly reviewService = inject(ReviewService);

  private readonly allTrips = signal<Trip[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly trips = computed(() => {
    const acceptedCounts = this.applicationService.publicAcceptedCounts();
    const reviews = this.reviewService.reviews();

    return this.allTrips().map((trip) => {
      const acceptedApplications = acceptedCounts[trip.id] ?? 0;

      const tripReviews = reviews.filter((review) => review.tripId === trip.id);
      const totalPrice = trip.stages.reduce((sum, stage) => sum + stage.price, 0);
      const averageRating = tripReviews.length
        ? tripReviews.reduce((sum, review) => sum + review.rating, 0) / tripReviews.length
        : undefined;

      return {
        ...trip,
        totalPrice,
        availablePlaces: Math.max(0, trip.maxParticipants - acceptedApplications),
        averageRating,
      };
    });
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      void this.loadTrips();
    }
  }

  async refresh(): Promise<void> {
    await this.loadTrips();
  }

  getById(id: string): Trip | undefined {
    return this.trips().find((trip) => trip.id === id);
  }

  async createTrip(data: Omit<Trip, 'id' | 'version' | 'ticker' | 'managerId'>): Promise<string | null> {
    const managerId = this.authService.currentUser()?.uid;
    if (!managerId) return null;

    const { totalPrice, availablePlaces, averageRating, ...rest } = data as Trip;
    const newTrip = this.stripUndefined({ ...rest, ticker: this.generateTicker(), managerId, version: 0 });

    try {
      const ref = await addDoc(collection(db, 'trips'), newTrip);
      await this.loadTrips();
      return ref.id;
    } catch (error) {
      console.error('Error creating trip', error);
      this.error.set('Could not create the trip.');
      return null;
    }
  }

  async updateTrip(tripId: string, data: Partial<Omit<Trip, 'id' | 'ticker' | 'managerId'>>): Promise<boolean> {
    if (!this.canEditTrip(tripId)) return false;

    const trip = this.getById(tripId)!;
    const { totalPrice, availablePlaces, averageRating, ...rest } = data as Trip;

    try {
      await updateDoc(doc(db, 'trips', tripId), this.stripUndefined({ ...rest, version: trip.version + 1 }));
      await this.loadTrips();
      return true;
    } catch (error) {
      console.error('Error updating trip', error);
      this.error.set('Could not update the trip.');
      return false;
    }
  }

  canEditTrip(tripId: string): boolean {
    const trip = this.getById(tripId);
    const uid = this.authService.currentUser()?.uid;
    if (!trip || !uid || trip.managerId !== uid) return false;

    const fiveDaysFromNow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    if (new Date(trip.startDate) <= fiveDaysFromNow) return false;

    return !this.applicationService.applications().some(
      (a) => a.tripId === tripId && a.status === 'ACCEPTED',
    );
  }

  canDeleteTrip(tripId: string): boolean {
    const trip = this.getById(tripId);
    const uid = this.authService.currentUser()?.uid;
    if (!trip || trip.managerId !== uid) return false;

    const fiveDaysFromNow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    if (new Date(trip.startDate) <= fiveDaysFromNow) return false;

    return !this.applicationService.applications().some(
      (a) => a.tripId === tripId && a.status === 'ACCEPTED',
    );
  }

  async deleteTrip(tripId: string): Promise<boolean> {
    if (!this.canDeleteTrip(tripId)) return false;

    try {
      await deleteDoc(doc(db, 'trips', tripId));
      await this.loadTrips();
      return true;
    } catch (error) {
      console.error('Error deleting trip', error);
      this.error.set('Could not delete the trip.');
      return false;
    }
  }

  canCancelTrip(tripId: string): boolean {
    const trip = this.getById(tripId);
    const uid = this.authService.currentUser()?.uid;
    if (!trip || trip.managerId !== uid) return false;
    if (trip.cancellation) return false;

    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (new Date(trip.startDate) <= oneWeekFromNow) return false;

    return !this.applicationService.applications().some(
      (a) => a.tripId === tripId && a.status === 'ACCEPTED',
    );
  }

  async cancelTrip(tripId: string, reason: string): Promise<boolean> {
    if (!this.canCancelTrip(tripId)) return false;
    if (!reason.trim()) return false;

    const trip = this.getById(tripId)!

    try {
      await updateDoc(doc(db, 'trips', tripId), {
        cancellation: {
          reason: reason.trim(),
          cancelledAt: new Date(),
        },
        version: trip.version + 1,
      });
      await this.loadTrips();
      return true;
    } catch (error) {
      console.error('Error cancelling trip', error);
      this.error.set('Could not cancel the trip.');
      return false;
    }
  }

  private stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [
          k,
          v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)
            ? this.stripUndefined(v as Record<string, unknown>)
            : v,
        ]),
    );
  }

  private generateTicker(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const letters = Array.from({ length: 4 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    ).join('');
    return `${yy}${mm}${dd}-${letters}`;
  }

  private async loadTrips(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const snapshot = await getDocs(collection(db, 'trips'));
      this.allTrips.set(snapshot.docs.map((tripDoc) => this.toTrip(tripDoc.id, tripDoc.data())));
    } catch (error) {
      console.error('Error loading trips', error);
      this.error.set('Could not load trips from Firestore.');
      this.allTrips.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private toTrip(id: string, data: Record<string, unknown>): Trip {
    return {
      id,
      version: this.toNumber(data['version']),
      ticker: String(data['ticker'] ?? ''),
      title: String(data['title'] ?? ''),
      description: String(data['description'] ?? ''),
      managerId: String(data['managerId'] ?? ''),
      stages: this.toStages(data['stages']),
      location: this.toLocation(data['location']),
      difficultyLevel: this.toDifficultyLevel(data['difficultyLevel']),
      maxParticipants: this.toNumber(data['maxParticipants']),
      startDate: this.toDate(data['startDate']),
      endDate: this.toDate(data['endDate']),
      cancellation: this.toCancellation(data['cancellation']),
      pictures: this.toPictures(data['pictures']),
    };
  }

  private toStages(value: unknown): Trip['stages'] {
    if (!Array.isArray(value)) return [];

    return value.map((stage) => {
      const item = stage as Record<string, unknown>;
      return {
        id: String(item['id'] ?? crypto.randomUUID()),
        version: this.toNumber(item['version']),
        title: String(item['title'] ?? ''),
        description: String(item['description'] ?? ''),
        price: this.toNumber(item['price']),
      };
    });
  }

  private toPictures(value: unknown): Trip['pictures'] {
    if (!Array.isArray(value)) return undefined;
    return value.map((picture) => ({ url: String((picture as Record<string, unknown>)['url'] ?? '') }));
  }

  private toLocation(value: unknown): Trip['location'] {
    if (!value || typeof value !== 'object') return undefined;
    const location = value as Record<string, unknown>;
    return {
      city: String(location['city'] ?? ''),
      country: String(location['country'] ?? ''),
    };
  }

  private toCancellation(value: unknown): Trip['cancellation'] {
    if (!value || typeof value !== 'object') return undefined;
    const cancellation = value as Record<string, unknown>;
    return {
      reason: String(cancellation['reason'] ?? ''),
      cancelledAt: this.toDate(cancellation['cancelledAt']),
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

  private toDifficultyLevel(value: unknown): Trip['difficultyLevel'] {
    if (value === 'EASY' || value === 'MEDIUM' || value === 'HARD') return value;
    return 'EASY';
  }
}
