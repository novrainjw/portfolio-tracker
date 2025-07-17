package com.example.portfolio.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.portfolio.model.Portfolio;
import com.example.portfolio.repository.PortfolioRepository;
import com.example.portfolio.service.PortfolioService;

@Service
public class PortfolioServiceImpl implements PortfolioService {
    private final PortfolioRepository portfolioRepository;

    public PortfolioServiceImpl(PortfolioRepository portfolioRepository) {
        this.portfolioRepository = portfolioRepository;
    }

    @Override
    public List<Portfolio> getAllPortfolios() {
        return portfolioRepository.findAll();
    }

    @Override
    public Portfolio getPortfolioById(String id) {
        return portfolioRepository.findById(id).orElseThrow(() -> new RuntimeException("Portfolio not found"));
    }

    @Override
    public Portfolio createPortfolio(Portfolio portfolio) {
        return portfolioRepository.save(portfolio);
    }

    @Override
    public Portfolio updatePortfolio(String id, Portfolio portfolio) {
        portfolio.setId(id);
        return portfolioRepository.save(portfolio);
    }

    @Override
    public void deletePortfolio(String id) {
        portfolioRepository.deleteById(id);
    }

}
