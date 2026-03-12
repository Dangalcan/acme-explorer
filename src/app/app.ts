import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TripDisplayComponent } from './features/trips/trip-display/trip-display.component';
import { AuthPanelComponent } from './shared/auth-panel/auth-panel.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TripDisplayComponent, AuthPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('acme-explorer');
}