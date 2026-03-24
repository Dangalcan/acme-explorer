import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Trip } from '../trip.model';

@Component({
  selector: 'app-trip-card',
  imports: [DatePipe],
  templateUrl: './trip-card.component.html',
})
export class TripCardComponent {
  @Input({ required: true }) trip!: Trip;
  @Input() mode: 'list' | 'details' = 'list';
  @Input() reviews: any[] = [];
  @Output() cancel = new EventEmitter<Trip>();
  @Output() apply = new EventEmitter<Trip>();
  @Output() view = new EventEmitter<Trip>();

  private authService = inject(AuthService);
  currentRole = this.authService.currentRole;

  readonly difficultyConfig = {
    EASY:   { label: 'Easy',   classes: 'bg-green-100 text-green-700' },
    MEDIUM: { label: 'Medium', classes: 'bg-yellow-100 text-yellow-700' },
    HARD:   { label: 'Hard',   classes: 'bg-red-100 text-red-700' },
  };

  getTotalPrice(trip: Trip): number {
    return trip.totalPrice ?? trip.stages.reduce((sum, s) => sum + s.price, 0);
  }

  getDuration(trip: Trip): number {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
}

