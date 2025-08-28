export interface Portfolio {
    id: string;
    name: string;
    description: string;
    userId: string;
    broker: string;
    currency: 'USD' | 'CAD';
    totalValue: number;
    totalCost: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
}

export interface CreatePortfolioRequest {
    name: string;
    description: string;
    broker: string;
    currency: 'USD' | 'CAD';
}

export interface UpdatePortfolioRequest extends Partial<CreatePortfolioRequest> {
    id: string;
}

export interface Holding {
    id: string;
    portfolioId: string;
    symbol: string;
    companyName: string;
    type: 'stock' | 'etf';
    market: string;
    currency: 'USD' | 'CAD';
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    totalCost: number;
    currentValue: number;
    gainLoss: number;
    gainLossPercent: number;
    sector: string;
    purchaseDate: string;
    lastUpdated: string;
}

export interface CreateHoldingRequest {
    portfolioId: string;
    symbol: string;
    companyName: string;
    type: 'stock' | 'etf';
    market: string;
    currency: 'USD' | 'CAD';
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    sector: string;
    purchaseDate: string;
}

export interface Transaction {
    id: string;
    portfolioId: string;
    holdingId: string;
    type: 'buy' | 'sell' | 'dividend';
    symbol: string;
    quantity: number;
    price: number;
    totalAmount: number;
    fees: number;
    currency: 'USD' | 'CAD';
    transactionDate: string;
    notes?: string;
}

export interface CreateTransactionRequest {
    portfolioId: string;
    // holdingId?: string;
    holdingId: string;
    type: 'buy' | 'sell' | 'dividend';
    symbol: string;
    quantity: number;
    price: number;
    fees: number;
    currency: 'USD' | 'CAD';
    transactionDate: string;
    notes?: string;
}

export interface WatchlistItem {
    id: string;
    userId: string;
    symbol: string;
    companyName: string;
    currentPrice: number;
    changePercent: number;
    addedDate: string;
}

export interface CreateWatchlistRequest {
    symbol: string;
    companyName: string;
    currentPrice: number;
    changePercent: number;
}

export interface Broker {
    id: string;
    name: string;
    type: 'discount' | 'full-service' | 'professional' | 'commission-free';
    country: 'Canada' | 'USA';
    supportedCurrencies: ('USD' | 'CAD' | 'EUR' | 'GBP')[];
    tradingFee: number;
    minTradingFee: number;
    maxTradingFee: number;
}

// Portfolio summary interfaces
export interface PortfolioSummary {
    totalValue: number;
    totalCost: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    portfolioCount: number;
    holdingCount: number;
    topGainer?: Holding;
    topLoser?: Holding;
    sectorAllocation: SectorAllocation[];
    currencyAllocation: CurrencyAllocation[];
}

export interface SectorAllocation {
    sector: string;
    value: number;
    percentage: number;
    count: number;
}

export interface CurrencyAllocation {
    currency: 'USD' | 'CAD';
    value: number;
    percentage: number;
}

// Chart data interfaces
export interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

export interface ChartDataset {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
}

// Filter and search interfaces
export interface PortfolioFilter {
    userId?: string;
    broker?: string;
    currency?: 'USD' | 'CAD';
    isActive?: boolean;
    sortBy?: 'name' | 'totalValue' | 'totalGainLoss' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

export interface HoldingFilter {
    portfolioId?: string;
    type?: 'stock' | 'etf';
    sector?: string;
    currency?: 'USD' | 'CAD';
    sortBy?: 'symbol' | 'currentValue' | 'gainLossPercent';
    sortOrder?: 'asc' | 'desc';
}

export interface TransactionFilter {
    portfolioId?: string;
    holdingId?: string;
    type?: 'buy' | 'sell' | 'dividend';
    symbol?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'transactionDate' | 'totalAmount';
    sortOrder?: 'asc' | 'desc';
}

// API Response interfaces
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Validation interfaces
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

export interface ApiError {
    message: string;
    errors?: ValidationError[];
    statusCode: number;
}
