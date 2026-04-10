import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TripService } from '../trip.service';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { AuthService } from '../../../core/services/auth.service';
import { AppStatus } from '../../applications/application.model';
import { ApplicationService } from '../../applications/application.service';

@Component({
  selector: 'app-trip-display',
  standalone: true,
  imports: [RouterLink, TripCardComponent, DatePipe],
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

  readonly rejectionReasonByApplicationId = signal<Partial<Record<string, string>>>({});
  readonly rejectionErrorByApplicationId = signal<Partial<Record<string, string | null>>>({});

  readonly currentManagerEmail = computed(() => this.authService.currentUser()?.email ?? null);

  readonly canManageCurrentTrip = computed(() => {
    const trip = this.trip();
    const managerEmail = this.currentManagerEmail();
    if (!trip || !managerEmail) return false;
    return trip.managerId === managerEmail;
  });

  // Filter applications for current trip (manager view)
  readonly tripApplications = computed(() => {
    const tripId = this.trip()?.id;
    const apps = this.applications();

    if (!tripId) return [];

    return apps
      .filter((app) => app.tripId === tripId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  });

  readonly statusConfig: Record<AppStatus, { label: string; classes: string }> = {
    PENDING: {
      label: $localize`:@@application.status.pending:Pending`,
      classes: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    },
    ACCEPTED: {
      label: $localize`:@@application.status.accepted:Accepted`,
      classes: 'bg-green-100 text-green-700 border border-green-200',
    },
    REJECTED: {
      label: $localize`:@@application.status.rejected:Rejected`,
      classes: 'bg-red-100 text-red-700 border border-red-200',
    },
    CANCELLED: {
      label: $localize`:@@application.status.cancelled:Cancelled`,
      classes: 'bg-gray-100 text-gray-700 border border-gray-200',
    },
    DUE: {
      label: $localize`:@@application.status.due:Due`,
      classes: 'bg-blue-100 text-blue-700 border border-blue-200',
    },
  };

  readonly pageSize = signal(2);
  readonly pageSizeOptions = [2, 5, 10];  
  readonly currentPage = signal(0);

  readonly totalApplications = computed(() => this.tripApplications().length);

  readonly totalPages = computed(() => {
    const total = this.totalApplications();
    const size = this.pageSize();
    return total === 0 ? 1 : Math.ceil(total / size);
  });

  private readonly clampCurrentPage = effect(() => {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();

    if (currentPage > totalPages - 1) {
      this.currentPage.set(Math.max(totalPages - 1, 0));
    }
  });

  readonly paginatedTripApplications = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const apps = this.tripApplications();

    const start = page * size;
    const end = start + size;

    return apps.slice(start, end);
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

  // Sample reviews — will come from ReviewService once the backend is wired
  readonly sampleReviews = [
    { id: 'r1', explorerId: 'Alice', rating: 5, comment: 'Absolutely incredible experience. The guides were professional and the scenery was breathtaking.', createdAt: new Date('2025-09-12') },
    { id: 'r2', explorerId: 'Bob', rating: 4, comment: 'Great trip overall. A bit challenging at times but totally worth it.', createdAt: new Date('2025-10-01') },
    { id: 'r3', explorerId: 'Carol', rating: 5, comment: 'Best trip of my life. Would book again without hesitation.', createdAt: new Date('2025-11-20') },
  ];

  readonly isLoadingApplications = signal(false);
  readonly loadApplicationsError = signal<string | null>(null);
}

