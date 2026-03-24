import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { TripListComponent } from './features/trips/trip-list/trip-list.component';
import { TripDisplayComponent } from './features/trips/trip-display/trip-display.component';
import { NotFoundComponent } from './core/not-found/not-found.component';
import { ApplicationsComponent } from './features/applications/applications.component';
import { FinderComponent } from './features/finder/finder.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SettingsComponent } from './features/settings/settings.component';

export const routes: Routes = [
  { path: 'trips', component: TripListComponent },
  { path: 'trips/:id', component: TripDisplayComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'applications', component: ApplicationsComponent },
  { path: 'finder', component: FinderComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '', redirectTo: '/trips', pathMatch: 'full' },
  { path: '**', component: NotFoundComponent },
];