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
  readonly isLoading = this.favouritesService.isLoading;
  readonly firebaseError = this.favouritesService.error;

  newListName = signal('');
  editingListId = signal<string | null>(null);
  editingName = signal('');

  selectedTripByListId = signal<Record<string, string>>({});

  readonly createListError = signal<string | null>(null);
  readonly editListError = signal<string | null>(null);
  readonly addTripErrorByListId = signal<Record<string, string | null>>({});

  readonly hasLists = computed(() => this.favouriteLists().length > 0);

  async createList(): Promise<void> {
    const rawName = this.newListName();
    const name = rawName.trim();

    if (!rawName.trim()) {
      this.createListError.set($localize`:@@favourites.create.error.required:List name is required.`);
      return;
    }

    if (name.length > this.maxNameLength) {
      this.createListError.set(
        $localize`:@@favourites.create.error.maxLength:List name cannot exceed ${this.maxNameLength} characters.`
      );
      return;
    }

    try {
      await this.favouritesService.createList(name);
      this.newListName.set('');
      this.createListError.set(null);
    } catch {}
  }

  startEditing(list: FavouriteList): void {
    this.editingListId.set(list.id);
    this.editingName.set(list.name);
    this.editListError.set(null);
  }

  cancelEditing(): void {
    this.editingListId.set(null);
    this.editingName.set('');
    this.editListError.set(null);
  }

  async saveEdit(listId: string): Promise<void> {
    const rawName = this.editingName();
    const name = rawName.trim();

    if (!rawName.trim()) {
      this.editListError.set($localize`:@@favourites.edit.error.required:List name is required.`);
      return;
    }

    if (name.length > this.maxNameLength) {
      this.editListError.set(
        $localize`:@@favourites.edit.error.maxLength:List name cannot exceed ${this.maxNameLength} characters.`
      );
      return;
    }

    try {
      await this.favouritesService.updateList(listId, name);
      this.cancelEditing();
    } catch {}
  }

  async deleteList(listId: string): Promise<void> {
    const confirmed = confirm(
      $localize`:@@favourites.delete.confirm:Are you sure you want to delete this list?`
    );

    if (!confirmed) return;

    try {
      await this.favouritesService.deleteList(listId);

      this.selectedTripByListId.update(state => {
        const copy = { ...state };
        delete copy[listId];
        return copy;
      });

      this.addTripErrorByListId.update(state => {
        const copy = { ...state };
        delete copy[listId];
        return copy;
      });
    } catch {}
  }

  setSelectedTrip(listId: string, tripId: string): void {
    this.selectedTripByListId.update(state => ({
      ...state,
      [listId]: tripId,
    }));

    this.addTripErrorByListId.update(state => ({
      ...state,
      [listId]: null,
    }));
  }

  async addSelectedTrip(listId: string): Promise<void> {
    const tripId = this.selectedTripByListId()[listId];

    if (!tripId) {
      this.addTripErrorByListId.update(state => ({
        ...state,
        [listId]: $localize`:@@favourites.trip.error.select:Please select a trip.`,
      }));
      return;
    }

    try {
      await this.favouritesService.addTripToList(listId, tripId);

      this.selectedTripByListId.update(state => ({
        ...state,
        [listId]: '',
      }));

      this.addTripErrorByListId.update(state => ({
        ...state,
        [listId]: null,
      }));
    } catch {}
  }

  async removeTrip(listId: string, tripId: string): Promise<void> {
    const confirmed = confirm(
      $localize`:@@favourites.trip.remove.confirm:Are you sure you want to remove this trip from the list?`
    );

    if (!confirmed) return;

    try {
      await this.favouritesService.removeTripFromList(listId, tripId);
    } catch {}
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