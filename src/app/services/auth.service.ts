import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  success: boolean;
  token: string;
  user: UserInfo;
  message?: string;
}

export interface UserInfo {
  id: number;
  username: string;
  role: 'pharmacy' | 'admin';
  pharmacy_id: number | null;
  pharmacy_name: string | null;
}

const TOKEN_KEY = 'ms_token';
const USER_KEY  = 'ms_user';
const BASE      = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http       = inject(HttpClient);
  private router     = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private get isBrowser() { return isPlatformBrowser(this.platformId); }

  // Real pharmacy names (kept for sidebar display — loaded from token)
  static readonly PHARMACIES = [
    'El Ezaby Pharmacy',
    'Sehha Pharmacy',
    'El Hazim Pharmacy',
    'Hind Pharmacy',
  ];

  // ── Token storage ─────────────────────────────────────────────────────────
  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private setToken(token: string): void {
    if (this.isBrowser) localStorage.setItem(TOKEN_KEY, token);
  }

  private setUser(user: UserInfo): void {
    if (this.isBrowser) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      // Decode without verifying (signature checked server-side)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch { return false; }
  }

  hasRole(role: 'pharmacy' | 'admin'): boolean {
    return this.currentUser?.role === role;
  }

  get currentUser(): UserInfo | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as UserInfo; } catch { return null; }
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${BASE}/api/auth/login`, { username, password }).pipe(
      tap(res => {
        if (res.success) {
          this.setToken(res.token);
          this.setUser(res.user);
        }
      }),
      catchError(err => {
        const msg = err.error?.message ?? 'Login failed. Please try again.';
        return throwError(() => new Error(msg));
      }),
    );
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.router.navigate(['/login']);
  }
}
