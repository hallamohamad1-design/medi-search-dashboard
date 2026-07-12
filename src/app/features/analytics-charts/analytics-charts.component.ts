import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import {
  PageTrafficPoint,
  TopSearchedDrug,
  PharmacyTrafficRanking,
  LoadingState,
} from '../../models/analytics.models';

// ─── Chart-level type aliases ─────────────────────────────────────────────────
type LineData   = ChartData<'line'>;
type BarData    = ChartData<'bar'>;
type DoughnutData = ChartData<'doughnut'>;
type RadarData  = ChartData<'radar'>;
type BubbleData = ChartData<'bubble'>;

// Brand palette (mirrors design-tokens.scss)
const PALETTE = {
  primary:  '#1a9fc9',
  accent:   '#12c09a',
  violet:   '#8b5cf6',
  amber:    '#f59e0b',
  rose:     '#f43f5e',
  blue:     '#3b82f6',
  teal:     '#14b8a6',
  orange:   '#f97316',
};

function hex2rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const CHART_DEFAULTS: Partial<ChartOptions> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'top' as const,
      labels: { font: { family: 'Inter, system-ui, sans-serif', size: 12 }, boxWidth: 12, padding: 16 } },
    tooltip: {
      backgroundColor: '#1e2a30',
      titleColor: '#fff',
      bodyColor: 'rgba(255,255,255,0.8)',
      padding: 12,
      cornerRadius: 8,
    },
  },
};

