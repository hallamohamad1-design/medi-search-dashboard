import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DrugSearchAnalyticsComponent } from '../../shared/components/drug-search-analytics/drug-search-analytics.component';

@Component({
  selector: 'ms-drug-detail-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DrugSearchAnalyticsComponent],
  templateUrl: './drug-detail-demo.component.html',
  styleUrls: ['./drug-detail-demo.component.scss'],
})
export class DrugDetailDemoComponent {
  // Preset names from the real DB (matches dim_drug.name exactly)
  demoOptions = [
    'Panadol Extra',
    'Augmentin 625',
    'Brufen 400mg',
    'Omeprazole 20mg',
    'Concor 5mg',
  ];

  selectedDrugName = this.demoOptions[0];
  customDrugName   = '';

  get activeDrug(): string {
    return this.customDrugName.trim() || this.selectedDrugName;
  }

  search(): void {
    if (this.customDrugName.trim()) {
      this.selectedDrugName = this.customDrugName.trim();
      this.customDrugName   = '';
    }
  }
}
