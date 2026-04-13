import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase.config';
import { ApplicationService } from '../applications/application.service';
import { ReviewService } from './review.service';
import { Trip } from './trip.model';

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly applicationService = inject(ApplicationService);
  private readonly reviewService = inject(ReviewService);

  private readonly allTrips = signal<Trip[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly trips = computed(() => {
    const applications = this.applicationService.applications();
    const reviews = this.reviewService.reviews();

    return this.allTrips().map((trip) => {
      const acceptedApplications = applications.filter(
        (application) => application.tripId === trip.id && application.status === 'ACCEPTED',
      ).length;

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

  async cancelTrip(tripId: string): Promise<boolean> {
    const trip = this.getById(tripId);
    if (!trip || trip.cancellation) return false;

    try {
      await updateDoc(doc(db, 'trips', tripId), {
        cancellation: {
          reason: 'Cancelled by manager',
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
