import { Component, inject } from '@angular/core';
import { MatCardModule } from "@angular/material/card";
import { PortfolioService } from '../service/portfolio.service';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-holding-form',
  imports: [MatCardModule, MatFormFieldModule, CommonModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './holding-form.component.html',
  styleUrl: './holding-form.component.scss'
})
export class HoldingFormComponent {
  private portfolioService = inject(PortfolioService);
  private route = inject(ActivatedRoute);

  isEditMode = false;

  portfolioId = this.route.snapshot.paramMap.get('portfolioId');

  holdingForm = new FormGroup({
    symbol: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    quantity: new FormControl(1, [Validators.required, Validators.min(0.0001)]),
    averagePrice: new FormControl(0, [Validators.required, Validators.min(0.0001)]),
    currency: new FormControl<'USD' | 'CAD'>('USD', [Validators.required]),
    type: new FormControl<'STOCK' | 'ETF'>('STOCK', [Validators.required])
  });

  onSubmit(): void {

  }

  onCancel(): void {

  }
}
