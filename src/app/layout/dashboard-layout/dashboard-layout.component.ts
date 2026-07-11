import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

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
  private router = inject(Router);

  sidebarCollapsed = signal(false);

  /** Real pharmacy names from the database */
  pharmacyOptions = AuthService.PHARMACIES;

  navItems: NavItem[] = [
    { label: 'My Dashboard',     icon: '📊', route: '/dashboard/pharmacy',  roles: ['pharmacy'] },
    { label: 'Overview',         icon: '🏥', route: '/dashboard/admin',      roles: ['admin'] },
    { label: 'Analytics Charts', icon: '📉', route: '/dashboard/analytics',  roles: ['pharmacy', 'admin'] },
    { label: 'Drug Widget',      icon: '💊', route: '/drug-detail-demo',      roles: ['pharmacy', 'admin'] },
  ];

  get visibleNavItems(): NavItem[] {
    const role = this.auth.currentUser.role as 'pharmacy' | 'admin';
    return this.navItems.filter(n => n.roles.includes(role));
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  /** Switch between pharmacy and admin role (dev helper) */
  switchRole(role: 'pharmacy' | 'admin'): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('dev_role', role);
    const dest = role === 'admin' ? '/dashboard/admin' : '/dashboard/pharmacy';
    this.router.navigate([dest]).then(() => window.location.reload());
  }

  /** Switch the active pharmacy (dev helper) */
  switchPharmacy(event: Event): void {
    if (typeof localStorage === 'undefined') return;
    const sel = (event.target as HTMLSelectElement).value;
    localStorage.setItem('dev_pharmacy', sel);
    window.location.reload();
  }

  /** Logout — clears session and returns to login */
  logout(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('dev_role');
    localStorage.removeItem('dev_name');
    localStorage.removeItem('dev_pharmacy');
    this.router.navigate(['/login']);
  }
}
