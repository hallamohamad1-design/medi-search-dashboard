import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
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
 * DashboardService — single source of truth for all API calls.
 *
 * Endpoints wired:
 *   GET /api/analytics/pharmacy/analytics?name=<name>
 *   GET /api/analytics/pharmacy/low-stock
 *   GET /api/analytics/admin
 *   GET /api/analytics/drug-search?name=<name>
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  // ─────────────────────────────────────────────────────────────────────────
  // Pharmacy  →  GET /api/analytics/pharmacy/analytics?name=<pharmacyName>
  //
  // Response envelope:  { success, data: { pharmacy_id, pharmacy_name,
  //                       page_traffic[], drug_trends[] } }
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
          if (!res.success || !res.data) {
            throw new Error(res.message ?? 'Pharmacy not found.');
          }
          return res.data;
        }),
        catchError(this.handleError),
      );
  }

  /** Just the page_traffic array */
  getPharmacyTraffic(pharmacyName: string): Observable<PageTrafficPoint[]> {
    return this.getPharmacyAnalytics(pharmacyName).pipe(map(r => r.page_traffic));
  }

  /** Just the drug_trends array */
  getLocalDrugTrends(pharmacyName: string): Observable<LocalDrugTrend[]> {
    return this.getPharmacyAnalytics(pharmacyName).pipe(map(r => r.drug_trends));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Low-stock  →  GET /api/analytics/pharmacy/low-stock
  //
  // Response (NOT wrapped in { data }):
  //   { success, low_stock_drugs: { count, data[] },
  //               high_demand_missing_drugs: { count, data[] } }
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
  // Admin  →  GET /api/analytics/admin
  //
  // Response envelope:  { success, data: { pharmacy_ranking[],
  //                        area_drug_trends[], top_searched_drugs[],
  //                        monthly_report[] } }
  // ─────────────────────────────────────────────────────────────────────────

  getAdminAnalytics(): Observable<AdminAnalyticsResponse> {
    return this.http
      .get<ApiResponse<AdminAnalyticsResponse>>(`${BASE}/api/analytics/admin`)
      .pipe(
        map(res => {
          if (!res.success || !res.data) {
            throw new Error(res.message ?? 'Failed to load admin analytics.');
          }
          return res.data;
        }),
        // shareReplay(1) so multiple widgets on the admin page share one HTTP call
        shareReplay(1),
        catchError(this.handleError),
      );
  }

  // ── Convenience slices of admin data ─────────────────────────────────────

  getPharmacyTrafficRanking(): Observable<PharmacyTrafficRanking[]> {
    return this.getAdminAnalytics().pipe(map(r => r.pharmacy_ranking));
  }

  getTopSearchedDrugs(): Observable<TopSearchedDrug[]> {
    return this.getAdminAnalytics().pipe(map(r => r.top_searched_drugs));
  }

  getMonthlySearchVolume(): Observable<MonthlySearchVolume[]> {
    return this.getAdminAnalytics().pipe(map(r => r.monthly_report));
  }

  /**
   * Area trends with optional client-side filtering.
   * Filtering happens on the already-fetched admin payload to avoid extra HTTP calls.
   */
  getAreaDrugTrends(governorate?: string, city?: string): Observable<AreaDrugTrend[]> {
    return this.getAdminAnalytics().pipe(
      map(r => {
        let t = r.area_drug_trends;
        if (governorate) t = t.filter(x => x.governorate === governorate);
        if (city)        t = t.filter(x => x.city === city);
        return t;
      }),
    );
  }

  /** Unique governorates from area_drug_trends */
  getGovernorates(): Observable<string[]> {
    return this.getAdminAnalytics().pipe(
      map(r => [...new Set(r.area_drug_trends.map(x => x.governorate))].sort()),
    );
  }

  /** Cities within a governorate */
  getCities(governorate: string): Observable<string[]> {
    return this.getAdminAnalytics().pipe(
      map(r =>
        [...new Set(
          r.area_drug_trends
            .filter(x => x.governorate === governorate)
            .map(x => x.city),
        )].sort(),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Drug analytics widget  →  GET /api/analytics/drug-search?name=<name>
  //
  // Response envelope:  { success, data: { drug_name, drug_id,
  //                        statistics: { average_price, highest_price,
  //                        lowest_price, pharmacies_in_stock,
  //                        pharmacies_carrying_drug, availability_percentage } } }
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
          if (!res.success || !res.data) {
            throw new Error(res.message ?? 'Drug not found.');
          }
          const d = res.data;
          // Flatten nested statistics → flat DrugSearchAnalytics model
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

  // ─────────────────────────────────────────────────────────────────────────
  // Centralised HTTP error handler
  // ─────────────────────────────────────────────────────────────────────────

  private handleError(err: HttpErrorResponse | Error): Observable<never> {
    let msg: string;

    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        msg = `Cannot reach the API server (${BASE || 'localhost:5000'}). `
            + 'Make sure Flask is running: cd BACK/app && python app.py';
      } else if (err.status === 400) {
        msg = err.error?.message ?? 'Bad request — check required parameters.';
      } else if (err.status === 404) {
        msg = err.error?.message ?? 'Resource not found.';
      } else if (err.status === 500) {
        msg = 'Internal server error — check the Flask console for details.';
      } else {
        msg = `Server error ${err.status}: ${err.error?.message ?? err.message}`;
      }
    } else {
      msg = err.message;
    }

    return throwError(() => new Error(msg));
  }
}
