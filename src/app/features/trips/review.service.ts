import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { AuthService } from '../../core/services/auth.service';
import { db } from '../../infrastructure/firebase.config';
import { Review } from './review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly allReviews = signal<Review[]>([]);
  private readonly reviewsCollection = collection(db, 'reviews');
  private readonly tripsCollection = collection(db, 'trips');

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly reviews = computed(() => this.allReviews());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        this.authService.currentUser();
        this.authService.currentRole();
        void this.loadReviews();
      });
    }
  }

  reviewsForTrip(tripId: string): Review[] {
    return this.reviews()
      .filter((review) => review.tripId === tripId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private async loadReviews(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const user = this.authService.currentUser();
      const role = this.authService.currentRole();

      if (!user || !role) {
        this.allReviews.set([]);
        return;
      }

      if (role === 'administrator') {
        const snapshot = await getDocs(this.reviewsCollection);
        this.allReviews.set(snapshot.docs.map((reviewDoc) => this.toReview(reviewDoc.id, reviewDoc.data() as Record<string, unknown>)));
        return;
      }

      if (role === 'explorer') {
        const snapshot = await getDocs(query(this.reviewsCollection, where('explorerId', '==', user.uid)));
        this.allReviews.set(snapshot.docs.map((reviewDoc) => this.toReview(reviewDoc.id, reviewDoc.data() as Record<string, unknown>)));
        return;
      }

      const managedTripIds = await this.getManagedTripIds(user.uid);
      if (managedTripIds.length === 0) {
        this.allReviews.set([]);
        return;
      }

      const chunks = this.chunk(managedTripIds, 10);
      const snapshots = await Promise.all(
        chunks.map((tripIds) => getDocs(query(this.reviewsCollection, where('tripId', 'in', tripIds)))),
      );

      const mapped = snapshots
        .flatMap((snapshot) => snapshot.docs)
        .map((reviewDoc) => this.toReview(reviewDoc.id, reviewDoc.data() as Record<string, unknown>));

      this.allReviews.set(mapped);
    } catch (error) {
      console.error('Error loading reviews', error);
      this.error.set('Could not load reviews from Firestore.');
      this.allReviews.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private toReview(id: string, data: Record<string, unknown>): Review {
    return {
      id,
      version: this.toNumber(data['version']),
      tripId: String(data['tripId'] ?? ''),
      explorerId: String(data['explorerId'] ?? ''),
      rating: this.toNumber(data['rating']),
      comment: typeof data['comment'] === 'string' ? data['comment'] : undefined,
      createdAt: this.toDate(data['createdAt']),
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
}