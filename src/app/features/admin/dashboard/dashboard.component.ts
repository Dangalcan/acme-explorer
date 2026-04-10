import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { TripService } from '../../trips/trip.service';
import { ApplicationService } from '../../applications/application.service';
import { AppStatus } from '../../applications/application.model';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DecimalPipe, PercentPipe, TranslatePipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly tripService = inject(TripService);
  private readonly applicationService = inject(ApplicationService);

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
