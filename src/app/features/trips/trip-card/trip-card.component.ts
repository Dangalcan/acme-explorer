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
  ],
  templateUrl: './trip-card.component.html',
})
export class TripCardComponent {
  @Input({ required: true }) trip!: Trip;
  @Input() mode: 'list' | 'details' = 'list';
  @Input() reviews: any[] = [];
  @Input() enableFavouriteControls = false;
  @Input() favouritePanelOpen = false;

  @Output() favouritePanelToggle = new EventEmitter<string>();
  @Output() favouritePanelClose = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<Trip>();
  @Output() apply = new EventEmitter<Trip>();
  @Output() view = new EventEmitter<Trip>();

  private authService = inject(AuthService);
  private favouritesService = inject(FavouritesService);
  private elementRef = inject(ElementRef);

  currentRole = this.authService.currentRole;
  favouriteLists = this.favouritesService.favouriteLists;

  readonly difficultyConfig = {
    EASY: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HARD: 'bg-red-100 text-red-700',
  };

  readonly isFavouritePanelOpenLocal = signal(false);
  readonly selectedFavouriteListId = signal('');
  readonly favouriteError = signal<string | null>(null);

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

  toggleFavouritePanel(event: Event): void {
    event.stopPropagation();

    const lists = this.favouriteLists();
    const availableLists = this.getAvailableFavouriteLists();

    if (lists.length === 0) {
      this.favouriteError.set($localize`:@@favourites.trip.noLists:You must create a favourite list first.`);
      if (this.mode === 'list') {
        this.favouritePanelToggle.emit(this.trip.id);
      } else {
        this.isFavouritePanelOpenLocal.set(true);
      }
      return;
    }

    if (availableLists.length === 0) {
      this.favouriteError.set($localize`:@@favourites.trip.alreadySavedEverywhere:This trip is already in all your favourite lists.`);
      if (this.mode === 'list') {
        this.favouritePanelToggle.emit(this.trip.id);
      } else {
        this.isFavouritePanelOpenLocal.set(true);
      }
      return;
    }

    this.favouriteError.set(null);
    this.selectedFavouriteListId.set('');

    if (this.mode === 'list') {
      this.favouritePanelToggle.emit(this.trip.id);
    } else {
      this.isFavouritePanelOpenLocal.update(value => !value);
    }
  }

  closeFavouritePanel(event?: Event): void {
    event?.stopPropagation();
    this.selectedFavouriteListId.set('');
    this.favouriteError.set(null);

    if (this.mode === 'list') {
      this.favouritePanelClose.emit();
    } else {
      this.isFavouritePanelOpenLocal.set(false);
    }
  }

  updateSelectedFavouriteList(listId: string, event?: Event): void {
    event?.stopPropagation();
    this.selectedFavouriteListId.set(listId);
    this.favouriteError.set(null);
  }

  saveToFavouriteList(event: Event): void {
    event.stopPropagation();

    const listId = this.selectedFavouriteListId();

    if (!listId) {
      this.favouriteError.set($localize`:@@favourites.trip.selectList:Please select a list.`);
      return;
    }

    this.favouritesService.addTripToList(listId, this.trip.id);
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
    if (!clickedInside) {
      this.closeFavouritePanel();
    }
  }
}