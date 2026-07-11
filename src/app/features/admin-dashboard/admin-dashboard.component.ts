import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { TrendChartComponent } from '../../shared/components/trend-chart/trend-chart.component';
import { RankedTableComponent, RankedTableColumn } from '../../shared/components/ranked-table/ranked-table.component';
import { PharmacyManagementComponent } from './pharmacy-management/pharmacy-management.component';
import {
  PharmacyTrafficRanking,
  AreaDrugTrend,
  TopSearchedDrug,
  MonthlySearchVolume,
  AdminAnalyticsResponse,
  LoadingState,
} from '../../models/analytics.models';

@Component({
  selector: 'ms-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, StatCardComponent, TrendChartComponent, RankedTableComponent, PharmacyManagementComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  private svc = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  // Single load state for everything (one API call)
  state: LoadingState = 'idle';
  errorMessage = '';

  // Raw data
  pharmacyRanking: PharmacyTrafficRanking[] = [];
  allAreaTrends:   AreaDrugTrend[] = [];
  filteredTrends:  AreaDrugTrend[] = [];
  topDrugs:        TopSearchedDrug[] = [];
  monthlyData:     MonthlySearchVolume[] = [];

  // Area filter
  governorates: string[] = [];
  cities: string[] = [];
  selectedGovernorate: string | null = null;
  selectedCity: string | null = null;

  // Monthly chart
  monthlyGov: string | null = null;
  monthlyGovOptions: string[] = [];
  monthlyChartLabels: string[] = [];
  monthlyChartData: number[] = [];

  // Summary KPIs
  totalPharmacies = 0;
  totalSystemViews = 0;
  totalSystemSearches = 0;
  topSystemDrug = '';

  readonly MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Table columns
  rankingColumns: RankedTableColumn[] = [
    { field: 'name',        header: 'Pharmacy',    sortable: true },
    { field: 'total_views', header: 'Total Views', sortable: true, align: 'right', format: 'number' },
  ];

  areaTrendsColumns: RankedTableColumn[] = [
    { field: 'drug_name',      header: 'Drug',        sortable: true },
    { field: 'governorate',    header: 'Governorate', sortable: true },
    { field: 'city',           header: 'City',        sortable: true },
    { field: 'total_searches', header: 'Searches',    sortable: true, align: 'right', format: 'number' },
  ];

  topDrugsColumns: RankedTableColumn[] = [
    { field: 'name',           header: 'Drug Name',     sortable: true },
    { field: 'total_searches', header: 'Total Searches', sortable: true, align: 'right', format: 'number' },
  ];

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.state = 'loading';
    this.svc.getAdminAnalytics().subscribe({
      next: (data: AdminAnalyticsResponse) => {
        // Pharmacy ranking
        this.pharmacyRanking    = data.pharmacy_ranking;
        this.totalPharmacies    = data.pharmacy_ranking.length;
        this.totalSystemViews   = data.pharmacy_ranking.reduce((s, r) => s + r.total_views, 0);

        // Area trends
        this.allAreaTrends  = data.area_drug_trends;
        this.filteredTrends = data.area_drug_trends;
        this.governorates   = [...new Set(data.area_drug_trends.map(t => t.governorate))].sort();

        // Top drugs
        this.topDrugs            = data.top_searched_drugs;
        this.totalSystemSearches = data.top_searched_drugs.reduce((s, d) => s + d.total_searches, 0);
        this.topSystemDrug       = data.top_searched_drugs[0]?.name ?? '—';

        // Monthly
        this.monthlyData       = data.monthly_report;
        this.monthlyGovOptions = [...new Set(data.monthly_report.map(d => d.governorate))].sort();
        if (!this.monthlyGov && this.monthlyGovOptions.length) {
          this.monthlyGov = this.monthlyGovOptions[0];
        }
        this.buildMonthlyChart();
        this.state = 'success';
        this.cdr.markForCheck();
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.state = 'error';
        this.cdr.markForCheck();
      },
    });
  }

  // Area filter handlers
  onGovernorateChange(): void {
    this.selectedCity = null;
    this.cities = this.selectedGovernorate
      ? [...new Set(this.allAreaTrends.filter(t => t.governorate === this.selectedGovernorate).map(t => t.city))].sort()
      : [];
    this.applyFilter();
    this.cdr.markForCheck();
  }

  onCityChange(): void { this.applyFilter(); this.cdr.markForCheck(); }

  clearAreaFilter(): void {
    this.selectedGovernorate = null;
    this.selectedCity = null;
    this.cities = [];
    this.applyFilter();
    this.cdr.markForCheck();
  }

  private applyFilter(): void {
    let data = this.allAreaTrends;
    if (this.selectedGovernorate) data = data.filter(t => t.governorate === this.selectedGovernorate);
    if (this.selectedCity)        data = data.filter(t => t.city === this.selectedCity);
    this.filteredTrends = data;
  }

  // Monthly chart
  onMonthlyGovChange(): void { this.buildMonthlyChart(); }

  private buildMonthlyChart(): void {
    const filtered = this.monthlyData.filter(d => !this.monthlyGov || d.governorate === this.monthlyGov);
    const byMonth: Record<string, number> = {};
    filtered.forEach(d => {
      const key = `${this.MONTH_NAMES[d.month - 1]} ${d.year}`;
      byMonth[key] = (byMonth[key] ?? 0) + d.total_searches;
    });
    this.monthlyChartLabels = Object.keys(byMonth);
    this.monthlyChartData   = Object.values(byMonth);
  }

  get topDrugsChartLabels(): string[] { return this.topDrugs.slice(0, 10).map(d => d.name); }
  get topDrugsChartData(): number[]   { return this.topDrugs.slice(0, 10).map(d => d.total_searches); }
  get isLoading(): boolean            { return this.state === 'loading'; }
  get isError(): boolean              { return this.state === 'error'; }
}
