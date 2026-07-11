import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * AuthService — wire to your real JWT/session system.
 *
 * Real pharmacies in DB:
 *   El Ezaby Pharmacy  (pharmacy_id: 1)
 *   Sehha Pharmacy     (pharmacy_id: 11)
 *   El Hazim Pharmacy  (pharmacy_id: 7)
 *   Hind Pharmacy      (pharmacy_id: 9)
 *
 * Dev usage (browser console):
 *   localStorage.setItem('dev_role',     'pharmacy')
 *   localStorage.setItem('dev_pharmacy', 'El Ezaby Pharmacy')
 *   localStorage.setItem('dev_role',     'admin')
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private get isBrowser(): boolean { return isPlatformBrowser(this.platformId); }

  /** Real pharmacy names from dim_pharmacy table */
  static readonly PHARMACIES = [
    'El Ezaby Pharmacy',
    'Sehha Pharmacy',
    'El Hazim Pharmacy',
    'Hind Pharmacy',
  ];

  isAuthenticated(): boolean {
    return true; // replace with real token check
  }

  hasRole(role: 'pharmacy' | 'admin'): boolean {
    if (!this.isBrowser) return true;
    const stored = localStorage.getItem('dev_role') ?? 'pharmacy';
    return stored === role;
  }

  get currentUser(): { name: string; role: string; pharmacyName?: string } {
    if (!this.isBrowser) {
      return { name: 'System', role: 'pharmacy', pharmacyName: 'El Ezaby Pharmacy' };
    }
    const role         = localStorage.getItem('dev_role')     ?? 'pharmacy';
    const pharmacyName = localStorage.getItem('dev_pharmacy') ?? 'El Ezaby Pharmacy';
    return {
      name:         localStorage.getItem('dev_name') ?? 'Demo User',
      role,
      pharmacyName: role === 'pharmacy' ? pharmacyName : undefined,
    };
  }
}
