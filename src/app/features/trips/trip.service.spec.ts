import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import {
  addDoc,
  deleteDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TripService } from './trip.service';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationService } from '../applications/application.service';
import { ReviewService } from './review.service';
import { Trip } from './trip.model';
import { Application } from '../applications/application.model';
import { Review } from './review.model';
import { TRIP_VALIDATION } from './trip.model';

// ---------------------------------------------------------------------------
// Firebase mocks — only package imports are supported by Angular's vitest patch
// (relative imports cannot be mocked with vi.mock; db from firebase.config is
//  a real Firestore instance but is only ever passed to the mocked functions)
// ---------------------------------------------------------------------------
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn().mockReturnValue('mock-collection'),
  deleteDoc: vi.fn(),
  doc: vi.fn().mockReturnValue('mock-doc-ref'),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  // getFirestore is called by firebase.config.ts at import time
  getFirestore: vi.fn().mockReturnValue({}),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeSnapshot(trips: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    docs: trips.map((t) => ({
      id: t.id,
      data: () => t.data,
    })),
  };
}

function makeFutureDate(daysFromNow: number): Date {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
}

function makeTripData(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    ticker: '260413-ABCD',
    title: 'Test Trip',
    description: 'A test trip',
    managerId: 'manager-uid',
    difficultyLevel: 'EASY',
    maxParticipants: 10,
    startDate: makeFutureDate(30).toISOString(),
    endDate: makeFutureDate(35).toISOString(),
    version: 0,
    stages: [
      { id: 's1', version: 0, title: 'Stage 1', description: 'Desc 1', price: 100 },
      { id: 's2', version: 0, title: 'Stage 2', description: 'Desc 2', price: 200 },
    ],
    ...overrides,
  };
}

