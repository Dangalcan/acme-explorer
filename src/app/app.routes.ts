import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin-guard';
import { explorerGuard } from './core/guards/explorer-guard';
import { authGuard } from './core/guards/auth-guard';
import { managerGuard } from './core/guards/manager-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/trips', pathMatch: 'full' },

  {
    path: 'trips',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/trips/trip-list/trip-list.component').then(
            (m) => m.TripListComponent,
          ),
      },
      {
        path: 'create',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/trips/trip-create/trip-create.component').then(
            (m) => m.TripCreateComponent,
          ),
      },
      {
        path: ':id/edit',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/trips/trip-edit/trip-edit.component').then(
            (m) => m.TripEditComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/trips/trip-display/trip-display.component').then(
            (m) => m.TripDisplayComponent,
          ),
      },
    ],
  },

  {
    path: 'applications',
    canActivate: [explorerGuard],
    loadComponent: () =>
      import('./features/applications/applications.component').then(
        (m) => m.ApplicationsComponent,
      ),
  },
  {
    path: 'finder',
    canActivate: [explorerGuard],
    loadComponent: () =>
      import('./features/finder/finder.component').then((m) => m.FinderComponent),
  },
  {
    path: 'favourites',
    canActivate: [explorerGuard],
    loadComponent: () =>
      import('./features/favourites/favourites-page.component').then(
        (m) => m.FavouritesPageComponent,
      ),
  },

  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },

  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'create-manager',
        loadComponent: () =>
          import('./features/admin/create-manager/create-manager.component').then(
            (m) => m.CreateManagerComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users-list/users-list.component').then(
            (m) => m.UsersListComponent,
          ),
      },
    ],
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./core/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./core/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
