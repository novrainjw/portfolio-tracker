import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PortfolioService } from '../service/portfolio.service';
import { HoldingListComponent } from "../holding-list/holding-list.component";

@Component({
  selector: 'app-portfolio-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatTableModule,
    CurrencyPipe,
    DatePipe,
    RouterModule,
    HoldingListComponent
],
  templateUrl: './portfolio-detail.component.html',
  styleUrls: ['./portfolio-detail.component.scss']
})
export class PortfolioDetailComponent {
  portfolioService = inject(PortfolioService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  portfolioId = signal<string | null>(null);
  portfolio = computed(() => {
    const id = this.portfolioId();
    return id ? this.portfolioService.getPortfolioById(id) : null;
  });

  holdings = computed(() => {
    const portfolio = this.portfolio();
    return portfolio
      ? this.portfolioService.holdings().filter(h => h.portfolioId === portfolio.id)
      : [];
  });

  holdingColumns = ['symbol', 'name', 'quantity', 'avgPrice', 'currentPrice', 'value', 'gainLoss'];

  portfolioSummary = computed(() => {
    const holdings = this.holdings();
    let totalValue = 0;
    let totalCost = 0;

    holdings.forEach(h => {
      totalValue += h.quantity * h.currentPrice;
      totalCost += h.quantity * h.averagePrice;
    });

    const totalGainLoss = totalValue - totalCost;
    const gainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      gainLossPercentage
    };
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.portfolioId.set(params['id']);
    });
  }

  addHolding(): void {
    this.router.navigate(['/holdings/new'], {
      queryParams: { portfolioId: this.portfolioId() }
    });
  }
}
