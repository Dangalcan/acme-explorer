import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, PercentPipe, isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { TripService } from '../../trips/trip.service';
import { ApplicationService } from '../../applications/application.service';
import { AppStatus } from '../../applications/application.model';
import { FavouritesService } from '../../favourites/favourites.service';
import { FavouriteList } from '../../favourites/favourite-list.model';
import { FinderService } from '../../finder/finder.service';
import { Finder } from '../../finder/finder.model';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DecimalPipe, PercentPipe, TranslatePipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly tripService = inject(TripService);
  private readonly applicationService = inject(ApplicationService);
  private readonly favouritesService = inject(FavouritesService);
  private readonly finderService = inject(FinderService);
  private readonly platformId = inject(PLATFORM_ID);

  // All favourite lists fetched from json-server for admin stats
  private readonly allFavouriteLists = signal<FavouriteList[]>([]);
  // All finders fetched from Firestore for B-level stats (req B16.1)
  private readonly allFinders = signal<Finder[]>([]);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      void this.favouritesService.getAllLists().then(lists => this.allFavouriteLists.set(lists));
      void this.finderService.getAllFinders().then(finders => this.allFinders.set(finders));
    }
  }

  readonly tripsPerManagerStats = computed(() => {
    const counts = new Map<string, number>();
    for (const trip of this.tripService.trips()) {
      counts.set(trip.managerId, (counts.get(trip.managerId) ?? 0) + 1);
    }
    return this.computeStats([...counts.values()]);
  });

  readonly applicationsPerTripStats = computed(() => {
    const counts = new Map<string, number>();
    for (const trip of this.tripService.trips()) {
      counts.set(trip.id, 0);
    }
    for (const app of this.applicationService.applications()) {
      counts.set(app.tripId, (counts.get(app.tripId) ?? 0) + 1);
    }
    return this.computeStats([...counts.values()]);
  });

  readonly availableSeatsThisMonth = computed(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return this.tripService.trips()
      .filter((t) => {
        const sd = new Date(t.startDate);
        return sd.getFullYear() === y && sd.getMonth() === m && sd > now;
      })
      .reduce((sum, t) => sum + (t.availablePlaces ?? 0), 0);
  });

  readonly currentYear = new Date().getFullYear();

  readonly monthKeys = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => `admin.dashboard.months.${i}`);

  readonly ALL_STATUSES: AppStatus[] = ['PENDING', 'REJECTED', 'DUE', 'ACCEPTED', 'CANCELLED'];

  readonly applicationStatusRatios = computed(() => {
    const apps = this.applicationService.applications();
    const total = apps.length;
    if (total === 0) return null;

    const counts = new Map<AppStatus, number>(
      this.ALL_STATUSES.map((s) => [s, 0]),
    );
    for (const app of apps) {
      counts.set(app.status, (counts.get(app.status) ?? 0) + 1);
    }
    return this.ALL_STATUSES.map((status) => ({
      status,
      ratio: (counts.get(status) ?? 0) / total,
    }));
  });

  readonly revenuePerMonth = computed(() => {
    const year = new Date().getFullYear();
    const revenue = new Array(12).fill(0) as number[];
    const trips = this.tripService.trips();

    const tripPrice = new Map(
      trips.map((t) => [t.id, t.totalPrice ?? t.stages.reduce((s, st) => s + st.price, 0)]),
    );

    for (const app of this.applicationService.applications()) {
      if (app.status !== 'ACCEPTED') continue;
      const trip = trips.find((t) => t.id === app.tripId);
      if (!trip) continue;
      const sd = new Date(trip.startDate);
      if (sd.getFullYear() !== year) continue;
      revenue[sd.getMonth()] += tripPrice.get(trip.id) ?? 0;
    }

    const max = Math.max(...revenue);
    return revenue.map((amount, i) => ({ month: i, amount, max }));
  });

  // ── A-level stats (req 24) ─────────────────────────────────────────────────

  /** Top 5 trips sorted by averageRating descending */
  readonly top5TripsByRating = computed(() =>
    [...this.tripService.trips()]
      .filter(t => t.averageRating !== undefined)
      .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
      .slice(0, 5),
  );

  /** Count of trips whose startDate falls within the next 7 days */
  readonly tripsStartingNext7Days = computed(() => {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return this.tripService.trips().filter(t => {
      const s = new Date(t.startDate);
      return s > now && s <= in7;
    }).length;
  });

  /** Number of trips starting each month in the current year */
  readonly tripsPerMonthCurrentYear = computed(() => {
    const year = new Date().getFullYear();
    const counts = new Array(12).fill(0) as number[];
    for (const trip of this.tripService.trips()) {
      const sd = new Date(trip.startDate);
      if (sd.getFullYear() === year) counts[sd.getMonth()]++;
    }
    const max = Math.max(...counts, 1);
    return counts.map((count, month) => ({ month, count, max }));
  });

  /** Top 3 trip IDs that appear in the most favourite lists */
  readonly top3TripsByFavourites = computed(() => {
    const counts = new Map<string, number>();
    for (const list of this.allFavouriteLists()) {
      for (const tripId of list.tripIds) {
        counts.set(tripId, (counts.get(tripId) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tripId, count]) => ({ trip: this.tripService.getById(tripId), count }))
      .filter((item): item is { trip: NonNullable<typeof item.trip>; count: number } => !!item.trip);
  });

  // ── B-level stats (req B16.1) ──────────────────────────────────────────────

  /** Average min and max price that explorers set in their finders */
  readonly finderAvgPriceRange = computed(() => {
    const finders = this.allFinders();
    const minPrices = finders.filter(f => f.minPrice !== undefined).map(f => f.minPrice!);
    const maxPrices = finders.filter(f => f.maxPrice !== undefined).map(f => f.maxPrice!);
    const avgMin = minPrices.length > 0 ? minPrices.reduce((s, v) => s + v, 0) / minPrices.length : null;
    const avgMax = maxPrices.length > 0 ? maxPrices.reduce((s, v) => s + v, 0) / maxPrices.length : null;
    if (avgMin === null && avgMax === null) return null;
    return { avgMin, avgMax };
  });

  /** Top 10 keywords used by explorers in their finders, sorted by frequency */
  readonly finderTop10Keywords = computed(() => {
    const counts = new Map<string, number>();
    for (const finder of this.allFinders()) {
      const kw = finder.keyword?.trim().toLowerCase();
      if (kw) counts.set(kw, (counts.get(kw) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
  });

  private computeStats(values: number[]) {
    if (values.length === 0) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return { min, max, avg, stdDev };
  }
}
