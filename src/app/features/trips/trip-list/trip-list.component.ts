import { Component, inject } from '@angular/core';
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
}
