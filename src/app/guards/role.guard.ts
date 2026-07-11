import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export function roleGuard(requiredRole: 'pharmacy' | 'admin'): CanActivateFn {
  return () => {
    const auth       = inject(AuthService);
    const router     = inject(Router);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) return true;

    if (!auth.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    if (!auth.hasRole(requiredRole)) {
      // Auto-redirect to the correct dashboard
      const dest = auth.currentUser?.role === 'admin' ? '/dashboard/admin' : '/dashboard/pharmacy';
      router.navigate([dest]);
      return false;
    }

    return true;
  };
}
