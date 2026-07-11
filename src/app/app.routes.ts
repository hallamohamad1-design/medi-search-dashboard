import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  // ── Dashboard shell (sidebar + topbar) ──────────────────────────────────
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./layout/dashboard-layout/dashboard-layout.component').then(
        m => m.DashboardLayoutComponent,
      ),
    children: [
      // Pharmacy dashboard
      {
        path: 'pharmacy',
        loadComponent: () =>
          import('./features/pharmacy-dashboard/pharmacy-dashboard.component').then(
            m => m.PharmacyDashboardComponent,
          ),
        canActivate: [roleGuard('pharmacy')],
        title: 'Pharmacy Dashboard — MediSearch',
      },

      // Admin dashboard
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/admin-dashboard/admin-dashboard.component').then(
            m => m.AdminDashboardComponent,
          ),
        canActivate: [roleGuard('admin')],
        title: 'Admin Dashboard — MediSearch',
      },

      // Analytics charts
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics-charts/analytics-charts.component').then(
            m => m.AnalyticsChartsComponent,
          ),
        title: 'Analytics Charts — MediSearch',
      },

      // Default redirect inside /dashboard
      {
        path: '',
        redirectTo: 'pharmacy',
        pathMatch: 'full',
      },
    ],
  },

  // ── Drug detail demo page (widget showcase) ──────────────────────────────
  {
    path: 'drug-detail-demo',
    loadComponent: () =>
      import('./features/drug-detail-demo/drug-detail-demo.component').then(
        m => m.DrugDetailDemoComponent,
      ),
    title: 'Drug Analytics Widget — MediSearch',
  },

  // ── Unauthorized ─────────────────────────────────────────────────────────
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/unauthorized/unauthorized.component').then(
        m => m.UnauthorizedComponent,
      ),
    title: 'Access Denied — MediSearch',
  },

  // ── Root redirect ─────────────────────────────────────────────────────────
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  // ── 404 fallback ─────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
