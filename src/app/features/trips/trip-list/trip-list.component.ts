import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { TripService } from '../trip.service';
import { Trip } from '../trip.model';

@Component({
  selector: 'app-trip-list',
  imports: [TripCardComponent],
  templateUrl: './trip-list.component.html',
})
export class TripListComponent {
  private tripService = inject(TripService);
  private router = inject(Router);

  availableTrips = this.tripService.trips;

  readonly openFavouriteTripId = signal<string | null>(null);

  cancelTrip(trip: Trip): void {
    this.tripService.cancelTrip(trip.id);
  }

  applyTrip(trip: Trip): void {
    // Placeholder — will be wired to ApplicationService in a future iteration
    console.log('Apply for trip:', trip.id, trip.title);
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