import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Application, AppStatus } from './application.model';
import { ApplicationService } from './application.service';
import { FechasPipe } from '../../shared/pipes/fechas.pipe';
import { TranslatePipe } from '@ngx-translate/core';
import { TripService } from '../trips/trip.service';
import { Router } from '@angular/router';

interface ApplicationItem extends Application {
  tripTitle?: string;
}

@Component({
  selector: 'app-applications',
  imports: [FechasPipe, TranslatePipe],
  templateUrl: './applications.component.html',
})
export class ApplicationsComponent {
  private readonly authService = inject(AuthService);
  private readonly applicationService = inject(ApplicationService);
  private readonly tripService = inject(TripService);
  private readonly router = inject(Router);

  readonly currentRole = this.authService.currentRole;
  readonly expandedId = signal<string | null>(null);

  readonly statusOrder: AppStatus[] = ['PENDING', 'DUE', 'ACCEPTED', 'REJECTED', 'CANCELLED'];

  readonly statusKeys: Record<AppStatus, string> = {
    PENDING: 'applications.status.pending',
    REJECTED: 'applications.status.rejected',
    DUE: 'applications.status.due',
    ACCEPTED: 'applications.status.accepted',
    CANCELLED: 'applications.status.cancelled',
  };

  readonly statusClasses: Record<AppStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    DUE: 'bg-blue-100 text-blue-700 border-blue-200',
    ACCEPTED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  readonly currentExplorerId = computed(() => this.authService.currentUser()?.uid ?? null);

  readonly explorerApplications = computed<ApplicationItem[]>(() => {
    const explorerId = this.currentExplorerId();
    if (!explorerId) return [];

    return this.applicationService
      .applications()
      .filter((application) => application.explorerId === explorerId)
      .map((application) => ({
        ...application,
        tripTitle: this.tripService.getById(application.tripId)?.title ?? application.tripId,
      }))
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
    const application = this.explorerApplications().find((item) => item.id === applicationId);
    if (!application || !this.canPay(application)) {
      return;
    }

    const trip = this.tripService.getById(application.tripId);
    const amount = trip?.totalPrice ?? 0;
    if (amount <= 0) {
      return;
    }

    void this.router.navigate(['/payments/paypal', amount], {
      queryParams: { applicationId },
    });
  }

  cancelApplication(applicationId: string): void {
    void this.applicationService.cancelApplication(applicationId);
  }
}
