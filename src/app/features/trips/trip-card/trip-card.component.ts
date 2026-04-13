import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Trip } from '../trip.model';
import { FechasPipe } from '../../../shared/pipes/fechas.pipe';
import { AppCurrencyPipe } from '../../../shared/pipes/currency.pipe';
import { DescriptionPipe } from '../../../shared/pipes/description.pipe';
import { DificultadPipe } from '../../../shared/pipes/dificultad.pipe';
import { SoldOutPipe } from '../../../shared/pipes/sold-out.pipe';
import { FavouritesService } from '../../favourites/favourites.service';
import { FavouriteList } from '../../favourites/favourite-list.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ApplicationService } from '../../applications/application.service';
import { TripService } from '../trip.service';
import { WeatherWidgetComponent } from '../../../shared/weather/weather-widget.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Review } from '../review.model';

@Component({
  selector: 'app-trip-card',
  imports: [
    FormsModule,
    FechasPipe,
    AppCurrencyPipe,
    DescriptionPipe,
    DificultadPipe,
    SoldOutPipe,
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
  private elementRef = inject(ElementRef);
  private translate = inject(TranslateService);

  currentRole = this.authService.currentRole;
  favouriteLists = this.favouritesService.favouriteLists;

  readonly today = new Date();

  readonly difficultyConfig = {
    EASY: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HARD: 'bg-red-100 text-red-700',
  };

  readonly isFavouritePanelOpenLocal = signal(false);
  readonly selectedFavouriteListId = signal('');
  readonly favouriteError = signal<string | null>(null);

  // Cancel panel state
  readonly isCancelPanelOpen = signal(false);
  readonly cancelReason = signal('');
  readonly cancelReasonError = signal<string | null>(null);
  readonly isCancelling = signal(false);

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

  isApplyDisabled(): boolean {
    if (this.currentRole() === 'manager') return true;
    if (this.trip.cancellation) return true;
    if (this.trip.availablePlaces !== undefined && this.trip.availablePlaces <= 0) return true;
    return !this.applicationService.canApplyForTrip(this.trip);
  }

  applyButtonLabel(): string {
    if (this.currentRole() === 'manager') return this.translate.instant('trips.card.apply');
    if (this.trip.cancellation) return this.translate.instant('trips.card.unavailable');
    if (new Date(this.trip.startDate).getTime() <= Date.now()) return this.translate.instant('trips.card.started');
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
}
