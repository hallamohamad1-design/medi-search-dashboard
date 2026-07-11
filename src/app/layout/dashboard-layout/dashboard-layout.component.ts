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

  get visibleNavItems(): NavItem[] {
    const role = this.auth.currentUser?.role as 'pharmacy' | 'admin' | undefined;
    if (!role) return [];
    return this.navItems.filter(n => n.roles.includes(role));
  }

  get currentPharmacyName(): string {
    return this.auth.currentUser?.pharmacy_name ?? this.auth.currentUser?.username ?? 'Dashboard';
  }

  get currentUsername(): string {
    return this.auth.currentUser?.username ?? '';
  }

  get currentRole(): string {
    return this.auth.currentUser?.role ?? '';
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  logout(): void {
    this.svc.invalidateAll();
    this.auth.logout();
  }
}
