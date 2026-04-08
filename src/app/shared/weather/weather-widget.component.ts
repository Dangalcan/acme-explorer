import { Component, computed, inject, Input, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TripLocation } from '../../features/trips/trip.model';
import { WeatherService, weatherLabel } from './weather.service';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './weather-widget.component.html',
})
export class WeatherWidgetComponent implements OnInit {
  @Input({ required: true }) location!: TripLocation;
  @Input({ required: true }) startDate!: Date;

  private weatherService = inject(WeatherService);

  readonly loading = this.weatherService.loading;
  readonly error = this.weatherService.error;
  readonly forecast = this.weatherService.forecast;
  readonly weatherLabel = weatherLabel;

  readonly outOfRange = computed(() => {
    const diff = new Date(this.startDate).getTime() - Date.now();
    return Math.ceil(diff / 86_400_000) > 16;
  });

  isStartDate(dateStr: string): boolean {
    return dateStr === new Date(this.startDate).toISOString().slice(0, 10);
  }

  ngOnInit(): void {
    if (!this.outOfRange()) {
      this.weatherService.loadForecast(this.location.city, new Date(this.startDate));
    }
  }
}
