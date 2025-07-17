package com.example.portfolio.service;

import java.util.List;

import com.example.portfolio.model.Portfolio;

public interface PortfolioService {
    List<Portfolio> getAllPortfolios();

    Portfolio getPortfolioById(String id);

    Portfolio createPortfolio(Portfolio portfolio);

    Portfolio updatePortfolio(String id, Portfolio portfolio);

    void deletePortfolio(String id);
}
