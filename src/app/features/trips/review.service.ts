import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationService } from '../applications/application.service';
import { db } from '../../infrastructure/firebase.config';
import { Review } from './review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly applicationService = inject(ApplicationService);
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

  async createReview(tripId: string, rating: number, comment?: string): Promise<boolean> {
    const user = this.authService.currentUser();
    const role = this.authService.currentRole();
    if (!user || role !== 'explorer') return false;

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