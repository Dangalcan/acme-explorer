import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FinderService } from './finder.service';
import { TripCardComponent } from '../trips/trip-card/trip-card.component';
import { DifficultyLevel, DIFFICULTY_LEVELS } from '../trips/trip.model';

@Component({
  selector: 'app-finder',
  standalone: true,
  imports: [FormsModule, TripCardComponent, TranslatePipe],
  templateUrl: './finder.component.html',
})
export class FinderComponent {
  readonly finderService = inject(FinderService);
  private readonly translate = inject(TranslateService);

  readonly finder = this.finderService.finder;
  readonly results = this.finderService.results;
  readonly dateRangeError = this.finderService.dateRangeError;
  readonly priceRangeError = this.finderService.priceRangeError;
  readonly minPriceError = this.finderService.minPriceError;
  readonly maxPriceError = this.finderService.maxPriceError;

  readonly difficulties = DIFFICULTY_LEVELS;

  readonly hasResults = computed(() => this.results().length > 0);
  readonly hasValidationError = computed(
    () =>
      !!this.dateRangeError() ||
      !!this.priceRangeError() ||
      !!this.minPriceError() ||
      !!this.maxPriceError(),
  );

  readonly maxResults = computed(() => this.finder().maxResults);
  readonly isLimited = computed(() => {
    const results = this.results();
    return results.length === this.finder().maxResults;
  });

  isSaving = signal(false);
  saveSuccess = signal('');
  saveError = signal('');

  constructor() {
    this.finderService.syncExplorerId();
  }

  onKeywordChange(value: string): void {
    this.finderService.updateFinder({
      keyword: value.trim() ? value : undefined,
    });
  }

  onMinPriceChange(value: string | number | null): void {
    this.finderService.updateFinder({
      minPrice: value === '' || value === null ? undefined : Number(value),
    });
  }

  onMaxPriceChange(value: string | number | null): void {
    this.finderService.updateFinder({
      maxPrice: value === '' || value === null ? undefined : Number(value),
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

  async save(): Promise<void> {
    if (this.hasValidationError()) return;
    this.saveSuccess.set('');
    this.saveError.set('');
    this.isSaving.set(true);
    try {
      await this.finderService.persistFinder();
      this.saveSuccess.set(this.translate.instant('finder.save_success'));
    } catch {
      this.saveError.set(this.translate.instant('finder.error.save_failed'));
    } finally {
      this.isSaving.set(false);
    }
  }

  reset(): void {
    this.saveSuccess.set('');
    this.saveError.set('');
    this.finderService.resetFinder();
  }

  toDateInputValue(date?: Date): string {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
