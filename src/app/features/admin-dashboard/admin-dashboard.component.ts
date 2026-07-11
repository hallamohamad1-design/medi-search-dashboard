import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { TrendChartComponent } from '../../shared/components/trend-chart/trend-chart.component';
import { RankedTableComponent, RankedTableColumn } from '../../shared/components/ranked-table/ranked-table.component';
import {
  PharmacyTrafficRanking,
  AreaDrugTrend,
  TopSearchedDrug,
  MonthlySearchVolume,
  LoadingState,
} from '../../models/analytics.models';

@Component({
  selector: 'ms-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatCardComponent,
    TrendChartComponent,
    RankedTableComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  private svc = inject(DashboardService);

  // ---- Pharmacy traffic ranking
  rankingState: LoadingState = 'idle';
  pharmacyRanking: PharmacyTrafficRanking[] = [];
  rankingError = '';
  rankingColumns: RankedTableColumn[] = [
    { field: 'name',        header: 'Pharmacy',      sortable: true },
    { field: 'total_views', header: 'Total Views',   sortable: true, align: 'right', format: 'number' },
  ];

  // ---- Area drug trends
  areaTrendsState: LoadingState = 'idle';
  areaTrends: AreaDrugTrend[] = [];
  areaTrendsError = '';
  areaTrendsColumns: RankedTableColumn[] = [
    { field: 'name',           header: 'Drug',          sortable: true },
    { field: 'governorate',    header: 'Governorate',   sortable: true },
    { field: 'city',           header: 'City',          sortable: true },
    { field: 'total_searches', header: 'Searches',      sortable: true, align: 'right', format: 'number' },
  ];

  // Area filter state
  governorates: string[] = [];
  cities: string[] = [];
  selectedGovernorate: string | null = null;
  selectedCity: string | null = null;

  // ---- Top drugs
  topDrugsState: LoadingState = 'idle';
  topDrugs: TopSearchedDrug[] = [];
  topDrugsError = '';
  topDrugsColumns: RankedTableColumn[] = [
    { field: 'name',           header: 'Drug Name',     sortable: true },
    { field: 'total_searches', header: 'Total Searches', sortable: true, align: 'right', format: 'number' },
  ];

  // ---- Monthly volume (stretch goal)
  monthlyState: LoadingState = 'idle';
  monthlyData: MonthlySearchVolume[] = [];
  monthlyError = '';
  monthlyChartLabels: string[] = [];
  monthlyChartData: number[] = [];
  monthlyGov: string | null = null;
  monthlyGovOptions: string[] = [];

  // ---- Summary stats
  totalPharmacies = 0;
  totalSystemViews = 0;
  totalSystemSearches = 0;
  topSystemDrug = '';

  readonly MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  ngOnInit(): void {
    this.loadRanking();
    this.loadGovernorates();
    this.loadAreaTrends();
    this.loadTopDrugs();
    this.loadMonthlyVolume();
  }

  // ---------------------------------------------------------------------------
  private loadRanking(): void {
    this.rankingState = 'loading';
    this.svc.getPharmacyTrafficRanking().subscribe({
      next: (data) => {
        this.pharmacyRanking = data;
        this.totalPharmacies = data.length;
        this.totalSystemViews = data.reduce((s, d) => s + d.total_views, 0);
        this.rankingState = 'success';
      },
      error: () => {
        this.rankingError = 'Could not load pharmacy ranking.';
        this.rankingState = 'error';
      },
    });
  }

  private loadGovernorates(): void {
    this.svc.getGovernorates().subscribe({
      next: (govs) => {
        this.governorates = govs;
        this.monthlyGovOptions = govs;
      },
    });
  }

  loadAreaTrends(): void {
    this.areaTrendsState = 'loading';
    this.svc
      .getAreaDrugTrends(
        this.selectedGovernorate ?? undefined,
        this.selectedCity ?? undefined,
      )
      .subscribe({
        next: (data) => {
          this.areaTrends = data;
          this.areaTrendsState = 'success';
        },
        error: () => {
          this.areaTrendsError = 'Could not load area drug trends.';
          this.areaTrendsState = 'error';
        },
      });
  }

  onGovernorateChange(): void {
    this.selectedCity = null;
    this.cities = [];
    if (this.selectedGovernorate) {
      this.svc.getCities(this.selectedGovernorate).subscribe(c => (this.cities = c));
    }
    this.loadAreaTrends();
  }

  onCityChange(): void {
    this.loadAreaTrends();
  }

  clearAreaFilter(): void {
    this.selectedGovernorate = null;
    this.selectedCity = null;
    this.cities = [];
    this.loadAreaTrends();
  }

  private loadTopDrugs(): void {
    this.topDrugsState = 'loading';
    this.svc.getTopSearchedDrugs().subscribe({
      next: (data) => {
        this.topDrugs = data;
        this.totalSystemSearches = data.reduce((s, d) => s + d.total_searches, 0);
        this.topSystemDrug = data[0]?.name ?? '—';
        this.topDrugsState = 'success';
      },
      error: () => {
        this.topDrugsError = 'Could not load top drugs.';
        this.topDrugsState = 'error';
      },
    });
  }

  private loadMonthlyVolume(): void {
    this.monthlyState = 'loading';
    this.svc.getMonthlySearchVolume().subscribe({
      next: (data) => {
        this.monthlyData = data;
        this.monthlyGovOptions = [...new Set(data.map(d => d.governorate))];
        if (!this.monthlyGov && this.monthlyGovOptions.length) {
          this.monthlyGov = this.monthlyGovOptions[0];
        }
        this.buildMonthlyChart();
        this.monthlyState = 'success';
      },
      error: () => {
        this.monthlyError = 'Could not load monthly data.';
        this.monthlyState = 'error';
      },
    });
  }

  onMonthlyGovChange(): void {
    this.buildMonthlyChart();
  }

  private buildMonthlyChart(): void {
    const filtered = this.monthlyData.filter(
      d => !this.monthlyGov || d.governorate === this.monthlyGov
    );
    // Aggregate by month (sum across cities in gov)
    const byMonth: Record<string, number> = {};
    filtered.forEach(d => {
      const key = `${this.MONTH_NAMES[d.month - 1]} ${d.year}`;
      byMonth[key] = (byMonth[key] ?? 0) + d.total_searches;
    });
    this.monthlyChartLabels = Object.keys(byMonth);
    this.monthlyChartData   = Object.values(byMonth);
  }

  get topDrugsChartLabels(): string[] {
    return this.topDrugs.slice(0, 10).map(d => d.name);
  }

  get topDrugsChartData(): number[] {
    return this.topDrugs.slice(0, 10).map(d => d.total_searches);
  }
}
