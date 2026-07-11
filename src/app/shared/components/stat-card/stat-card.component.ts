import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatCardVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

@Component({
  selector: 'ms-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss'],
})
export class StatCardComponent {
  /** Main numeric value */
  @Input() value: string | number | null = '—';
  /** Label below the value */
  @Input() label = '';
  /** Optional sub-label or description */
  @Input() sublabel = '';
  /** Icon (emoji or text symbol) */
  @Input() icon = '';
  /** Color variant */
  @Input() variant: StatCardVariant = 'primary';
  /** Show skeleton loading state */
  @Input() loading = false;
  /** Trend: positive number shows green arrow up, negative red arrow down */
  @Input() trend: number | null = null;
  /** Trend label text e.g. "vs last month" */
  @Input() trendLabel = '';
}
