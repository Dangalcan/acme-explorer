import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'admin/**',
    renderMode: RenderMode.Client
  },
  {
    path: 'trips/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'trips/create',
    renderMode: RenderMode.Client
  },
  {
    path: 'trips/:id/edit',
    renderMode: RenderMode.Client
  },
  {
    path: 'applications',
    renderMode: RenderMode.Client
  },
  {
    path: 'finder',
    renderMode: RenderMode.Client
  },
  {
    path: 'favourites',
    renderMode: RenderMode.Client
  },
  {
    path: 'settings',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
