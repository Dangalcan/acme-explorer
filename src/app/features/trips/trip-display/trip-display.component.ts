import { Component, DestroyRef, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TripService } from '../trip.service';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { AuthService } from '../../../core/services/auth.service';
import { AppStatus, APPLICATION_VALIDATION } from '../../applications/application.model';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationService } from '../../applications/application.service';
import { ReviewService } from '../review.service';
import { REVIEW_VALIDATION } from '../review.model';


@Component({
  selector: 'app-trip-display',
  standalone: true,
  imports: [RouterLink, FormsModule, TripCardComponent, DatePipe, TranslatePipe],
  templateUrl: './trip-display.component.html',
})
export class TripDisplayComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tripService = inject(TripService);
  private authService = inject(AuthService);
  private applicationService = inject(ApplicationService);
  private reviewService = inject(ReviewService);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  private id = toSignal(this.route.paramMap.pipe(map(p => p.get('id') ?? '')));

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Re-compute immediately when the trip signal changes (e.g., on first route load)
      effect(() => { this.trip(); this.refreshCountdown(); });
      // Tick every minute for live updates
      const id = setInterval(() => this.refreshCountdown(), 60_000);
      this.destroyRef.onDestroy(() => clearInterval(id));
    }
  }

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
        [applicationId]: 'trips.details.rejection_reason_required',
      }));
      return;
    }

    if (reason.length > this.applicationValidation.rejectionReason.maxLength) {
      this.rejectionErrorByApplicationId.update((state) => ({
        ...state,
        [applicationId]: 'trips.details.rejection_reason_max_length',
      }));
      return;
    }

    const didReject = await this.applicationService.rejectApplication(applicationId, reason);
    if (!didReject) {
      this.rejectionErrorByApplicationId.update((state) => ({
        ...state,
        [applicationId]: 'trips.details.reject_failed',
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

  // ── Countdown timer (req B20) ──────────────────────────────────────────────
  readonly countdown = signal<{ days: number; hours: number; minutes: number } | null>(null);

  private refreshCountdown(): void {
    const trip = this.trip();
    if (!trip || trip.cancellation) { this.countdown.set(null); return; }
    const diff = new Date(trip.startDate).getTime() - Date.now();
    if (diff <= 0) { this.countdown.set(null); return; }
    this.countdown.set({
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    });
  }

  readonly reviewValidation = REVIEW_VALIDATION;
  readonly applicationValidation = APPLICATION_VALIDATION;
  readonly ratingStars = Array.from(
    { length: REVIEW_VALIDATION.rating.max - REVIEW_VALIDATION.rating.min + 1 },
    (_, i) => REVIEW_VALIDATION.rating.min + i,
  );

  // ── Review submission (req 23b) ────────────────────────────────────────────

  readonly reviewRating = signal<number>(0);
  readonly reviewComment = signal('');
  readonly isSubmittingReview = signal(false);
  readonly reviewError = signal<string | null>(null);
  readonly reviewSuccess = signal(false);

  /** True when the explorer has an ACCEPTED application and the trip is finished,
   *  and has not yet reviewed this trip. */
  readonly canReview = computed(() => {
    const trip = this.trip();
    const uid = this.authService.currentUser()?.uid;
    if (!trip || this.authService.currentRole() !== 'explorer' || !uid) return false;
    if (trip.cancellation) return false; // cancelled trips cannot be reviewed
    if (new Date(trip.endDate) >= new Date()) return false; // trip must have finished
    const hasAccepted = this.applicationService
      .applications()
      .some((a) => a.tripId === trip.id && a.explorerId === uid && a.status === 'ACCEPTED');
    if (!hasAccepted) return false;
    return !this.tripReviews().some((r) => r.explorerId === uid); // not yet reviewed
  });

  async submitReview(): Promise<void> {
    const rating = this.reviewRating();
    if (rating < REVIEW_VALIDATION.rating.min || rating > REVIEW_VALIDATION.rating.max) {
      this.reviewError.set('reviews.error.rating_required');
      return;
    }
    this.isSubmittingReview.set(true);
    this.reviewError.set(null);
    const tripId = this.trip()?.id;
    if (!tripId) { this.isSubmittingReview.set(false); return; }
    const ok = await this.reviewService.createReview(
      tripId,
      rating,
      this.reviewComment().trim() || undefined,
    );
    this.isSubmittingReview.set(false);
    if (ok) {
      this.reviewSuccess.set(true);
      this.reviewRating.set(0);
      this.reviewComment.set('');
    } else {
      this.reviewError.set('reviews.error.submit_failed');
    }
  }

  setReviewRating(star: number): void {
    this.reviewRating.set(star);
    this.reviewError.set(null);
  }
}
