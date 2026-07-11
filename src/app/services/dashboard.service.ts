import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  PageTrafficPoint,
  LocalDrugTrend,
  PharmacyTrafficRanking,
  AreaDrugTrend,
  TopSearchedDrug,
  MonthlySearchVolume,
  DrugSearchAnalytics,
} from '../models/analytics.models';

// ---------------------------------------------------------------------------
// Wire your real API base URL here (e.g. from environment.ts)
// ---------------------------------------------------------------------------
const API_BASE = '/api'; // replace with environment.apiUrl

/**
 * DashboardService
 *
 * Wraps all analytics endpoints.  Every method returns a cold Observable
 * that can be subscribed to with the async pipe — no manual unsubscription
 * needed in templates.
 *
 * The stub data below mirrors the exact shapes described in the spec so
 * that the dashboard renders correctly before the real API is wired in.
 * Replace the `of(STUB)` calls with the commented-out `this.http.get()`
 * calls once the base URL is configured.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  // -------------------------------------------------------------------------
  // Pharmacy Dashboard
  // -------------------------------------------------------------------------

  /** Page traffic over time for the authenticated pharmacy */
  getPharmacyTraffic(): Observable<PageTrafficPoint[]> {
    // return this.http.get<PageTrafficPoint[]>(`${API_BASE}/analytics/pharmacy/traffic`);
    return of(STUB_PHARMACY_TRAFFIC).pipe(delay(800));
  }

  /** Most-searched drugs in the pharmacy's area — last 30 days */
  getLocalDrugTrends(): Observable<LocalDrugTrend[]> {
    // return this.http.get<LocalDrugTrend[]>(`${API_BASE}/analytics/pharmacy/drug-trends`);
    return of(STUB_LOCAL_DRUG_TRENDS).pipe(delay(1000));
  }

  // -------------------------------------------------------------------------
  // Admin Dashboard
  // -------------------------------------------------------------------------

  /** Pharmacy-level traffic ranking — last 30 days */
  getPharmacyTrafficRanking(): Observable<PharmacyTrafficRanking[]> {
    // return this.http.get<PharmacyTrafficRanking[]>(`${API_BASE}/analytics/admin/pharmacy-ranking`);
    return of(STUB_PHARMACY_RANKING).pipe(delay(900));
  }

  /** Area-level drug trends — optional governorate/city filter */
  getAreaDrugTrends(governorate?: string, city?: string): Observable<AreaDrugTrend[]> {
    // let params = new HttpParams();
    // if (governorate) params = params.set('governorate', governorate);
    // if (city)        params = params.set('city', city);
    // return this.http.get<AreaDrugTrend[]>(`${API_BASE}/analytics/admin/area-trends`, { params });
    let stub = STUB_AREA_TRENDS;
    if (governorate) stub = stub.filter(r => r.governorate === governorate);
    if (city)        stub = stub.filter(r => r.city === city);
    return of(stub).pipe(delay(900));
  }

  /** System-wide top searched drugs */
  getTopSearchedDrugs(): Observable<TopSearchedDrug[]> {
    // return this.http.get<TopSearchedDrug[]>(`${API_BASE}/analytics/admin/top-drugs`);
    return of(STUB_TOP_DRUGS).pipe(delay(700));
  }

  /** Monthly period-over-period search volume (stretch goal) */
  getMonthlySearchVolume(): Observable<MonthlySearchVolume[]> {
    // return this.http.get<MonthlySearchVolume[]>(`${API_BASE}/analytics/admin/monthly-volume`);
    return of(STUB_MONTHLY_VOLUME).pipe(delay(1100));
  }

  /** Distinct governorates available in area trends data */
  getGovernorates(): Observable<string[]> {
    // return this.http.get<string[]>(`${API_BASE}/analytics/admin/governorates`);
    const govs = [...new Set(STUB_AREA_TRENDS.map(r => r.governorate))].sort();
    return of(govs).pipe(delay(300));
  }

  /** Cities within a governorate */
  getCities(governorate: string): Observable<string[]> {
    // return this.http.get<string[]>(`${API_BASE}/analytics/admin/cities`, { params: { governorate } });
    const cities = [
      ...new Set(
        STUB_AREA_TRENDS.filter(r => r.governorate === governorate).map(r => r.city)
      ),
    ].sort();
    return of(cities).pipe(delay(300));
  }

  // -------------------------------------------------------------------------
  // Search Analytics Widget
  // -------------------------------------------------------------------------

  /** Analytics for a specific drug — used in drug detail pages */
  getDrugAnalytics(drugId: number): Observable<DrugSearchAnalytics> {
    // return this.http.get<DrugSearchAnalytics>(`${API_BASE}/analytics/drug/${drugId}`);
    const stub = STUB_DRUG_ANALYTICS.find(d => d.drug_id === drugId) ?? STUB_DRUG_ANALYTICS[0];
    return of({ ...stub, drug_id: drugId }).pipe(delay(600));
  }
}

// =============================================================================
// Stub data — mirrors real API shapes exactly
// Replace with real HTTP calls once the backend URL is configured.
// =============================================================================

