package com.example.portfolio.model;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "portfolios")
public class Portfolio {
    @Id
    private String id;
    private String name;
    private String description;
    private Double totalValue;
    private List<Holding> holdings;
}
