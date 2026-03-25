import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TripService } from '../trip.service';
import { TripCardComponent } from '../trip-card/trip-card.component';

@Component({
  selector: 'app-trip-display',
  imports: [RouterLink, TripCardComponent],
  templateUrl: './trip-display.component.html',
})
export class TripDisplayComponent {
  private route = inject(ActivatedRoute);
  private tripService = inject(TripService);

  private id = toSignal(this.route.paramMap.pipe(map(p => p.get('id') ?? '')));

  trip = computed(() => this.tripService.getById(this.id() ?? ''));

  // Sample reviews — will come from ReviewService once the backend is wired
  readonly sampleReviews = [
    { id: 'r1', explorerId: 'Alice', rating: 5, comment: 'Absolutely incredible experience. The guides were professional and the scenery was breathtaking.', createdAt: new Date('2025-09-12') },
    { id: 'r2', explorerId: 'Bob', rating: 4, comment: 'Great trip overall. A bit challenging at times but totally worth it.', createdAt: new Date('2025-10-01') },
    { id: 'r3', explorerId: 'Carol', rating: 5, comment: 'Best trip of my life. Would book again without hesitation.', createdAt: new Date('2025-11-20') },
  ];
}

