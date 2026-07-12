import { Component, Input, OnChanges, SimpleChanges, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

export type TrendChartType = 'line' | 'bar' | 'horizontalBar';

@Component({
  selector: 'ms-trend-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './trend-chart.component.html',
  styleUrls: ['./trend-chart.component.scss'],
})
export class TrendChartComponent implements OnChanges {
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  /** Chart type */
  @Input() chartType: TrendChartType = 'line';
  /** Array of labels (x-axis) */
  @Input() labels: string[] = [];
  /** Array of data points matching labels */
  @Input() data: number[] = [];
  /** Dataset label shown in the Chart.js legend */
  @Input() datasetLabel = 'Views';
  /** Primary color for the dataset (defaults to brand primary) */
  @Input() color = '#1a9fc9';
  /** Show area fill under line */
  @Input() fill = true;
  /** Loading state */
  @Input() loading = false;
  /** Error state */
  @Input() error = false;
  /** Error message */
  @Input() errorMessage = 'Failed to load chart data.';
  /** Chart height in px */
  @Input() height = 280;
  /** Show legend */
  @Input() showLegend = false;

  chartData: ChartData<'line' | 'bar'> = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration['options'] = {};
  resolvedChartType: 'line' | 'bar' = 'line';

  ngOnChanges(changes: SimpleChanges): void {
    this.buildChart();
  }

  get isEmpty(): boolean {
    return !this.loading && !this.error && this.data.length === 0;
  }

  private buildChart(): void {
    const alpha = (hex: string, a: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    };

    this.resolvedChartType = this.chartType === 'horizontalBar' ? 'bar' : this.chartType;

    const isBar = this.resolvedChartType === 'bar';

    this.chartData = {
      labels: this.labels,
      datasets: [
        {
          label: this.datasetLabel,
          data: this.data,
          borderColor: this.color,
          backgroundColor: isBar
            ? alpha(this.color, 0.75)
            : (this.fill ? alpha(this.color, 0.12) : 'transparent'),
          borderWidth: isBar ? 0 : 2.5,
          pointBackgroundColor: this.color,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: this.fill && !isBar,
          tension: 0.4,
          borderRadius: isBar ? 6 : 0,
        } as any,
      ],
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: this.chartType === 'horizontalBar' ? 'y' : 'x',
      plugins: {
        legend: { display: this.showLegend },
        tooltip: {
          backgroundColor: '#1e2a30',
          titleColor: '#ffffff',
          bodyColor: 'rgba(255,255,255,0.8)',
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(228,233,237,0.6)', drawTicks: false },
          border: { display: false },
          ticks: {
            color: '#6e808c',
            font: { size: 11, family: 'Inter, system-ui, sans-serif' },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
          },
        },
        y: {
          grid: { color: 'rgba(228,233,237,0.6)', drawTicks: false },
          border: { display: false },
          ticks: {
            color: '#6e808c',
            font: { size: 11, family: 'Inter, system-ui, sans-serif' },
          },
          beginAtZero: true,
        },
      },
      animation: { duration: 400 },
    };
  }
}
