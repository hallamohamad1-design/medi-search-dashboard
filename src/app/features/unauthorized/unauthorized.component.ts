import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ms-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="unauth">
      <span class="unauth__icon" aria-hidden="true">🔒</span>
      <h1 class="unauth__title">Access Denied</h1>
      <p class="unauth__body">You don't have permission to view this page.</p>
      <a routerLink="/" class="btn btn--primary">Go Home</a>
    </div>
  `,
  styles: [`
    @use '../../../styles/design-tokens' as *;
    @use '../../../styles/mixins' as *;

    .unauth {
      min-height: 100vh;
      @include flex-center;
      flex-direction: column;
      gap: $space-4;
      text-align: center;
      padding: $space-8;

      &__icon  { font-size: 4rem; }
      &__title { font-size: $font-size-2xl; font-weight: $font-weight-bold; }
      &__body  { color: $color-text-secondary; }
    }
  `],
})
export class UnauthorizedComponent {}
