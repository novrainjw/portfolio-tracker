import { Component, computed, inject, OnInit, signal, Signal } from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, Router } from "@angular/router";
import { combineLatest, Subject, switchMap, takeUntil } from "rxjs";
import { PortfolioService } from "../../core/services/portfolio.service";
import { AuthService } from "../../core/services/auth.service";
import { Holding, Portfolio, Transaction } from "../../core/models/portfolio.models";
import { MatChipsModule } from "@angular/material/chips";
import { MatMenuModule } from "@angular/material/menu";
import { DatePipe, DecimalPipe } from "@angular/common";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { CreatePortfolioDialogComponent } from "./create-portfolio-dialog.component";
import { MatCardModule } from "@angular/material/card";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTableModule } from "@angular/material/table";
import { AddHoldingDialogComponent } from "./add-holding-dialog.component";

@Component({
    selector: 'app-portfolio-detail',
    standalone: true,
    imports: [DatePipe,
        MatProgressSpinnerModule,
        MatIconModule,
        MatChipsModule,
        MatMenuModule,
        MatSnackBarModule,
        MatDialogModule,
        MatCardModule,
        MatTableModule,
        MatTabsModule,
        DecimalPipe],
    templateUrl: './portfolio-detail.component.html',
    styleUrl: 'portfolio-detail.component.scss'
})
export class PortfolioDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly portfolioService = inject(PortfolioService);
    private readonly authService = inject(AuthService);
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);
    private readonly destroy$ = new Subject<void>();

    // Signals for reactive state
    public readonly isLoading = signal<boolean>(false);
    public readonly error = signal<string | null>(null);
    public readonly portfolio = signal<Portfolio | null>(null);
    public readonly holdings = signal<Holding[]>([]);
    public readonly transactions = signal<Transaction[]>([]);
    public readonly selectedTab = signal<number>(0);

    // Table columns
    public readonly holdingsColumns = ['symbol', 'companyName', 'quantity', 'averagePrice', 'currentPrice', 'currentValue', 'gainLoss', 'actions'];
    public readonly transactionsColumns = ['transactionDate', 'type', 'symbol', 'quantity', 'price', 'totalAmount', 'notes'];

    // Computed values
    public readonly isOwner = computed(() => {
        const currentUser = this.authService.currentUser();
        const portfolio = this.portfolio();
        return currentUser?.id === portfolio?.userId;
    });
    public readonly holdingsSummary = computed(() => {
        const holdingsList = this.holdings();
        const totalValue = holdingsList.reduce((sum, h) => sum + h.currentValue, 0);
        const totalCost = holdingsList.reduce((sum, h) => sum + h.totalCost, 0);
        const totalGainLoss = totalValue - totalCost;
        const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

        return {
            totalValue,
            totalCost,
            totalGainLoss,
            totalGainLossPercent,
            count: holdingsList.length
        };
    });
    public readonly sectorAllocation = computed(() => {
        const holdingsList = this.holdings();
        const sectorMap = new Map<string, { value: number; count: number }>();

        holdingsList.forEach(holding => {
            const existing = sectorMap.get(holding.sector) || { value: 0, count: 0 };
            sectorMap.set(holding.sector, {
                value: existing.value + holding.currentValue,
                count: existing.count + 1
            });
        });

        const totalValue = this.holdingsSummary().totalValue;
        return Array.from(sectorMap.entries()).map(([sector, data]) => ({
            sector,
            value: data.value,
            percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
            count: data.count
        })).sort((a, b) => b.value - a.value);
    });

    ngOnInit(): void {
        this.loadPortfolioData();
    }

    //TODO computed(()=>) vs computed(()=>{})
    public readonly topHoldings = computed(() =>
        this.holdings()
            .slice()
            .sort((a, b) => b.currentValue - a.currentValue)
            .slice(0, 5)
    );

    /**
     * Refresh portfolio data
     */
    refreshData(): void {
        this.loadPortfolioData();
    }

    /**
     * Load portfolio data based on route parameter
     */
    loadPortfolioData(): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.route.params.pipe(
            switchMap(params => {
                const portfolioId = params['id'];
                if (!portfolioId) {
                    throw new Error('Portfolio ID is required');
                }

                // Load portfolio details and related data
                return combineLatest([
                    this.portfolioService.getPortfolioById(portfolioId),
                    this.portfolioService.getPortfolioHoldings(portfolioId),
                    this.portfolioService.getPortfolioTransactions(portfolioId)
                ]);
            }),
            takeUntil(this.destroy$)
        ).subscribe({
            next: ([portfolio, holdings, transactions]) => {
                // Verify user has access to this portfolio
                const currentUser = this.authService.currentUser();

                if (!currentUser || portfolio.userId !== currentUser.id) {
                    console.info('portfolio.userId: ' + portfolio.userId);
                    console.info('currentUser.id: ' + currentUser?.id);
                    this.error.set('You do not have access to this portfolio');
                    this.isLoading.set(false);
                    return;
                }

                this.portfolio.set(portfolio);
                this.holdings.set(holdings);
                this.transactions.set(transactions);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Failed to load portfolio:', error);
                this.error.set('Failed to load portfolio. Please try again.');
                this.isLoading.set(false);
            }
        });
    }

    /**
     * Edit portfolio
     */
    editPortfolio(): void {
        const portfolio = this.portfolio;
        if (!portfolio) return;

        const dialogRef = this.dialog.open(CreatePortfolioDialogComponent, {
            width: '600px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            disableClose: true,
            autoFocus: true,
            restoreFocus: true,
            data: {
                mode: 'edit',
                portfolio: portfolio
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result)
                // Portfolio was updated successfully, refresh data
                this.refreshData();
        });
    }

    /**
     * Delete portfolio with confirmation
     */
    deletePortfolio(): void {
        const portfolio = this.portfolio();
        if (!portfolio) return;

        const confirmed = confirm(`Are you sure you want to delete "${portfolio.name}"? This action cannot be undone.`);
        if (!confirmed) return;

        this.portfolioService.deletePortfolio(portfolio.id).subscribe({
            next: () => {
                this.snackBar.open(`Portfolio "${portfolio.name}" deleted successfully`, 'Close', {
                    duration: 5000,
                    panelClass: 'success-snackbar'
                });
                this.router.navigate(['/dashboard']);
            },
            error: (error) => {
                console.error('Failed to delete portfolio:', error);
                this.snackBar.open('Failed to delete portfolio. Please try again.', 'Close', {
                    duration: 5000,
                    panelClass: 'error-snackbar'
                });
            }
        });
    }

    /**
     * Handle tab change
     */
    goBack(): void {
        this.router.navigate(['/dashboard']);
    }

    /**
     * Format currency with proper symbol
     * @param amount 
     * @param currency 
     */
    formatCurrency(amount: number, currency: 'USD' | 'CAD'): string {
        const symbol = currency === 'CAD' ? 'CA$' : '$';
        return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    /**
     * Format percentage
     * @param percent 
     * @returns 
     */
    formatPercentage(percent: number): string {
        const sign = percent >= 0 ? '+' : '';
        return `${sign}${percent.toFixed(2)}%`;
    }

    /**
     * Get performance class for styling
     * @param gainLossPercent 
     * @returns 
     */
    getPerformanceClass(gainLossPercent: number): string {
        if (gainLossPercent > 0) return 'positive';
        if (gainLossPercent < 0) return 'negative';
        return 'neutral';
    }

    /**
     * Add new holding
     */
    addHolding(): void {
        const portfolio = this.portfolio();
        if (!portfolio) return;

        const dialogRef = this.dialog.open(AddHoldingDialogComponent, {
            width: '700px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            disableClose: true,
            autoFocus: true,
            restoreFocus: true,
            data: {
                mode: 'add',
                portfolio: portfolio
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Holding was added successfully, refresh data
                this.refreshData();

                // Show success message
                this.snackBar.open(
                    `${result.symbol} added to portfolio successfully!`,
                    'Close',
                    {
                        duration: 5000,
                        panelClass: 'success-snackbar'
                    }
                );
            }
        });
    }

    /**
     * Edit holding
     * @param holding 
     */
    editHolding(holding: Holding): void {
        const portfolio = this.portfolio();
        if (!portfolio) return;

        const dialogRef = this.dialog.open(AddHoldingDialogComponent, {
            width: '700px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            disableClose: true,
            autoFocus: true,
            restoreFocus: true,
            data: {
                mode: 'edit',
                portfolio: portfolio,
                holding: holding
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Holding was updated successfully, refresh data
                this.refreshData();

                // Show success message
                this.snackBar.open(
                    `${result.symbol} updated successfully!`,
                    'Close',
                    {
                        duration: 5000,
                        panelClass: 'success-snackbar'
                    }
                );
            }
        });
    }

    /**
     * Remove holding
     * @param holding 
     * @returns 
     */
    removeHolding(holding: Holding): void {
        const confirmed = confirm(`Are you sure you want to remove ${holding.symbol} from this portfolio?`);
        if (!confirmed) return;

        this.portfolioService.removeHolding(holding.id).subscribe({
            next: () => {
                this.snackBar.open(`${holding.symbol} removed from portfolio`, 'Close', { duration: 3000 });
                this.refreshData();
            },
            error: (error) => {
                console.error('Failed to remove holding:', error);
                this.snackBar.open('Failed to remove holding. Please try again.', 'Close', { duration: 3000 });
            }
        });
    }

    /**
     * Track by function for ngFor performance
     * @param index 
     * @param holding 
     * @returns 
     */
    trackByHoldingId(index: number, holding: Holding): string {
        return holding.id;
    }

    /**
     * Handle tab change
     * @param index 
     */
    onTabChange(index: number): void {
        this.selectedTab.set(index);
    }
}