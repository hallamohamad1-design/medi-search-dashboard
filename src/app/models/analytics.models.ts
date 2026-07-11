// =============================================================================
// Analytics Domain Models
// These interfaces match the exact API response shapes described in the spec.
// =============================================================================

// ---------------------------------------------------------------------------
// Pharmacy Dashboard
// ---------------------------------------------------------------------------

/** Page traffic over time — used for the pharmacy traffic line/area chart */
export interface PageTrafficPoint {
  date_key: string;   // e.g. "2024-01-15"
  day_name: string;   // e.g. "Monday"
  number_of_views: number;
}

/** Drug search trend within the pharmacy's own area (last 30 days) */
export interface LocalDrugTrend {
  drug_id: number;
  drug_name: string;
  total_searches: number;
}

// ---------------------------------------------------------------------------
// Admin Dashboard
// ---------------------------------------------------------------------------

/** Per-pharmacy traffic ranking (last 30 days) */
export interface PharmacyTrafficRanking {
  pharmacy_id: number;
  name: string;
  total_views: number;
}

/** Area-level drug search trend — filterable by governorate/city */
export interface AreaDrugTrend {
  governorate: string;
  city: string;
  drug_id: number;
  name: string;
  total_searches: number;
}

/** System-wide top searched drugs */
export interface TopSearchedDrug {
  drug_id: number;
  name: string;
  total_searches: number;
}

/** Monthly period-over-period search volume (stretch goal) */
export interface MonthlySearchVolume {
  year: number;
  month: number;        // 1–12
  governorate: string;
  total_searches: number;
}

// ---------------------------------------------------------------------------
// Search Analytics Widget (embedded in drug detail page)
// ---------------------------------------------------------------------------

export interface DrugSearchAnalytics {
  drug_id: number;
  drug_name: string;
  avg_price: number;
  highest_price: number;
  lowest_price: number;
  pharmacies_in_stock: number;
  pharmacies_carrying: number;
  availability_percent: number;   // 0–100
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

// Filter model used in admin area-trend view
export interface AreaFilter {
  governorate: string | null;
  city: string | null;
}
