import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, Observable, Subject, takeUntil } from 'rxjs';
import { PortfolioService } from '../../core/services/portfolio.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from "@angular/material/card";
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { Portfolio, WatchlistItem } from '../../core/models/portfolio.models';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatIconModule, MatCardModule, MatChipsModule, MatTabsModule, MatMenuModule, MatDividerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly portfolioService = inject(PortfolioService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  //Signals for reactive state
  public readonly isInitialLoading = signal<boolean>(true);
  public readonly refreshing = signal<boolean>(false);
  public readonly selectedTab = signal<number>(0);

  // Data from service
  public readonly user = this.authService.currentUser;
  public readonly portfolioSummary = this.portfolioService.portfolioSummary;
  public readonly portfolios = this.portfolioService.portfolios;
  public readonly watchlist = this.portfolioService.watchlist;

  // Computed values for display
  public readonly totalValue = computed(() => this.portfolioSummary().totalValue);
  public readonly totalGainLossPercent = computed(() => this.portfolioSummary().totalGainLossPercent);
  public readonly totalGainLoss = computed(() => this.portfolioSummary().totalGainLoss);
  public readonly isPositiveGainLoss = computed(() => this.totalGainLoss() >= 0);
  public readonly hasData = computed(() => this.portfolios().length > 0);

  // Recent activity computed
  public readonly recentPortfolios = computed(() =>
    this.portfolios()
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3));

  public readonly topPerformingPortfolios = computed(() =>
    this.portfolios()
      .slice()
      .sort((a, b) => b.totalGainLossPercent - a.totalGainLossPercent)
      .slice(0, 3)
  );

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
      takeUntil(this.destroy$)
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

  /**
   * Refresh dashboard data
   */
  refreshData(): Promise<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return Promise.resolve();

    this.refreshing.set(true);

    return new Promise((resolve) => {
      combineLatest([
        this.portfolioService.getUserPortfolios(currentUser.id),
        this.portfolioService.getUserWatchlist()
      ]).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.refreshing.set(false);
          resolve();
        },
        error: (error) => {
          this.refreshing.set(false);
          console.error('Failed to refresh data:', error);
          resolve();
        }
      });
    });
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

  /**
   * Get sector color for display
   */
  getSectorColor(sector: string): string {
    const colors: { [key: string]: string } = {
      'Technology': '#2196F3',
      'Financial Services': '#4CAF50',
      'Consumer Cyclical': '#FF9800',
      'Healthcare': '#E91E63',
      'Diversified': '#9C27B0',
      'Energy': '#F44336',
      'Real Estate': '#795548'
    };
    return colors[sector] || '#607D8B';
  }

  /**
   * Handle tab change
   */
  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  /**
   * Navigate to portfolio details
   */
  viewPortfolio(portfolio: Portfolio): void {
    // This will navigate to portfolio detail page
    this.snackBar.open(`Viewing ${portfolio.name} will be available soon`, 'Close', { duration: 3000 });
  }

  /**
   * Add stock to watchlist
   */
  addToWatchlist(): void {
    // This will open a dialog to add stocks
    this.snackBar.open('Add to watchlist feature will be available soon', 'Close', { duration: 3000 });
  }

  /**
   * Navigate to stock details
   */
  viewStock(symbol: string): void {
    // This will navigate to stock detail page
    this.snackBar.open(`Stock details for ${symbol} will be available soon`, 'Close', { duration: 3000 });
  }

  /**
   * Remove from watchlist
   */
  removeFromWatchlist(item: WatchlistItem): void {
    this.portfolioService.removeFromWatchlist(item.id).subscribe({
      next: () => {
        this.snackBar.open(`Removed ${item.symbol} from watchlist`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Failed to remove from watchlist:', error);
        this.snackBar.open('Failed to remove from watchlist', 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Track by function for ngFor performance
   */
  trackByPortfolioId(index: number, portfolio: Portfolio): string {
    return portfolio.id;
  }

  trackByWatchlistId(index: number, item: WatchlistItem): string {
    return item.id;
  }
}
