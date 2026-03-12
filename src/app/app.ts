import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthPanelComponent } from './shared/auth-panel/auth-panel.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AuthPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('acme-explorer');
  protected router = inject(Router);
}