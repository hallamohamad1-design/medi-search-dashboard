import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role-based access guard.
 *
 * Usage in route config:
 *   canActivate: [roleGuard('pharmacy')]
 *   canActivate: [roleGuard('admin')]
 *
 * Assumes AuthService.hasRole(role) already exists in the app.
 * Falls back to a redirect to /login when not authenticated,
 * and to /unauthorized when authenticated but wrong role.
 */
export function roleGuard(requiredRole: 'pharmacy' | 'admin'): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    if (!auth.hasRole(requiredRole)) {
      router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  };
}
