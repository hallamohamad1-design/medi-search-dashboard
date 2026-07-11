import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * AuthService stub — wire this to your existing auth implementation.
 *
 * The dashboard only relies on:
 *   - isAuthenticated(): boolean
 *   - hasRole(role): boolean
 *   - currentUser: { name, role, pharmacyName? }
 *
 * These are intentionally lightweight so the existing auth system
 * can back them without changes to the dashboard components.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private get isBrowser() { return isPlatformBrowser(this.platformId); }

  /**
   * Returns true when a valid session/token is present.
   * Replace with your token-check / session logic.
   */
  isAuthenticated(): boolean {
    // Example: return !!localStorage.getItem('auth_token');
    return true; // stub — always authenticated for development
  }

  /**
   * Returns true when the authenticated user has the given role.
   * Replace with JWT claim check or session store lookup.
   */
  hasRole(role: 'pharmacy' | 'admin'): boolean {
    // Example: const claims = jwtDecode(token); return claims.role === role;
    if (!this.isBrowser) return true; // SSR: allow all during prerender
    const stubRole = localStorage.getItem('dev_role') ?? 'pharmacy';
    return stubRole === role;
  }

  /** Current user info — used for greeting in sidebar/topbar */
  get currentUser(): { name: string; role: string; pharmacyName?: string } {
    if (!this.isBrowser) {
      return { name: 'Demo User', role: 'pharmacy', pharmacyName: 'El Ezaby Pharmacy' };
    }
    return {
      name: 'Demo User',
      role: localStorage.getItem('dev_role') ?? 'pharmacy',
      pharmacyName: 'El Ezaby Pharmacy',
    };
  }
}
