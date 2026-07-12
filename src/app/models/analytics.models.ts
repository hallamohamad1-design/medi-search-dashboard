// =============================================================================
// Analytics Domain Models
// Matched exactly to the Flask API response shapes.
// =============================================================================

// ---------------------------------------------------------------------------
// Generic API envelope — every endpoint wraps its payload in this
// ---------------------------------------------------------------------------
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ---------------------------------------------------------------------------
// Pharmacy Dashboard  — GET /api/analytics/pharmacy/analytics?name=<name>
// ---------------------------------------------------------------------------

export interface PageTrafficPoint {
  date_key: string;        // "2024-06-01"
  day_name: string;        // "Monday"
  number_of_views: number;
}

export interface LocalDrugTrend {
  drug_id: number;
  drug_name: string;       // NOTE: field is drug_name (not name)
  total_searches: number;
}

export interface PharmacyAnalyticsResponse {
  pharmacy_id: number;
  pharmacy_name: string;
  page_traffic: PageTrafficPoint[];
  drug_trends: LocalDrugTrend[];
}

// ---------------------------------------------------------------------------
// Low-stock  — GET /api/analytics/pharmacy/low-stock
// ---------------------------------------------------------------------------

export interface LowStockDrug {
  drug_id: number;
  name: string;
  pharmacies_in_stock: number;
}

export interface MissingDrug {
  pharmacy_id: number;
  pharmacy_name: string;
  drug_id: number;
  drug_name: string;
  city: string;
  governorate: string;
  total_searches: number;
}

export interface LowStockResponse {
  success: boolean;
  low_stock_drugs: { count: number; data: LowStockDrug[] };
  high_demand_missing_drugs: { count: number; data: MissingDrug[] };
}

// ---------------------------------------------------------------------------
// Admin Dashboard  — GET /api/analytics/admin
// ---------------------------------------------------------------------------

export interface PharmacyTrafficRanking {
  pharmacy_id: number;
  name: string;
  total_views: number;
}

export interface AreaDrugTrend {
  governorate: string;
  city: string;
  drug_id: number;
  drug_name: string;        // NOTE: field is drug_name (not name)
  total_searches: number;
}

export interface TopSearchedDrug {
  drug_id: number;
  name: string;
  total_searches: number;
}

export interface MonthlySearchVolume {
  year: number;
  month: number;
  governorate: string;
  total_searches: number;
}

export interface AdminAnalyticsResponse {
  pharmacy_ranking: PharmacyTrafficRanking[];
  area_drug_trends: AreaDrugTrend[];
  top_searched_drugs: TopSearchedDrug[];
  monthly_report: MonthlySearchVolume[];
}

// ---------------------------------------------------------------------------
// Drug Search Analytics Widget  — GET /api/analytics/drug-search?name=<name>
// ---------------------------------------------------------------------------

export interface DrugStatistics {
  average_price: number;
  highest_price: number;
  lowest_price: number;
  pharmacies_in_stock: number;
  pharmacies_carrying_drug: number;
  availability_percentage: number;   // 0–100
}

export interface DrugSearchAnalyticsResponse {
  drug_name: string;
  drug_id: number;
  statistics: DrugStatistics;
}

// Flattened version used inside the widget component
export interface DrugSearchAnalytics {
  drug_id: number;
  drug_name: string;
  avg_price: number;
  highest_price: number;
  lowest_price: number;
  pharmacies_in_stock: number;
  pharmacies_carrying: number;
  availability_percent: number;
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiError {
  message: string;
  status?: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface AreaFilter {
  governorate: string | null;
  city: string | null;
}
