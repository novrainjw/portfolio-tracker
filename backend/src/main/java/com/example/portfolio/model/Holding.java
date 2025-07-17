package com.example.portfolio.model;

import lombok.Data;

@Data
public class Holding {
    private String symbol;
    private String name;
    private Integer quantity;
    private Double purchasePrice;
    private Double currentPrice;
}
