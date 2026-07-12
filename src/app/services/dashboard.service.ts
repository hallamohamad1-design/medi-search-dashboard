import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, shareReplay, tap, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import {
  PageTrafficPoint,
  LocalDrugTrend,
  PharmacyAnalyticsResponse,
  PharmacyTrafficRanking,
  AreaDrugTrend,
  TopSearchedDrug,
  MonthlySearchVolume,
  AdminAnalyticsResponse,
  DrugSearchAnalyticsResponse,
  DrugSearchAnalytics,
  LowStockDrug,
  MissingDrug,
  LowStockResponse,
  ApiResponse,
} from '../models/analytics.models';

const BASE   = environment.apiUrl;
const TTL_MS = 5 * 60 * 1000; // 5-minute in-session cache

interface CacheEntry<T> { value: T; expiresAt: number; }

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private cache = new Map<string, CacheEntry<any>>();

  private getCached<T>(key: string): T | null {
    const e = this.cache.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) { this.cache.delete(key); return null; }
    return e.value as T;
  }
  private setCached<T>(key: string, v: T): void {
    this.cache.set(key, { value: v, expiresAt: Date.now() + TTL_MS });
  }
  invalidateAll(): void { this.cache.clear(); }

  private cachedGet<T>(key: string, url: string, params?: HttpParams): Observable<T> {
    const hit = this.getCached<T>(key);
    if (hit !== null) return of(hit);
    return this.http.get<T>(url, params ? { params } : {}).pipe(
      timeout(25000),
      tap(v => this.setCached(key, v)),
      catchError(this.handleError),
    );
  }

  // ── Pharmacy — token-scoped, no ?name= needed ─────────────────────────────
  getPharmacyAnalytics(pharmacyId: number): Observable<PharmacyAnalyticsResponse> {
    return this.cachedGet<ApiResponse<PharmacyAnalyticsResponse>>(
      `pharmacy:${pharmacyId}`, `${BASE}/api/analytics/pharmacy/${pharmacyId}/analytics`,
    ).pipe(
      map(res => {
        if (!res.success || !res.data) throw new Error(res.message ?? 'Pharmacy not found.');
        return res.data;
      }),
      shareReplay(1),
    );
  }
  getPharmacyTraffic(pharmacyId: number): Observable<PageTrafficPoint[]> {
    return this.getPharmacyAnalytics(pharmacyId).pipe(map(r => r.page_traffic));
  }
  getLocalDrugTrends(pharmacyId: number): Observable<LocalDrugTrend[]> {
    return this.getPharmacyAnalytics(pharmacyId).pipe(map(r => r.drug_trends));
  }

  // ── Low-stock ──────────────────────────────────────────────────────────────
  getLowStock(): Observable<LowStockResponse> {
    return this.cachedGet<LowStockResponse>('low-stock', `${BASE}/api/analytics/pharmacy/low-stock`);
  }
  getLowStockDrugs(): Observable<LowStockDrug[]> {
    return this.getLowStock().pipe(map(r => r.low_stock_drugs.data));
  }
  getMissingDrugs(): Observable<MissingDrug[]> {
    return this.getLowStock().pipe(map(r => r.high_demand_missing_drugs.data));
  }

  // ── Admin — single call, cached, in-flight deduplication ──────────────────
  private adminAnalytics$: Observable<AdminAnalyticsResponse> | null = null;

  getAdminAnalytics(): Observable<AdminAnalyticsResponse> {
    const cached = this.getCached<AdminAnalyticsResponse>('admin');
    if (cached) return of(cached);
    if (this.adminAnalytics$) return this.adminAnalytics$;

    this.adminAnalytics$ = this.http
      .get<ApiResponse<AdminAnalyticsResponse>>(`${BASE}/api/analytics/admin`)
      .pipe(
        timeout(25000),
        map(res => {
          if (!res.success || !res.data) throw new Error(res.message ?? 'Failed to load admin data.');
          return res.data;
        }),
        tap(data => { this.setCached('admin', data); this.adminAnalytics$ = null; }),
        shareReplay(1),
        catchError(err => { this.adminAnalytics$ = null; return this.handleError(err); }),
      );
    return this.adminAnalytics$;
  }

  getPharmacyTrafficRanking(): Observable<PharmacyTrafficRanking[]> {
    return this.getAdminAnalytics().pipe(map(r => r.pharmacy_ranking));
  }
  getTopSearchedDrugs(): Observable<TopSearchedDrug[]> {
    return this.getAdminAnalytics().pipe(map(r => r.top_searched_drugs));
  }
  getMonthlySearchVolume(): Observable<MonthlySearchVolume[]> {
    return this.getAdminAnalytics().pipe(map(r => r.monthly_report));
  }
  getAreaDrugTrends(gov?: string, city?: string): Observable<AreaDrugTrend[]> {
    return this.getAdminAnalytics().pipe(map(r => {
      let t = r.area_drug_trends;
      if (gov)  t = t.filter(x => x.governorate === gov);
      if (city) t = t.filter(x => x.city === city);
      return t;
    }));
  }
  getGovernorates(): Observable<string[]> {
    return this.getAdminAnalytics().pipe(
      map(r => [...new Set(r.area_drug_trends.map(x => x.governorate))].sort()),
    );
  }
  getCities(gov: string): Observable<string[]> {
    return this.getAdminAnalytics().pipe(
      map(r => [...new Set(
        r.area_drug_trends.filter(x => x.governorate === gov).map(x => x.city),
      )].sort()),
    );
  }

  // ── Drug analytics — partial name search ─────────────────────────────────
  getDrugAnalyticsByName(drugName: string): Observable<DrugSearchAnalytics> {
    const params = new HttpParams().set('name', drugName);
    return this.cachedGet<ApiResponse<DrugSearchAnalyticsResponse>>(
      `drug:${drugName.toLowerCase()}`, `${BASE}/api/analytics/drug-search`, params,
    ).pipe(
      map(res => {
        if (!res.success || !res.data) throw new Error(res.message ?? 'Drug not found.');
        const d = res.data;
        return {
          drug_id:              d.drug_id,
          drug_name:            d.drug_name,
          avg_price:            d.statistics.average_price,
          highest_price:        d.statistics.highest_price,
          lowest_price:         d.statistics.lowest_price,
          pharmacies_in_stock:  d.statistics.pharmacies_in_stock,
          pharmacies_carrying:  d.statistics.pharmacies_carrying_drug,
          availability_percent: d.statistics.availability_percentage,
        } as DrugSearchAnalytics;
      }),
    );
  }

  // ── Drug autocomplete ─────────────────────────────────────────────────────
  getDrugSuggestions(query: string): Observable<{ drug_id: number; name: string }[]> {
    if (!query || query.trim().length < 2) return of([]);
    const params = new HttpParams().set('q', query.trim());
    return this.http
      .get<{ success: boolean; suggestions: { drug_id: number; name: string }[] }>(
        `${BASE}/api/analytics/drug-suggestions`, { params },
      )
      .pipe(
        timeout(8000),
        map(res => res.suggestions ?? []),
        catchError(() => of([])),
      );
  }

  // ── Admin: pharmacy management ────────────────────────────────────────────
  getPharmacyList(): Observable<{ pharmacy_id: number; name: string; is_active: boolean }[]> {
    return this.http
      .get<{ success: boolean; data: any[] }>(`${BASE}/api/auth/pharmacies`)
      .pipe(map(r => r.data), catchError(this.handleError));
  }

  togglePharmacyActive(pharmacyId: number, active: boolean): Observable<any> {
    return this.http
      .post<any>(`${BASE}/api/auth/pharmacies/${pharmacyId}/toggle`, { active })
      .pipe(
        tap(() => this.invalidateAll()),  // bust cache after change
        catchError(this.handleError),
      );
  }

  getPharmacyUsers(): Observable<any[]> {
    return this.http
      .get<{ success: boolean; data: any[] }>(`${BASE}/api/auth/users`)
      .pipe(map(r => r.data), catchError(this.handleError));
  }

  // ── Error handler ─────────────────────────────────────────────────────────
  private handleError(err: HttpErrorResponse | Error): Observable<never> {
    let msg: string;
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0)    msg = 'Cannot reach the API server. Is the backend running?';
      else if (err.status === 401) msg = 'Session expired. Please log in again.';
      else if (err.status === 403) msg = 'Access denied.';
      else if (err.status === 400) msg = err.error?.message ?? 'Bad request.';
      else if (err.status === 404) msg = err.error?.message ?? 'Not found.';
      else                         msg = `Server error ${err.status}: ${err.error?.message ?? err.message}`;
    } else {
      msg = (err as any).name === 'TimeoutError'
        ? 'Request timed out. The database may be waking up — please try again.'
        : err.message;
    }
    return throwError(() => new Error(msg));
  }
}
