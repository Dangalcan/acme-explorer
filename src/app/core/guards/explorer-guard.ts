import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const explorerGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.ready;

  if (authService.currentRole() === 'explorer') {
    return true;
  }

  return router.parseUrl('/forbidden');
};