const STUB_PHARMACY_TRAFFIC: PageTrafficPoint[] = [
  { date_key: '2024-06-01', day_name: 'Saturday',  number_of_views: 45 },
  { date_key: '2024-06-02', day_name: 'Sunday',    number_of_views: 38 },
  { date_key: '2024-06-03', day_name: 'Monday',    number_of_views: 62 },
  { date_key: '2024-06-04', day_name: 'Tuesday',   number_of_views: 71 },
  { date_key: '2024-06-05', day_name: 'Wednesday', number_of_views: 58 },
  { date_key: '2024-06-06', day_name: 'Thursday',  number_of_views: 49 },
  { date_key: '2024-06-07', day_name: 'Friday',    number_of_views: 33 },
  { date_key: '2024-06-08', day_name: 'Saturday',  number_of_views: 52 },
  { date_key: '2024-06-09', day_name: 'Sunday',    number_of_views: 41 },
  { date_key: '2024-06-10', day_name: 'Monday',    number_of_views: 78 },
  { date_key: '2024-06-11', day_name: 'Tuesday',   number_of_views: 84 },
  { date_key: '2024-06-12', day_name: 'Wednesday', number_of_views: 69 },
  { date_key: '2024-06-13', day_name: 'Thursday',  number_of_views: 55 },
  { date_key: '2024-06-14', day_name: 'Friday',    number_of_views: 37 },
  { date_key: '2024-06-15', day_name: 'Saturday',  number_of_views: 60 },
  { date_key: '2024-06-16', day_name: 'Sunday',    number_of_views: 44 },
  { date_key: '2024-06-17', day_name: 'Monday',    number_of_views: 91 },
  { date_key: '2024-06-18', day_name: 'Tuesday',   number_of_views: 103 },
  { date_key: '2024-06-19', day_name: 'Wednesday', number_of_views: 88 },
  { date_key: '2024-06-20', day_name: 'Thursday',  number_of_views: 76 },
  { date_key: '2024-06-21', day_name: 'Friday',    number_of_views: 42 },
  { date_key: '2024-06-22', day_name: 'Saturday',  number_of_views: 67 },
  { date_key: '2024-06-23', day_name: 'Sunday',    number_of_views: 50 },
  { date_key: '2024-06-24', day_name: 'Monday',    number_of_views: 95 },
  { date_key: '2024-06-25', day_name: 'Tuesday',   number_of_views: 112 },
  { date_key: '2024-06-26', day_name: 'Wednesday', number_of_views: 98 },
  { date_key: '2024-06-27', day_name: 'Thursday',  number_of_views: 83 },
  { date_key: '2024-06-28', day_name: 'Friday',    number_of_views: 46 },
  { date_key: '2024-06-29', day_name: 'Saturday',  number_of_views: 73 },
  { date_key: '2024-06-30', day_name: 'Sunday',    number_of_views: 58 },
];

const STUB_LOCAL_DRUG_TRENDS: LocalDrugTrend[] = [
  { drug_id: 1, drug_name: 'Panadol Extra',    total_searches: 342 },
  { drug_id: 2, drug_name: 'Augmentin 625',    total_searches: 287 },
  { drug_id: 3, drug_name: 'Brufen 400mg',     total_searches: 251 },
  { drug_id: 4, drug_name: 'Cataflam 50mg',    total_searches: 198 },
  { drug_id: 5, drug_name: 'Omeprazole 20mg',  total_searches: 176 },
  { drug_id: 6, drug_name: 'Concor 5mg',       total_searches: 154 },
  { drug_id: 7, drug_name: 'Aspirin 81mg',     total_searches: 143 },
  { drug_id: 8, drug_name: 'Amoxil 500mg',     total_searches: 129 },
  { drug_id: 9, drug_name: 'Zithromax 500mg',  total_searches: 115 },
  { drug_id: 10, drug_name: 'Voltaren Gel',    total_searches: 98 },
];

const STUB_PHARMACY_RANKING: PharmacyTrafficRanking[] = [
  { pharmacy_id: 1,  name: 'El Ezaby Pharmacy',     total_views: 4821 },
  { pharmacy_id: 2,  name: 'Sehha Pharmacy',         total_views: 3654 },
  { pharmacy_id: 3,  name: 'El Hazim Pharmacy',      total_views: 2987 },
  { pharmacy_id: 4,  name: 'Hind Pharmacy',          total_views: 2341 },
  { pharmacy_id: 5,  name: 'Shifa Pharmacy',         total_views: 1987 },
  { pharmacy_id: 6,  name: 'Al Nour Pharmacy',       total_views: 1654 },
  { pharmacy_id: 7,  name: 'Cairo Medical Pharmacy', total_views: 1432 },
  { pharmacy_id: 8,  name: 'Dawaai Pharmacy',        total_views: 1198 },
  { pharmacy_id: 9,  name: 'Roshdy Pharmacy',        total_views: 987 },
  { pharmacy_id: 10, name: 'Cleopatra Pharmacy',     total_views: 823 },
];

