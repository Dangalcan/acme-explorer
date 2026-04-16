import { isPlatformBrowser } from '@angular/common';
import { Injectable, Injector, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationService } from '../applications/application.service';
import { db } from '../../infrastructure/firebase.config';
import { Review } from './review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly applicationService = inject(ApplicationService);
  private readonly injector = inject(Injector);
  private readonly allReviews = signal<Review[]>([]);
  private readonly reviewsCollection = collection(db, 'reviews');

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

  async createReview(tripId: string, rating: number, comment?: string): Promise<boolean> {
    const user = this.authService.currentUser();
    const role = this.authService.currentRole();
    if (!user || role !== 'explorer') return false;

    const { TripService } = await import('./trip.service');
    const tripService = this.injector.get(TripService);
    const trip = tripService.getById(tripId);
    if (!trip || trip.cancellation) return false;
    if (new Date(trip.endDate) >= new Date()) return false;

    const hasAcceptedApplication = this.applicationService
      .applications()
      .some((a) => a.tripId === tripId && a.explorerId === user.uid && a.status === 'ACCEPTED');
    if (!hasAcceptedApplication) return false;

    // Enforce one review per explorer per trip
    const alreadyExists = this.reviews().some(
      (r) => r.tripId === tripId && r.explorerId === user.uid,
    );
    if (alreadyExists) return false;

    try {
      await addDoc(this.reviewsCollection, {
        tripId,
        explorerId: user.uid,
        rating,
        comment: comment ?? null,
        createdAt: new Date(),
        version: 0,
      });
      await this.loadReviews();
      return true;
    } catch (err) {
      console.error('Error creating review', err);
      return false;
    }
  }

  canModifyReview(reviewId: string): boolean {
    const uid = this.authService.currentUser()?.uid;
    const review = this.reviews().find((r) => r.id === reviewId);
    if (!uid || !review || review.explorerId !== uid) return false;
    return this.applicationService
      .applications()
      .some((a) => a.tripId === review.tripId && a.explorerId === uid && a.status === 'ACCEPTED');
  }

  async deleteReview(reviewId: string): Promise<boolean> {
    if (!this.canModifyReview(reviewId)) return false;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      await this.loadReviews();
      return true;
    } catch (err) {
      console.error('Error deleting review', err);
      return false;
    }
  }

  async updateReview(reviewId: string, rating: number, comment?: string): Promise<boolean> {
    if (!this.canModifyReview(reviewId)) return false;
    const review = this.reviews().find((r) => r.id === reviewId)!;
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        rating,
        comment: comment ?? null,
        version: review.version + 1,
      });
      await this.loadReviews();
      return true;
    } catch (err) {
      console.error('Error updating review', err);
      return false;
    }
  }

  private async loadReviews(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Reviews are public — load all regardless of role so that average ratings
      // (req 25) and the full review list are correct for every user.
      const snapshot = await getDocs(this.reviewsCollection);
      this.allReviews.set(
        snapshot.docs.map((reviewDoc) =>
          this.toReview(reviewDoc.id, reviewDoc.data() as Record<string, unknown>),
        ),
      );
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


}