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
  // Real drug names exactly as stored in dim_drug.name
  demoOptions = [
    'Panadol Advance',
    'Acti Colla C Advanced-10 Sachets',
    'Brufen 200 mg-30 Tablets',
    'Mepafuran 100 mg-20 Capsules',
    'Bioderma Sensibio Forte Cream-Reddened Sensitive Skin-40ml',
    'Mebo 0.25 % Ointment-15gm',
    'Cerebromap 200 mg-30 Capsules',
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
