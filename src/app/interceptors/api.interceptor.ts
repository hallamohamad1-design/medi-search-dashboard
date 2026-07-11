import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Adds common headers to every request going to /api/*.
 *
 * Extend here to:
 *  - Attach a Bearer token:  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
 *  - Set Accept-Language for Arabic/English content negotiation
 */
export const apiInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  // Only modify requests to our own API
  if (!req.url.includes('/api/')) {
    return next(req);
  }

  const apiReq = req.clone({
    setHeaders: {
      'Accept':       'application/json',
      'Content-Type': 'application/json',
    },
  });

  return next(apiReq);
};
