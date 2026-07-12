import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  // ── Login page ────────────────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(m => m.LoginComponent),
    title: 'Sign In — MediSearch Analytics',
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
        canActivate: [roleGuard('pharmacy')],
        title: 'Pharmacy Dashboard — MediSearch',
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/admin-dashboard/admin-dashboard.component').then(
            m => m.AdminDashboardComponent,
          ),
        canActivate: [roleGuard('admin')],
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
        redirectTo: 'pharmacy',
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

  // ── Unauthorized ──────────────────────────────────────────────────────────
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/unauthorized/unauthorized.component').then(
        m => m.UnauthorizedComponent,
      ),
    title: 'Access Denied — MediSearch',
  },

  // ── Root → login ──────────────────────────────────────────────────────────
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // ── 404 fallback ──────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'login',
  },
];
