import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Trip } from '../trip.model';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { DifficultyClassPipe } from '../../../shared/pipes/difficulty-class.pipe';

@Component({
  selector: 'app-trip-card',
  imports: [DatePipe, CurrencyPipe, TruncatePipe, DifficultyClassPipe],
  templateUrl: './trip-card.component.html',
})
export class TripCardComponent {
  @Input({ required: true }) trip!: Trip;
  @Output() cancel = new EventEmitter<Trip>();
  @Output() apply = new EventEmitter<Trip>();
  @Output() view = new EventEmitter<Trip>();

  private authService = inject(AuthService);
  currentRole = this.authService.currentRole;

  getTotalPrice(trip: Trip): number {
    return trip.totalPrice ?? trip.stages.reduce((sum, s) => sum + s.price, 0);
  }

  getDuration(trip: Trip): number {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  }
}
