package com.example.portfolio.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.portfolio.model.Portfolio;

public interface PortfolioRepository extends MongoRepository<Portfolio, String> {

}
