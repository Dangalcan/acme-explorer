import { Component, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TripService } from '../trip.service';
import { TripFormComponent, TripFormValue } from '../trip-form/trip-form.component';
import { ComponentCanDeactivate } from '../../../core/guards/pending-changes.guard';

@Component({
  selector: 'app-trip-create',
  standalone: true,
  imports: [TripFormComponent, TranslatePipe],
  templateUrl: './trip-create.component.html',
})
export class TripCreateComponent implements ComponentCanDeactivate {
  private tripService = inject(TripService);
  private router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  @ViewChild(TripFormComponent)
  private tripFormComponent?: TripFormComponent;

  async onCreate(value: TripFormValue): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const id = await this.tripService.createTrip({
      title: value.title,
      description: value.description,
      difficultyLevel: value.difficultyLevel,
      maxParticipants: value.maxParticipants,
      startDate: value.startDate,
      endDate: value.endDate,
      location: value.location.city || value.location.country ? value.location : undefined,
      stages: value.stages.map((s) => ({
        id: crypto.randomUUID(),
        version: 0,
        title: s.title,
        description: s.description,
        price: s.price,
      })),
      pictures: value.pictures.map((url) => ({ url })),
    });

    this.isLoading.set(false);

    if (id) {
      this.tripFormComponent?.tripForm.markAsPristine();
      void this.router.navigate(['/trips', id]);
    } else {
      this.errorMessage.set('trips.form.error.create_failed');
    }
  }

  onCancel(): void {
    void this.router.navigate(['/trips']);
  }

  canDeactivate(): boolean {
    return !this.tripFormComponent?.tripForm.dirty;
  }
}
