import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
export class TripDisplayComponent implements OnInit {
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

  // Status badge styling
  readonly statusClasses: Record<AppStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    ACCEPTED: 'bg-green-100 text-green-700 border border-green-200',
    REJECTED: 'bg-red-100 text-red-700 border border-red-200',
    CANCELLED: 'bg-gray-100 text-gray-700 border border-gray-200',
    DUE: 'bg-blue-100 text-blue-700 border border-blue-200',
  };

  // Sample reviews — will come from ReviewService once the backend is wired
  readonly sampleReviews = [
    { id: 'r1', explorerId: 'Alice', rating: 5, comment: 'Absolutely incredible experience. The guides were professional and the scenery was breathtaking.', createdAt: new Date('2025-09-12') },
    { id: 'r2', explorerId: 'Bob', rating: 4, comment: 'Great trip overall. A bit challenging at times but totally worth it.', createdAt: new Date('2025-10-01') },
    { id: 'r3', explorerId: 'Carol', rating: 5, comment: 'Best trip of my life. Would book again without hesitation.', createdAt: new Date('2025-11-20') },
  ];

  ngOnInit(): void {
    this.isLoadingApplications.set(false);
  }

  readonly isLoadingApplications = signal(false);
  readonly loadApplicationsError = signal<string | null>(null);
}

