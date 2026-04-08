import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
}

export function weatherLabel(code: number): { label: string; icon: string } {
  if (code === 0)  return { label: 'Clear sky',    icon: '☀️' };
  if (code <= 3)   return { label: 'Partly cloudy',icon: '⛅' };
  if (code <= 48)  return { label: 'Fog',           icon: '🌫️' };
  if (code <= 67)  return { label: 'Rain',          icon: '🌧️' };
  if (code <= 77)  return { label: 'Snow',          icon: '❄️' };
  if (code <= 82)  return { label: 'Showers',       icon: '🌦️' };
  return                  { label: 'Thunderstorm',  icon: '⛈️' };
}

interface GeoResponse {
  results?: { latitude: number; longitude: number }[];
}

interface ForecastResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private http = inject(HttpClient);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly forecast = signal<WeatherDay[] | null>(null);

  async loadForecast(city: string, startDate: Date): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.forecast.set(null);

    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
      const geo = await firstValueFrom(this.http.get<GeoResponse>(geoUrl));

      if (!geo.results?.length) {
        this.error.set('Location not found');
        return;
      }

      const { latitude, longitude } = geo.results[0];
      const today = new Date();
      const maxEnd = new Date(today);
      maxEnd.setDate(today.getDate() + 15);
      const endDate = startDate < maxEnd ? startDate : maxEnd;

      const forecastUrl =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${latitude}&longitude=${longitude}` +
        `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
        `&timezone=auto` +
        `&start_date=${formatDate(today)}&end_date=${formatDate(endDate)}`;

      const raw = await firstValueFrom(this.http.get<ForecastResponse>(forecastUrl));
      const days: WeatherDay[] = raw.daily.time.map((date, i) => ({
        date,
        tempMax: raw.daily.temperature_2m_max[i],
        tempMin: raw.daily.temperature_2m_min[i],
        weatherCode: raw.daily.weathercode[i],
      }));

      this.forecast.set(days);
    } catch {
      this.error.set('Weather forecast unavailable');
    } finally {
      this.loading.set(false);
    }
  }
}
