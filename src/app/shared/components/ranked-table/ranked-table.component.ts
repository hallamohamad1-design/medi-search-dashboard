import { Component, Input, OnChanges, SimpleChanges, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SortConfig, SortDirection } from '../../../models/analytics.models';

export interface RankedTableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  /** Optional pipe/formatter: 'number' | 'currency' | 'percent' */
  format?: 'number' | 'currency' | 'percent' | 'rank';
  currencyCode?: string;
}

@Component({
  selector: 'ms-ranked-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranked-table.component.html',
  styleUrls: ['./ranked-table.component.scss'],
})
export class RankedTableComponent implements OnChanges {
  /** Column definitions */
  @Input() columns: RankedTableColumn[] = [];
  /** Row data — any[] so the component stays generic */
  @Input() rows: any[] = [];
  /** Loading state */
  @Input() loading = false;
  /** Error state */
  @Input() error = false;
  /** Error message */
  @Input() errorMessage = 'Failed to load data.';
  /** Empty message */
  @Input() emptyMessage = 'No data available.';
  /** Number of skeleton rows to show while loading */
  @Input() skeletonRows = 7;
  /** Show rank (#) column */
  @Input() showRank = true;
  /** Whether to allow external sort events */
  @Input() serverSide = false;

  sortChanged = output<SortConfig>();

  sortConfig: SortConfig = { field: '', direction: 'desc' };
  displayRows: any[] = [];
  skeletonArray: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.skeletonArray = Array.from({ length: this.skeletonRows }, (_, i) => i);
    if (!this.serverSide) {
      this.applySort();
    } else {
      this.displayRows = [...this.rows];
    }
  }

  onSort(field: string): void {
    if (this.sortConfig.field === field) {
      this.sortConfig = {
        field,
        direction: this.sortConfig.direction === 'asc' ? 'desc' : 'asc',
      };
    } else {
      this.sortConfig = { field, direction: 'desc' };
    }

    if (this.serverSide) {
      this.sortChanged.emit(this.sortConfig);
    } else {
      this.applySort();
    }
  }

  sortIcon(field: string): string {
    if (this.sortConfig.field !== field) return '↕';
    return this.sortConfig.direction === 'asc' ? '↑' : '↓';
  }

  formatCell(value: any, col: RankedTableColumn): string {
    if (value === null || value === undefined) return '—';

    switch (col.format) {
      case 'number':
        return new Intl.NumberFormat('en-EG').format(value);
      case 'currency':
        return new Intl.NumberFormat('en-EG', {
          style: 'currency',
          currency: col.currencyCode ?? 'EGP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(value);
      case 'percent':
        return `${value}%`;
      default:
        return String(value);
    }
  }

  private applySort(): void {
    if (!this.sortConfig.field) {
      this.displayRows = [...this.rows];
      return;
    }

    const { field, direction } = this.sortConfig;
    this.displayRows = [...this.rows].sort((a, b) => {
      const va = a[field];
      const vb = b[field];
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return direction === 'asc' ? cmp : -cmp;
    });
  }
}
