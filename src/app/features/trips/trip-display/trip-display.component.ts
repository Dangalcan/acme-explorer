import { Component } from '@angular/core';
import { type Trip } from '../trip.model';

@Component({
  selector: 'app-trip-display',
  imports: [],
  templateUrl: './trip-display.component.html',
  styleUrl: './trip-display.component.scss',
})

export class TripDisplayComponent {

  trip: Trip = {
    id: '1',
    version: 0,
    ticker: 'TRIP-0001',
    title: 'Adventure in the Alps',
    description: 'A breathtaking journey through the Swiss Alps.',
    price: 1200,
    location: { city: 'Zurich', country: 'Switzerland' },
    difficulty: 'medium',
    maxParticipants: 20,
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-10'),
    pictures: [],
  };

  get duration() {
    const start: Date = new Date(this.trip.startDate);
    const end: Date = new Date(this.trip.endDate);
    const ms: number = end.getTime() - start.getTime();
    return ms / (1000 * 60 * 60 * 24);
  }

}