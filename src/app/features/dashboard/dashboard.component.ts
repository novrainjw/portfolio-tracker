import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { PortfolioService } from '../../core/services/portfolio.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from "@angular/material/card";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard.component',
  imports: [CommonModule, MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatIconModule, MatCardModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly portfolioService = inject(PortfolioService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destory$ = new Subject();

  //Signals for reactive state
  public readonly isInitialLoading = signal<boolean>(true);
  public readonly refreshing = signal<boolean>(false);

  // Data from service
  public readonly user = this.authService.currentUser;
  public readonly portfolioSummary = this.portfolioService.portfolioSummary;

  // Computed values for display
  public readonly totalValue = computed(() => this.portfolioSummary().totalValue);
  public readonly totalGainLossPercent = computed(() => this.portfolioSummary().totalGainLossPercent);
  public readonly totalGainLoss = computed(() => this.portfolioSummary().totalGainLoss);
  public readonly isPositiveGainLoss = computed(() => this.totalGainLoss() >= 0);


  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.snackBar.open('Please log in to view your dashboard', 'Close', { duration: 3000 });
      return;
    }

    this.isInitialLoading.set(true);

    // Load portfolios and watchlist in paralle
    combineLatest([
      this.portfolioService.getUserPortfolios(currentUser.id),
      this.portfolioService.getUserWatchlist()
    ]).pipe(
      takeUntil(this.destory$)
    ).subscribe({
      next: ([portfolios, watchlist]) => {
        this.isInitialLoading.set(false);

        // Load holdings for each portfolio
        portfolios.forEach(portfolio => {
          this.portfolioService.getPortfolioHoldings(portfolio.id).subscribe({
            error: (error) => {
              console.error(`Failed to load holdings for portfolio ${portfolio.name}:`, error);
            }
          });
        });
      },
      error: (error) => {
        this.isInitialLoading.set(false);
        console.error(`Failed to load dashboard data:`, error);
        this.snackBar.open('Failed to load dashboard data. Please try again.', 'Close', { duration: 5000 });
      }
    })
  }

  refreshData(): void {

  }

  createPortfolio(): void {

  }

  /**
   * Format currency with proper symbol
   */
  formatCurrency(amount: number, currency: 'USD' | 'CAD' = 'USD'): string {
    const symbol = currency === 'CAD' ? 'CA$' : '$';
    return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Get portfolio performance class for styling
   */
  getPerformanceClass(gainLossPercent: number): string {
    if (gainLossPercent > 0) return 'positive';
    if (gainLossPercent < 0) return 'negative';
    return 'neutral';
  }

  /**
   * Format percentage
   */
  formatPercentage(percent: number): string {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  }
}
