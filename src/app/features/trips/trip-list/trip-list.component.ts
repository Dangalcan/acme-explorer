import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { TripService } from '../trip.service';
import { Trip } from '../trip.model';
import { ApplicationService } from '../../applications/application.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-trip-list',
  imports: [TripCardComponent, TranslatePipe, RouterLink, FormsModule],
  templateUrl: './trip-list.component.html',
})
export class TripListComponent {
  private tripService = inject(TripService);
  private router = inject(Router);
  private applicationService = inject(ApplicationService);
  private authService = inject(AuthService);

  readonly currentRole = this.authService.currentRole;

  readonly searchKeyword = signal('');

  readonly filteredTrips = computed(() => {
    const kw = this.searchKeyword().trim().toLowerCase();
    const trips = this.tripService.trips();
    if (!kw) return trips;
    return trips.filter(t =>
      t.ticker.toLowerCase().includes(kw) ||
      t.title.toLowerCase().includes(kw) ||
      t.description.toLowerCase().includes(kw)
    );
  });

  readonly openFavouriteTripId = signal<string | null>(null);

  clearSearch(): void {
    this.searchKeyword.set('');
  }

  applyTrip(trip: Trip): void {
    void this.applicationService.applyForTrip(trip);
  }

  viewTrip(trip: Trip): void {
    this.router.navigate(['/trips', trip.id]);
  }

  toggleFavouritePanel(tripId: string): void {
    this.openFavouriteTripId.update(current => current === tripId ? null : tripId);
  }

  closeFavouritePanel(): void {
    this.openFavouriteTripId.set(null);
  }
}