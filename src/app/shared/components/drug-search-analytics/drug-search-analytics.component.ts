import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../services/dashboard.service';
import { DrugSearchAnalytics, LoadingState } from '../../../models/analytics.models';

/**
 * DrugSearchAnalyticsComponent
 *
 * Reusable card/stat-block embedded in a drug detail page.
 * Pass [drugId] and it will load + display analytics automatically.
 *
 * Usage:
 *   <ms-drug-search-analytics [drugId]="drug.id" />
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

  /** ID of the drug to show analytics for */
  @Input({ required: true }) drugId!: number;

  state: LoadingState = 'idle';
  analytics: DrugSearchAnalytics | null = null;
  error = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['drugId'] && this.drugId) {
      this.load();
    }
  }

  private load(): void {
    this.state = 'loading';
    this.analytics = null;
    this.svc.getDrugAnalytics(this.drugId).subscribe({
      next: (data) => {
        this.analytics = data;
        this.state = 'success';
      },
      error: () => {
        this.error = 'Could not load drug analytics.';
        this.state = 'error';
      },
    });
  }

  /** Price spread as a percentage of avg — flags high variance */
  get priceSpreadPct(): number {
    if (!this.analytics || this.analytics.avg_price === 0) return 0;
    const spread = this.analytics.highest_price - this.analytics.lowest_price;
    return Math.round((spread / this.analytics.avg_price) * 100);
  }

  get availabilityClass(): string {
    const pct = this.analytics?.availability_percent ?? 0;
    if (pct >= 75) return 'success';
    if (pct >= 40) return 'warning';
    return 'error';
  }

  retry(): void {
    this.load();
  }
}