function makeTripInput(overrides: Partial<Omit<Trip, 'id' | 'version' | 'ticker' | 'managerId'>> = {}): Omit<Trip, 'id' | 'version' | 'ticker' | 'managerId'> {
  return {
    title: 'Test Trip',
    description: 'A test trip',
    difficultyLevel: 'EASY',
    maxParticipants: 10,
    startDate: makeFutureDate(30),
    endDate: makeFutureDate(35),
    stages: [
      { id: 's1', version: 0, title: 'Stage 1', description: 'Desc 1', price: 100 },
      { id: 's2', version: 0, title: 'Stage 2', description: 'Desc 2', price: 200 },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('TripService', () => {
  let service: TripService;

  const currentUserSignal = signal<{ uid: string } | null>(null);
  const currentRoleSignal = signal<string | null>(null);
  const applicationsSignal = signal<Application[]>([]);
  const reviewsSignal = signal<Review[]>([]);
  const publicAcceptedCountsSignal = signal<Record<string, number>>({});

  const authServiceMock = {
    currentUser: currentUserSignal,
    currentRole: currentRoleSignal,
  };

  const applicationServiceMock = {
    applications: applicationsSignal,
    publicAcceptedCounts: publicAcceptedCountsSignal,
  };

  const reviewServiceMock = {
    reviews: reviewsSignal,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    currentUserSignal.set(null);
    currentRoleSignal.set(null);
    applicationsSignal.set([]);
    reviewsSignal.set([]);
    publicAcceptedCountsSignal.set({});

    // Prevent constructor from throwing on empty load
    (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(makeSnapshot([]));

    await TestBed.configureTestingModule({
      providers: [
        TripService,
        { provide: AuthService, useValue: authServiceMock },
        { provide: ApplicationService, useValue: applicationServiceMock },
        { provide: ReviewService, useValue: reviewServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    service = TestBed.inject(TripService);

    // Wait for the constructor's loadTrips() to finish
    await new Promise((r) => setTimeout(r, 0));
  });

  // -------------------------------------------------------------------------
  // trips computed signal
  // -------------------------------------------------------------------------
  describe('trips computed signal', () => {
    it('computes totalPrice as sum of stage prices', async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([{ id: 'trip-1', data: makeTripData() }]),
      );
      await service.refresh();

      const trips = service.trips();
      expect(trips[0].totalPrice).toBe(300);
    });

    it('computes totalPrice correctly with a single stage', async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([
          {
            id: 'trip-1',
            data: makeTripData({ stages: [{ id: 's1', version: 0, title: 'S', description: 'D', price: 150 }] }),
          },
        ]),
      );
      await service.refresh();

      expect(service.trips()[0].totalPrice).toBe(150);
    });

    it('computes availablePlaces as maxParticipants minus ACCEPTED applications', async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([{ id: 'trip-1', data: makeTripData({ maxParticipants: 5 }) }]),
      );
      await service.refresh();

      publicAcceptedCountsSignal.set({
        'trip-1': 2,
      });

      expect(service.trips()[0].availablePlaces).toBe(3);
    });

    it('clamps availablePlaces to 0 when accepted applications exceed maxParticipants', async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([{ id: 'trip-1', data: makeTripData({ maxParticipants: 1 }) }]),
      );
      await service.refresh();

      publicAcceptedCountsSignal.set({
        'trip-1': 2,
      });

      expect(service.trips()[0].availablePlaces).toBe(0);
    });

    it('computes averageRating from reviews', async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([{ id: 'trip-1', data: makeTripData() }]),
      );
      await service.refresh();

      reviewsSignal.set([
        { id: 'r1', version: 0, tripId: 'trip-1', explorerId: 'e1', rating: 4, createdAt: new Date() },
        { id: 'r2', version: 0, tripId: 'trip-1', explorerId: 'e2', rating: 2, createdAt: new Date() },
      ]);

      expect(service.trips()[0].averageRating).toBe(3);
    });

    it('sets averageRating to undefined when there are no reviews', async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([{ id: 'trip-1', data: makeTripData() }]),
      );
      await service.refresh();

      reviewsSignal.set([]);

      expect(service.trips()[0].averageRating).toBeUndefined();
    });

    it('does not mix computed fields between trips', async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([
          { id: 'trip-1', data: makeTripData({ maxParticipants: 10 }) },
          { id: 'trip-2', data: makeTripData({ maxParticipants: 5 }) },
        ]),
      );
      await service.refresh();

      publicAcceptedCountsSignal.set({
        'trip-1': 1,
        'trip-2': 0,
      });

      const [t1, t2] = service.trips();
      expect(t1.availablePlaces).toBe(9);
      expect(t2.availablePlaces).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  // createTrip
  // -------------------------------------------------------------------------
  describe('createTrip()', () => {
    it('returns null when no user is authenticated', async () => {
      currentUserSignal.set(null);
      const result = await service.createTrip(makeTripInput());
      expect(result).toBeNull();
    });

    it('calls addDoc with managerId equal to currentUser uid', async () => {
      currentUserSignal.set({ uid: 'manager-uid' });
      (addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-trip-id' });

      await service.createTrip(makeTripInput());

      const calledWith = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(calledWith['managerId']).toBe('manager-uid');
    });

    it('calls addDoc with version 0', async () => {
      currentUserSignal.set({ uid: 'manager-uid' });
      (addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-trip-id' });

      await service.createTrip(makeTripInput());

      const calledWith = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(calledWith['version']).toBe(0);
    });

    it('generates a ticker matching the YYMMDD-WWWW pattern', async () => {
      currentUserSignal.set({ uid: 'manager-uid' });
      (addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-trip-id' });

      await service.createTrip(makeTripInput());

      const calledWith = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(typeof calledWith['ticker']).toBe('string');
      expect(TRIP_VALIDATION.ticker.pattern.test(calledWith['ticker'] as string)).toBe(true);
    });

    it('ticker contains today\'s date in YYMMDD format', async () => {
      currentUserSignal.set({ uid: 'manager-uid' });
      (addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-trip-id' });

      await service.createTrip(makeTripInput());

      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const expectedPrefix = `${yy}${mm}${dd}-`;

      const calledWith = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect((calledWith['ticker'] as string).startsWith(expectedPrefix)).toBe(true);
    });

    it('does not store totalPrice, availablePlaces, or averageRating', async () => {
      currentUserSignal.set({ uid: 'manager-uid' });
      (addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-trip-id' });

      await service.createTrip({
        ...makeTripInput(),
        totalPrice: 999,
        availablePlaces: 5,
        averageRating: 4.5,
      } as Parameters<typeof service.createTrip>[0]);

      const calledWith = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect('totalPrice' in calledWith).toBe(false);
      expect('availablePlaces' in calledWith).toBe(false);
      expect('averageRating' in calledWith).toBe(false);
    });

    it('returns the new document id on success', async () => {
      currentUserSignal.set({ uid: 'manager-uid' });
      (addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-trip-id' });

      const result = await service.createTrip(makeTripInput());
      expect(result).toBe('new-trip-id');
    });

    it('returns null and sets error when Firestore throws', async () => {
      currentUserSignal.set({ uid: 'manager-uid' });
      (addDoc as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Firestore error'));

      const result = await service.createTrip(makeTripInput());
      expect(result).toBeNull();
      expect(service.error()).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // updateTrip
  // -------------------------------------------------------------------------
  describe('updateTrip()', () => {
    beforeEach(async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([{ id: 'trip-1', data: makeTripData({ managerId: 'manager-uid', version: 2 }) }]),
      );
      await service.refresh();
    });

    it('returns false when trip does not exist', async () => {
      const result = await service.updateTrip('nonexistent-id', { title: 'New Title' });
      expect(result).toBe(false);
    });

    it('returns false when current user is not the owner', async () => {
      currentUserSignal.set({ uid: 'other-user' });
      const result = await service.updateTrip('trip-1', { title: 'New Title' });
      expect(result).toBe(false);
    });

    it('calls updateDoc with incremented version', async () => {
      currentUserSignal.set({ uid: 'manager-uid' });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await service.updateTrip('trip-1', { title: 'New Title' });

      const calledWith = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(calledWith['version']).toBe(3); // original was 2
    });

    it('does not include ticker in updateDoc payload', async () => {
      currentUserSignal.set({ uid: 'manager-uid' });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await service.updateTrip('trip-1', { title: 'New Title' });

      const calledWith = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect('ticker' in calledWith).toBe(false);
    });

    it('does not include computed fields in updateDoc payload', async () => {
      currentUserSignal.set({ uid: 'manager-uid' });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await service.updateTrip('trip-1', {
        title: 'New Title',
        totalPrice: 999,
        availablePlaces: 5,
        averageRating: 4,
      } as Parameters<typeof service.updateTrip>[1]);

      const calledWith = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect('totalPrice' in calledWith).toBe(false);
      expect('availablePlaces' in calledWith).toBe(false);
      expect('averageRating' in calledWith).toBe(false);
    });

    it('returns true on success', async () => {
      currentUserSignal.set({ uid: 'manager-uid' });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const result = await service.updateTrip('trip-1', { title: 'Updated' });
      expect(result).toBe(true);
    });

    it('returns false and sets error when Firestore throws', async () => {
      currentUserSignal.set({ uid: 'manager-uid' });
      (updateDoc as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

      const result = await service.updateTrip('trip-1', { title: 'Updated' });
      expect(result).toBe(false);
      expect(service.error()).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // canEditTrip
  // -------------------------------------------------------------------------
  describe('canEditTrip()', () => {
    beforeEach(async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([{ id: 'trip-1', data: makeTripData({ managerId: 'manager-uid' }) }]),
      );
      await service.refresh();
    });

    it('returns true when authenticated user is the owner', () => {
      currentUserSignal.set({ uid: 'manager-uid' });
      expect(service.canEditTrip('trip-1')).toBe(true);
    });

    it('returns false when authenticated user is not the owner', () => {
      currentUserSignal.set({ uid: 'other-uid' });
      expect(service.canEditTrip('trip-1')).toBe(false);
    });

    it('returns false when no user is authenticated', () => {
      currentUserSignal.set(null);
      expect(service.canEditTrip('trip-1')).toBe(false);
    });

    it('returns false when trip does not exist', () => {
      currentUserSignal.set({ uid: 'manager-uid' });
      expect(service.canEditTrip('nonexistent')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // canDeleteTrip
  // -------------------------------------------------------------------------
  describe('canDeleteTrip()', () => {
    beforeEach(async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([
          {
            id: 'trip-1',
            data: makeTripData({
              managerId: 'manager-uid',
              startDate: makeFutureDate(10).toISOString(),
            }),
          },
        ]),
      );
      await service.refresh();
      currentUserSignal.set({ uid: 'manager-uid' });
      applicationsSignal.set([]);
    });

    it('returns false when current user is not the owner', () => {
      currentUserSignal.set({ uid: 'other-uid' });
      expect(service.canDeleteTrip('trip-1')).toBe(false);
    });

    it('returns false when trip starts today', async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([
          { id: 'trip-1', data: makeTripData({ managerId: 'manager-uid', startDate: makeFutureDate(0).toISOString() }) },
        ]),
      );
      await service.refresh();
      expect(service.canDeleteTrip('trip-1')).toBe(false);
    });

    it('returns false when trip starts in exactly 5 days (boundary)', async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([
          { id: 'trip-1', data: makeTripData({ managerId: 'manager-uid', startDate: makeFutureDate(5).toISOString() }) },
        ]),
      );
      await service.refresh();
      expect(service.canDeleteTrip('trip-1')).toBe(false);
    });

    it('returns true when trip starts in 6 days with no accepted applications', async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([
          { id: 'trip-1', data: makeTripData({ managerId: 'manager-uid', startDate: makeFutureDate(6).toISOString() }) },
        ]),
      );
      await service.refresh();
      expect(service.canDeleteTrip('trip-1')).toBe(true);
    });

    it('returns false when there is at least one ACCEPTED application', () => {
      applicationsSignal.set([
        { id: 'a1', version: 0, tripId: 'trip-1', explorerId: 'e1', createdAt: new Date(), status: 'ACCEPTED' },
      ]);
      expect(service.canDeleteTrip('trip-1')).toBe(false);
    });

    it('returns true when all applications are non-ACCEPTED statuses', () => {
      applicationsSignal.set([
        { id: 'a1', version: 0, tripId: 'trip-1', explorerId: 'e1', createdAt: new Date(), status: 'PENDING' },
        { id: 'a2', version: 0, tripId: 'trip-1', explorerId: 'e2', createdAt: new Date(), status: 'REJECTED' },
        { id: 'a3', version: 0, tripId: 'trip-1', explorerId: 'e3', createdAt: new Date(), status: 'CANCELLED' },
      ]);
      expect(service.canDeleteTrip('trip-1')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // deleteTrip
  // -------------------------------------------------------------------------
  describe('deleteTrip()', () => {
    beforeEach(async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([
          {
            id: 'trip-1',
            data: makeTripData({
              managerId: 'manager-uid',
              startDate: makeFutureDate(10).toISOString(),
            }),
          },
        ]),
      );
      await service.refresh();
      currentUserSignal.set({ uid: 'manager-uid' });
      applicationsSignal.set([]);
    });

    it('returns false without calling deleteDoc when canDeleteTrip is false', async () => {
      currentUserSignal.set({ uid: 'wrong-uid' });
      const result = await service.deleteTrip('trip-1');
      expect(result).toBe(false);
      expect(deleteDoc).not.toHaveBeenCalled();
    });

    it('calls deleteDoc when canDeleteTrip is true', async () => {
      (deleteDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      await service.deleteTrip('trip-1');
      expect(deleteDoc).toHaveBeenCalledOnce();
    });

    it('returns true on successful deletion', async () => {
      (deleteDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      const result = await service.deleteTrip('trip-1');
      expect(result).toBe(true);
    });

    it('returns false and sets error when Firestore throws', async () => {
      (deleteDoc as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
      const result = await service.deleteTrip('trip-1');
      expect(result).toBe(false);
      expect(service.error()).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // cancelTrip
  // -------------------------------------------------------------------------
  describe('cancelTrip()', () => {
    beforeEach(async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([
          {
            id: 'trip-1',
            data: makeTripData({
              managerId: 'manager-uid',
              startDate: makeFutureDate(20).toISOString(),
            }),
          },
        ]),
      );
      await service.refresh();
      currentUserSignal.set({ uid: 'manager-uid' });
      applicationsSignal.set([]);
    });

    it('returns false when trip is not found', async () => {
      const result = await service.cancelTrip('nonexistent', 'reason');
      expect(result).toBe(false);
    });

    it('returns false when trip is already cancelled', async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([
          {
            id: 'trip-1',
            data: makeTripData({
              managerId: 'manager-uid',
              startDate: makeFutureDate(20).toISOString(),
              cancellation: { reason: 'old reason', cancelledAt: new Date().toISOString() },
            }),
          },
        ]),
      );
      await service.refresh();
      const result = await service.cancelTrip('trip-1', 'new reason');
      expect(result).toBe(false);
    });

    it('returns false when reason is an empty string', async () => {
      const result = await service.cancelTrip('trip-1', '');
      expect(result).toBe(false);
    });

    it('returns false when reason is whitespace-only', async () => {
      const result = await service.cancelTrip('trip-1', '   ');
      expect(result).toBe(false);
    });

    it('calls updateDoc with trimmed reason and cancelledAt date', async () => {
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      await service.cancelTrip('trip-1', '  Bad weather  ');

      const calledWith = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      const cancellation = calledWith['cancellation'] as Record<string, unknown>;
      expect(cancellation['reason']).toBe('Bad weather');
      expect(cancellation['cancelledAt']).toBeInstanceOf(Date);
    });

    it('calls updateDoc with incremented version', async () => {
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      await service.cancelTrip('trip-1', 'reason');

      const calledWith = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(calledWith['version']).toBe(1); // original version was 0
    });

    it('returns true on success', async () => {
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      const result = await service.cancelTrip('trip-1', 'reason');
      expect(result).toBe(true);
    });

    it('returns false and sets error when Firestore throws', async () => {
      (updateDoc as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
      const result = await service.cancelTrip('trip-1', 'reason');
      expect(result).toBe(false);
      expect(service.error()).not.toBeNull();
    });

    // Spec compliance tests — these document UNIMPLEMENTED requirements.
    // Per req #8.3: cancellation is only allowed at least one week before start.
    it('[spec] returns false when trip starts in less than 7 days', async () => {
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeSnapshot([
          { id: 'trip-1', data: makeTripData({ managerId: 'manager-uid', startDate: makeFutureDate(3).toISOString() }) },
        ]),
      );
      await service.refresh();
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const result = await service.cancelTrip('trip-1', 'reason');
      // NOTE: this test currently fails — cancelTrip() does not enforce the 7-day rule
      expect(result).toBe(false);
    });

    // Per req #8.3: manager cannot cancel a trip that has at least one paid application.
    it('[spec] returns false when there is at least one ACCEPTED application', async () => {
      applicationsSignal.set([
        { id: 'a1', version: 0, tripId: 'trip-1', explorerId: 'e1', createdAt: new Date(), status: 'ACCEPTED' },
      ]);
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const result = await service.cancelTrip('trip-1', 'reason');
      // NOTE: this test currently fails — cancelTrip() does not check for paid applications
      expect(result).toBe(false);
    });
  });
});
