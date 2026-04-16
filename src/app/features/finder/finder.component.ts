import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinderService } from './finder.service';
import { TripCardComponent } from '../trips/trip-card/trip-card.component';
import { DifficultyLevel } from '../trips/trip.model';

@Component({
  selector: 'app-finder',
  standalone: true,
  imports: [FormsModule, TripCardComponent],
  templateUrl: './finder.component.html',
})
export class FinderComponent {
  readonly finderService = inject(FinderService);

  readonly finder = this.finderService.finder;
  readonly results = this.finderService.results;

  readonly difficulties: DifficultyLevel[] = ['EASY', 'MEDIUM', 'HARD'];

  readonly hasResults = computed(() => this.results().length > 0);

  constructor() {
    this.finderService.syncExplorerId();
  }

  onKeywordChange(value: string): void {
    this.finderService.updateFinder({
      keyword: value.trim() ? value : undefined,
    });
  }

  onMinPriceChange(value: string): void {
    this.finderService.updateFinder({
      minPrice: value === '' ? undefined : Number(value),
    });
  }

  onMaxPriceChange(value: string): void {
    this.finderService.updateFinder({
      maxPrice: value === '' ? undefined : Number(value),
    });
  }

  onStartDateChange(value: string): void {
    this.finderService.updateFinder({
      startDate: value ? new Date(value) : undefined,
    });
  }

  onEndDateChange(value: string): void {
    this.finderService.updateFinder({
      endDate: value ? new Date(value) : undefined,
    });
  }

  onDifficultyChange(value: string): void {
    this.finderService.updateFinder({
      difficulty: value ? (value as DifficultyLevel) : undefined,
    });
  }

  reset(): void {
    this.finderService.resetFinder();
  }

  toDateInputValue(date?: Date): string {
    return date ? date.toISOString().slice(0, 10) : '';
  }
}