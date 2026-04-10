import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TripService } from '../trip.service';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { AuthService } from '../../../core/services/auth.service';
import { Application, AppStatus } from '../../applications/application.model';
import { Review } from '../review.model';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationService } from '../../applications/application.service';


@Component({
  selector: 'app-trip-display',
  standalone: true,
  imports: [RouterLink, TripCardComponent, DatePipe, TranslatePipe],
  templateUrl: './trip-display.component.html',
})
export class TripDisplayComponent {
  private route = inject(ActivatedRoute);
  private tripService = inject(TripService);
  private authService = inject(AuthService);
  private applicationService = inject(ApplicationService);

  private id = toSignal(this.route.paramMap.pipe(map(p => p.get('id') ?? '')));

  trip = computed(() => this.tripService.getById(this.id() ?? ''));

  readonly currentRole = this.authService.currentRole;

  readonly applications = this.applicationService.applications;
  readonly fallbackApplications = signal<Application[]>([
    { id: 'app-1', version: 0, tripId: '1', explorerId: 'explorer-1', createdAt: new Date('2026-01-10T09:00:00.000Z'), status: 'ACCEPTED', comments: 'Very excited about the Alps trip!' },
    { id: 'app-2', version: 0, tripId: '3', explorerId: 'explorer-1', createdAt: new Date('2026-01-15T11:30:00.000Z'), status: 'PENDING', comments: 'Huge fan of Japanese culture.' },
    { id: 'app-3', version: 0, tripId: '2', explorerId: 'explorer-2', createdAt: new Date('2026-02-01T08:00:00.000Z'), status: 'ACCEPTED' },
    { id: 'app-4', version: 0, tripId: '4', explorerId: 'explorer-2', createdAt: new Date('2026-02-20T14:00:00.000Z'), status: 'REJECTED', comments: 'Interested in Amazon wildlife.', rejectionReason: 'Trip is fully booked.' },
    { id: 'app-5', version: 0, tripId: '3', explorerId: 'explorer-3', createdAt: new Date('2026-01-20T10:00:00.000Z'), status: 'ACCEPTED' },
    { id: 'app-6', version: 0, tripId: '4', explorerId: 'explorer-3', createdAt: new Date('2026-03-01T09:30:00.000Z'), status: 'PENDING', comments: 'I have jungle survival training.' },
    { id: 'app-7', version: 0, tripId: '1', explorerId: 'explorer-2', createdAt: new Date('2026-01-25T16:00:00.000Z'), status: 'CANCELLED', comments: 'Schedule conflict, unfortunately.' },
    { id: 'app-8', version: 0, tripId: '1', explorerId: 'explorer-4', createdAt: new Date('2026-01-28T10:00:00.000Z'), status: 'PENDING', comments: 'Looking forward to this trip.' },
    { id: 'app-9', version: 0, tripId: '1', explorerId: 'explorer-5', createdAt: new Date('2026-01-29T09:15:00.000Z'), status: 'DUE', comments: 'Please confirm payment instructions.' },
    { id: 'app-10', version: 0, tripId: '1', explorerId: 'explorer-6', createdAt: new Date('2026-01-30T12:45:00.000Z'), status: 'REJECTED', rejectionReason: 'No seats available.' },
    { id: 'app-11', version: 0, tripId: '1', explorerId: 'explorer-7', createdAt: new Date('2026-01-31T08:20:00.000Z'), status: 'ACCEPTED', comments: 'Happy to join.' },
    { id: 'app-12', version: 0, tripId: '1', explorerId: 'explorer-8', createdAt: new Date('2026-02-01T14:00:00.000Z'), status: 'CANCELLED', comments: 'Cannot attend anymore.' },
  ]);

  readonly rejectionReasonByApplicationId = signal<Partial<Record<string, string>>>({});
  readonly rejectionErrorByApplicationId = signal<Partial<Record<string, string | null>>>({});

  readonly currentManagerEmail = computed(() => this.authService.currentUser()?.email ?? null);

  readonly canManageCurrentTrip = computed(() => {
    const trip = this.trip();
    const managerEmail = this.currentManagerEmail();
    if (!trip || !managerEmail) return false;
    return trip.managerId === managerEmail;
  });

