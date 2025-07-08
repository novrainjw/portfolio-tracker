import { Injectable, signal } from "@angular/core";
import { Holding, Portfolio, PortfolioSummary } from "../models/portfolio.model";

@Injectable({
    providedIn: 'root'
})
export class PortfolioService {
    // signals for state management
    portfolios = signal<Portfolio[]>([]);
    holdings = signal<Holding[]>([]);
    summary = signal<PortfolioSummary>({
        totalValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        gainLossPercentage: 0
    });

    constructor() {
        this.loadDummyData();
        this.calculateSummary();
    }

    private loadDummyData(): void {
        // Dummy portfolios
        this.portfolios.set([
            {
                id: '1',
                name: 'RRSP Account',
                broker: 'Questrade',
                currency: 'USD',
                createdDate: new Date('2022-01-15')
            },
            {
                id: '2',
                name: 'TFSA Account',
                broker: 'Wealthsimple',
                currency: 'CAD',
                createdDate: new Date('2021-11-03')
            },
            {
                id: '3',
                name: 'Personal Account',
                broker: 'Interactive Brokers',
                currency: 'USD',
                createdDate: new Date('2023-02-20')
            }
        ]);

        // Dummy holdings
        this.holdings.set([
            // RRSP Holdings (USD)
            { id: '101', portfolioId: '1', symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', quantity: 25, averagePrice: 220.50, currentPrice: 250.75, currency: 'USD', type: 'ETF' },
            { id: '102', portfolioId: '1', symbol: 'MSFT', name: 'Microsoft Corporation', quantity: 10, averagePrice: 300.25, currentPrice: 420.50, currency: 'USD', type: 'STOCK' },
            { id: '103', portfolioId: '1', symbol: 'AAPL', name: 'Apple Inc.', quantity: 15, averagePrice: 150.75, currentPrice: 175.25, currency: 'USD', type: 'STOCK' },

            // TFSA Holdings (CAD)
            { id: '201', portfolioId: '2', symbol: 'XEQT', name: 'iShares Core Equity ETF', quantity: 100, averagePrice: 25.80, currentPrice: 28.50, currency: 'CAD', type: 'ETF' },
            { id: '202', portfolioId: '2', symbol: 'ENB', name: 'Enbridge Inc.', quantity: 50, averagePrice: 48.25, currentPrice: 52.75, currency: 'CAD', type: 'STOCK' },

            // Personal Account Holdings (USD)
            { id: '301', portfolioId: '3', symbol: 'QQQ', name: 'Invesco QQQ Trust', quantity: 20, averagePrice: 350.40, currentPrice: 425.25, currency: 'USD', type: 'ETF' },
            { id: '302', portfolioId: '3', symbol: 'GOOGL', name: 'Alphabet Inc.', quantity: 5, averagePrice: 125.75, currentPrice: 145.30, currency: 'USD', type: 'STOCK' }
        ]);
    }

    private calculateSummary(): void {
        // have to excute signal to get the result, add () to excute signal
        const holdings = this.holdings();
        let totalValue = 0;
        let totalCost = 0;

        holdings.forEach(holding => {
            totalValue += holding.quantity * holding.currentPrice;
            totalCost += holding.quantity * holding.averagePrice;
        });

        const totalGainLoss = totalValue - totalCost;
        const gainLossPercentage = totalCost > 0 ? totalGainLoss / totalCost : 0;

        this.summary.set({
            totalValue: totalValue,
            totalCost: totalCost,
            totalGainLoss: totalGainLoss,
            gainLossPercentage: gainLossPercentage
        });
    }
}