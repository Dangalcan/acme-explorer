import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { TripService } from '../trip.service';
import { TripFormComponent, TripFormValue } from '../trip-form/trip-form.component';

@Component({
  selector: 'app-trip-edit',
  standalone: true,
  imports: [TripFormComponent, TranslatePipe, RouterLink],
  templateUrl: './trip-edit.component.html',
})
export class TripEditComponent {
  private route = inject(ActivatedRoute);
  private tripService = inject(TripService);
  private router = inject(Router);

  private id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')));

  readonly trip = computed(() => this.tripService.getById(this.id() ?? ''));

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async onUpdate(value: TripFormValue): Promise<void> {
    const tripId = this.id();
    const currentTrip = this.trip();
    if (!tripId || !currentTrip) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const success = await this.tripService.updateTrip(tripId, {
      title: value.title,
      description: value.description,
      difficultyLevel: value.difficultyLevel,
      maxParticipants: value.maxParticipants,
      startDate: value.startDate,
      endDate: value.endDate,
      location: value.location.city || value.location.country ? value.location : undefined,
      stages: value.stages.map((s, i) => ({
        id: currentTrip.stages[i]?.id ?? crypto.randomUUID(),
        version: currentTrip.stages[i]?.version ?? 0,
        title: s.title,
        description: s.description,
        price: s.price,
      })),
      pictures: value.pictures.map((url) => ({ url })),
    });

    this.isLoading.set(false);

    if (success) {
      void this.router.navigate(['/trips', tripId]);
    } else {
      this.errorMessage.set('trips.form.error.update_failed');
    }
  }

  onCancel(): void {
    const tripId = this.id();
    void this.router.navigate(tripId ? ['/trips', tripId] : ['/trips']);
  }
}
