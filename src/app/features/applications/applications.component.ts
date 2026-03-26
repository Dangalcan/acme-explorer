import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Application, AppStatus } from './application.model';
import { FechasPipe } from '../../shared/pipes/fechas.pipe';

interface ApplicationItem extends Application {
  tripTitle?: string;
}

@Component({
  selector: 'app-applications',
  imports: [FechasPipe],
  templateUrl: './applications.component.html',
  // styleUrl: './applications.component.scss',
})
export class ApplicationsComponent {
  private readonly authService = inject(AuthService);
  private readonly explorerUid = 'dALmY94uwtRtkt4jnWywUMV5Rz82';

  readonly currentRole = this.authService.currentRole;
  private readonly fallbackExplorerId = this.explorerUid;

  readonly expandedId = signal<string | null>(null);

  readonly statusLabel: Record<AppStatus, string> = {
    PENDING: 'Pending',
    REJECTED: 'Rejected',
    DUE: 'Due',
    ACCEPTED: 'Accepted',
    CANCELLED: 'Cancelled',
  };

  readonly statusClasses: Record<AppStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    DUE: 'bg-blue-100 text-blue-700 border-blue-200',
    ACCEPTED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  readonly mockApplications = signal<ApplicationItem[]>([
    {
      id: 'a1',
      version: 0,
      tripId: '1',
      tripTitle: 'Adventure in the Alps',
      explorerId: 'dALmY94uwtRtkt4jnWywUMV5Rz82',
      createdAt: new Date('2026-03-16T10:30:00Z'),
      status: 'PENDING',
      comments: 'I have previous mountain trekking experience and can adapt to weather changes.',
    },
    {
      id: 'a2',
      version: 0,
      tripId: '2',
      tripTitle: 'Sahara Desert Trek',
      explorerId: 'dALmY94uwtRtkt4jnWywUMV5Rz82',
      createdAt: new Date('2026-03-12T09:20:00Z'),
      status: 'REJECTED',
      comments: 'Flexible dates and available for all pre-trip briefings.',
      rejectionReason: 'Required vaccination document is missing.',
    },
    {
      id: 'a3',
      version: 0,
      tripId: '3',
      tripTitle: 'Kyoto Cherry Blossom',
      explorerId: 'explorer-2',
      createdAt: new Date('2026-03-20T15:10:00Z'),
      status: 'ACCEPTED',
      comments: 'Interested in culture-focused itinerary and temple visits.',
    },
    {
      id: 'a4',
      version: 0,
      tripId: '4',
      tripTitle: 'Amazon Rainforest Expedition',
      explorerId: 'dALmY94uwtRtkt4jnWywUMV5Rz82',
      createdAt: new Date('2026-03-01T11:45:00Z'),
      status: 'CANCELLED',
      comments: 'I cancelled due to a schedule conflict with work.',
    },
  ]);

  private readonly currentExplorerId = computed(
    () => this.authService.currentUser()?.uid ?? this.fallbackExplorerId,
  );

  readonly explorerApplications = computed(() => {
    const explorerId = this.currentExplorerId();

    return this.mockApplications()
      .filter((app) => app.explorerId === explorerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  });

  toggleAccordion(applicationId: string): void {
    this.expandedId.update((current) => (current === applicationId ? null : applicationId));
  }

  isExpanded(applicationId: string): boolean {
    return this.expandedId() === applicationId;
  }

  getTripLabel(application: ApplicationItem): string {
    return application.tripTitle?.trim() || application.tripId;
  }
}
