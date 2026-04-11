import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TripCardComponent } from './trip-card.component';
import { AuthService } from '../../../core/services/auth.service';
import { FavouritesService } from '../../favourites/favourites.service';
import { Trip } from '../trip.model';
import { FavouriteList } from '../../favourites/favourite-list.model';

describe('TripCardComponent', () => {
  let fixture: ComponentFixture<TripCardComponent>;
  let component: TripCardComponent;

  const authServiceMock = {
    currentRole: signal<'explorer' | 'manager' | 'admin' | null>('explorer'),
  };

  const favouriteListsSignal = signal<FavouriteList[]>([]);

  const favouritesServiceMock = {
    favouriteLists: favouriteListsSignal,
    isTripInList: vi.fn<(listId: string, tripId: string) => boolean>(),
    addTripToList: vi.fn<(listId: string, tripId: string) => void>(),
  };

  const mockTrip: Trip = {
    id: 'trip-1',
    version: 0,
    ticker: '260407-ABCD',
    title: 'Alps Adventure',
    description: 'A great mountain trip for testing.',
    difficultyLevel: 'MEDIUM',
    maxParticipants: 12,
    startDate: new Date('2026-07-10'),
    endDate: new Date('2026-07-15'),
    location: {
      city: 'Zermatt',
      country: 'Switzerland',
    },
    pictures: [{ url: '/assets/alps.jpg' }],
    availablePlaces: 5,
    stages: [
      {
        id: 'stage-1',
        version: 0,
        title: 'Arrival',
        description: 'Arrival and briefing',
        price: 100,
      },
      {
        id: 'stage-2',
        version: 0,
        title: 'Climb',
        description: 'Main activity',
        price: 250,
      },
    ],
    managerId: 'manager-1',
  };

  async function configureTestingModule() {
    await TestBed.configureTestingModule({
      imports: [TripCardComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: FavouritesService, useValue: favouritesServiceMock },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ fallbackLang: 'en' }),
      ],
    }).compileComponents();
  }

  beforeEach(async () => {
    favouritesServiceMock.isTripInList.mockReset();
    favouritesServiceMock.addTripToList.mockReset();

    authServiceMock.currentRole.set('explorer');
    favouriteListsSignal.set([]);

    favouritesServiceMock.isTripInList.mockReturnValue(false);

    await configureTestingModule();

    fixture = TestBed.createComponent(TripCardComponent);
    component = fixture.componentInstance;

    component.trip = mockTrip;
    component.mode = 'list';
    component.enableFavouriteControls = true;
    component.favouritePanelOpen = false;
    component.reviews = [];
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the trip title after detectChanges', () => {
    fixture.detectChanges();

    const title = fixture.debugElement.query(By.css('h2'));
    expect(title.nativeElement.textContent).toContain('Alps Adventure');
  });

  it('computes total price from stages when totalPrice is not defined', () => {
    expect(component.getTotalPrice(mockTrip)).toBe(350);
  });

  it('shows the favourite button only for explorer when controls are enabled', () => {
    authServiceMock.currentRole.set('explorer');
    component.enableFavouriteControls = true;
    expect(component.canShowFavouriteButton()).toBe(true);

    authServiceMock.currentRole.set('manager');
    expect(component.canShowFavouriteButton()).toBe(false);

    authServiceMock.currentRole.set('explorer');
    component.enableFavouriteControls = false;
    expect(component.canShowFavouriteButton()).toBe(false);
  });

  it('shows an error when toggling favourites and there are no lists', () => {
    const toggleSpy = vi.spyOn(component.favouritePanelToggle, 'emit');
    const event = { stopPropagation: vi.fn() } as unknown as Event;

    favouriteListsSignal.set([]);

    component.toggleFavouritePanel(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.favouriteError()).toBe('favourites.errors.no_lists');
    expect(toggleSpy).toHaveBeenCalledWith('trip-1');
  });

  it('filters out lists where the trip is already saved', () => {
    favouriteListsSignal.set([
      {
        id: 'list-1',
        version: 0,
        explorerId: 'uid-explorer-1',
        name: 'Summer',
        tripIds: [],
      },
      {
        id: 'list-2',
        version: 0,
        explorerId: 'uid-explorer-1',
        name: 'Dream trips',
        tripIds: [],
      },
    ]);

    favouritesServiceMock.isTripInList.mockImplementation((listId, tripId) => {
      return listId === 'list-1' && tripId === 'trip-1';
    });

    const availableLists = component.getAvailableFavouriteLists();

    expect(availableLists).toHaveLength(1);
    expect(availableLists[0].id).toBe('list-2');
  });

  it('shows an error when trying to save without selecting a list', () => {
    const event = { stopPropagation: vi.fn() } as unknown as Event;

    component.selectedFavouriteListId.set('');

    component.saveToFavouriteList(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.favouriteError()).toBe('favourites.errors.select_list');
    expect(favouritesServiceMock.addTripToList).not.toHaveBeenCalled();
  });

  it('adds the trip to the selected favourite list and closes the panel', () => {
    const closeSpy = vi.spyOn(component.favouritePanelClose, 'emit');
    const event = { stopPropagation: vi.fn() } as unknown as Event;

    favouriteListsSignal.set([
      {
        id: 'list-1',
        version: 0,
        explorerId: 'uid-explorer-1',
        name: 'Summer',
        tripIds: [],
      },
    ]);

    component.selectedFavouriteListId.set('list-1');
    component.favouriteError.set('old error');

    component.saveToFavouriteList(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(favouritesServiceMock.addTripToList).toHaveBeenCalledWith('list-1', 'trip-1');
    expect(component.selectedFavouriteListId()).toBe('');
    expect(component.favouriteError()).toBeNull();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('shows an error when the trip is already saved in all favourite lists', () => {
    const toggleSpy = vi.spyOn(component.favouritePanelToggle, 'emit');
    const event = { stopPropagation: vi.fn() } as unknown as Event;

    favouriteListsSignal.set([
        {
        id: 'list-1',
        version: 0,
        explorerId: 'uid-explorer-1',
        name: 'Summer',
        tripIds: ['trip-1'],
        },
        {
        id: 'list-2',
        version: 0,
        explorerId: 'uid-explorer-1',
        name: 'Dream trips',
        tripIds: ['trip-1'],
        },
    ]);

    favouritesServiceMock.isTripInList.mockReturnValue(true);

    component.toggleFavouritePanel(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.favouriteError()).toBe('favourites.errors.already_saved');
    expect(toggleSpy).toHaveBeenCalledWith('trip-1');
  });

  it('closes the favourite panel when clicking outside in list mode', () => {
    const closeSpy = vi.spyOn(component.favouritePanelClose, 'emit');

    component.mode = 'list';
    component.favouritePanelOpen = true;
    component.selectedFavouriteListId.set('list-1');
    component.favouriteError.set('some error');

    vi.spyOn((component as any).elementRef.nativeElement, 'contains').mockReturnValue(false);

    const event = { target: document.createElement('div') } as unknown as Event;

    component.handleDocumentClick(event);

    expect(component.selectedFavouriteListId()).toBe('');
    expect(component.favouriteError()).toBeNull();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('does not close the favourite panel when clicking inside', () => {
    const closeSpy = vi.spyOn(component.favouritePanelClose, 'emit');

    component.mode = 'list';
    component.favouritePanelOpen = true;

    vi.spyOn((component as any).elementRef.nativeElement, 'contains').mockReturnValue(true);

    const event = { target: document.createElement('div') } as unknown as Event;

    component.handleDocumentClick(event);

    expect(closeSpy).not.toHaveBeenCalled();
  });
});