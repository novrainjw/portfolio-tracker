package com.example.portfolio.util;

import com.example.portfolio.model.Portfolio;
import com.example.portfolio.repository.PortfolioRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.List;

@Component
public class DataInitializer {

    private final PortfolioRepository portfolioRepository;

    public DataInitializer(PortfolioRepository portfolioRepository) {
        this.portfolioRepository = portfolioRepository;
    }

    @PostConstruct
    public void init() throws IOException {
        if (portfolioRepository.count() == 0) {
            ObjectMapper mapper = new ObjectMapper();
            ClassPathResource resource = new ClassPathResource("data/portfolios.json");
            List<Portfolio> portfolios = mapper.readValue(
                    resource.getInputStream(),
                    new TypeReference<>() {
                    });
            portfolioRepository.saveAll(portfolios);
        }
    }
}
