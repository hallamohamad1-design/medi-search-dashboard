import { Component, inject, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { DrugSearchAnalyticsComponent } from '../../shared/components/drug-search-analytics/drug-search-analytics.component';

@Component({
  selector: 'ms-drug-detail-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, DrugSearchAnalyticsComponent],
  templateUrl: './drug-detail-demo.component.html',
  styleUrls: ['./drug-detail-demo.component.scss'],
})
export class DrugDetailDemoComponent implements OnDestroy {
  private svc     = inject(DashboardService);
  private cdr     = inject(ChangeDetectorRef);
  private destroy = new Subject<void>();

  // ── Search state ──────────────────────────────────────────────────────────
  inputValue   = '';
  activeDrug   = 'Panadol Advance';   // shown in widget
  suggestions: { drug_id: number; name: string }[] = [];
  showDropdown = false;
  isSearching  = false;

  // ── Typeahead stream ──────────────────────────────────────────────────────
  private search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      debounceTime(300),           // wait 300ms after last keystroke
      distinctUntilChanged(),      // skip if same value
      switchMap(q => {
        if (q.trim().length < 2) {
          this.suggestions  = [];
          this.showDropdown = false;
          this.isSearching  = false;
          this.cdr.markForCheck();
          return [];
        }
        this.isSearching = true;
        this.cdr.markForCheck();
        return this.svc.getDrugSuggestions(q);
      }),
      takeUntil(this.destroy),
    ).subscribe(results => {
      this.suggestions  = results;
      this.showDropdown = results.length > 0;
      this.isSearching  = false;
      this.cdr.markForCheck();
    });
  }

  onInput(): void {
    this.search$.next(this.inputValue);
  }

  selectSuggestion(name: string): void {
    this.activeDrug   = name;
    this.inputValue   = '';
    this.suggestions  = [];
    this.showDropdown = false;
    this.cdr.markForCheck();
  }

  search(): void {
    const q = this.inputValue.trim();
    if (!q) return;
    this.activeDrug   = q;
    this.inputValue   = '';
    this.suggestions  = [];
    this.showDropdown = false;
    this.cdr.markForCheck();
  }

  closeSuggestions(): void {
    setTimeout(() => {
      this.showDropdown = false;
      this.cdr.markForCheck();
    }, 180);
  }

  // Quick-select presets (real drug names from dim_drug)
  presets = [
    'Panadol Advance',
    'Acti Colla C Advanced-10 Sachets',
    'Brufen 200 mg-30 Tablets',
    'Mepafuran 100 mg-20 Capsules',
    'Bioderma Sensibio Forte Cream-Reddened Sensitive Skin-40ml',
    'Mebo 0.25 % Ointment-15gm',
    'Cerebromap 200 mg-30 Capsules',
  ];

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }
}
