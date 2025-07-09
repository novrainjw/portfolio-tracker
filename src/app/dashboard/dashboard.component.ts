import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { PortfolioService } from '../service/portfolio.service';
import { CurrencyPipe, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule,
    MatGridListModule,
    MatListModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule, 
    CurrencyPipe, 
    PercentPipe, 
    DatePipe,
    DecimalPipe,
    RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class Dashboard {
  private portfolioService = inject(PortfolioService);
  summary = this.portfolioService.summary;
  portfolio = this.portfolioService.portfolios;
  holdings = this.portfolioService.holdings;

  // Portfolio list table columns
  portfolioColumns = ['name', 'broker', 'createdDate', 'actions'];

  // Holding table columns
  holdingColumns = ['symbol', 'name', 'quantity', 'avgPrice', 'currentPrice', 'gainLoss'];
}
