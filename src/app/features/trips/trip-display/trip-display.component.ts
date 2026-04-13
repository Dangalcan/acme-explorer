import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TripService } from '../trip.service';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { AuthService } from '../../../core/services/auth.service';
import { AppStatus } from '../../applications/application.model';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationService } from '../../applications/application.service';
import { ReviewService } from '../review.service';


@Component({
  selector: 'app-trip-display',
  standalone: true,
  imports: [RouterLink, TripCardComponent, DatePipe, TranslatePipe],
  templateUrl: './trip-display.component.html',
})
export class TripDisplayComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tripService = inject(TripService);
  private authService = inject(AuthService);
  private applicationService = inject(ApplicationService);
  private reviewService = inject(ReviewService);

  private id = toSignal(this.route.paramMap.pipe(map(p => p.get('id') ?? '')));

  trip = computed(() => this.tripService.getById(this.id() ?? ''));

  readonly currentRole = this.authService.currentRole;

  readonly rejectionReasonByApplicationId = signal<Partial<Record<string, string>>>({});
  readonly rejectionErrorByApplicationId = signal<Partial<Record<string, string | null>>>({});

  readonly currentManagerId = computed(() => this.authService.currentUser()?.uid ?? null);

  readonly canManageCurrentTrip = computed(() => {
    const trip = this.trip();
    const managerId = this.currentManagerId();
    if (!trip || !managerId) return false;
    return trip.managerId === managerId;
  });

  readonly canEdit = computed(() => this.tripService.canEditTrip(this.trip()?.id ?? ''));
  readonly canDelete = computed(() => this.tripService.canDeleteTrip(this.trip()?.id ?? ''));
  readonly isDeleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  async onDelete(): Promise<void> {
    const tripId = this.trip()?.id;
    if (!tripId) return;

    this.isDeleting.set(true);
    this.deleteError.set(null);

    const success = await this.tripService.deleteTrip(tripId);
    this.isDeleting.set(false);

    if (success) {
      void this.router.navigate(['/trips']);
    } else {
      this.deleteError.set('trips.details.delete_error');
    }
  }

  readonly tripApplications = computed(() => {
    const tripId = this.trip()?.id;
    const apps = this.applicationService.applications();
    if (!tripId) return [];
    return apps.filter((app) => app.tripId === tripId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
    void this.applicationService.markApplicationAsDue(applicationId);
  }

  async reject(applicationId: string): Promise<void> {
    const reason = (this.rejectionReasonByApplicationId()[applicationId] ?? '').trim();

    if (!reason) {
      this.rejectionErrorByApplicationId.update((state) => ({
        ...state,
        [applicationId]: $localize`:@@trip.manager.rejectReason.required:Rejection reason is required.`,
      }));
      return;
    }

    const didReject = await this.applicationService.rejectApplication(applicationId, reason);
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

  readonly isLoadingApplications = this.applicationService.isLoading;
  readonly loadApplicationsError = this.applicationService.error;

  readonly tripReviews = computed(() => {
    const tripId = this.trip()?.id;
    if (!tripId) return [];
    return this.reviewService.reviewsForTrip(tripId);
  });

  readonly today = new Date();
}
