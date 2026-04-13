import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TripCreateComponent } from './trip-create.component';
import { TripService } from '../trip.service';
import { TripFormValue } from '../trip-form/trip-form.component';
import { AuthService } from '../../../core/services/auth.service';
import { ApplicationService } from '../../applications/application.service';
import { ReviewService } from '../review.service';
import { FavouritesService } from '../../favourites/favourites.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeFormValue(overrides: Partial<TripFormValue> = {}): TripFormValue {
  return {
    title: 'Alps Adventure',
    description: 'A great trip',
    difficultyLevel: 'MEDIUM',
    maxParticipants: 10,
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-08-10'),
    location: { city: 'Zermatt', country: 'Switzerland' },
    stages: [{ title: 'Stage 1', description: 'Desc 1', price: 150 }],
    pictures: ['https://example.com/img.jpg'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('TripCreateComponent', () => {
  let fixture: ComponentFixture<TripCreateComponent>;
  let component: TripCreateComponent;

  const createTripSpy = vi.fn();

  const tripServiceMock = {
    createTrip: createTripSpy,
    trips: signal([]),
    isLoading: signal(false),
    error: signal(null),
    refresh: vi.fn().mockResolvedValue(undefined),
    getById: vi.fn().mockReturnValue(undefined),
    canEditTrip: vi.fn().mockReturnValue(false),
    canDeleteTrip: vi.fn().mockReturnValue(false),
    cancelTrip: vi.fn(),
    updateTrip: vi.fn(),
    deleteTrip: vi.fn(),
  };

  const authServiceMock = {
    currentUser: signal(null),
    currentRole: signal(null),
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

  beforeEach(async () => {
    vi.clearAllMocks();
    createTripSpy.mockResolvedValue('new-trip-id');

    await TestBed.configureTestingModule({
      imports: [TripCreateComponent, NoopAnimationsModule],
      providers: [
        { provide: TripService, useValue: tripServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ApplicationService, useValue: applicationServiceMock },
        { provide: ReviewService, useValue: reviewServiceMock },
        { provide: FavouritesService, useValue: favouritesServiceMock },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ fallbackLang: 'en' }),
        provideRouter([{ path: '**', redirectTo: '' }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TripCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('calls tripService.createTrip() with correct field mapping', async () => {
    const formValue = makeFormValue();
    await component.onCreate(formValue);

    expect(createTripSpy).toHaveBeenCalledOnce();
    const arg = createTripSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(arg['title']).toBe('Alps Adventure');
    expect(arg['description']).toBe('A great trip');
    expect(arg['difficultyLevel']).toBe('MEDIUM');
    expect(arg['maxParticipants']).toBe(10);
  });

  it('passes stages with version 0 for each stage', async () => {
    await component.onCreate(makeFormValue());

    const arg = createTripSpy.mock.calls[0][0] as { stages: Array<{ version: number }> };
    expect(arg.stages.every((s) => s.version === 0)).toBe(true);
  });

  it('passes stages with a uuid-shaped id for each stage', async () => {
    await component.onCreate(makeFormValue());

    const arg = createTripSpy.mock.calls[0][0] as { stages: Array<{ id: string }> };
    expect(arg.stages[0].id).toBeTruthy();
    expect(typeof arg.stages[0].id).toBe('string');
  });

  it('passes location when city or country is provided', async () => {
    await component.onCreate(makeFormValue({ location: { city: 'Paris', country: '' } }));

    const arg = createTripSpy.mock.calls[0][0] as { location: unknown };
    expect(arg.location).toBeDefined();
    expect((arg.location as { city: string }).city).toBe('Paris');
  });

  it('passes location as undefined when both city and country are empty', async () => {
    await component.onCreate(makeFormValue({ location: { city: '', country: '' } }));

    const arg = createTripSpy.mock.calls[0][0] as { location: unknown };
    expect(arg.location).toBeUndefined();
  });

  it('sets isLoading to true while waiting, then false after', async () => {
    let capturedDuringCall = false;
    createTripSpy.mockImplementation(() => {
      capturedDuringCall = component.isLoading();
      return Promise.resolve('some-id');
    });

    await component.onCreate(makeFormValue());

    expect(capturedDuringCall).toBe(true);
    expect(component.isLoading()).toBe(false);
  });

  it('clears errorMessage on a new attempt', async () => {
    component.errorMessage.set('old error');
    await component.onCreate(makeFormValue());
    expect(component.errorMessage()).toBeNull();
  });

  it('sets errorMessage when service returns null', async () => {
    createTripSpy.mockResolvedValue(null);
    await component.onCreate(makeFormValue());
    expect(component.errorMessage()).toBe('trips.form.error.create_failed');
  });
});
