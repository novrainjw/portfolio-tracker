import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { PortfolioService } from '../service/portfolio.service';
import { PortfolioCreateDto } from '../models/portfolio.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-portfolio-form',
  imports: [MatCardModule, MatFormFieldModule, ReactiveFormsModule, CommonModule, MatInputModule, MatSelectModule, MatIconModule],
  templateUrl: './portfolio-form.component.html',
  styleUrl: './portfolio-form.component.scss'
})
export class PortfolioForm implements OnInit {
  portfolioService = inject(PortfolioService);
  router = inject(Router)
  route = inject(ActivatedRoute);

  isEditMode = signal<boolean>(false);
  portfolioId = signal<string | null>(null);

  portfolioForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    broker: new FormControl('', [Validators.required]),
    currency: new FormControl<'USD' | 'CAD'>('USD', [Validators.required]),
    description: new FormControl('')
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.portfolioId.set(params['id']);
        const portfolio = this.portfolioService.getPortfolioById(params['id']);

        if (portfolio) {
          this.portfolioForm.patchValue({
            name: portfolio.name,
            broker: portfolio.broker,
            currency: portfolio.currency,
            description: portfolio.description || ''
          });
        }
      }
    });
  }

  onSubmit(): void {
    if (this.portfolioForm.invalid)
      return;

    // Type Assertions
    const formData = this.portfolioForm.value as PortfolioCreateDto;

    if (this.isEditMode() && this.portfolioId()) {
      this.portfolioService.updatePortfolio(this.portfolioId()!, formData);
    } else {
      this.portfolioService.addPortfolio(formData);
    }

    this.router.navigate(['/portfolios']);
  }
}
