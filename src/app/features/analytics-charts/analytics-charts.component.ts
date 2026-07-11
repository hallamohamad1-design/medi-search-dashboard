import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import {
  ChartConfiguration,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { DashboardService } from '../../services/dashboard.service';
import {
  PageTrafficPoint,
  TopSearchedDrug,
  PharmacyTrafficRanking,
  AreaDrugTrend,
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

    // Parallel load
    let pending = 3;
    const done = () => { if (--pending === 0) this.state = 'success'; };

    this.svc.getPharmacyTraffic().subscribe({ next: t => { this.buildTrafficCharts(t); this.buildMixedChart(t); done(); }, error: () => { this.state = 'error'; } });
    this.svc.getTopSearchedDrugs().subscribe({ next: d => { this.buildStackedBar(d); this.buildRadar(d); this.buildBubble(d); done(); }, error: () => { this.state = 'error'; } });
    this.svc.getPharmacyTrafficRanking().subscribe({ next: r => { this.buildDoughnut(r); done(); }, error: () => { this.state = 'error'; } });

    this.buildWeeklyVelocity();
    this.buildGrowthChart();
  }

  // ── Chart builders ─────────────────────────────────────────────────────────

  private buildTrafficCharts(data: PageTrafficPoint[]): void {
    const slice = this.selectedPeriod === '7d' ? 7 : this.selectedPeriod === '14d' ? 14 : 30;
    const recent = data.slice(-slice);

    // Simulate "previous period" by offsetting values ±15%
    const prev = recent.map(d => Math.round(d.number_of_views * (0.7 + Math.random() * 0.4)));

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
        },
        {
          label: 'Previous Period',
          data: prev,
          borderColor: PALETTE.violet,
          backgroundColor: 'transparent',
          pointBackgroundColor: PALETTE.violet,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 3,
          borderDash: [5, 4],
          fill: false,
          tension: 0.4,
          borderWidth: 2,
          order: 2,
        },
      ] as any[],
    };

    // KPIs
    const total = recent.reduce((s, d) => s + d.number_of_views, 0);
    const prevTotal = prev.reduce((a, b) => a + b, 0);
    this.kpis.searches = total;
    this.kpis.growth   = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;
    const peak = recent.reduce((m, d) => d.number_of_views > m.number_of_views ? d : m, recent[0]);
    this.kpis.peakDay  = peak?.day_name ?? '—';
  }

  private buildStackedBar(drugs: TopSearchedDrug[]): void {
    const top5  = drugs.slice(0, 5);
    const govs  = ['Cairo', 'Giza', 'Alexandria'];
    const splits = [0.42, 0.31, 0.27]; // distribution weights

    this.stackedBarData = {
      labels: top5.map(d => d.name),
      datasets: govs.map((gov, i) => ({
        label: gov,
        data: top5.map(d => Math.round(d.total_searches * splits[i] * (0.85 + Math.random() * 0.3))),
        backgroundColor: hex2rgba(Object.values(PALETTE)[i], 0.8),
        borderColor:     Object.values(PALETTE)[i],
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      })) as any[],
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

  private buildRadar(drugs: TopSearchedDrug[]): void {
    const top6 = drugs.slice(0, 6);
    const govs = ['Cairo', 'Giza', 'Alexandria', 'Assiut', 'Luxor'];
    const palArr = Object.values(PALETTE);

    this.radarData = {
      labels: top6.map(d => d.name),
      datasets: govs.map((gov, i) => ({
        label: gov,
        data: top6.map(d => Math.round(d.total_searches * (0.1 + Math.random() * 0.5))),
        borderColor: palArr[i],
        backgroundColor: hex2rgba(palArr[i], 0.1),
        pointBackgroundColor: palArr[i],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
        borderWidth: 2,
      })) as any[],
    };
  }

  private buildWeeklyVelocity(): void {
    const days  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const views = [820, 910, 870, 780, 540, 630, 480];
    const colors = views.map(v =>
      v >= 850 ? hex2rgba(PALETTE.primary, 0.85) :
      v >= 650 ? hex2rgba(PALETTE.accent,  0.85) :
                 hex2rgba(PALETTE.amber,   0.75),
    );

    this.weeklyVelocityData = {
      labels: days,
      datasets: [{
        label: 'Avg Searches',
        data: views,
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace(/[\d.]+\)$/, '1)')),
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
          y: Math.round(4 + Math.random() * 8),          // pharmacies carrying (1-12)
          r: Math.round(4 + (d.total_searches / 2000)),   // bubble size ~ avg price
        }],
        backgroundColor: hex2rgba(palArr[i % palArr.length], 0.65),
        borderColor:     palArr[i % palArr.length],
        borderWidth: 2,
      })) as any[],
    };
  }

  private buildGrowthChart(): void {
    const months = ['Jan','Feb','Mar','Apr','May','Jun'];
    const base   = 6200;
    let running  = 0;
    const cumulative = months.map((_, i) => {
      running += base + i * 800 + Math.round(Math.random() * 500);
      return running;
    });

    this.growthData = {
      labels: months,
      datasets: [{
        label: 'Cumulative Searches',
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
    this.svc.getPharmacyTraffic().subscribe(t => this.buildTrafficCharts(t));
  }
}