@Component({
  selector: 'ms-analytics-charts',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './analytics-charts.component.html',
  styleUrls: ['./analytics-charts.component.scss'],
})
export class AnalyticsChartsComponent implements OnInit {
  private svc        = inject(DashboardService);
  private auth       = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  // ── Global loading state ───────────────────────────────────────────────────
  state: LoadingState = 'idle';

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Multi-series traffic comparison line chart
  //    Two datasets: this period vs previous period (simulated)
  // ─────────────────────────────────────────────────────────────────────────
  trafficCompareData!: LineData;
  trafficCompareOptions: ChartOptions<'line'> = {
    ...(CHART_DEFAULTS as ChartOptions<'line'>),
    scales: {
      x: { grid: { color: 'rgba(228,233,237,0.5)' }, border: { display: false },
           ticks: { color: '#6e808c', font: { size: 11 }, maxTicksLimit: 10, maxRotation: 0 } },
      y: { grid: { color: 'rgba(228,233,237,0.5)' }, border: { display: false },
           ticks: { color: '#6e808c', font: { size: 11 } }, beginAtZero: true },
    },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { ...CHART_DEFAULTS.plugins!['legend'], display: true },
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Stacked bar — top 5 drugs across 3 governorates
  // ─────────────────────────────────────────────────────────────────────────
  stackedBarData!: BarData;
  stackedBarOptions: ChartOptions<'bar'> = {
    ...(CHART_DEFAULTS as ChartOptions<'bar'>),
    scales: {
      x: { stacked: true, grid: { display: false }, border: { display: false },
           ticks: { color: '#6e808c', font: { size: 11 } } },
      y: { stacked: true, grid: { color: 'rgba(228,233,237,0.5)' }, border: { display: false },
           ticks: { color: '#6e808c', font: { size: 11 } }, beginAtZero: true },
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Doughnut — pharmacy market share by views
  // ─────────────────────────────────────────────────────────────────────────
  doughnutData!: DoughnutData;
  doughnutOptions: ChartOptions<'doughnut'> = {
    ...(CHART_DEFAULTS as ChartOptions<'doughnut'>),
    cutout: '65%',
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { display: true, position: 'right' as const,
        labels: { font: { family: 'Inter, system-ui, sans-serif', size: 11 }, boxWidth: 12, padding: 10 } },
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Radar — top drug search intensity across governorates
  // ─────────────────────────────────────────────────────────────────────────
  radarData!: RadarData;
  radarOptions: ChartOptions<'radar'> = {
    ...(CHART_DEFAULTS as ChartOptions<'radar'>),
    scales: {
      r: {
        backgroundColor: 'rgba(26,159,201,0.04)',
        grid: { color: 'rgba(228,233,237,0.8)' },
        angleLines: { color: 'rgba(228,233,237,0.8)' },
        pointLabels: { font: { size: 11, family: 'Inter, system-ui, sans-serif' }, color: '#4a5c66' },
        ticks: { display: false },
      },
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Horizontal bar — weekly search velocity (searches per day of week)
  // ─────────────────────────────────────────────────────────────────────────
  weeklyVelocityData!: BarData;
  weeklyVelocityOptions: ChartOptions<'bar'> = {
    ...(CHART_DEFAULTS as ChartOptions<'bar'>),
    indexAxis: 'y' as const,
    scales: {
      x: { grid: { color: 'rgba(228,233,237,0.5)' }, border: { display: false },
           ticks: { color: '#6e808c', font: { size: 11 } }, beginAtZero: true },
      y: { grid: { display: false }, border: { display: false },
           ticks: { color: '#4a5c66', font: { size: 12, weight: '500' as any } } },
    },
    plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Mixed chart — views (bar) + cumulative (line) overlay
  // ─────────────────────────────────────────────────────────────────────────
  mixedData!: ChartData<'bar'>;
  mixedOptions: ChartOptions<'bar'> = {
    ...(CHART_DEFAULTS as ChartOptions<'bar'>),
    scales: {
      x: { grid: { display: false }, border: { display: false },
           ticks: { color: '#6e808c', font: { size: 11 }, maxTicksLimit: 10, maxRotation: 0 } },
      yLeft:  { position: 'left'  as const, grid: { color: 'rgba(228,233,237,0.5)' }, border: { display: false },
                ticks: { color: '#6e808c', font: { size: 11 } }, beginAtZero: true, title: { display: true, text: 'Daily Views', color: '#6e808c' } },
      yRight: { position: 'right' as const, grid: { drawOnChartArea: false }, border: { display: false },
                ticks: { color: PALETTE.accent, font: { size: 11 } }, title: { display: true, text: 'Cumulative', color: PALETTE.accent } },
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Bubble — drug search volume vs pharmacy count vs avg price
  // ─────────────────────────────────────────────────────────────────────────
  bubbleData!: BubbleData;
  bubbleOptions: ChartOptions<'bubble'> = {
    ...(CHART_DEFAULTS as ChartOptions<'bubble'>),
    scales: {
      x: { title: { display: true, text: 'Total Searches', color: '#6e808c' },
           grid: { color: 'rgba(228,233,237,0.5)' }, border: { display: false },
           ticks: { color: '#6e808c', font: { size: 11 } } },
      y: { title: { display: true, text: 'Pharmacies Carrying', color: '#6e808c' },
           grid: { color: 'rgba(228,233,237,0.5)' }, border: { display: false },
           ticks: { color: '#6e808c', font: { size: 11 } }, beginAtZero: true },
    },
    plugins: {
      ...CHART_DEFAULTS.plugins,
      tooltip: {
        ...(CHART_DEFAULTS.plugins as any).tooltip,
        callbacks: {
          label: (ctx: any) => {
            const d = ctx.raw as { x: number; y: number; r: number };
            return ` Searches: ${d.x} | Pharmacies: ${d.y} | Price: ${d.r * 10} EGP`;
          },
        },
      },
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Area chart — cumulative monthly growth
  // ─────────────────────────────────────────────────────────────────────────
  growthData!: LineData;
  growthOptions: ChartOptions<'line'> = {
    ...(CHART_DEFAULTS as ChartOptions<'line'>),
    scales: {
      x: { grid: { display: false }, border: { display: false },
           ticks: { color: '#6e808c', font: { size: 11 } } },
      y: { grid: { color: 'rgba(228,233,237,0.5)' }, border: { display: false },
           ticks: { color: '#6e808c', font: { size: 11 } }, beginAtZero: true },
    },
    plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } },
  };

  // ── Summary KPIs ──────────────────────────────────────────────────────────
  kpis = { searches: 0, pharmacies: 0, peakDay: '', growth: 0 };

  // ── Period toggle ─────────────────────────────────────────────────────────
  selectedPeriod: '7d' | '14d' | '30d' = '30d';

  readonly MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.state = 'loading';

    const pharmacyName = this.auth.currentUser?.pharmacy_name ?? '';
    const isAdmin      = this.auth.currentUser?.role === 'admin';

    // Admin data — always load (analytics page is accessible to both roles)
    this.svc.getAdminAnalytics().subscribe({
      next: adminData => {
        this.buildStackedBar(adminData.area_drug_trends);
        this.buildRadar(adminData.area_drug_trends);
        this.buildBubble(adminData.top_searched_drugs);
        this.buildDoughnut(adminData.pharmacy_ranking);
        this.kpis.pharmacies = adminData.pharmacy_ranking.length;

        if (isAdmin && !pharmacyName) {
          this.state = 'success';
        }
      },
      error: (err: Error) => {
        this.state = 'error';
        console.error('Admin analytics error:', err.message);
      },
    });

    // Pharmacy traffic — load when pharmacy role
    if (pharmacyName) {
      this.svc.getPharmacyAnalytics().subscribe({
        next: pharmData => {
          this.buildTrafficCharts(pharmData.page_traffic);
          this.buildMixedChart(pharmData.page_traffic);
          this.buildWeeklyVelocity(pharmData.page_traffic);
          this.buildGrowthChart(pharmData.page_traffic);
          this.state = 'success';
        },
        error: (err: Error) => {
          console.warn('Pharmacy traffic not available:', err.message);
          this.buildWeeklyVelocity();
          this.buildGrowthChart();
          if (this.state !== 'error') this.state = 'success';
        },
      });
    } else {
      this.buildWeeklyVelocity();
      this.buildGrowthChart();
    }
  }

  // ── Chart builders ─────────────────────────────────────────────────────────

  private buildTrafficCharts(data: PageTrafficPoint[]): void {
    const slice = this.selectedPeriod === '7d' ? 7 : this.selectedPeriod === '14d' ? 14 : 30;
    const recent = data.slice(-slice);
    const labels = recent.map(d => {
      const dt = new Date(d.date_key);
      return `${dt.getDate()} ${this.MONTHS[dt.getMonth()]}`;
    });

    this.trafficCompareData = {
      labels,
      datasets: [
        {
          label: 'This Period',
          data: recent.map(d => d.number_of_views),
          borderColor: PALETTE.primary,
          backgroundColor: hex2rgba(PALETTE.primary, 0.12),
          pointBackgroundColor: PALETTE.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          order: 1,
        }
      ] as any[],
    };

    // KPIs
    const total = recent.reduce((s, d) => s + d.number_of_views, 0);
    this.kpis.searches = total;
    this.kpis.growth   = 0; // Growth would require real previous period data
    const peak = recent.length ? recent.reduce((m, d) => d.number_of_views > m.number_of_views ? d : m, recent[0]) : null;
    this.kpis.peakDay  = peak?.day_name ?? '—';
  }

  private buildStackedBar(trends: any[]): void {
    if (!trends || !trends.length) return;
    
    // Get unique top drugs and governorates
    const uniqueDrugs = [...new Set(trends.map(t => t.drug_name))].slice(0, 5);
    const govs = [...new Set(trends.map(t => t.governorate))];

    this.stackedBarData = {
      labels: uniqueDrugs,
      datasets: govs.map((gov, i) => {
        const data = uniqueDrugs.map(d => {
          const match = trends.find(t => t.drug_name === d && t.governorate === gov);
          return match ? match.total_searches : 0;
        });
        return {
          label: gov,
          data: data,
          backgroundColor: hex2rgba(Object.values(PALETTE)[i % 8], 0.8),
          borderColor: Object.values(PALETTE)[i % 8],
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        };
      }) as any[],
    };
  }

  private buildDoughnut(ranking: PharmacyTrafficRanking[]): void {
    const top6   = ranking.slice(0, 6);
    const others = ranking.slice(6).reduce((s, r) => s + r.total_views, 0);
    const colors = Object.values(PALETTE);

    this.doughnutData = {
      labels: [...top6.map(r => r.name), others > 0 ? 'Others' : null].filter(Boolean) as string[],
      datasets: [{
        data: [...top6.map(r => r.total_views), others > 0 ? others : null].filter(v => v !== null) as number[],
        backgroundColor: colors.map(c => hex2rgba(c, 0.85)),
        borderColor: colors.map(c => hex2rgba(c, 1)),
        borderWidth: 2,
        hoverOffset: 8,
      }],
    };

    this.kpis.pharmacies = ranking.length;
  }

  private buildRadar(trends: any[]): void {
    if (!trends || !trends.length) return;
    
    const uniqueDrugs = [...new Set(trends.map(t => t.drug_name))].slice(0, 6);
    const govs = [...new Set(trends.map(t => t.governorate))].slice(0, 5);
    const palArr = Object.values(PALETTE);

    this.radarData = {
      labels: uniqueDrugs,
      datasets: govs.map((gov, i) => {
        const data = uniqueDrugs.map(d => {
          const match = trends.find(t => t.drug_name === d && t.governorate === gov);
          return match ? match.total_searches : 0;
        });
        return {
          label: gov,
          data: data,
          borderColor: palArr[i % palArr.length],
          backgroundColor: hex2rgba(palArr[i % palArr.length], 0.1),
          pointBackgroundColor: palArr[i % palArr.length],
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 3,
          borderWidth: 2,
        };
      }) as any[],
    };
  }

  private buildWeeklyVelocity(traffic?: PageTrafficPoint[]): void {
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    let views  = [0, 0, 0, 0, 0, 0, 0];

    if (traffic && traffic.length) {
      const totals: Record<string, number> = {};
      const counts: Record<string, number> = {};
      traffic.forEach(d => {
        totals[d.day_name] = (totals[d.day_name] ?? 0) + d.number_of_views;
        counts[d.day_name] = (counts[d.day_name] ?? 0) + 1;
      });
      views = days.map(d => counts[d] ? Math.round(totals[d] / counts[d]) : 0);
    }

    const colors = views.map(v =>
      v >= 850 ? hex2rgba(PALETTE.primary, 0.85) :
      v >= 650 ? hex2rgba(PALETTE.accent,  0.85) :
                 hex2rgba(PALETTE.amber,   0.75),
    );

    this.weeklyVelocityData = {
      labels: days,
      datasets: [{
        label: 'Avg Views',
        data: views,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      }] as any[],
    };
  }

  private buildMixedChart(data: PageTrafficPoint[]): void {
    const recent = data.slice(-14);
    const labels = recent.map(d => {
      const dt = new Date(d.date_key);
      return `${dt.getDate()} ${this.MONTHS[dt.getMonth()]}`;
    });
    const daily = recent.map(d => d.number_of_views);
    let cum = 0;
    const cumulative = daily.map(v => (cum += v));

    this.mixedData = {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Daily Views',
          data: daily,
          backgroundColor: hex2rgba(PALETTE.primary, 0.7),
          borderColor: PALETTE.primary,
          borderWidth: 1,
          borderRadius: 5,
          yAxisID: 'yLeft',
          order: 2,
        } as any,
        {
          type: 'line' as const,
          label: 'Cumulative',
          data: cumulative,
          borderColor: PALETTE.accent,
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          pointRadius: 3,
          pointBackgroundColor: PALETTE.accent,
          fill: false,
          tension: 0.4,
          yAxisID: 'yRight',
          order: 1,
        } as any,
      ],
    };
  }

  private buildBubble(drugs: TopSearchedDrug[]): void {
    const top8 = drugs.slice(0, 8);
    const palArr = Object.values(PALETTE);

    this.bubbleData = {
      datasets: top8.map((d, i) => ({
        label: d.name,
        data: [{
          x: d.total_searches,
          y: 0, // Need API support for pharmacies carrying
          r: Math.round(4 + (d.total_searches / 2000)), // Approximate bubble size
        }],
        backgroundColor: hex2rgba(palArr[i % palArr.length], 0.65),
        borderColor:     palArr[i % palArr.length],
        borderWidth: 2,
      })) as any[],
    };
  }

  private buildGrowthChart(traffic?: PageTrafficPoint[]): void {
    let labels: string[] = [];
    let cumulative: number[] = [];

    if (traffic && traffic.length) {
      const byMonth: Record<string, number> = {};
      traffic.forEach(d => {
        const dt  = new Date(d.date_key);
        const key = `${this.MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
        byMonth[key] = (byMonth[key] ?? 0) + d.number_of_views;
      });
      labels = Object.keys(byMonth);
      let cum = 0;
      cumulative = Object.values(byMonth).map(v => (cum += v));
    }

    this.growthData = {
      labels,
      datasets: [{
        label: 'Cumulative Views',
        data: cumulative,
        borderColor: PALETTE.violet,
        backgroundColor: hex2rgba(PALETTE.violet, 0.12),
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: PALETTE.violet,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.45,
      }] as any[],
    };
  }

  // ── Period toggle handler ─────────────────────────────────────────────────
  onPeriodChange(period: '7d' | '14d' | '30d'): void {
    this.selectedPeriod = period;
    const isPharmacy = this.auth.currentUser?.role === 'pharmacy';
    if (isPharmacy) {
      this.svc.getPharmacyAnalytics().subscribe({
        next: data => this.buildTrafficCharts(data.page_traffic),
        error: () => { /* keep existing chart */ },
      });
    }
  }
}
