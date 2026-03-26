import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TripService } from '../trip.service';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { AuthService } from '../../../core/services/auth.service';
import { ApplicationsDataService } from '../../applications/applications-data.service';
import { AppStatus } from '../../applications/application.model';

interface ApplicationWithTrip {
  id: string;
  version: number;
  tripId: string;
  explorerId: string;
  createdAt: Date;
  status: AppStatus;
  comments?: string;
  rejectionReason?: string;
  tripTitle?: string;
}

interface Actor {
  id: string;
  version: number;
  role: 'explorer' | 'manager' | 'administrator';
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
  address: string;
}

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
  private applicationsDataService = inject(ApplicationsDataService);

  private id = toSignal(this.route.paramMap.pipe(map(p => p.get('id') ?? '')));

  trip = computed(() => this.tripService.getById(this.id() ?? ''));

  readonly currentUser = this.authService.currentUser;
  readonly currentRole = this.authService.currentRole;

  // Data signals
  readonly applications = signal<ApplicationWithTrip[]>([]);
  readonly actors = signal<Actor[]>([]);

  // State signals
  readonly isLoadingApplications = signal(false);
  readonly loadApplicationsError = signal<string | null>(null);

  // Temporary UID to actor ID mapping
  private readonly uidToActorId: Record<string, string> = {
    'dALmY94uwtRtkt4jnWywUMV5Rz82': 'manager-1', // manager@acme-explorer.com
  };

  readonly currentActorId = computed(() => {
    const user = this.currentUser();
    const actors = this.actors();

    if (!user) return null;

    const byUid = actors.find((a) => a.id === user.uid);
    if (byUid) return byUid.id;

    const byEmail = actors.find((a) => a.email === user.email);
    if (byEmail) return byEmail.id;

    return this.uidToActorId[user.uid] ?? null;
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
    this.loadApplicationsData();
  }

  private loadApplicationsData(): void {
    this.isLoadingApplications.set(true);
    this.loadApplicationsError.set(null);

    try {
      const { applications, actors } = this.applicationsDataService.getApplicationsData();
      this.actors.set(actors);
      this.applications.set(applications);
    } catch {
      this.loadApplicationsError.set('Failed to load applications.');
    } finally {
      this.isLoadingApplications.set(false);
    }
  }
}

