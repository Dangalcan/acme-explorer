import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TripService } from '../trip.service';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { AuthService } from '../../../core/services/auth.service';
import { Application, AppStatus } from '../../applications/application.model';

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

  private id = toSignal(this.route.paramMap.pipe(map(p => p.get('id') ?? '')));

  trip = computed(() => this.tripService.getById(this.id() ?? ''));

  readonly currentRole = this.authService.currentRole;

  readonly applications = signal<Application[]>([
    {
      id: 'app-1',
      version: 0,
      tripId: '1',
      explorerId: 'explorer-1',
      createdAt: new Date('2026-01-10T09:00:00.000Z'),
      status: 'ACCEPTED',
      comments: 'Very excited about the Alps trip!',
    },
    {
      id: 'app-2',
      version: 0,
      tripId: '3',
      explorerId: 'explorer-1',
      createdAt: new Date('2026-01-15T11:30:00.000Z'),
      status: 'PENDING',
      comments: 'Huge fan of Japanese culture.',
    },
    {
      id: 'app-3',
      version: 0,
      tripId: '2',
      explorerId: 'explorer-2',
      createdAt: new Date('2026-02-01T08:00:00.000Z'),
      status: 'ACCEPTED',
    },
    {
      id: 'app-4',
      version: 0,
      tripId: '4',
      explorerId: 'explorer-2',
      createdAt: new Date('2026-02-20T14:00:00.000Z'),
      status: 'REJECTED',
      comments: 'Interested in Amazon wildlife.',
      rejectionReason: 'Trip is fully booked.',
    },
    {
      id: 'app-5',
      version: 0,
      tripId: '3',
      explorerId: 'explorer-3',
      createdAt: new Date('2026-01-20T10:00:00.000Z'),
      status: 'ACCEPTED',
    },
    {
      id: 'app-6',
      version: 0,
      tripId: '4',
      explorerId: 'explorer-3',
      createdAt: new Date('2026-03-01T09:30:00.000Z'),
      status: 'PENDING',
      comments: 'I have jungle survival training.',
    },
    {
      id: 'app-7',
      version: 0,
      tripId: '1',
      explorerId: 'explorer-2',
      createdAt: new Date('2026-01-25T16:00:00.000Z'),
      status: 'CANCELLED',
      comments: 'Schedule conflict, unfortunately.',
    },
    {
      id: 'app-8',
      version: 0,
      tripId: '1',
      explorerId: 'explorer-4',
      createdAt: new Date('2026-01-28T10:00:00.000Z'),
      status: 'PENDING',
      comments: 'Looking forward to this trip.',
    },
    {
      id: 'app-9',
      version: 0,
      tripId: '1',
      explorerId: 'explorer-5',
      createdAt: new Date('2026-01-29T09:15:00.000Z'),
      status: 'DUE',
      comments: 'Please confirm payment instructions.',
    },
    {
      id: 'app-10',
      version: 0,
      tripId: '1',
      explorerId: 'explorer-6',
      createdAt: new Date('2026-01-30T12:45:00.000Z'),
      status: 'REJECTED',
      rejectionReason: 'No seats available.',
    },
    {
      id: 'app-11',
      version: 0,
      tripId: '1',
      explorerId: 'explorer-7',
      createdAt: new Date('2026-01-31T08:20:00.000Z'),
      status: 'ACCEPTED',
      comments: 'Happy to join.',
    },
    {
      id: 'app-12',
      version: 0,
      tripId: '1',
      explorerId: 'explorer-8',
      createdAt: new Date('2026-02-01T14:00:00.000Z'),
      status: 'CANCELLED',
      comments: 'Cannot attend anymore.',
    },
  ]);

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

  // Sample reviews — will come from ReviewService once the backend is wired
  readonly sampleReviews = [
    { id: 'r1', explorerId: 'Alice', rating: 5, comment: 'Absolutely incredible experience. The guides were professional and the scenery was breathtaking.', createdAt: new Date('2025-09-12') },
    { id: 'r2', explorerId: 'Bob', rating: 4, comment: 'Great trip overall. A bit challenging at times but totally worth it.', createdAt: new Date('2025-10-01') },
    { id: 'r3', explorerId: 'Carol', rating: 5, comment: 'Best trip of my life. Would book again without hesitation.', createdAt: new Date('2025-11-20') },
  ];

  readonly isLoadingApplications = signal(false);
  readonly loadApplicationsError = signal<string | null>(null);
}

