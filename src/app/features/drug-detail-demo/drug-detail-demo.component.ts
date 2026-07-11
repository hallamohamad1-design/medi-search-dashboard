import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DrugSearchAnalyticsComponent } from '../../shared/components/drug-search-analytics/drug-search-analytics.component';

/**
 * Demo page showing how to embed the DrugSearchAnalyticsComponent
 * inside any existing drug detail page in the main app.
 *
 * In the real app, replace this component with the actual drug detail page
 * and add <ms-drug-search-analytics [drugId]="drug.id" /> anywhere in the template.
 */
@Component({
  selector: 'ms-drug-detail-demo',
  standalone: true,
  imports: [CommonModule, RouterLink, DrugSearchAnalyticsComponent],
  templateUrl: './drug-detail-demo.component.html',
  styleUrls: ['./drug-detail-demo.component.scss'],
})
export class DrugDetailDemoComponent {
  // In the real app this comes from the route params + API
  selectedDrugId = 1;

  demoOptions = [
    { id: 1, name: 'Panadol Extra' },
    { id: 2, name: 'Augmentin 625' },
  ];
}
