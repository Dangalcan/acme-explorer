import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, signal } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Trip, TRIP_CANCELLATION_VALIDATION } from '../trip.model';
import { FechasPipe } from '../../../shared/pipes/fechas.pipe';
import { AppCurrencyPipe } from '../../../shared/pipes/currency.pipe';
import { DescriptionPipe } from '../../../shared/pipes/description.pipe';
import { DificultadPipe } from '../../../shared/pipes/dificultad.pipe';
import { SoldOutPipe } from '../../../shared/pipes/sold-out.pipe';
import { SoldOutClassPipe } from '../../../shared/pipes/sold-out-class.pipe';
import { FavouritesService } from '../../favourites/favourites.service';
import { FavouriteList } from '../../favourites/favourite-list.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ApplicationService } from '../../applications/application.service';
import { APPLICATION_VALIDATION } from '../../applications/application.model';
import { TripService } from '../trip.service';
import { WeatherWidgetComponent } from '../../../shared/weather/weather-widget.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Review, REVIEW_VALIDATION } from '../review.model';
import { ReviewService } from '../review.service';

@Component({
  selector: 'app-trip-card',
  imports: [
    DecimalPipe,
    NgClass,
    FormsModule,
    FechasPipe,
    AppCurrencyPipe,
    DescriptionPipe,
    DificultadPipe,
    SoldOutPipe,
    SoldOutClassPipe,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    WeatherWidgetComponent,
    TranslatePipe,
  ],
  templateUrl: './trip-card.component.html',
})
export class TripCardComponent {
  @Input({ required: true }) trip!: Trip;
  @Input() mode: 'list' | 'details' = 'list';
  @Input() reviews: Review[] = [];
  @Input() enableFavouriteControls = false;
  @Input() favouritePanelOpen = false;

  @Output() favouritePanelToggle = new EventEmitter<string>();
  @Output() favouritePanelClose = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<Trip>();
  @Output() apply = new EventEmitter<Trip>();
  @Output() view = new EventEmitter<Trip>();

  private authService = inject(AuthService);
  private favouritesService = inject(FavouritesService);
  private applicationService = inject(ApplicationService);
  private tripService = inject(TripService);
  private reviewService = inject(ReviewService);
  private elementRef = inject(ElementRef);
  private translate = inject(TranslateService);

  currentRole = this.authService.currentRole;
  favouriteLists = this.favouritesService.favouriteLists;

  readonly today = new Date();

  readonly reviewValidation = REVIEW_VALIDATION;
  readonly cancellationValidation = TRIP_CANCELLATION_VALIDATION;
  readonly ratingStars = Array.from(
    { length: REVIEW_VALIDATION.rating.max - REVIEW_VALIDATION.rating.min + 1 },
    (_, i) => REVIEW_VALIDATION.rating.min + i,
  );

  readonly difficultyConfig = {
    EASY: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HARD: 'bg-red-100 text-red-700',
  };

  readonly isFavouritePanelOpenLocal = signal(false);
  readonly selectedFavouriteListId = signal('');
  readonly favouriteError = signal<string | null>(null);

  // Apply panel state
  readonly isApplyPanelOpen = signal(false);
  readonly applyComment = signal('');
  readonly applyError = signal<string | null>(null);
  readonly isApplying = signal(false);

  openApplyPanel(event: Event): void {
    event.stopPropagation();
    this.applyComment.set('');
    this.applyError.set(null);
    this.isApplyPanelOpen.set(true);
  }

  closeApplyPanel(event?: Event): void {
    event?.stopPropagation();
    this.isApplyPanelOpen.set(false);
    this.applyComment.set('');
    this.applyError.set(null);
  }

