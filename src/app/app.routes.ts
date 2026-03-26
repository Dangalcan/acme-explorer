import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { TripListComponent } from './features/trips/trip-list/trip-list.component';
import { TripDisplayComponent } from './features/trips/trip-display/trip-display.component';
import { NotFoundComponent } from './core/not-found/not-found.component';
import { ForbiddenComponent } from './core/forbidden/forbidden.component';
import { ApplicationsComponent } from './features/applications/applications.component';
import { FinderComponent } from './features/finder/finder.component';
import { DashboardComponent } from './features/admin/dashboard/dashboard.component';
import { SettingsComponent } from './features/settings/settings.component';
import { CreateManagerComponent } from './features/admin/create-manager/create-manager.component';
import { UsersListComponent } from './features/admin/users-list/users-list.component';
import { adminGuard } from './core/guards/admin-guard';
import { explorerGuard } from './core/guards/explorer-guard';

export const routes: Routes = [
  { path: 'trips', component: TripListComponent },
  { path: 'trips/:id', component: TripDisplayComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'applications', component: ApplicationsComponent, canActivate: [explorerGuard] },
  { path: 'finder', component: FinderComponent , canActivate: [explorerGuard]  },
  { path: 'admin/dashboard', component: DashboardComponent, canActivate: [adminGuard] },
  { path: 'settings', component: SettingsComponent },
  { path: 'admin/create-manager', component: CreateManagerComponent, canActivate: [adminGuard] },
  { path: 'admin/users', component: UsersListComponent, canActivate: [adminGuard] },
  { path: 'forbidden', component: ForbiddenComponent },
  { path: '', redirectTo: '/trips', pathMatch: 'full' },
  { path: '**', component: NotFoundComponent },
];