const STUB_AREA_TRENDS: AreaDrugTrend[] = [
  { governorate: 'Cairo',  city: 'Nasr City',      drug_id: 1, name: 'Panadol Extra',   total_searches: 892 },
  { governorate: 'Cairo',  city: 'Nasr City',      drug_id: 2, name: 'Augmentin 625',   total_searches: 745 },
  { governorate: 'Cairo',  city: 'Maadi',           drug_id: 3, name: 'Brufen 400mg',    total_searches: 621 },
  { governorate: 'Cairo',  city: 'Maadi',           drug_id: 5, name: 'Omeprazole 20mg', total_searches: 498 },
  { governorate: 'Cairo',  city: 'Heliopolis',      drug_id: 4, name: 'Cataflam 50mg',   total_searches: 412 },
  { governorate: 'Giza',   city: 'Dokki',           drug_id: 1, name: 'Panadol Extra',   total_searches: 654 },
  { governorate: 'Giza',   city: 'Dokki',           drug_id: 6, name: 'Concor 5mg',      total_searches: 521 },
  { governorate: 'Giza',   city: '6th of October',  drug_id: 2, name: 'Augmentin 625',   total_searches: 489 },
  { governorate: 'Giza',   city: '6th of October',  drug_id: 7, name: 'Aspirin 81mg',    total_searches: 376 },
  { governorate: 'Alexandria', city: 'Smouha',      drug_id: 1, name: 'Panadol Extra',   total_searches: 723 },
  { governorate: 'Alexandria', city: 'Smouha',      drug_id: 3, name: 'Brufen 400mg',    total_searches: 589 },
  { governorate: 'Alexandria', city: 'Miami',       drug_id: 8, name: 'Amoxil 500mg',    total_searches: 445 },
  { governorate: 'Assiut', city: 'Assiut City',     drug_id: 1, name: 'Panadol Extra',   total_searches: 312 },
  { governorate: 'Assiut', city: 'Assiut City',     drug_id: 9, name: 'Zithromax 500mg', total_searches: 241 },
  { governorate: 'Luxor',  city: 'Luxor City',      drug_id: 10, name: 'Voltaren Gel',   total_searches: 198 },
  { governorate: 'Luxor',  city: 'Luxor City',      drug_id: 5,  name: 'Omeprazole 20mg',total_searches: 165 },
];

const STUB_TOP_DRUGS: TopSearchedDrug[] = [
  { drug_id: 1,  name: 'Panadol Extra',    total_searches: 12543 },
  { drug_id: 2,  name: 'Augmentin 625',    total_searches: 9876 },
  { drug_id: 3,  name: 'Brufen 400mg',     total_searches: 8432 },
  { drug_id: 4,  name: 'Cataflam 50mg',    total_searches: 7218 },
  { drug_id: 5,  name: 'Omeprazole 20mg',  total_searches: 6543 },
  { drug_id: 6,  name: 'Concor 5mg',       total_searches: 5987 },
  { drug_id: 7,  name: 'Aspirin 81mg',     total_searches: 5432 },
  { drug_id: 8,  name: 'Amoxil 500mg',     total_searches: 4876 },
  { drug_id: 9,  name: 'Zithromax 500mg',  total_searches: 4312 },
  { drug_id: 10, name: 'Voltaren Gel',     total_searches: 3987 },
];

const STUB_MONTHLY_VOLUME: MonthlySearchVolume[] = [
  { year: 2024, month: 1,  governorate: 'Cairo', total_searches: 8432 },
  { year: 2024, month: 2,  governorate: 'Cairo', total_searches: 7890 },
  { year: 2024, month: 3,  governorate: 'Cairo', total_searches: 9123 },
  { year: 2024, month: 4,  governorate: 'Cairo', total_searches: 10234 },
  { year: 2024, month: 5,  governorate: 'Cairo', total_searches: 11456 },
  { year: 2024, month: 6,  governorate: 'Cairo', total_searches: 12345 },
  { year: 2024, month: 1,  governorate: 'Giza',  total_searches: 5432 },
  { year: 2024, month: 2,  governorate: 'Giza',  total_searches: 4987 },
  { year: 2024, month: 3,  governorate: 'Giza',  total_searches: 6123 },
  { year: 2024, month: 4,  governorate: 'Giza',  total_searches: 6789 },
  { year: 2024, month: 5,  governorate: 'Giza',  total_searches: 7654 },
  { year: 2024, month: 6,  governorate: 'Giza',  total_searches: 8234 },
];

const STUB_DRUG_ANALYTICS: DrugSearchAnalytics[] = [
  {
    drug_id: 1, drug_name: 'Panadol Extra',
    avg_price: 52, highest_price: 65, lowest_price: 42,
    pharmacies_in_stock: 9, pharmacies_carrying: 12,
    availability_percent: 75,
  },
  {
    drug_id: 2, drug_name: 'Augmentin 625',
    avg_price: 145, highest_price: 165, lowest_price: 128,
    pharmacies_in_stock: 7, pharmacies_carrying: 10,
    availability_percent: 70,
  },
];
