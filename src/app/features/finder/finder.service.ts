import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { TripService } from '../trips/trip.service';
import { FINDER_DEFAULTS, Finder } from './finder.model';
import { Trip } from '../trips/trip.model';

@Injectable({
  providedIn: 'root',
})
export class FinderService {
  private readonly authService = inject(AuthService);
  private readonly tripService = inject(TripService);

  readonly currentExplorerId = computed(() => {
    const user = this.authService.currentUser();
    const role = this.authService.currentRole();
    if (!user || role !== 'explorer') return null;
    return user.uid;
  });

  readonly finder = signal<Finder>({
    id: 'finder-current',
    version: 0,
    explorerId: '',
    keyword: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    startDate: undefined,
    endDate: undefined,
    difficulty: undefined,
    cacheTimeHours: FINDER_DEFAULTS.cacheTimeHours,
    maxResults: FINDER_DEFAULTS.maxResults,
    cachedAt: undefined,
  });

  readonly results = computed(() => {
    const explorerId = this.currentExplorerId();
    const finder = this.finder();
    const trips = this.tripService.trips();

    if (!explorerId) return [];

    const keyword = finder.keyword?.trim().toLowerCase();
    const minPrice = finder.minPrice;
    const maxPrice = finder.maxPrice;
    const startDate = finder.startDate;
    const endDate = finder.endDate;
    const difficulty = finder.difficulty;

    return trips
      .filter((trip) => this.matchesKeyword(trip, keyword))
      .filter((trip) => this.matchesPrice(trip, minPrice, maxPrice))
      .filter((trip) => this.matchesDateRange(trip, startDate, endDate))
      .filter((trip) => this.matchesDifficulty(trip, difficulty))
      .slice(0, finder.maxResults);
  });

  syncExplorerId(): void {
    const explorerId = this.currentExplorerId();
    if (!explorerId) return;

    this.finder.update((finder) => ({
      ...finder,
      explorerId,
    }));
  }

  updateFinder(patch: Partial<Finder>): void {
    this.syncExplorerId();

    this.finder.update((finder) => ({
      ...finder,
      ...patch,
      version: finder.version + 1,
    }));
  }

  resetFinder(): void {
    const explorerId = this.currentExplorerId() ?? '';

    this.finder.set({
      id: 'finder-current',
      version: 0,
      explorerId,
      keyword: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      startDate: undefined,
      endDate: undefined,
      difficulty: undefined,
      cacheTimeHours: FINDER_DEFAULTS.cacheTimeHours,
      maxResults: FINDER_DEFAULTS.maxResults,
      cachedAt: undefined,
    });
  }

  private matchesKeyword(trip: Trip, keyword?: string): boolean {
    if (!keyword) return true;

    return (
      trip.ticker.toLowerCase().includes(keyword) ||
      trip.title.toLowerCase().includes(keyword) ||
      trip.description.toLowerCase().includes(keyword)
    );
  }

  private matchesPrice(trip: Trip, minPrice?: number, maxPrice?: number): boolean {
    const totalPrice = trip.totalPrice ?? trip.stages.reduce((sum, stage) => sum + stage.price, 0);

    if (minPrice !== undefined && totalPrice < minPrice) return false;
    if (maxPrice !== undefined && totalPrice > maxPrice) return false;

    return true;
  }

  private matchesDateRange(trip: Trip, startDate?: Date, endDate?: Date): boolean {
    const tripStart = new Date(trip.startDate);

    if (startDate && tripStart < startDate) return false;
    if (endDate && tripStart > endDate) return false;

    return true;
  }

  private matchesDifficulty(trip: Trip, difficulty?: Finder['difficulty']): boolean {
    if (!difficulty) return true;
    return trip.difficultyLevel === difficulty;
  }
}