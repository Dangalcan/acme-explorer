import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FavouriteList } from './favourite-list.model';
import { AuthService } from '../../core/services/auth.service';
import { TripService } from '../trips/trip.service';
import { Trip } from '../trips/trip.model';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class FavouritesService {
  private readonly authService = inject(AuthService);
  private readonly tripService = inject(TripService);
  private readonly translate = inject(TranslateService);
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/favouriteLists';

  private readonly allLists = signal<FavouriteList[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly currentExplorerId = computed(() => {
    const user = this.authService.currentUser();
    const role = this.authService.currentRole();
    if (!user || role !== 'explorer') return null;
    return user.uid;
  });

  readonly favouriteLists = computed(() => {
    const explorerId = this.currentExplorerId();
    if (!explorerId) return [];
    return this.allLists().filter(list => list.explorerId === explorerId);
  });

  constructor() {
    effect(() => {
      const explorerId = this.currentExplorerId();
      void this.loadLists(explorerId);
    });
  }

  private async loadLists(explorerId: string | null): Promise<void> {
    if (!explorerId) {
      this.allLists.set([]);
      this.error.set(null);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const lists = await firstValueFrom(
        this.http.get<FavouriteList[]>(`${this.apiUrl}?explorerId=${explorerId}`)
      );

      this.allLists.set(lists ?? []);
    } catch (error) {
      console.error('Error loading favourite lists', error);
      this.error.set(this.translate.instant('favourites.errors.load'));
      this.allLists.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async refresh(): Promise<void> {
    await this.loadLists(this.currentExplorerId());
  }

  async createList(name: string): Promise<void> {
    const explorerId = this.currentExplorerId();
    const normalizedName = name.trim();

    if (!explorerId || !normalizedName) return;

    this.error.set(null);

    try {
      const payload: FavouriteList = {
        id: crypto.randomUUID(),
        explorerId,
        name: normalizedName,
        tripIds: [],
        version: 0,
      };

      await firstValueFrom(this.http.post<FavouriteList>(this.apiUrl, payload));
      await this.refresh();
    } catch (error) {
      console.error('Error creating favourite list', error);
      this.error.set(this.translate.instant('favourites.errors.create'));
      throw error;
    }
  }

  async updateList(listId: string, name: string): Promise<void> {
    const normalizedName = name.trim();
    if (!normalizedName) return;

    const currentList = this.allLists().find(list => list.id === listId);
    if (!currentList) return;

    this.error.set(null);

    try {
      await firstValueFrom(
        this.http.patch<FavouriteList>(`${this.apiUrl}/${listId}`, {
          name: normalizedName,
          version: currentList.version + 1,
        })
      );

      await this.refresh();
    } catch (error) {
      console.error('Error updating favourite list', error);
      this.error.set(this.translate.instant('favourites.errors.update'));
      throw error;
    }
  }

  async deleteList(listId: string): Promise<void> {
    this.error.set(null);

    try {
      await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${listId}`));
      await this.refresh();
    } catch (error) {
      console.error('Error deleting favourite list', error);
      this.error.set(this.translate.instant('favourites.errors.delete'));
      throw error;
    }
  }

  async addTripToList(listId: string, tripId: string): Promise<void> {
    const currentList = this.allLists().find(list => list.id === listId);
    if (!currentList) return;
    if (currentList.tripIds.includes(tripId)) return;

    this.error.set(null);

    try {
      await firstValueFrom(
        this.http.patch<FavouriteList>(`${this.apiUrl}/${listId}`, {
          tripIds: [...currentList.tripIds, tripId],
          version: currentList.version + 1,
        })
      );

      await this.refresh();
    } catch (error) {
      console.error('Error adding trip to favourite list', error);
      this.error.set(this.translate.instant('favourites.errors.add_trip'));
      throw error;
    }
  }

  async removeTripFromList(listId: string, tripId: string): Promise<void> {
    const currentList = this.allLists().find(list => list.id === listId);
    if (!currentList) return;

    this.error.set(null);

    try {
      await firstValueFrom(
        this.http.patch<FavouriteList>(`${this.apiUrl}/${listId}`, {
          tripIds: currentList.tripIds.filter(id => id !== tripId),
          version: currentList.version + 1,
        })
      );

      await this.refresh();
    } catch (error) {
      console.error('Error removing trip from favourite list', error);
      this.error.set(this.translate.instant('favourites.errors.remove_trip'));
      throw error;
    }
  }

  async getAllLists(): Promise<FavouriteList[]> {
    try {
      const lists = await firstValueFrom(this.http.get<FavouriteList[]>(this.apiUrl));
      return lists ?? [];
    } catch (error) {
      console.error('Error fetching all favourite lists', error);
      return [];
    }
  }

  getTripsForList(list: FavouriteList): Trip[] {
    return list.tripIds
      .map(id => this.tripService.getById(id))
      .filter((trip): trip is Trip => !!trip);
  }

  isTripInList(listId: string, tripId: string): boolean {
    const list = this.favouriteLists().find(l => l.id === listId);
    return !!list?.tripIds.includes(tripId);
  }

  getAvailableTripsForList(list: FavouriteList): Trip[] {
    const existingTripIds = new Set(list.tripIds);
    return this.tripService.trips().filter(trip => !existingTripIds.has(trip.id));
  }
}