import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { TrendChartComponent } from '../../shared/components/trend-chart/trend-chart.component';
import { RankedTableComponent, RankedTableColumn } from '../../shared/components/ranked-table/ranked-table.component';
import { PageTrafficPoint, LocalDrugTrend, LoadingState } from '../../models/analytics.models';

@Component({
  selector: 'ms-pharmacy-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    TrendChartComponent,
    RankedTableComponent,
  ],
  templateUrl: './pharmacy-dashboard.component.html',
  styleUrls: ['./pharmacy-dashboard.component.scss'],
})
export class PharmacyDashboardComponent implements OnInit {
  private svc = inject(DashboardService);

  // ---- Traffic chart data
  trafficState: LoadingState = 'idle';
  trafficLabels: string[] = [];
  trafficData: number[] = [];
  trafficError = '';

  // ---- Local drug trends
  trendsState: LoadingState = 'idle';
  localTrends: LocalDrugTrend[] = [];
  trendsError = '';

  // ---- Chart view toggle
  trendsChartType: 'bar' | 'horizontalBar' = 'horizontalBar';

  // ---- Stat summaries
  totalViews = 0;
  peakDay = '';
  avgDailyViews = 0;
  topDrug = '';

  // ---- Drug trends table columns
  trendsColumns: RankedTableColumn[] = [
    { field: 'drug_name',      header: 'Drug Name',     sortable: true  },
    { field: 'total_searches', header: 'Total Searches', sortable: true, align: 'right', format: 'number' },
  ];

  ngOnInit(): void {
    this.loadTraffic();
    this.loadTrends();
  }

  private loadTraffic(): void {
    this.trafficState = 'loading';
    this.svc.getPharmacyTraffic().subscribe({
      next: (data: PageTrafficPoint[]) => {
        this.trafficLabels = data.map(d => {
          const date = new Date(d.date_key);
          return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        });
        this.trafficData = data.map(d => d.number_of_views);

        // Summary stats
        this.totalViews   = data.reduce((s, d) => s + d.number_of_views, 0);
        this.avgDailyViews = Math.round(this.totalViews / (data.length || 1));
        const peak = data.reduce((max, d) => d.number_of_views > max.number_of_views ? d : max, data[0]);
        this.peakDay = peak ? `${peak.day_name} (${peak.number_of_views})` : '—';

        this.trafficState = 'success';
      },
      error: (err) => {
        this.trafficError = 'Could not load traffic data. The data warehouse may be warming up — try again shortly.';
        this.trafficState = 'error';
      },
    });
  }

  private loadTrends(): void {
    this.trendsState = 'loading';
    this.svc.getLocalDrugTrends().subscribe({
      next: (data: LocalDrugTrend[]) => {
        this.localTrends = data;
        this.topDrug = data[0]?.drug_name ?? '—';
        this.trendsState = 'success';
      },
      error: () => {
        this.trendsError = 'Could not load drug trend data.';
        this.trendsState = 'error';
      },
    });
  }

  get trendsChartLabels(): string[] {
    return this.localTrends.map(d => d.drug_name);
  }

  get trendsChartData(): number[] {
    return this.localTrends.map(d => d.total_searches);
  }

  toggleTrendsView(): void {
    this.trendsChartType = this.trendsChartType === 'horizontalBar' ? 'bar' : 'horizontalBar';
  }

  // Strict template helpers
  get isTrafficError(): boolean  { return this.trafficState === 'error'; }
  get isTrendsError(): boolean   { return this.trendsState === 'error'; }
  get isTrendsLoading(): boolean { return this.trendsState === 'loading'; }
}
