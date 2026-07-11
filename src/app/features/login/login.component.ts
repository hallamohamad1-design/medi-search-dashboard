import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'ms-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private cdr    = inject(ChangeDetectorRef);

  username  = '';
  password  = '';
  loading   = false;
  error     = '';
  showPass  = false;

  login(): void {
    this.error   = '';
    this.loading = true;
    this.cdr.markForCheck();

    this.auth.login(this.username.trim(), this.password).subscribe({
      next: res => {
        this.loading = false;
        const dest   = res.user.role === 'admin' ? '/dashboard/admin' : '/dashboard/pharmacy';
        this.router.navigate([dest]);
      },
      error: (err: Error) => {
        this.error   = err.message;
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
