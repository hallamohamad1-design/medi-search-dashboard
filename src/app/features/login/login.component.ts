import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface PharmacyOption {
  name: string;
  id: number;
}

@Component({
  selector: 'ms-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private router    = inject(Router);
  private auth      = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  selectedRole: 'pharmacy' | 'admin' = 'pharmacy';
  selectedPharmacy = AuthService.PHARMACIES[0];
  userName = 'Demo User';

  pharmacies: PharmacyOption[] = [
    { name: 'El Ezaby Pharmacy',  id: 1  },
    { name: 'Sehha Pharmacy',     id: 11 },
    { name: 'El Hazim Pharmacy',  id: 7  },
    { name: 'Hind Pharmacy',      id: 9  },
  ];

  ngOnInit(): void {
    // If already logged in, redirect
    if (isPlatformBrowser(this.platformId)) {
      const role = localStorage.getItem('dev_role');
      if (role) {
        this.router.navigate([role === 'admin' ? '/dashboard/admin' : '/dashboard/pharmacy']);
      }
    }
  }

  login(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('dev_role',     this.selectedRole);
    localStorage.setItem('dev_name',     this.userName);
    localStorage.setItem('dev_pharmacy', this.selectedPharmacy);

    const dest = this.selectedRole === 'admin' ? '/dashboard/admin' : '/dashboard/pharmacy';
    this.router.navigate([dest]);
  }
}
