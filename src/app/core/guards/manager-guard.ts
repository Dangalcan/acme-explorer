import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const managerGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.ready;

  if (authService.currentRole() === 'manager') {
    return true;
  }

  return router.parseUrl('/forbidden');
};
