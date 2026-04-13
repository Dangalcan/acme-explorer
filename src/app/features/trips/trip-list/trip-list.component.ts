import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { TripService } from '../trip.service';
import { Trip } from '../trip.model';
import { ApplicationService } from '../../applications/application.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-trip-list',
  imports: [TripCardComponent, TranslatePipe],
  templateUrl: './trip-list.component.html',
})
export class TripListComponent {
  private tripService = inject(TripService);
  private router = inject(Router);
  private applicationService = inject(ApplicationService);

  availableTrips = this.tripService.trips;

  readonly openFavouriteTripId = signal<string | null>(null);

  cancelTrip(trip: Trip): void {
    void this.tripService.cancelTrip(trip.id);
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