import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ActivatedRoute, provideRouter, convertToParamMap } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TripEditComponent } from './trip-edit.component';
import { TripService } from '../trip.service';
import { TripFormValue } from '../trip-form/trip-form.component';
import { Trip } from '../trip.model';
import { AuthService } from '../../../core/services/auth.service';
import { ApplicationService } from '../../applications/application.service';
import { ReviewService } from '../review.service';
import { FavouritesService } from '../../favourites/favourites.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockTrip: Trip = {
  id: 'trip-1',
  version: 3,
  ticker: '260413-ABCD',
  title: 'Alps Adventure',
  description: 'A great trip',
  difficultyLevel: 'MEDIUM',
  maxParticipants: 10,
  startDate: new Date('2026-09-01'),
  endDate: new Date('2026-09-10'),
  location: { city: 'Zermatt', country: 'Switzerland' },
  stages: [
    { id: 'stage-1', version: 0, title: 'Arrival', description: 'Arrive', price: 100 },
    { id: 'stage-2', version: 1, title: 'Climb', description: 'Climb', price: 250 },
  ],
  managerId: 'manager-uid',
};

function makeFormValue(overrides: Partial<TripFormValue> = {}): TripFormValue {
  return {
    title: 'Updated Title',
    description: 'Updated description',
    difficultyLevel: 'HARD',
    maxParticipants: 15,
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-09-12'),
    location: { city: 'Zermatt', country: 'Switzerland' },
    stages: [
      { title: 'Arrival Updated', description: 'Arrive', price: 120 },
      { title: 'Climb Updated', description: 'Climb', price: 280 },
    ],
    pictures: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('TripEditComponent', () => {
  let fixture: ComponentFixture<TripEditComponent>;
  let component: TripEditComponent;

  const updateTripSpy = vi.fn();
  const getByIdSpy = vi.fn();

  const tripServiceMock = {
    updateTrip: updateTripSpy,
    getById: getByIdSpy,
    trips: signal([mockTrip]),
    isLoading: signal(false),
    error: signal(null),
    refresh: vi.fn().mockResolvedValue(undefined),
    canEditTrip: vi.fn().mockReturnValue(true),
    canDeleteTrip: vi.fn().mockReturnValue(false),
    cancelTrip: vi.fn(),
    deleteTrip: vi.fn(),
    createTrip: vi.fn(),
  };

  const authServiceMock = {
    currentUser: signal({ uid: 'manager-uid' }),
    currentRole: signal('manager'),
    isAuthLoading: signal(false),
    ready: Promise.resolve(),
  };

  const applicationServiceMock = {
    applications: signal([]),
    isLoading: signal(false),
    error: signal(null),
    applyForTrip: vi.fn(),
    canApplyForTrip: vi.fn().mockReturnValue(false),
    hasActiveApplicationForTrip: vi.fn().mockReturnValue(false),
    refresh: vi.fn().mockResolvedValue(undefined),
  };

  const reviewServiceMock = {
    reviews: signal([]),
    reviewsForTrip: vi.fn().mockReturnValue([]),
  };

  const favouritesServiceMock = {
    favouriteLists: signal([]),
    isTripInList: vi.fn().mockReturnValue(false),
    addTripToList: vi.fn(),
  };

  const activatedRouteMock = {
    paramMap: of(convertToParamMap({ id: 'trip-1' })),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    updateTripSpy.mockResolvedValue(true);
    getByIdSpy.mockReturnValue(mockTrip);

    await TestBed.configureTestingModule({
      imports: [TripEditComponent, NoopAnimationsModule],
      providers: [
        { provide: TripService, useValue: tripServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ApplicationService, useValue: applicationServiceMock },
        { provide: ReviewService, useValue: reviewServiceMock },
        { provide: FavouritesService, useValue: favouritesServiceMock },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ fallbackLang: 'en' }),
        // provideRouter must come BEFORE the ActivatedRoute mock so our mock wins
        provideRouter([{ path: '**', redirectTo: '' }]),
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TripEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('calls tripService.updateTrip() with the correct tripId and data', async () => {
    await component.onUpdate(makeFormValue());

    expect(updateTripSpy).toHaveBeenCalledOnce();
    const [calledId] = updateTripSpy.mock.calls[0] as [string, unknown];
    expect(calledId).toBe('trip-1');
  });

  it('maps form value fields correctly to updateTrip payload', async () => {
    await component.onUpdate(makeFormValue());

    const payload = updateTripSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(payload['title']).toBe('Updated Title');
    expect(payload['description']).toBe('Updated description');
    expect(payload['difficultyLevel']).toBe('HARD');
    expect(payload['maxParticipants']).toBe(15);
  });

  it('preserves original stage id and version from the current trip', async () => {
    await component.onUpdate(makeFormValue());

    const payload = updateTripSpy.mock.calls[0][1] as { stages: Array<{ id: string; version: number }> };
    expect(payload.stages[0].id).toBe('stage-1');
    expect(payload.stages[0].version).toBe(0);
    expect(payload.stages[1].id).toBe('stage-2');
    expect(payload.stages[1].version).toBe(1);
  });

  it('sets location to undefined when both city and country are empty', async () => {
    await component.onUpdate(makeFormValue({ location: { city: '', country: '' } }));

    const payload = updateTripSpy.mock.calls[0][1] as { location: unknown };
    expect(payload.location).toBeUndefined();
  });

  it('sets location when only city is provided', async () => {
    await component.onUpdate(makeFormValue({ location: { city: 'Oslo', country: '' } }));

    const payload = updateTripSpy.mock.calls[0][1] as { location: { city: string } };
    expect(payload.location).toBeDefined();
    expect(payload.location.city).toBe('Oslo');
  });

  it('sets isLoading to true while waiting, false after', async () => {
    let capturedDuringCall = false;
    updateTripSpy.mockImplementation(() => {
      capturedDuringCall = component.isLoading();
      return Promise.resolve(true);
    });

    await component.onUpdate(makeFormValue());

    expect(capturedDuringCall).toBe(true);
    expect(component.isLoading()).toBe(false);
  });

  it('sets errorMessage when service returns false', async () => {
    updateTripSpy.mockResolvedValue(false);
    await component.onUpdate(makeFormValue());
    expect(component.errorMessage()).toBe('trips.form.error.update_failed');
  });

  it('clears errorMessage before each attempt', async () => {
    component.errorMessage.set('stale error');
    await component.onUpdate(makeFormValue());
    expect(component.errorMessage()).toBeNull();
  });

  it('passes correct stage titles to the update payload', async () => {
    const formValue = makeFormValue({
      stages: [
        { title: 'New Stage A', description: 'Desc A', price: 50 },
        { title: 'New Stage B', description: 'Desc B', price: 75 },
      ],
    });

    await component.onUpdate(formValue);

    const payload = updateTripSpy.mock.calls[0][1] as { stages: Array<{ title: string }> };
    expect(payload.stages[0].title).toBe('New Stage A');
    expect(payload.stages[1].title).toBe('New Stage B');
  });
});
