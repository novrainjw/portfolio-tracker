import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { PortfolioService } from '../service/portfolio.service';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-portfolio-list',
  imports: [MatCardModule, MatIconModule, MatTableModule, MatButtonModule, RouterLink, DatePipe],
  templateUrl: './portfolio-list.component.html',
  styleUrl: './portfolio-list.component.scss'
})
export class PortfolioList {
  private portfolioService = inject(PortfolioService);

  portfolios = this.portfolioService.portfolios;
  displayedColumns = ['name', 'broker', 'currency', 'createdDate', 'actions'];

  deletePortfolio(id: string): void {
    if (confirm('Are you sure you want to delete this portfolio? All holdings will be deleted.')) {
      this.portfolioService.deletePortfolio(id);
    }
  }
}
