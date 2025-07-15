import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PortfolioService } from '../service/portfolio.service';
import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Holding } from '../models/portfolio.model';

@Component({
  selector: 'app-holding-list',
  imports: [RouterModule, MatIconModule, MatTableModule, CurrencyPipe, DecimalPipe, PercentPipe, CommonModule],
  templateUrl: './holding-list.component.html',
  styleUrl: './holding-list.component.scss'
})
export class HoldingListComponent {
  private portfolioService = inject(PortfolioService);
  private route = inject(ActivatedRoute);

  portfolioId = this.route.snapshot.paramMap.get('id');

  holdings = computed(() => { // return are needed or use without{}
    return this.portfolioId ? this.portfolioService.getHoldingsByPortfolio(this.portfolioId) : []
  });

  displayedColumns = ['symbol', 'name', 'quantity', 'avgPrice', 'currentPrice', 'value', 'gainLoss', 'actions'];

  deleteHolding(id: string): void {
    if (confirm('Are you sure you want to delete this holding?')) {
      this.portfolioService.deleteHolding(id);
    }
  }

  getGainLoss(holding: Holding): number {
    return (holding.currentPrice - holding.averagePrice) * holding.quantity;
  }

  getGainLossPercent(holding: Holding): number {
    return (holding.currentPrice - holding.averagePrice) / holding.averagePrice;
  }

}
