import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { TrendChartComponent } from '../../shared/components/trend-chart/trend-chart.component';
import { RankedTableComponent, RankedTableColumn } from '../../shared/components/ranked-table/ranked-table.component';
import {
  PageTrafficPoint,
  LocalDrugTrend,
  LowStockDrug,
  MissingDrug,
  LoadingState,
} from '../../models/analytics.models';

@Component({
  selector: 'ms-pharmacy-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, StatCardComponent, TrendChartComponent, RankedTableComponent],
  templateUrl: './pharmacy-dashboard.component.html',
  styleUrls: ['./pharmacy-dashboard.component.scss'],
})
export class PharmacyDashboardComponent implements OnInit {
  private svc  = inject(DashboardService);
  private auth = inject(AuthService);

  // Pharmacy name comes from the logged-in user
  pharmacyName = this.auth.currentUser.pharmacyName ?? '';

  // ── Traffic chart
  trafficState: LoadingState = 'idle';
  trafficLabels: string[] = [];
  trafficData: number[] = [];
  trafficError = '';
  totalViews = 0;
  avgDailyViews = 0;
  peakDay = '';

  // ── Drug trends
  trendsState: LoadingState = 'idle';
  localTrends: LocalDrugTrend[] = [];
  trendsError = '';
  topDrug = '';
  trendsView: 'chart' | 'table' = 'chart';

  // ── Low stock
  lowStockState: LoadingState = 'idle';
  lowStockDrugs: LowStockDrug[] = [];
  missingDrugs: MissingDrug[] = [];
  lowStockError = '';

  // ── Table columns
  trendsColumns: RankedTableColumn[] = [
    { field: 'drug_name',      header: 'Drug Name',      sortable: true },
    { field: 'total_searches', header: 'Total Searches', sortable: true, align: 'right', format: 'number' },
  ];

  lowStockColumns: RankedTableColumn[] = [
    { field: 'name',               header: 'Drug',               sortable: true },
    { field: 'pharmacies_in_stock', header: 'Pharmacies In Stock', sortable: true, align: 'right' },
  ];

  missingColumns: RankedTableColumn[] = [
    { field: 'drug_name',      header: 'Drug',          sortable: true },
    { field: 'total_searches', header: 'Searches',      sortable: true, align: 'right', format: 'number' },
    { field: 'governorate',    header: 'Governorate',   sortable: true },
    { field: 'city',           header: 'City',          sortable: true },
  ];

  ngOnInit(): void {
    this.loadAnalytics();
    this.loadLowStock();
  }

  private loadAnalytics(): void {
    if (!this.pharmacyName) {
      this.trafficError = 'No pharmacy name found in session. Please log in again.';
      this.trafficState = 'error';
      this.trendsState  = 'error';
      this.trendsError  = this.trafficError;
      return;
    }

    this.trafficState = 'loading';
    this.trendsState  = 'loading';

    this.svc.getPharmacyAnalytics(this.pharmacyName).subscribe({
      next: data => {
        // Traffic
        this.trafficLabels = data.page_traffic.map(d => {
          const dt = new Date(d.date_key);
          return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        });
        this.trafficData    = data.page_traffic.map(d => d.number_of_views);
        this.totalViews     = this.trafficData.reduce((s, v) => s + v, 0);
        this.avgDailyViews  = Math.round(this.totalViews / (this.trafficData.length || 1));
        const peak = data.page_traffic.reduce(
          (m, d) => d.number_of_views > m.number_of_views ? d : m,
          data.page_traffic[0],
        );
        this.peakDay     = peak ? `${peak.day_name} (${peak.number_of_views})` : '—';
        this.trafficState = 'success';

        // Trends
        this.localTrends  = data.drug_trends;
        this.topDrug      = data.drug_trends[0]?.drug_name ?? '—';
        this.trendsState  = 'success';
      },
      error: (err: Error) => {
        this.trafficError = err.message;
        this.trafficState = 'error';
        this.trendsError  = err.message;
        this.trendsState  = 'error';
      },
    });
  }

  private loadLowStock(): void {
    this.lowStockState = 'loading';
    this.svc.getLowStock().subscribe({
      next: res => {
        this.lowStockDrugs = res.low_stock_drugs.data;
        this.missingDrugs  = res.high_demand_missing_drugs.data;
        this.lowStockState = 'success';
      },
      error: (err: Error) => {
        this.lowStockError = err.message;
        this.lowStockState = 'error';
      },
    });
  }

  get trendsChartLabels(): string[] { return this.localTrends.map(d => d.drug_name); }
  get trendsChartData(): number[]   { return this.localTrends.map(d => d.total_searches); }
  get isTrafficError(): boolean     { return this.trafficState === 'error'; }
  get isTrendsError(): boolean      { return this.trendsState === 'error'; }
  get isTrendsLoading(): boolean    { return this.trendsState === 'loading'; }
  get isLowStockError(): boolean    { return this.lowStockState === 'error'; }
  get isLowStockLoading(): boolean  { return this.lowStockState === 'loading'; }

  toggleTrendsView(): void {
    this.trendsView = this.trendsView === 'chart' ? 'table' : 'chart';
  }
}
