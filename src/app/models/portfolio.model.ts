export interface Portfolio {
    id: string;
    name: string;
    broker: string;
    currency: 'USD' | 'CAD';
    createdDate: Date;
    description?: string;
}

export interface PortfolioCreateDto {
    name: string,
    broker: string,
    currency: 'USD' | 'CAD';
    description?: string;
}

export interface Holding {
    id: string;
    portfolioId: string;
    symbol: string;
    name: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    currency: 'USD' | 'CAD';
    type: 'STOCK' | 'ETF';
}

export interface PortfolioSummary {
    totalValue: number;
    totalCost: number;
    totalGainLoss: number;
    gainLossPercentage: number;
}
