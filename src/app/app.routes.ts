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
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/trips', pathMatch: 'full' },

  {
    path: 'trips',
    children: [
      { path: '', component: TripListComponent },
      { path: ':id', component: TripDisplayComponent },
    ],
  },
 
  { path: 'applications', component: ApplicationsComponent, canActivate: [explorerGuard] },
  { path: 'finder', component: FinderComponent , canActivate: [explorerGuard]  },

  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
 
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'create-manager', component: CreateManagerComponent },
      { path: 'users', component: UsersListComponent },
    ],
  },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forbidden', component: ForbiddenComponent },
  { path: '**', component: NotFoundComponent },
];