import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TripService } from '../trip.service';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { AuthService } from '../../../core/services/auth.service';
import { Application, AppStatus } from '../../applications/application.model';
import { TranslatePipe } from '@ngx-translate/core';

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

  private id = toSignal(this.route.paramMap.pipe(map(p => p.get('id') ?? '')));

  trip = computed(() => this.tripService.getById(this.id() ?? ''));

  readonly currentRole = this.authService.currentRole;

  readonly applications = signal<Application[]>([
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

  readonly tripApplications = computed(() => {
    const tripId = this.trip()?.id;
    const apps = this.applications();
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
  readonly pageStartItem = computed(() => this.currentPage() * this.pageSize() + 1);
  readonly pageEndItem = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalApplications()));
  readonly paginatedTripApplications = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.tripApplications().slice(start, start + this.pageSize());
  });

  readonly isLoadingApplications = signal(false);
  readonly loadApplicationsError = signal<string | null>(null);

  readonly sampleReviews: any[] = [
    { id: 'r1', explorerId: 'explorer-1', rating: 5, comment: 'Absolutely breathtaking! The Alps exceeded all expectations.', createdAt: new Date('2026-03-15') },
    { id: 'r2', explorerId: 'explorer-3', rating: 4, comment: 'Great trip overall, well organized.', createdAt: new Date('2026-03-20') },
  ];

  readonly today = new Date();

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) this.currentPage.update(p => p + 1);
  }

  previousPage(): void {
    if (this.currentPage() > 0) this.currentPage.update(p => p - 1);
  }

  changePageSize(value: string): void {
    this.pageSize.set(Number(value));
    this.currentPage.set(0);
  }
}