  async confirmApply(event: Event): Promise<void> {
    event.stopPropagation();
    this.isApplying.set(true);
    const comment = this.applyComment().trim() || undefined;

    if (comment && comment.length > APPLICATION_VALIDATION.comments.maxLength) {
      this.applyError.set(this.translate.instant('applications.error.comments_max_length', { max: APPLICATION_VALIDATION.comments.maxLength }));
      this.isApplying.set(false);
      return;
    }

    const success = await this.applicationService.applyForTrip(this.trip, comment);
    this.isApplying.set(false);
    if (success) {
      this.isApplyPanelOpen.set(false);
      this.applyComment.set('');
    } else {
      this.applyError.set(this.translate.instant('trips.card.apply_failed'));
    }
  }

  // Cancel panel state
  readonly isCancelPanelOpen = signal(false);
  readonly cancelReason = signal('');
  readonly cancelReasonError = signal<string | null>(null);
  readonly isCancelling = signal(false);

  canCancelTrip(): boolean {
    return this.tripService.canCancelTrip(this.trip.id);
  }

  openCancelPanel(event: Event): void {
    event.stopPropagation();
    this.cancelReason.set('');
    this.cancelReasonError.set(null);
    this.isCancelPanelOpen.set(true);
  }

  closeCancelPanel(event?: Event): void {
    event?.stopPropagation();
    this.isCancelPanelOpen.set(false);
    this.cancelReason.set('');
    this.cancelReasonError.set(null);
  }

  async confirmCancel(event: Event): Promise<void> {
    event.stopPropagation();
    const reason = this.cancelReason().trim();

    if (!reason) {
      this.cancelReasonError.set(this.translate.instant('trips.card.cancel_reason_required'));
      return;
    }

    if (reason.length > TRIP_CANCELLATION_VALIDATION.reason.maxLength) {
      this.cancelReasonError.set(this.translate.instant('trips.card.cancel_reason_max_length', { max: TRIP_CANCELLATION_VALIDATION.reason.maxLength }));
      return;
    }

    this.isCancelling.set(true);
    const success = await this.tripService.cancelTrip(this.trip.id, reason);
    this.isCancelling.set(false);

    if (success) {
      this.isCancelPanelOpen.set(false);
      this.cancelReason.set('');
    } else {
      this.cancelReasonError.set(this.translate.instant('trips.card.cancel_failed'));
    }
  }

  isUpcomingSoon(): boolean {
    if (this.trip.cancellation) return false;
    const now = Date.now();
    const start = new Date(this.trip.startDate).getTime();
    return start > now && start <= now + 7 * 24 * 60 * 60 * 1000;
  }

  getTotalPrice(trip: Trip): number {
    return trip.totalPrice ?? trip.stages.reduce((sum, s) => sum + s.price, 0);
  }

