import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../services/dashboard.service';
import { LoadingState } from '../../../models/analytics.models';

interface PharmacyRow {
  pharmacy_id: number;
  name: string;
  is_active: boolean;
  toggling?: boolean;
}

@Component({
  selector: 'ms-pharmacy-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: './pharmacy-management.component.html',
  styleUrls: ['./pharmacy-management.component.scss'],
})
export class PharmacyManagementComponent implements OnInit {
  private svc = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  state: LoadingState = 'idle';
  pharmacies: PharmacyRow[] = [];
  error = '';
  successMsg = '';

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.state = 'loading';
    this.cdr.markForCheck();
    this.svc.getPharmacyList().subscribe({
      next: data => {
        this.pharmacies = data.map(p => ({ ...p, toggling: false }));
        this.state = 'success';
        this.cdr.markForCheck();
      },
      error: (err: Error) => {
        this.error = err.message;
        this.state = 'error';
        this.cdr.markForCheck();
      },
    });
  }

  toggle(p: PharmacyRow): void {
    p.toggling = true;
    this.successMsg = '';
    this.cdr.markForCheck();

    this.svc.togglePharmacyActive(p.pharmacy_id, !p.is_active).subscribe({
      next: res => {
        p.is_active = res.data.is_active;
        p.toggling  = false;
        this.successMsg = `${p.name} is now ${p.is_active ? 'enabled ✅' : 'disabled 🚫'}. ${res.warning ?? ''}`;
        this.cdr.markForCheck();
      },
      error: (err: Error) => {
        p.toggling  = false;
        this.error  = err.message;
        this.cdr.markForCheck();
      },
    });
  }
}
