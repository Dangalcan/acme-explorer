import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'admin/**',
    renderMode: RenderMode.Client
  },
  {
    path: 'trips/:id/edit',
    renderMode: RenderMode.Client
  },
  {
    path: 'trips/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'payments/paypal/:amount',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
