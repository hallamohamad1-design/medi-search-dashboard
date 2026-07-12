import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: ('pharmacy' | 'admin')[];
}

@Component({
  selector: 'ms-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
})
export class DashboardLayoutComponent {
  auth    = inject(AuthService);
  private svc    = inject(DashboardService);
  private router = inject(Router);

  sidebarCollapsed = signal(false);

  navItems: NavItem[] = [
    { label: 'My Dashboard',      icon: '📊', route: '/dashboard/pharmacy',  roles: ['pharmacy'] },
    { label: 'Admin Overview',    icon: '🏥', route: '/dashboard/admin',      roles: ['admin'] },
    { label: 'Analytics Charts',  icon: '📉', route: '/dashboard/analytics',  roles: ['pharmacy', 'admin'] },
    { label: 'Drug Search Widget',icon: '💊', route: '/drug-detail-demo',      roles: ['pharmacy', 'admin'] },
  ];

  get currentPharmacyId(): string | null {
    const url = this.router.url;
    const match = url.match(/\/dashboard\/pharmacy\/(\d+)/);
    return match ? match[1] : null;
  }

  get visibleNavItems(): NavItem[] {
    const pharmId = this.currentPharmacyId;
    return this.navItems
      .filter(item => {
        // If we don't have a pharmacyId in the URL, hide the 'My Dashboard' item
        if (item.route === '/dashboard/pharmacy' && !pharmId) {
          return false;
        }
        return true;
      })
      .map(n => {
        if (n.route === '/dashboard/pharmacy') {
          return { ...n, route: `/dashboard/pharmacy/${pharmId}` };
        }
        return n;
      });
  }

  get currentPharmacyName(): string {
    const id = this.currentPharmacyId;
    if (id) {
      const idx = parseInt(id, 10) - 1;
      const names = [
        'El Ezaby Pharmacy',
        'Sehha Pharmacy',
        'El Hazim Pharmacy',
        'Hind Pharmacy',
      ];
      return names[idx] || `Pharmacy #${id}`;
    }
    return 'MediSearch';
  }

  get currentUsername(): string {
    return this.currentPharmacyId ? this.currentPharmacyName : 'Administrator';
  }

  get currentRole(): string {
    return this.currentPharmacyId ? 'pharmacy' : 'admin';
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  logout(): void {
    this.svc.invalidateAll();
    this.router.navigate(['/dashboard/admin']);
  }
}
