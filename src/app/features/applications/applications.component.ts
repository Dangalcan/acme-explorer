import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Application, AppStatus } from './application.model';
import { ApplicationService } from './application.service';
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
  private readonly applicationService = inject(ApplicationService);
  private readonly explorerUid = 'dALmY94uwtRtkt4jnWywUMV5Rz82';

  readonly currentRole = this.authService.currentRole;
  private readonly fallbackExplorerId = this.explorerUid;

  readonly expandedId = signal<string | null>(null);

  readonly statusOrder: AppStatus[] = ['PENDING', 'DUE', 'ACCEPTED', 'REJECTED', 'CANCELLED'];

  readonly statusLabel: Record<AppStatus, string> = {
    PENDING: $localize`:@@application.status.pending:Pending`,
    REJECTED: $localize`:@@application.status.rejected:Rejected`,
    DUE: $localize`:@@application.status.due:Due`,
    ACCEPTED: $localize`:@@application.status.accepted:Accepted`,
    CANCELLED: $localize`:@@application.status.cancelled:Cancelled`,
  };

  readonly statusClasses: Record<AppStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    DUE: 'bg-blue-100 text-blue-700 border-blue-200',
    ACCEPTED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  readonly mockApplications = computed<ApplicationItem[]>(() =>
    this.applicationService.applications().map((app) => ({
      ...app,
      tripTitle: this.tripTitles[app.tripId],
    })),
  );

  private readonly tripTitles: Record<string, string> = {
    '1': 'Adventure in the Alps',
    '2': 'Sahara Desert Trek',
    '3': 'Kyoto Cherry Blossom',
    '4': 'Amazon Rainforest Expedition',
  };

  private readonly currentExplorerId = computed(
    () => this.authService.currentUser()?.uid ?? this.fallbackExplorerId,
  );

  readonly explorerApplications = computed(() => {
    const explorerId = this.currentExplorerId();
    const applications = this.mockApplications();

    const matchingByCurrentUser = applications.filter((app) => app.explorerId === explorerId);

    if (matchingByCurrentUser.length > 0) {
      return matchingByCurrentUser.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // Keep explorer demo data visible even if Firebase UID differs from mock IDs.
    if (this.currentRole() === 'explorer') {
      return applications
        .filter((app) => app.explorerId === this.fallbackExplorerId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return applications
      .filter((app) => app.explorerId === explorerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  });

  readonly groupedApplications = computed(() =>
    this.statusOrder
      .map((status) => ({
        status,
        applications: this.explorerApplications().filter((application) => application.status === status),
      }))
      .filter((group) => group.applications.length > 0),
  );

  toggleAccordion(applicationId: string): void {
    this.expandedId.update((current) => (current === applicationId ? null : applicationId));
  }

  isExpanded(applicationId: string): boolean {
    return this.expandedId() === applicationId;
  }

  getTripLabel(application: ApplicationItem): string {
    return application.tripTitle?.trim() || application.tripId;
  }

  canPay(application: ApplicationItem): boolean {
    return application.status === 'DUE';
  }

  canCancel(application: ApplicationItem): boolean {
    return application.status === 'PENDING' || application.status === 'DUE';
  }

  payApplication(applicationId: string): void {
    this.applicationService.payApplication(applicationId);
  }

  cancelApplication(applicationId: string): void {
    this.applicationService.cancelApplication(applicationId);
  }
}
