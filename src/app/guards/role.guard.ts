import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

/**
 * Dynamic role guard.
 * - No session → redirect to /login
 * - Wrong role → redirect to the correct dashboard automatically
 */
export function roleGuard(requiredRole: 'pharmacy' | 'admin'): CanActivateFn {
  return () => {
    const router     = inject(Router);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) return true; // SSR: allow

    const role = localStorage.getItem('dev_role');

    // Not logged in → go to login page
    if (!role) {
      router.navigate(['/login']);
      return false;
    }

    // Wrong role → auto-redirect to the correct dashboard
    if (role !== requiredRole) {
      const dest = role === 'admin' ? '/dashboard/admin' : '/dashboard/pharmacy';
      router.navigate([dest]);
      return false;
    }

    return true;
  };
}