  readonly tripApplications = computed(() => {
    const tripId = this.trip()?.id;
    const apps = this.applications();
    const sourceApps = apps.length > 0 ? apps : this.fallbackApplications();
    if (!tripId) return [];
    return sourceApps.filter((app) => app.tripId === tripId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  });

  readonly statusConfig: Record<AppStatus, { key: string; classes: string }> = {
    PENDING:   { key: 'applications.status.pending',   classes: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
    ACCEPTED:  { key: 'applications.status.accepted',  classes: 'bg-green-100 text-green-700 border border-green-200' },
    REJECTED:  { key: 'applications.status.rejected',  classes: 'bg-red-100 text-red-700 border border-red-200' },
    CANCELLED: { key: 'applications.status.cancelled', classes: 'bg-gray-100 text-gray-700 border border-gray-200' },
    DUE:       { key: 'applications.status.due',       classes: 'bg-blue-100 text-blue-700 border border-blue-200' },
  };

  readonly pageSize = signal(2);
  readonly pageSizeOptions = [2, 5, 10];
  readonly currentPage = signal(0);

  readonly totalApplications = computed(() => this.tripApplications().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalApplications() / this.pageSize())));
  readonly paginatedTripApplications = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.tripApplications().slice(start, start + this.pageSize());
  });

  readonly pageStartItem = computed(() => {
    if (this.totalApplications() === 0) return 0;
    return this.currentPage() * this.pageSize() + 1;
  });

  readonly pageEndItem = computed(() => {
    return Math.min(
      (this.currentPage() + 1) * this.pageSize(),
      this.totalApplications()
    );
  });

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(page => page - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(page => page + 1);
    }
  }

  changePageSize(size: string): void {
    this.pageSize.set(Number(size));
    this.currentPage.set(0);
  }

  updateRejectionReason(applicationId: string, reason: string): void {
    this.rejectionReasonByApplicationId.update((state) => ({
      ...state,
      [applicationId]: reason,
    }));

    this.rejectionErrorByApplicationId.update((state) => ({
      ...state,
      [applicationId]: null,
    }));
  }

  markAsDue(applicationId: string): void {
    this.applicationService.markApplicationAsDue(applicationId);
  }

  reject(applicationId: string): void {
    const reason = (this.rejectionReasonByApplicationId()[applicationId] ?? '').trim();

    if (!reason) {
      this.rejectionErrorByApplicationId.update((state) => ({
        ...state,
        [applicationId]: $localize`:@@trip.manager.rejectReason.required:Rejection reason is required.`,
      }));
      return;
    }

    const didReject = this.applicationService.rejectApplication(applicationId, reason);
    if (!didReject) {
      this.rejectionErrorByApplicationId.update((state) => ({
        ...state,
        [applicationId]: $localize`:@@trip.manager.rejectReason.invalid:Could not reject the application.`,
      }));
      return;
    }

    this.rejectionReasonByApplicationId.update((state) => ({
      ...state,
      [applicationId]: '',
    }));
    this.rejectionErrorByApplicationId.update((state) => ({
      ...state,
      [applicationId]: null,
    }));
  }

  readonly isLoadingApplications = signal(false);
  readonly loadApplicationsError = signal<string | null>(null);

  readonly sampleReviews: Review[] = [
    { id: 'r1', version: 0, tripId: '1', explorerId: 'Alice', rating: 5, comment: 'Absolutely incredible experience. The guides were professional and the scenery was breathtaking.', createdAt: new Date('2025-09-12') },
    { id: 'r2', version: 0, tripId: '1', explorerId: 'Bob', rating: 4, comment: 'Great trip overall. A bit challenging at times but totally worth it.', createdAt: new Date('2025-10-01') },
    { id: 'r3', version: 0, tripId: '1', explorerId: 'Carol', rating: 5, comment: 'Best trip of my life. Would book again without hesitation.', createdAt: new Date('2025-11-20') },
    { id: 'r4', version: 0, tripId: '1', explorerId: 'explorer-1', rating: 5, comment: 'Absolutely breathtaking! The Alps exceeded all expectations.', createdAt: new Date('2026-03-15') },
    { id: 'r5', version: 0, tripId: '1', explorerId: 'explorer-3', rating: 4, comment: 'Great trip overall, well organized.', createdAt: new Date('2026-03-20') },
  ];

  readonly today = new Date();
}
