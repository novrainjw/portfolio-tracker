import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from "@angular/material/card";
import { PortfolioService } from '../service/portfolio.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { HoldingCreateDto } from '../models/portfolio.model';

@Component({
  selector: 'app-holding-form',
  imports: [MatCardModule, MatFormFieldModule, CommonModule, MatSelectModule, ReactiveFormsModule, MatInputModule],
  templateUrl: './holding-form.component.html',
  styleUrl: './holding-form.component.scss'
})
export class HoldingFormComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  isEditMode = false;
  portfolioId = this.route.snapshot.paramMap.get('portfolioId');
  holdingId: string | null = null;

  holdingForm = new FormGroup({
    portfolioId: new FormControl('', [Validators.required]), // Add portfolioId to form
    symbol: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    quantity: new FormControl(1, [Validators.required, Validators.min(0.0001)]),
    averagePrice: new FormControl(0, [Validators.required, Validators.min(0.0001)]),
    currency: new FormControl<'USD' | 'CAD'>('USD', [Validators.required]),
    type: new FormControl<'STOCK' | 'ETF'>('STOCK', [Validators.required])
  });

  ngOnInit(): void {
    // const holdingId = this.route.snapshot.paramMap.get('id');

    // if (holdingId) {
    //   this.isEditMode = true;
    //   this.holdingId = holdingId;

    //   const holding = this.portfolioService.getHoldingById(holdingId);

    //   if (holding) {
    //     this.holdingForm.patchValue({
    //       symbol: holding.symbol,
    //       name: holding.name,
    //       quantity: holding.quantity,
    //       averagePrice: holding.averagePrice,
    //       currency: holding.currency,
    //       type: holding.type
    //     });
    //   }
    // } else if (this.portfolioId) {
    //   this.holdingForm.patchValue({
    //     portfolioId: this.portfolioId
    //   });
    // }
    // Get portfolio ID from route parameters
    this.route.params.subscribe(params => {
      this.portfolioId = params['id'];  // From route: portfolios/:id/holdings/...
      
      // Set portfolio ID in form
      if (this.portfolioId) {
        this.holdingForm.patchValue({ portfolioId: this.portfolioId });
      }

      // Check if we're in edit mode
      if (params['holdingId']) {
        this.isEditMode = true;
        this.holdingId = params['holdingId'];
        const holding = this.portfolioService.getHoldingById(params['holdingId']);
        
        if (holding) {
          // Populate form with existing holding data
          this.holdingForm.patchValue({
            portfolioId: holding.portfolioId,
            symbol: holding.symbol,
            name: holding.name,
            quantity: holding.quantity,
            averagePrice: holding.averagePrice,
            currency: holding.currency,
            type: holding.type
          });
          
          // Save portfolio ID separately
          this.portfolioId = holding.portfolioId;
        }
      }
    });

  }

  onSubmit(): void {
    if(this.holdingForm.invalid || !this.portfolioId)
      return;

    const formData = this.holdingForm.value as HoldingCreateDto;
    formData.portfolioId = this.portfolioId;

    if(this.isEditMode && this.holdingId){
      this.portfolioService.updateHolding(this.holdingId, formData);
    }else{
      this.portfolioService.addHolding(formData);
    }

    this.router.navigate(['../../'], { relativeTo: this.route });
  }

  onCancel(): void {
    // if (this.isEditMode) {
    //   // For edit mode: go back to holdings list
    //   this.router.navigate(['../../'], { relativeTo: this.route });
    // } else {
    //   // For create mode: go back to portfolio detail
    //   this.router.navigate(['../../../', this.portfolioId], {
    //     relativeTo: this.route,
    //     queryParamsHandling: 'preserve'
    //   })
    // }
    // Navigate back to holdings list
    this.router.navigate(['../../'], { relativeTo: this.route });
  }
}
