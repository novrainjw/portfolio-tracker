import { Injectable, signal } from "@angular/core";
import { Holding, Portfolio, PortfolioCreateDto, PortfolioSummary } from "../models/portfolio.model";
import { DummyDataPortfolio, DummyHolding } from "../models/dummy-data";
import { v4 as uuidv4 } from 'uuid';

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
        this.portfolios.set(DummyDataPortfolio);

        // Dummy holdings
        this.holdings.set(DummyHolding);
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

    addPortfolio(portfolio: PortfolioCreateDto): Portfolio {
        const newPortfolio: Portfolio = {
            ...portfolio,
            id: uuidv4(),
            createdDate: new Date()
        };

        this.portfolios.update(portfolio => [...portfolio, newPortfolio]);
        return newPortfolio;
    }

    updatePortfolio(id: string, update: Partial<PortfolioCreateDto>): Portfolio | null {
        let updated: Portfolio | null = null;

        this.portfolios.update(portfolios => {
            return portfolios.map((item) => {
                if (item.id === id) {
                    updated = { ...item, ...update };
                    return updated;
                }
                return item;
            });
        });

        return updated;
    }

    deletePortfolio(id: string): void {
        this.portfolios.update(portfolios => portfolios.filter(p => p.id !== id));

        // Also remove associated holdings
        this.holdings.update(holdings => holdings.filter(h => h.portfolioId !== id));
        this.calculateSummary();
    }

    getPortfolioById(id: string): Portfolio | undefined {
        return this.portfolios().find(p => p.id === id);
    }
}