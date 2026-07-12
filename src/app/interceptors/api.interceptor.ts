import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Attaches the JWT Bearer token + JSON headers to every /api/* request.
 * Also enables withCredentials so the session cookie is sent/received.
 */
export const apiInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (!req.url.includes('/api/')) return next(req);

  const auth = inject(AuthService);
  const token = auth.getToken();

  const headers: Record<string, string> = {
    'Accept':       'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return next(req.clone({ setHeaders: headers, withCredentials: true }));
};
