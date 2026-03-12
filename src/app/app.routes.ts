import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { TripDisplayComponent } from './features/trips/trip-display/trip-display.component';

export const routes: Routes = [
  { path: '', component: TripDisplayComponent },
  { path: 'login', component: LoginComponent },
];