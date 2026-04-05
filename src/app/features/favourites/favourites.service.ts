import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { FavouriteList } from './favourite-list.model';
import { AuthService } from '../../core/services/auth.service';
import { TripService } from '../trips/trip.service';
import { Trip } from '../trips/trip.model';

@Injectable({
  providedIn: 'root',
})
export class FavouritesService {
  private readonly storageKey = 'acme-explorer-favourite-lists';

  private authService = inject(AuthService);
  private tripService = inject(TripService);

  private allLists = signal<FavouriteList[]>(this.loadFromStorage());

  readonly currentExplorerId = computed(() => this.authService.currentUser()?.uid ?? null);

  readonly favouriteLists = computed(() => {
    const explorerId = this.currentExplorerId();
    if (!explorerId) return [];
    return this.allLists().filter(list => list.explorerId === explorerId);
  });

  constructor() {
    effect(() => {
      localStorage.setItem(this.storageKey, JSON.stringify(this.allLists()));
    });
  }

  private loadFromStorage(): FavouriteList[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as FavouriteList[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  createList(name: string): void {
    const explorerId = this.currentExplorerId();
    const normalizedName = name.trim();

    if (!explorerId || !normalizedName) return;

    const newList: FavouriteList = {
      id: crypto.randomUUID(),
      version: 0,
      explorerId,
      name: normalizedName,
      tripIds: [],
    };

    this.allLists.update(lists => [...lists, newList]);
  }

  updateList(listId: string, name: string): void {
    const normalizedName = name.trim();
    if (!normalizedName) return;

    this.allLists.update(lists =>
      lists.map(list =>
        list.id === listId
          ? { ...list, name: normalizedName, version: list.version + 1 }
          : list
      )
    );
  }

  deleteList(listId: string): void {
    this.allLists.update(lists => lists.filter(list => list.id !== listId));
  }

  addTripToList(listId: string, tripId: string): void {
    this.allLists.update(lists =>
      lists.map(list => {
        if (list.id !== listId) return list;
        if (list.tripIds.includes(tripId)) return list;

        return {
          ...list,
          tripIds: [...list.tripIds, tripId],
          version: list.version + 1,
        };
      })
    );
  }

  removeTripFromList(listId: string, tripId: string): void {
    this.allLists.update(lists =>
      lists.map(list =>
        list.id === listId
          ? {
              ...list,
              tripIds: list.tripIds.filter(id => id !== tripId),
              version: list.version + 1,
            }
          : list
      )
    );
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