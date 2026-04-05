import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TripCardComponent } from '../trips/trip-card/trip-card.component';
import { FavouritesService } from './favourites.service';
import { FavouriteList, FAVOURITE_LIST_VALIDATION } from './favourite-list.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-favourites-page',
  standalone: true,
  imports: [FormsModule, TripCardComponent],
  templateUrl: './favourites-page.component.html',
})
export class FavouritesPageComponent {
  private favouritesService = inject(FavouritesService);
  private router = inject(Router);

  readonly favouriteLists = this.favouritesService.favouriteLists;
  readonly maxNameLength = FAVOURITE_LIST_VALIDATION.name.maxLength;

  newListName = signal('');
  editingListId = signal<string | null>(null);
  editingName = signal('');

  selectedTripByListId = signal<Record<string, string>>({});

  readonly hasLists = computed(() => this.favouriteLists().length > 0);

  createList(): void {
    const name = this.newListName().trim();
    if (!name) return;
    if (name.length > this.maxNameLength) return;

    this.favouritesService.createList(name);
    this.newListName.set('');
  }

  startEditing(list: FavouriteList): void {
    this.editingListId.set(list.id);
    this.editingName.set(list.name);
  }

  cancelEditing(): void {
    this.editingListId.set(null);
    this.editingName.set('');
  }

  saveEdit(listId: string): void {
    const name = this.editingName().trim();
    if (!name) return;
    if (name.length > this.maxNameLength) return;

    this.favouritesService.updateList(listId, name);
    this.cancelEditing();
  }

  deleteList(listId: string): void {
    this.favouritesService.deleteList(listId);
    this.selectedTripByListId.update(state => {
      const copy = { ...state };
      delete copy[listId];
      return copy;
    });
  }

  setSelectedTrip(listId: string, tripId: string): void {
    this.selectedTripByListId.update(state => ({
      ...state,
      [listId]: tripId,
    }));
  }

  addSelectedTrip(listId: string): void {
    const tripId = this.selectedTripByListId()[listId];
    if (!tripId) return;

    this.favouritesService.addTripToList(listId, tripId);

    this.selectedTripByListId.update(state => ({
      ...state,
      [listId]: '',
    }));
  }

  removeTrip(listId: string, tripId: string): void {
    this.favouritesService.removeTripFromList(listId, tripId);
  }

  tripsForList(list: FavouriteList) {
    return this.favouritesService.getTripsForList(list);
  }

  availableTripsForList(list: FavouriteList) {
    return this.favouritesService.getAvailableTripsForList(list);
  }

  viewTrip(tripId: string): void {
    this.router.navigate(['/trips', tripId]);
  }
}