import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../services/dashboard.service';
import { DrugSearchAnalytics, LoadingState } from '../../../models/analytics.models';

/**
 * DrugSearchAnalyticsComponent
 *
 * Reusable card embedded in any drug detail page.
 * Pass [drugName] (the drug's display name) and it loads analytics automatically.
 *
 * Usage:
 *   <ms-drug-search-analytics [drugName]="drug.name" />
 */
@Component({
  selector: 'ms-drug-search-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drug-search-analytics.component.html',
  styleUrls: ['./drug-search-analytics.component.scss'],
})
export class DrugSearchAnalyticsComponent implements OnChanges {
  private svc = inject(DashboardService);

  /** Name of the drug — passed from the host drug detail page */
  @Input({ required: true }) drugName!: string;

  state: LoadingState = 'idle';
  analytics: DrugSearchAnalytics | null = null;
  error = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['drugName'] && this.drugName) {
      this.load();
    }
  }

  private load(): void {
    this.state     = 'loading';
    this.analytics = null;
    this.svc.getDrugAnalyticsByName(this.drugName).subscribe({
      next: data => {
        this.analytics = data;
        this.state     = 'success';
      },
      error: (err: Error) => {
        this.error = err.message;
        this.state = 'error';
      },
    });
  }

  get priceSpreadPct(): number {
    if (!this.analytics || this.analytics.avg_price === 0) return 0;
    return Math.round(
      ((this.analytics.highest_price - this.analytics.lowest_price) / this.analytics.avg_price) * 100,
    );
  }

  get availabilityClass(): string {
    const pct = this.analytics?.availability_percent ?? 0;
    if (pct >= 75) return 'success';
    if (pct >= 40) return 'warning';
    return 'error';
  }

  retry(): void { this.load(); }
}
