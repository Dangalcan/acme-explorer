import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase.config';
import { AuthService } from '../../core/services/auth.service';
import { TripService } from '../trips/trip.service';
import { FINDER_DEFAULTS, FINDER_VALIDATION, Finder } from './finder.model';
import { Trip } from '../trips/trip.model';

@Injectable({
  providedIn: 'root',
})
export class FinderService {
  private readonly authService = inject(AuthService);
  private readonly tripService = inject(TripService);
  private readonly translate = inject(TranslateService);
  private readonly storageKeyPrefix = 'acme-explorer.finder';
  private readonly resultsCacheKeyPrefix = 'acme-explorer.finder.results';
  private readonly cachedResults = signal<Trip[]>([]);

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

    return this.translate.instant('finder.error.invalid_date_range');
  });

  readonly priceRangeError = computed(() => {
    const { minPrice, maxPrice } = this.finder();

    if (minPrice === undefined || maxPrice === undefined) return null;
    if (minPrice <= maxPrice) return null;

    return this.translate.instant('finder.error.invalid_price_range');
  });

  readonly minPriceError = computed(() => {
    const { minPrice } = this.finder();
    if (minPrice === undefined) return null;
    if (minPrice < FINDER_VALIDATION.minPrice.min)
      return this.translate.instant('finder.error.min_price_negative');
    return null;
  });

  readonly maxPriceError = computed(() => {
    const { maxPrice } = this.finder();
    if (maxPrice === undefined) return null;
    if (maxPrice < FINDER_VALIDATION.maxPrice.min)
      return this.translate.instant('finder.error.max_price_negative');
    return null;
  });

  readonly results = computed(() => this.cachedResults());

  constructor() {
    effect(() => {
      const explorerId = this.currentExplorerId();
      if (!explorerId) return;
      if (this.finder().explorerId === explorerId) return;
      this.loadFromLocalStorage();
      void this.loadFromFirestore(explorerId);
    });

    effect(() => {
      const explorerId = this.currentExplorerId();
      const finder = this.finder();
      const trips = this.tripService.trips();
      const dateError = this.dateRangeError();
      const priceError = this.priceRangeError();

      if (!explorerId || dateError || priceError || this.minPriceError() || this.maxPriceError()) {
        this.cachedResults.set([]);
        return;
      }

      const cached = this.loadResultsCache(explorerId, finder);
      if (cached) {
        this.cachedResults.set(cached);
        return;
      }

      const freshResults = this.computeResults(trips, finder);
      this.cachedResults.set(freshResults);

      this.saveResultsCache(explorerId, finder, freshResults);
    });
  }

  syncExplorerId(): void {
    const explorerId = this.currentExplorerId();
    if (!explorerId) return;

    if (this.finder().explorerId === explorerId) return;

    this.loadFromLocalStorage();
    void this.loadFromFirestore(explorerId);
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
    const current = this.finder();
    const explorerId = this.currentExplorerId() ?? current.explorerId;

    this.finder.set({
      ...current,
      explorerId,
      keyword: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      startDate: undefined,
      endDate: undefined,
      difficulty: undefined,
      cachedAt: undefined,
      version: current.version + 1,
    });

    this.saveToLocalStorage();
    void this.saveToFirestore();
  }

  async persistFinder(): Promise<void> {
    return this.saveToFirestore();
  }

  async getAllFinders(): Promise<Finder[]> {
    try {
      const snap = await getDocs(collection(db, 'finders'));
      return snap.docs.map(d => {
        const parsed = d.data() as Partial<Finder & { startDate?: string; endDate?: string }>;
        return {
          id: d.id,
          version: typeof parsed.version === 'number' ? parsed.version : 0,
          explorerId: parsed.explorerId ?? d.id,
          keyword: parsed.keyword ?? undefined,
          minPrice: parsed.minPrice ?? undefined,
          maxPrice: parsed.maxPrice ?? undefined,
          startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
          endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
          difficulty: parsed.difficulty ?? undefined,
          cacheTimeHours: typeof parsed.cacheTimeHours === 'number' ? parsed.cacheTimeHours : FINDER_DEFAULTS.cacheTimeHours,
          maxResults: typeof parsed.maxResults === 'number' ? parsed.maxResults : FINDER_DEFAULTS.maxResults,
          cachedAt: undefined,
        };
      });
    } catch {
      return [];
    }
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
      tripStart.getDate(),
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

  private toFirestorePayload(): Record<string, unknown> {
    const finder = this.finder();
    const raw: Record<string, unknown> = {
      explorerId:     finder.explorerId,
      version:        finder.version,
      cacheTimeHours: finder.cacheTimeHours,
      maxResults:     finder.maxResults,
      keyword:        finder.keyword,
      minPrice:       finder.minPrice,
      maxPrice:       finder.maxPrice,
      startDate:      finder.startDate ? finder.startDate.toISOString() : undefined,
      endDate:        finder.endDate   ? finder.endDate.toISOString()   : undefined,
      difficulty:     finder.difficulty,
    };
    return Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined));
  }

  private saveToFirestore(): Promise<void> {
    const explorerId = this.currentExplorerId();
    if (!explorerId) return Promise.resolve();
    return setDoc(doc(db, 'finders', explorerId), this.toFirestorePayload(), { merge: true });
  }

  private async loadFromFirestore(explorerId: string): Promise<void> {
    try {
      const snap = await getDoc(doc(db, 'finders', explorerId));
      if (!snap.exists()) return;

      const parsed = snap.data() as Partial<Finder & { startDate?: string; endDate?: string }>;

      this.finder.set({
        id: 'finder-current',
        version:        typeof parsed.version === 'number' ? parsed.version : 0,
        explorerId,
        keyword:        parsed.keyword    ?? undefined,
        minPrice:       parsed.minPrice   ?? undefined,
        maxPrice:       parsed.maxPrice   ?? undefined,
        startDate:      parsed.startDate  ? new Date(parsed.startDate) : undefined,
        endDate:        parsed.endDate    ? new Date(parsed.endDate)   : undefined,
        difficulty:     parsed.difficulty ?? undefined,
        cacheTimeHours: typeof parsed.cacheTimeHours === 'number' ? parsed.cacheTimeHours : FINDER_DEFAULTS.cacheTimeHours,
        maxResults:     typeof parsed.maxResults === 'number'     ? parsed.maxResults     : FINDER_DEFAULTS.maxResults,
        cachedAt: undefined,
      });

      this.saveToLocalStorage();
    } catch {
      // silently ignore — localStorage value stands
    }
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
      this.setFinderDefaults(explorerId);
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
          typeof parsed.maxResults === 'number' ? parsed.maxResults : FINDER_DEFAULTS.maxResults,
      });
    } catch {
      this.setFinderDefaults(explorerId);
    }
  }

  private setFinderDefaults(explorerId: string): void {
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

  private getResultsCacheKey(explorerId: string): string {
    return `${this.resultsCacheKeyPrefix}.${explorerId}`;
  }

  private getCriteriaSignature(finder: Finder): string {
    return JSON.stringify({
      keyword: finder.keyword ?? null,
      minPrice: finder.minPrice ?? null,
      maxPrice: finder.maxPrice ?? null,
      startDate: finder.startDate ? this.toDateOnlyString(finder.startDate) : null,
      endDate: finder.endDate ? this.toDateOnlyString(finder.endDate) : null,
      difficulty: finder.difficulty ?? null,
      maxResults: finder.maxResults,
    });
  }

  private toDateOnlyString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private computeResults(trips: Trip[], finder: Finder): Trip[] {
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
  }

  private saveResultsCache(explorerId: string, finder: Finder, results: Trip[]): void {
    if (typeof localStorage === 'undefined') return;

    const payload = {
      criteriaSignature: this.getCriteriaSignature(finder),
      cachedAt: new Date().toISOString(),
      results: results.map((trip) => ({
        ...trip,
        startDate: trip.startDate.toISOString(),
        endDate: trip.endDate.toISOString(),
        cancellation: trip.cancellation
          ? {
              ...trip.cancellation,
              cancelledAt: trip.cancellation.cancelledAt.toISOString(),
            }
          : undefined,
      })),
    };

    localStorage.setItem(this.getResultsCacheKey(explorerId), JSON.stringify(payload));
  }

  private loadResultsCache(explorerId: string, finder: Finder): Trip[] | null {
    if (typeof localStorage === 'undefined') return null;

    const raw = localStorage.getItem(this.getResultsCacheKey(explorerId));
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as {
        criteriaSignature?: string;
        cachedAt?: string;
        results?: Array<Record<string, unknown>>;
      };

      if (!parsed.criteriaSignature || !parsed.cachedAt || !Array.isArray(parsed.results)) {
        return null;
      }

      if (parsed.criteriaSignature !== this.getCriteriaSignature(finder)) {
        return null;
      }

      const cachedAt = new Date(parsed.cachedAt);
      const ttlMs = finder.cacheTimeHours * 60 * 60 * 1000;
      const expired = Date.now() - cachedAt.getTime() > ttlMs;

      if (expired) {
        return null;
      }

      return parsed.results.map((trip) => {
        const cancellationRaw =
          trip['cancellation'] && typeof trip['cancellation'] === 'object'
            ? (trip['cancellation'] as Record<string, unknown>)
            : null;

        return {
          ...(trip as unknown as Trip),
          startDate: new Date(trip['startDate'] as string),
          endDate: new Date(trip['endDate'] as string),
          cancellation: cancellationRaw
            ? {
                reason: String(cancellationRaw['reason'] ?? ''),
                cancelledAt: new Date(String(cancellationRaw['cancelledAt'] ?? '')),
              }
            : undefined,
        };
      });
    } catch {
      return null;
    }
  }
}
