import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { TripDisplayComponent } from './features/trips/trip-display/trip-display.component';
import { NotFoundComponent } from './core/not-found/not-found.component';

export const routes: Routes = [
  { path: 'trips', component: TripDisplayComponent },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/trips', pathMatch: 'full' },
  { path: '**', component: NotFoundComponent },
];