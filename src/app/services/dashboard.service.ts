import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

const BASE = environment.apiUrl;

/**
 * DashboardService
 *
 * All methods call the real Flask API.
 * Error handling: every Observable surfaces a meaningful string so
 * components can display it directly without extra parsing.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  // ─────────────────────────────────────────────────────────────────────────
  // Pharmacy Dashboard
  // GET /api/analytics/pharmacy/analytics?name=<pharmacy_name>
  // ─────────────────────────────────────────────────────────────────────────

  getPharmacyAnalytics(pharmacyName: string): Observable<PharmacyAnalyticsResponse> {
    const params = new HttpParams().set('name', pharmacyName);
    return this.http
      .get<ApiResponse<PharmacyAnalyticsResponse>>(
        `${BASE}/api/analytics/pharmacy/analytics`,
        { params },
      )
      .pipe(
        map(res => {
          if (!res.success || !res.data) throw new Error(res.message ?? 'Pharmacy not found.');
          return res.data;
        }),
        catchError(this.handleError),
      );
  }

  /** Convenience: just the traffic array */
  getPharmacyTraffic(pharmacyName: string): Observable<PageTrafficPoint[]> {
    return this.getPharmacyAnalytics(pharmacyName).pipe(
      map(r => r.page_traffic),
    );
  }

  /** Convenience: just the drug trends array */
  getLocalDrugTrends(pharmacyName: string): Observable<LocalDrugTrend[]> {
    return this.getPharmacyAnalytics(pharmacyName).pipe(
      map(r => r.drug_trends),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Low stock & missing drugs
  // GET /api/analytics/pharmacy/low-stock
  // ─────────────────────────────────────────────────────────────────────────

  getLowStock(): Observable<LowStockResponse> {
    return this.http
      .get<LowStockResponse>(`${BASE}/api/analytics/pharmacy/low-stock`)
      .pipe(catchError(this.handleError));
  }

  getLowStockDrugs(): Observable<LowStockDrug[]> {
    return this.getLowStock().pipe(map(r => r.low_stock_drugs.data));
  }

  getMissingDrugs(): Observable<MissingDrug[]> {
    return this.getLowStock().pipe(map(r => r.high_demand_missing_drugs.data));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Admin Dashboard — single call returns all admin data
  // GET /api/analytics/admin
  // ─────────────────────────────────────────────────────────────────────────

  getAdminAnalytics(): Observable<AdminAnalyticsResponse> {
    return this.http
      .get<ApiResponse<AdminAnalyticsResponse>>(`${BASE}/api/analytics/admin`)
      .pipe(
        map(res => {
          if (!res.success || !res.data) throw new Error(res.message ?? 'Failed to load admin data.');
          return res.data;
        }),
        catchError(this.handleError),
      );
  }

  /** Convenience wrappers used by analytics-charts */
  getPharmacyTrafficRanking(): Observable<PharmacyTrafficRanking[]> {
    return this.getAdminAnalytics().pipe(map(r => r.pharmacy_ranking));
  }

  getAreaDrugTrends(governorate?: string, city?: string): Observable<AreaDrugTrend[]> {
    return this.getAdminAnalytics().pipe(
      map(r => {
        let trends = r.area_drug_trends;
        if (governorate) trends = trends.filter(t => t.governorate === governorate);
        if (city)        trends = trends.filter(t => t.city === city);
        return trends;
      }),
    );
  }

  getTopSearchedDrugs(): Observable<TopSearchedDrug[]> {
    return this.getAdminAnalytics().pipe(map(r => r.top_searched_drugs));
  }

  getMonthlySearchVolume(): Observable<MonthlySearchVolume[]> {
    return this.getAdminAnalytics().pipe(map(r => r.monthly_report));
  }

  /** Unique governorates extracted from area_drug_trends */
  getGovernorates(): Observable<string[]> {
    return this.getAdminAnalytics().pipe(
      map(r => [...new Set(r.area_drug_trends.map(t => t.governorate))].sort()),
    );
  }

  /** Cities within a governorate */
  getCities(governorate: string): Observable<string[]> {
    return this.getAdminAnalytics().pipe(
      map(r => [
        ...new Set(
          r.area_drug_trends
            .filter(t => t.governorate === governorate)
            .map(t => t.city),
        ),
      ].sort()),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Drug Search Analytics Widget
  // GET /api/analytics/drug-search?name=<drug_name>
  // ─────────────────────────────────────────────────────────────────────────

  getDrugAnalyticsByName(drugName: string): Observable<DrugSearchAnalytics> {
    const params = new HttpParams().set('name', drugName);
    return this.http
      .get<ApiResponse<DrugSearchAnalyticsResponse>>(
        `${BASE}/api/analytics/drug-search`,
        { params },
      )
      .pipe(
        map(res => {
          if (!res.success || !res.data) throw new Error(res.message ?? 'Drug not found.');
          const d = res.data;
          // Flatten the nested statistics object into our widget model
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
        catchError(this.handleError),
      );
  }

  // Keep backward-compatible signature used by the widget (by drug id — not supported
  // by the API; we look up by name instead; this overload is kept for the demo page)
  getDrugAnalytics(drugId: number): Observable<DrugSearchAnalytics> {
    // The API only supports name-based lookup; drugId is not exposed as a query param.
    // The demo page now uses getDrugAnalyticsByName() directly.
    // This stub preserves the existing widget interface signature.
    return throwError(() => new Error(
      'The drug analytics API requires a drug name, not an ID. ' +
      'Use getDrugAnalyticsByName(name) instead.'
    ));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Error handler
  // ─────────────────────────────────────────────────────────────────────────
  private handleError(err: HttpErrorResponse | Error): Observable<never> {
    let msg: string;

    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        msg = 'Cannot reach the API server. Make sure the Flask backend is running on ' + BASE;
      } else if (err.status === 404) {
        msg = err.error?.message ?? 'Resource not found.';
      } else if (err.status === 400) {
        msg = err.error?.message ?? 'Bad request.';
      } else {
        msg = `Server error ${err.status}: ${err.error?.message ?? err.message}`;
      }
    } else {
      msg = err.message;
    }

    return throwError(() => new Error(msg));
  }
}
