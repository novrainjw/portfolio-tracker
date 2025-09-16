import { HttpClient } from "@angular/common/http";
import { computed, inject, Injectable, signal } from "@angular/core";
import { AuthService } from "./auth.service";
import { environment } from "../../../environments/environment";
import { Broker, CreateHoldingRequest, CreatePortfolioRequest, CreateTransactionRequest, CurrencyAllocation, Holding, Portfolio, PortfolioSummary, SectorAllocation, Transaction, UpdatePortfolioRequest, WatchlistItem } from "../models/portfolio.models";
import { catchError, Observable, shareReplay, tap } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class PortfolioService {
    private readonly http = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly API_URL = environment.apiUrl;

    // Signals for reactive state management
    private readonly _portfolios = signal<Portfolio[]>([]);
    private readonly _selectedPortfolio = signal<Portfolio | null>(null);
    private readonly _holdings = signal<Holding[]>([]);
    private readonly _transactions = signal<Transaction[]>([]);
    private readonly _watchlist = signal<WatchlistItem[]>([]);
    private readonly _brokers = signal<Broker[]>([]);
    private readonly _isLoading = signal<boolean>(false);

    // public readonly signals
    public readonly portfolios = this._portfolios.asReadonly();
    public readonly selectedPortfolio = this._selectedPortfolio.asReadonly();
    public readonly holdings = this._holdings.asReadonly();
    public readonly transactions = this._transactions.asReadonly();
    public readonly watchlist = this._watchlist.asReadonly();
    public readonly brokers = this._brokers.asReadonly();
    public readonly isLoading = this._isLoading.asReadonly();

    // Computed signals
    public readonly portfolioSummary = computed(() => this.calculatePortfolioSummary());
    public readonly totalPortfolioValue = computed(() => this._portfolios().reduce((sum, p) => sum + p.totalValue, 0));
    public readonly totalGainLoss = computed(() => this._portfolios().reduce((sum, p) => sum + p.totalGainLoss, 0));
    public readonly isPositiveGainLoss = computed(() => this.totalGainLoss() >= 0);


    constructor() {
        this.loadBrokers();
    }


    // Portfolio Methods
    getUserPortfolios(userId?: string): Observable<Portfolio[]> {
        const currentUserId = userId || this.authService.currentUser()?.id;
        if (!currentUserId) {
            return new Observable(observer => observer.error('User not authenticated'));
        }

        this._isLoading.set(true);
        return this.http.get<Portfolio[]>(`${this.API_URL}/portfolios`, {
            params: { userId: currentUserId }
        }).pipe(
            tap(portfolios => {
                this._portfolios.set(portfolios);
                this._isLoading.set(false);
            }),
            catchError(error => {
                this._isLoading.set(false);
                throw error;
            }),
            shareReplay(1)
        );
    }

    getPortfolioById(id: string): Observable<Portfolio> {
        return this.http.get<Portfolio>(`${this.API_URL}/portfolios/${id}`).pipe(
            tap(portfolio => this._selectedPortfolio.set(portfolio))
        );
    }

    createPortfolio(request: CreatePortfolioRequest): Observable<Portfolio> {
        const currentUser = this.authService.currentUser();

        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        const portfolioData: Omit<Portfolio, 'id'> = {
            ...request,
            userId: currentUser.id,
            totalValue: 0,
            totalCost: 0,
            totalGainLoss: 0,
            totalGainLossPercent: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
        }

        return this.http.post<Portfolio>(`${this.API_URL}/portfolios`, portfolioData).pipe(
            tap(newPortfolio => {
                this._portfolios.update(portfolios => [...portfolios, newPortfolio]);
            })
        );
    }

    updatePortfolio(request: UpdatePortfolioRequest): Observable<Portfolio> {
        const updateData = {
            ...request,
            updatedAt: new Date().toISOString()
        };

        return this.http.put<Portfolio>(`${this.API_URL}/portfolios/${request.id}`, updateData).pipe(
            tap(updatedPortfolio => {
                this._portfolios.update(portfolios =>
                    portfolios.map(p => p.id === request.id ? updatedPortfolio : p)
                );
                if (this._selectedPortfolio()?.id === request.id) {
                    this._selectedPortfolio.set(updatedPortfolio);
                }
            })
        );
    }

    deletePortfolio(id: string): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/portfolios/${id}`).pipe(
            tap(() => {
                this._portfolios.update(portfolios => portfolios.filter(p => p.id !== id));
                if (this._selectedPortfolio()?.id === id) {
                    this._selectedPortfolio.set(null);
                }
            })
        );
    }

    // Holdings methods
    getPortfolioHoldings(portfolioId: string): Observable<Holding[]> {
        this._isLoading.set(true);
        return this.http.get<Holding[]>(`${this.API_URL}/holdings`, {
            params: { portfolioId }
        }).pipe(
            tap(holdings => {
                this._holdings.set(holdings);
                this._isLoading.set(false);
            }),
            catchError(error => {
                this._isLoading.set(false);
                throw error;
            })
        );
    }

    addHolding(request: CreateHoldingRequest): Observable<Holding> {
        const holdingData: Omit<Holding, 'id'> = {
            ...request,
            totalCost: request.quantity * request.averagePrice,
            currentValue: request.quantity * request.currentPrice,
            gainLoss: (request.quantity * request.currentPrice) - (request.quantity * request.averagePrice),
            gainLossPercent: ((request.currentPrice - request.averagePrice) / request.averagePrice) * 100,
            lastUpdated: new Date().toISOString()
        };

        return this.http.post<Holding>(`${this.API_URL}/holdings`, holdingData).pipe(
            tap(newHolding => {
                this._holdings.update(holdings => [...holdings, newHolding]);
                this.recalculatePortfolioTotals(request.portfolioId);
            })
        );
    }

    updateHolding(id: string, updates: Partial<Holding>): Observable<Holding> {
        const updateData = {
            ...updates,
            lastUpdate: new Date().toISOString()
        };

        return this.http.patch<Holding>(`${this.API_URL}/holdings/${id}`, updateData).pipe(
            tap(updatedHolding => {
                this._holdings.update(holdings =>
                    holdings.map(h => h.id === id ? updatedHolding : h)
                );
                this.recalculatePortfolioTotals(updatedHolding.portfolioId);
            })
        );
    }

    removeHolding(id: string): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/holdings/${id}`).pipe(
            tap(() => {
                const removeHolding = this._holdings().find(h => h.id === id);
                this._holdings.update(holdings => holdings.filter(h => h.id !== id));
                if (removeHolding) {
                    this.recalculatePortfolioTotals(removeHolding.portfolioId);
                }
            })
        );
    }

    // Transaction methods
    getPortfolioTransactions(portfolioId: string): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.API_URL}/transactions`, {
            params: { portfolioId }
        }).pipe(
            tap(transactions => this._transactions.set(transactions))
        );
    }

    addTransaction(request: CreateTransactionRequest): Observable<Transaction> {
        const trasnsactionData: Omit<Transaction, 'id'> = {
            ...request,
            totalAmount: (request.quantity * request.price) + request.fees
        };

        return this.http.post<Transaction>(`${this.API_URL}/transactions`, trasnsactionData).pipe(
            tap(newTransaction => {
                this._transactions.update(transactions => [...transactions, newTransaction]);
                // Update holding if exists
                if (request.holdingId) {
                    this.updateHoldingFromTransaction(request.holdingId, newTransaction);
                }
            })
        );
    }

    // Watchlist methods
    getUserWatchlist(): Observable<WatchlistItem[]> {
        const currentUser = this.authService.currentUser();
        if (!currentUser) {
            return new Observable(observer => observer.error('User not authenticated'));
        }

        return this.http.get<WatchlistItem[]>(`${this.API_URL}/watchlist`, {
            params: { userId: currentUser.id }
        }).pipe(
            tap(watchlist => this._watchlist.set(watchlist))
        );
    }

    removeFromWatchlist(id: string): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/watchlist/${id}`).pipe(
            tap(() => {
                this._watchlist.update(watchlist => watchlist.filter(w => w.id != id));
            })
        );
    }

    /**
     * Update holding from transaction - recalculate averages and totals
     * @param holdingId 
     * @param newTransaction 
     * @returns 
     */
    updateHoldingFromTransaction(holdingId: string, newTransaction: Transaction) {
        const holdings = this._holdings();
        const holdingIndex = holdings.findIndex(h => h.id === holdingId);

        if (holdingIndex === -1) return;

        const holding = { ...holdings[holdingIndex] };

        // Get all transactions for this holding
        const holdingTransactions = this._transactions().filter(t => t.holdingId === holdingId);

        // Recalculate quantity and average price based on all transactions
        let totalQuantity = 0;
        let totalCost = 0;

        holdingTransactions.forEach(transaction => {
            if (transaction.type === 'buy') {
                totalQuantity += transaction.quantity;
                totalCost += transaction.quantity * transaction.price;
            } else if (transaction.type === 'sell') {
                totalQuantity -= transaction.quantity;
                // For sells, we don't adjust the average cost basis of remaining shares
            }
            // Dividend transactions don't affect quantity or cost basis
        });

        // Update holding with recalculated values
        if (totalQuantity > 0) {
            holding.quantity = totalQuantity;
            holding.averagePrice = totalCost / totalQuantity;
            holding.totalCost = totalCost;
            holding.currentValue = totalQuantity * holding.currentPrice;
            holding.gainLoss = holding.currentValue - holding.totalCost;
            holding.gainLossPercent = holding.totalCost > 0 ? (holding.gainLoss / holding.totalCost) * 100 : 0;
            holding.lastUpdated = new Date().toISOString();

            // Update the holdings array
            const updatedHoldings = [...holdings];
            updatedHoldings[holdingIndex] = holding;
            this._holdings.set(updatedHoldings);

            // Recalculate portfolio totals
            this.recalculatePortfolioTotals(holding.portfolioId);
        } else {
            // If quantity becomes 0 or negative, remove the holding
            this.removeHolding(holdingId).subscribe();
        }
    }

    /**
     * Recalculate portfolio totals based on current holdings
     * @param portfolioId 
     * @returns 
     */
    recalculatePortfolioTotals(portfolioId: string) {
        const portfolios = this._portfolios();
        const portfolioIndex = portfolios.findIndex(p => p.id === portfolioId);

        if (portfolioIndex === -1) return;

        const portfolio = { ...portfolios[portfolioIndex] };
        const portfolioHoldings = this._holdings().filter(h => h.portfolioId === portfolioId);

        // Calculate new totals
        const totalValue = portfolioHoldings.reduce((sum, h) => sum + h.currentValue, 0);
        const totalCost = portfolioHoldings.reduce((sum, h) => sum + h.totalCost, 0);
        const totalGainLoss = totalValue - totalCost;
        const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

        // Update portfolio
        portfolio.totalValue = totalValue;
        portfolio.totalCost = totalCost;
        portfolio.totalGainLoss = totalGainLoss;
        portfolio.totalGainLossPercent = totalGainLossPercent;
        portfolio.updatedAt = new Date().toISOString();

        // Update the portfolios array
        const updatedPortfolios = [...portfolios];
        updatedPortfolios[portfolioIndex] = portfolio;
        this._portfolios.set(updatedPortfolios);

        // Update selected portfolio if it's the same one
        if (this._selectedPortfolio()?.id === portfolioId) {
            this._selectedPortfolio.set(portfolio);
        }
    }

    calculatePortfolioSummary(): PortfolioSummary {
        const portfolios = this._portfolios();
        const holdings = this._holdings();

        const totalValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0);
        const totalCost = portfolios.reduce((sum, p) => sum + p.totalCost, 0);
        const totalGainLoss = totalValue - totalCost;
        const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

        const topGainer = holdings.length > 0
            ? holdings.reduce((prev, current) =>
                prev.gainLossPercent > current.gainLossPercent ? prev : current
            )
            : undefined;

        const topLoser = holdings.length > 0
            ? holdings.reduce((prev, current) =>
                prev.gainLossPercent < current.gainLossPercent ? prev : current
            )
            : undefined;

        // Calculate sector allocation
        const sectorMap = new Map<string, { value: number; count: number }>();
        holdings.forEach(holding => {
            const existing = sectorMap.get(holding.sector) || { value: 0, count: 0 };
            sectorMap.set(holding.sector, {
                value: existing.value + holding.currentValue,
                count: existing.count + 1
            });
        });

        const sectorAllocation: SectorAllocation[] = Array.from(sectorMap.entries()).map(([sector, data]) => ({
            sector,
            value: data.value,
            percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
            count: data.count
        }));

        // Calculate currency allocation
        const currencyMap = new Map<string, number>();
        portfolios.forEach(portfolio => {
            const existing = currencyMap.get(portfolio.currency) || 0;
            currencyMap.set(portfolio.currency, existing + portfolio.totalValue);
        });

        const currencyAllocation: CurrencyAllocation[] = Array.from(currencyMap.entries()).map(([currency, value]) => ({
            currency: currency as 'USD' | 'CAD',
            value,
            percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
        }));

        return {
            totalValue,
            totalCost,
            totalGainLoss,
            totalGainLossPercent,
            portfolioCount: portfolios.length,
            holdingCount: holdings.length,
            topGainer,
            topLoser,
            sectorAllocation,
            currencyAllocation
        };
    }

    // loadBrokers(): Observable<Broker[]> {
    //     return this.http.get<Broker[]>(`${this.API_URL}/brokers`).pipe(
    //         tap(brokers=> this._brokers.set(brokers))
    //     );
    // }

    loadBrokers(): void {
        this.http.get<Broker[]>(`${this.API_URL}/brokers`).subscribe(brokers => this._brokers.set(brokers));
    }

//     /**
//  * Add stock to watchlist
//  */
//     addToWatchlist(request: CreateWatchlistRequest): Observable<WatchlistItem> {
//         const currentUser = this.authService.currentUser();
//         if (!currentUser) {
//             return new Observable(observer => observer.error('User not authenticated'));
//         }

//         const watchlistData: Omit<WatchlistItem, 'id'> = {
//             userId: currentUser.id,
//             symbol: request.symbol.toUpperCase(),
//             companyName: request.companyName,
//             currentPrice: request.currentPrice,
//             changePercent: request.changePercent,
//             addedDate: new Date().toISOString()
//         };

//         return this.http.post<WatchlistItem>(`${this.API_URL}/watchlist`, watchlistData).pipe(
//             tap(newItem => {
//                 this._watchlist.update(watchlist => [...watchlist, newItem]);
//             })
//         );
//     }
}