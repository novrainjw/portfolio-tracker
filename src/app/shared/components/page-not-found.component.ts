import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <mat-icon class="not-found-icon">error_outline</mat-icon>
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div class="not-found-actions">
          <button mat-raised-button color="primary" (click)="goHome()">
            <mat-icon>home</mat-icon>
            Go to Dashboard
          </button>
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Go Back
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 2rem;
    }

    .not-found-content {
      text-align: center;
      max-width: 400px;

      .not-found-icon {
        font-size: 5rem;
        height: 5rem;
        width: 5rem;
        color: var(--mat-sys-error);
        margin-bottom: 1.5rem;
      }

      h1 {
        margin: 0 0 1rem 0;
        font-size: 2rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }

      p {
        margin: 0 0 2rem 0;
        color: var(--mat-sys-on-surface-variant);
        font-size: 1.1rem;
        line-height: 1.5;
      }

      .not-found-actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;

        @media (min-width: 480px) {
          flex-direction: row;
          justify-content: center;
        }

        button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 150px;
        }
      }
    }
  `]
})
export class PageNotFoundComponent {
  private readonly router = inject(Router);

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    window.history.back();
  }
}