import { HttpClient } from "@angular/common/http";
import { computed, inject, Injectable, signal } from "@angular/core";
import { AuthService } from "./auth.service";
import { environment } from "../../../environments/environment";
import { Broker, CreateHoldingRequest, CreatePortfolioRequest, CreateTransactionRequest, Holding, Portfolio, Transaction, UpdatePortfolioRequest, WatchlistItem } from "../models/portfolio.models";
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

    constructor() {
        this.loadBrokers();
    }

    // Portfolio Methods
    getUserPortfolios(userId?: string): Observable<Portfolio[]> {
        const currentUserId = userId || this.authService.currentUser()?.id;
        if (!currentUserId) {
            return new Observable(observer => observer.error('User not authenticated'));
        }

        this._isLoading();
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
        const currentUser = this.authService.currentUser;

        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        const portfolioData: Omit<Portfolio, 'id'> = {
            ...request,
            userId: currentUser.name,
            totalValue: 0,
            totalCost: 0,
            totalGainLoss: 0,
            totalGainLossPercent: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
        };

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
    

    updateHoldingFromTransaction(holdingId: string, newTransaction: Transaction) {
        throw new Error("Method not implemented.");
    }

    recalculatePortfolioTotals(portfolioId: string) {
        throw new Error("Method not implemented.");
    }
}