import { Routes } from '@angular/router';

export const routes: Routes = [
  // ── Login page (Redirected to dashboard/admin) ────────────────────────────
  {
    path: 'login',
    redirectTo: 'dashboard/admin',
    pathMatch: 'full',
  },

  // ── Dashboard shell ───────────────────────────────────────────────────────
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./layout/dashboard-layout/dashboard-layout.component').then(
        m => m.DashboardLayoutComponent,
      ),
    children: [
      {
        path: 'pharmacy/:pharmacyId',
        loadComponent: () =>
          import('./features/pharmacy-dashboard/pharmacy-dashboard.component').then(
            m => m.PharmacyDashboardComponent,
          ),
        title: 'Pharmacy Dashboard — MediSearch',
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/admin-dashboard/admin-dashboard.component').then(
            m => m.AdminDashboardComponent,
          ),
        title: 'Admin Dashboard — MediSearch',
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics-charts/analytics-charts.component').then(
            m => m.AnalyticsChartsComponent,
          ),
        title: 'Analytics Charts — MediSearch',
      },
      {
        path: '',
        redirectTo: 'admin',
        pathMatch: 'full',
      },
    ],
  },

  // ── Drug detail demo ──────────────────────────────────────────────────────
  {
    path: 'drug-detail-demo',
    loadComponent: () =>
      import('./features/drug-detail-demo/drug-detail-demo.component').then(
        m => m.DrugDetailDemoComponent,
      ),
    title: 'Drug Analytics Widget — MediSearch',
  },

  // ── Unauthorized (Redirected to dashboard/admin since there are no auth gates)
  {
    path: 'unauthorized',
    redirectTo: 'dashboard/admin',
    pathMatch: 'full',
  },

  // ── Root → Dashboard ──────────────────────────────────────────────────────
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  // ── 404 fallback ──────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
