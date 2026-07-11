import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
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
  auth = inject(AuthService);
  sidebarCollapsed = signal(false);

  navItems: NavItem[] = [
    { label: 'My Dashboard',    icon: '📊', route: '/dashboard/pharmacy',  roles: ['pharmacy'] },
    { label: 'Overview',        icon: '🏥', route: '/dashboard/admin',      roles: ['admin'] },
    { label: 'Traffic Rank',    icon: '📈', route: '/dashboard/admin',      roles: ['admin'] },
    { label: 'Area Trends',     icon: '🗺️', route: '/dashboard/admin',      roles: ['admin'] },
    { label: 'Top Drugs',       icon: '💊', route: '/dashboard/admin',      roles: ['admin'] },
    { label: 'Analytics Charts',icon: '📉', route: '/dashboard/analytics',  roles: ['pharmacy', 'admin'] },
  ];

  get visibleNavItems(): NavItem[] {
    const role = this.auth.currentUser.role as 'pharmacy' | 'admin';
    return this.navItems.filter(n => n.roles.includes(role));
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }
}