  getDuration(trip: Trip): number {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  canShowFavouriteButton(): boolean {
    return this.enableFavouriteControls && this.currentRole() === 'explorer';
  }

  getAvailableFavouriteLists(): FavouriteList[] {
    return this.favouriteLists().filter(list => !this.favouritesService.isTripInList(list.id, this.trip.id));
  }

  private isTripStartTodayOrPast(): boolean {
    const tripStart = new Date(this.trip.startDate);
    tripStart.setHours(0, 0, 0, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return tripStart <= todayStart;
  }

  isApplyDisabled(): boolean {
    if (this.currentRole() === 'manager') return true;
    if (this.trip.cancellation) return true;
    if (this.trip.availablePlaces !== undefined && this.trip.availablePlaces <= 0) return true;
    if (this.isTripStartTodayOrPast()) return true;
    return !this.applicationService.canApplyForTrip(this.trip);
  }

  applyButtonLabel(): string {
    if (this.currentRole() === 'manager') return this.translate.instant('trips.card.apply');
    if (this.trip.cancellation) return this.translate.instant('trips.card.unavailable');
    if (this.isTripStartTodayOrPast()) return this.translate.instant('trips.card.started');
    if (this.trip.availablePlaces !== undefined && this.trip.availablePlaces <= 0) return this.translate.instant('trips.card.sold_out');
    if (this.applicationService.hasActiveApplicationForTrip(this.trip.id)) return this.translate.instant('trips.card.applied');
    return this.translate.instant('trips.card.apply');
  }

  toggleFavouritePanel(event: Event): void {
    event.stopPropagation();

    const lists = this.favouriteLists();
    const availableLists = this.getAvailableFavouriteLists();

    if (lists.length === 0) {
      this.favouriteError.set(this.translate.instant('favourites.errors.no_lists'));
      if (this.mode === 'list') this.favouritePanelToggle.emit(this.trip.id);
      else this.isFavouritePanelOpenLocal.set(true);
      return;
    }

    if (availableLists.length === 0) {
      this.favouriteError.set(this.translate.instant('favourites.errors.already_saved'));
      if (this.mode === 'list') this.favouritePanelToggle.emit(this.trip.id);
      else this.isFavouritePanelOpenLocal.set(true);
      return;
    }

    this.favouriteError.set(null);
    this.selectedFavouriteListId.set('');

    if (this.mode === 'list') this.favouritePanelToggle.emit(this.trip.id);
    else this.isFavouritePanelOpenLocal.update(value => !value);
  }

  closeFavouritePanel(event?: Event): void {
    event?.stopPropagation();
    this.selectedFavouriteListId.set('');
    this.favouriteError.set(null);
    if (this.mode === 'list') this.favouritePanelClose.emit();
    else this.isFavouritePanelOpenLocal.set(false);
  }

  updateSelectedFavouriteList(listId: string, event?: Event): void {
    event?.stopPropagation();
    this.selectedFavouriteListId.set(listId);
    this.favouriteError.set(null);
  }

  async saveToFavouriteList(event: Event): Promise<void> {
    event.stopPropagation();
    const listId = this.selectedFavouriteListId();
    if (!listId) {
      this.favouriteError.set(this.translate.instant('favourites.errors.select_list'));
      return;
    }
    await this.favouritesService.addTripToList(listId, this.trip.id);
    this.closeFavouritePanel();
  }

  isFavouritePanelVisible(): boolean {
    return this.mode === 'list' ? this.favouritePanelOpen : this.isFavouritePanelOpenLocal();
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: Event): void {
    if (this.mode !== 'list') return;
    if (!this.favouritePanelOpen) return;
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) this.closeFavouritePanel();
  }

  // ── Review edit / delete ────────────────────────────────────────────────────

  readonly editingReviewId  = signal<string | null>(null);
  readonly editRating       = signal(0);
  readonly editComment      = signal('');
  readonly isSavingReview   = signal(false);
  readonly isDeletingReview = signal(false);
  readonly reviewActionError = signal<string | null>(null);

  canModifyReview(review: Review): boolean {
    return this.reviewService.canModifyReview(review.id);
  }

  startEditReview(review: Review): void {
    this.editingReviewId.set(review.id);
    this.editRating.set(review.rating);
    this.editComment.set(review.comment ?? '');
    this.reviewActionError.set(null);
  }

  cancelEditReview(): void {
    this.editingReviewId.set(null);
    this.reviewActionError.set(null);
  }

  setEditRating(star: number): void {
    this.editRating.set(star);
  }

  async saveEditReview(reviewId: string): Promise<void> {
    const rating = this.editRating();
    if (rating < REVIEW_VALIDATION.rating.min || rating > REVIEW_VALIDATION.rating.max) {
      this.reviewActionError.set('reviews.error.rating_required');
      return;
    }
    this.isSavingReview.set(true);
    this.reviewActionError.set(null);
    const ok = await this.reviewService.updateReview(
      reviewId, rating, this.editComment().trim() || undefined,
    );
    this.isSavingReview.set(false);
    if (ok) {
      this.editingReviewId.set(null);
    } else {
      this.reviewActionError.set('reviews.error.edit_failed');
    }
  }

  async deleteReview(reviewId: string): Promise<void> {
    this.isDeletingReview.set(true);
    this.reviewActionError.set(null);
    const ok = await this.reviewService.deleteReview(reviewId);
    this.isDeletingReview.set(false);
    if (!ok) {
      this.reviewActionError.set('reviews.error.delete_failed');
    }
  }
}
