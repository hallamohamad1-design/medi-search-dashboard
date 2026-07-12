import { Component, OnInit, Input, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { TrendChartComponent } from '../../shared/components/trend-chart/trend-chart.component';
import { RankedTableComponent, RankedTableColumn } from '../../shared/components/ranked-table/ranked-table.component';
import { LocalDrugTrend, LowStockDrug, MissingDrug, LoadingState } from '../../models/analytics.models';

@Component({
  selector: 'ms-pharmacy-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,  // ← OnPush: only re-render on @Input change or markForCheck
  imports: [CommonModule, FormsModule, StatCardComponent, TrendChartComponent, RankedTableComponent],
  templateUrl: './pharmacy-dashboard.component.html',
  styleUrls: ['./pharmacy-dashboard.component.scss'],
})
export class PharmacyDashboardComponent implements OnInit {
  private svc  = inject(DashboardService);
  private auth = inject(AuthService);
  private cdr  = inject(ChangeDetectorRef);

  private _pharmacyId!: string;

  @Input()
  set pharmacyId(value: string) {
    this._pharmacyId = value;
    this.loadAnalytics();
    this.loadLowStock();
  }

  get pharmacyId(): string {
    return this._pharmacyId;
  }

  loadedPharmacyName = '—';
  get pharmacyName(): string { return this.loadedPharmacyName; }

  trafficState: LoadingState = 'idle';
  trafficLabels: string[] = [];
  trafficData: number[] = [];
  trafficError = '';
  totalViews = 0;
  avgDailyViews = 0;
  peakDay = '';

  trendsState: LoadingState = 'idle';
  localTrends: LocalDrugTrend[] = [];
  trendsError = '';
  topDrug = '';
  trendsView: 'chart' | 'table' = 'chart';

  lowStockState: LoadingState = 'idle';
  lowStockDrugs: LowStockDrug[] = [];
  missingDrugs: MissingDrug[] = [];
  lowStockError = '';

  trendsColumns: RankedTableColumn[] = [
    { field: 'drug_name',       header: 'Drug Name',       sortable: true },
    { field: 'total_searches',  header: 'Total Searches',  sortable: true, align: 'right', format: 'number' },
  ];
  lowStockColumns: RankedTableColumn[] = [
    { field: 'name',                header: 'Drug',               sortable: true },
    { field: 'pharmacies_in_stock', header: 'Pharmacies In Stock', sortable: true, align: 'right' },
  ];
  missingColumns: RankedTableColumn[] = [
    { field: 'drug_name',      header: 'Drug',        sortable: true },
    { field: 'total_searches', header: 'Searches',    sortable: true, align: 'right', format: 'number' },
    { field: 'governorate',    header: 'Governorate', sortable: true },
    { field: 'city',           header: 'City',        sortable: true },
  ];

  ngOnInit(): void {
  }

  private loadAnalytics(): void {
    const id = Number(this.pharmacyId);
    if (!id || isNaN(id)) {
      this.trafficError = this.trendsError = 'Invalid Pharmacy ID in URL.';
      this.trafficState = this.trendsState = 'error';
      return;
    }
    this.trafficState = this.trendsState = 'loading';
    this.cdr.markForCheck();

    this.svc.getPharmacyAnalytics(id).subscribe({
      next: data => {
        this.loadedPharmacyName = data.pharmacy_name;
        this.trafficLabels = data.page_traffic.map(d => {
          const dt = new Date(d.date_key);
          return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        });
        this.trafficData   = data.page_traffic.map(d => d.number_of_views);
        this.totalViews    = this.trafficData.reduce((s, v) => s + v, 0);
        this.avgDailyViews = Math.round(this.totalViews / (this.trafficData.length || 1));
        const peak = data.page_traffic.length
          ? data.page_traffic.reduce((m, d) => d.number_of_views > m.number_of_views ? d : m)
          : null;
        this.peakDay      = peak ? `${peak.day_name} (${peak.number_of_views})` : '—';
        this.trafficState = 'success';
        this.localTrends  = data.drug_trends;
        this.topDrug      = data.drug_trends[0]?.drug_name ?? '—';
        this.trendsState  = 'success';
        this.cdr.markForCheck();
      },
      error: (err: Error) => {
        this.trafficError = this.trendsError = err.message;
        this.trafficState = this.trendsState = 'error';
        this.cdr.markForCheck();
      },
    });
  }

  private loadLowStock(): void {
    this.lowStockState = 'loading';
    this.cdr.markForCheck();
    this.svc.getLowStock().subscribe({
      next: res => {
        this.lowStockDrugs = res.low_stock_drugs.data;
        this.missingDrugs  = res.high_demand_missing_drugs.data;
        this.lowStockState = 'success';
        this.cdr.markForCheck();
      },
      error: (err: Error) => {
        this.lowStockError = err.message;
        this.lowStockState = 'error';
        this.cdr.markForCheck();
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

  toggleTrendsView(): void { this.trendsView = this.trendsView === 'chart' ? 'table' : 'chart'; }
}
