import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * AuthService
 *
 * Wire this to your existing session/JWT implementation.
 * The dashboard reads three things from it:
 *   - isAuthenticated()         → guards routes
 *   - hasRole(role)             → guards pharmacy vs admin routes
 *   - currentUser.pharmacyName  → used as the ?name= query param for the
 *                                  pharmacy analytics API endpoint
 *
 * Dev usage (browser console):
 *   localStorage.setItem('dev_role',     'admin')        // switch to admin
 *   localStorage.setItem('dev_pharmacy', 'El Ezaby Pharmacy') // set pharmacy
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private get isBrowser(): boolean { return isPlatformBrowser(this.platformId); }

  isAuthenticated(): boolean {
    // Replace with: return !!this.tokenService.getToken();
    return true;
  }

  hasRole(role: 'pharmacy' | 'admin'): boolean {
    if (!this.isBrowser) return true; // SSR: allow prerender
    const stored = localStorage.getItem('dev_role') ?? 'pharmacy';
    return stored === role;
  }

  get currentUser(): { name: string; role: string; pharmacyName?: string } {
    if (!this.isBrowser) {
      return { name: 'System', role: 'pharmacy', pharmacyName: '' };
    }
    const role         = localStorage.getItem('dev_role')     ?? 'pharmacy';
    const pharmacyName = localStorage.getItem('dev_pharmacy') ?? 'El Ezaby Pharmacy';
    return {
      name:         localStorage.getItem('dev_name') ?? 'Demo User',
      role,
      // Only expose pharmacyName for pharmacy role; admins don't have one
      pharmacyName: role === 'pharmacy' ? pharmacyName : undefined,
    };
  }
}
