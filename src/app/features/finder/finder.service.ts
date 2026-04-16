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
  private readonly storageKeyPrefix = 'acme-explorer.finder';

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

  readonly dateRangeError = computed(() => {
    const { startDate, endDate } = this.finder();

    if (!startDate || !endDate) return null;
    if (startDate <= endDate) return null;

    return 'Start date must be before or equal to end date.';
  });

  readonly priceRangeError = computed(() => {
    const { minPrice, maxPrice } = this.finder();

    if (minPrice === undefined || maxPrice === undefined) return null;
    if (minPrice <= maxPrice) return null;

    return 'Min price must be less than or equal to max price.';
  });

  readonly results = computed(() => {
    const explorerId = this.currentExplorerId();
    const finder = this.finder();
    const trips = this.tripService.trips();

    if (!explorerId) return [];
    if (this.dateRangeError()) return [];
    if (this.priceRangeError()) return [];

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

    if (this.finder().explorerId === explorerId) return;

    this.loadFromLocalStorage();
  }

  updateFinder(patch: Partial<Finder>): void {
    this.syncExplorerId();

    this.finder.update((finder) => ({
        ...finder,
        ...patch,
        version: finder.version + 1,
    }));

    this.saveToLocalStorage();
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

    this.saveToLocalStorage();
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

    const normalizedTripStart = new Date(
        tripStart.getFullYear(),
        tripStart.getMonth(),
        tripStart.getDate()
    );

    const normalizedStartDate = startDate
        ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        : undefined;

    const normalizedEndDate = endDate
        ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
        : undefined;

    if (normalizedStartDate && normalizedTripStart < normalizedStartDate) return false;
    if (normalizedEndDate && normalizedTripStart > normalizedEndDate) return false;

    return true;
  }

  private matchesDifficulty(trip: Trip, difficulty?: Finder['difficulty']): boolean {
    if (!difficulty) return true;
    return trip.difficultyLevel === difficulty;
  }

  private getStorageKey(explorerId: string): string {
    return `${this.storageKeyPrefix}.${explorerId}`;
  }

  private saveToLocalStorage(): void {
    const explorerId = this.currentExplorerId();
    if (!explorerId || typeof localStorage === 'undefined') return;

    const finder = this.finder();

    const payload = {
        ...finder,
        startDate: finder.startDate ? finder.startDate.toISOString() : undefined,
        endDate: finder.endDate ? finder.endDate.toISOString() : undefined,
        cachedAt: finder.cachedAt ? finder.cachedAt.toISOString() : undefined,
    };

    localStorage.setItem(this.getStorageKey(explorerId), JSON.stringify(payload));
  }

  private loadFromLocalStorage(): void {
    const explorerId = this.currentExplorerId();
    if (!explorerId || typeof localStorage === 'undefined') return;

    const raw = localStorage.getItem(this.getStorageKey(explorerId));
    if (!raw) {
        this.resetFinder();
        return;
    }

    try {
        const parsed = JSON.parse(raw) as Partial<Finder>;

        this.finder.set({
        id: 'finder-current',
        version: typeof parsed.version === 'number' ? parsed.version : 0,
        explorerId,
        keyword: parsed.keyword ?? undefined,
        minPrice: parsed.minPrice ?? undefined,
        maxPrice: parsed.maxPrice ?? undefined,
        startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
        endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
        difficulty: parsed.difficulty ?? undefined,
        cacheTimeHours:
            typeof parsed.cacheTimeHours === 'number'
            ? parsed.cacheTimeHours
            : FINDER_DEFAULTS.cacheTimeHours,
        cachedAt: parsed.cachedAt ? new Date(parsed.cachedAt) : undefined,
        maxResults:
            typeof parsed.maxResults === 'number'
            ? parsed.maxResults
            : FINDER_DEFAULTS.maxResults,
        });
    } catch {
        this.resetFinder();
    }
  }

}