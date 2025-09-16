import { Component, inject, Inject, OnInit, signal } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { CreateHoldingRequest, Holding, Portfolio } from "../../core/models/portfolio.models";
import { PortfolioService } from "../../core/services/portfolio.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { CommonModule } from "@angular/common";
import { MatNativeDateModule } from "@angular/material/core";


interface DialogData {
    mode: 'add' | 'edit',
    portfolio: Portfolio,
    holding?: Holding;
}

@Component({
    selector: 'app-add-holding-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatIconModule,
        MatDialogModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './add-holding-dialog.component.html',
    styleUrl: './add-holding-dialog.component.scss'
})
export class AddHoldingDialogComponent implements OnInit {
    private readonly portfolioService = inject(PortfolioService);
    private readonly fb = inject(FormBuilder);
    private readonly snackBar = inject(MatSnackBar);
    private readonly dialogRef = inject(MatDialogRef<AddHoldingDialogComponent>);

    // Signals
    public readonly isEditMode = signal<boolean>(false);
    public readonly isSubmitting = signal<boolean>(false);

    // Form
    public readonly holdingForm: FormGroup;

    // Available options
    public readonly availableSectors = [
        'Technology',
        'Financial Services',
        'Healthcare',
        'Consumer Cyclical',
        'Consumer Defensive',
        'Energy',
        'Industrials',
        'Materials',
        'Real Estate',
        'Utilities',
        'Communication Services',
        'Diversified'
    ];

    constructor(@Inject(MAT_DIALOG_DATA) private data: DialogData) {
        this.holdingForm = this.fb.group({
            symbol: ['', [
                Validators.required,
                Validators.minLength(1),
                Validators.maxLength(10),
                Validators.pattern(/^[A-Za-z0-9._-]+$/)
            ]],
            companyName: ['', [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(100)
            ]],
            type: ['stock', Validators.required],
            market: ['', Validators.required],
            currency: [this.data.portfolio.currency, Validators.required],
            sector: ['', Validators.required],
            quantity: [0, [
                Validators.required,
                Validators.min(0.01),
                Validators.max(999999)
            ]],
            averagePrice: [0, [
                Validators.required,
                Validators.min(0.01),
                Validators.max(999999)
            ]],
            currentPrice: [0, [
                Validators.required,
                Validators.min(0.01),
                Validators.max(999999)
            ]],
            purchaseDate: [new Date(), Validators.required]
        });
    }

    ngOnInit(): void {
        this.isEditMode.set(this.data?.mode === 'edit');

        // Pre-fill form if editing
        if (this.isEditMode() && this.data.holding) {
            const holding = this.data.holding;
            this.holdingForm.patchValue({
                symbol: holding.symbol,
                companyName: holding.companyName,
                type: holding.type,
                market: holding.market,
                currency: holding.currency,
                sector: holding.sector,
                quantity: holding.quantity,
                averagePrice: holding.averagePrice,
                currentPrice: holding.currentPrice,
                purchaseDate: new Date(holding.purchaseDate)
            });
        }
    }

    /**
     * Handle symbol blur - transform to uppercase
     */
    onSymbolBlur(): void {
        const symbolControl = this.holdingForm.get('symbol');
        if (symbolControl?.value) {
            symbolControl.setValue(symbolControl.value.toUpperCase());
        }
    }

    /**
     * Check if field has error
     * @param fieldName 
     * @returns 
     */
    hasError(fieldName: string): boolean {
        const control = this.holdingForm.get(fieldName);
        return !!(control?.invalid && control?.touched);
    }

    /**
     * Get error message for field
     * @param fieldName 
     */
    getErrorMessage(fieldName: string): string {
        const control = this.holdingForm.get(fieldName);
        if (!control?.errors) return '';

        const errors = control.errors;
        switch (fieldName) {
            case 'symbol':
                if (errors['required']) return 'Stock symbol is required';
                if (errors['pattern']) return 'Invalid symbol format';
                if (errors['maxlength']) return 'Symbol too long';
                break;

            case 'companyName':
                if (errors['required']) return 'Company name is required';
                if (errors['minlength']) return 'Company name too short';
                if (errors['maxlength']) return 'Company name too long';
                break;

            case 'quantity':
                if (errors['required']) return 'Quantity is required';
                if (errors['min']) return 'Quantity must be greater than 0';
                if (errors['max']) return 'Quantity too large';
                break;

            case 'averagePrice':
                if (errors['required']) return 'Average price is required';
                if (errors['min']) return 'Price must be greater than 0';
                if (errors['max']) return 'Price too large';
                break;

            case 'currentPrice':
                if (errors['required']) return 'Current price is required';
                if (errors['min']) return 'Price must be greater than 0';
                if (errors['max']) return 'Price too large';
                break;

            default:
                if (errors['required']) return `${fieldName} is required`;
                break;
        }

        return 'Invalid input';
    }

    /**
     * Get currency symbol based on selected currency
     */
    getCurrencySymbol(): string {
        const currency = this.holdingForm.get('currency')?.value;
        return currency === 'CAD' ? 'CA$' : '$';
    }

    /**
     * Format currency
     */
    formatCurrency(amount: number): string {
        const currency = this.holdingForm.get('currency')?.value || 'USD';
        const symbol = currency === 'CAD' ? 'CA$' : '$';
        return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    /**
     * Calculate total cost
     */
    getTotalCost(): number {
        const quantity = this.holdingForm.get('quantity')?.value || 0;
        const averagePrice = this.holdingForm.get('averagePrice')?.value || 0;
        return quantity * averagePrice;
    }

    /**
     * Calculate current value
     */
    getCurrentValue(): number {
        const quantity = this.holdingForm.get('quantity')?.value || 0;
        const currentPrice = this.holdingForm.get('currentPrice')?.value || 0;
        return quantity * currentPrice;
    }

    /**
     * Calculate gain/loss
     */
    getGainLoss(): number {
        return this.getCurrentValue() - this.getTotalCost();
    }

    /**
     * Calculate gain/loss percentage
     */
    getGainLossPercent(): string {
        const totalCost = this.getTotalCost();
        if (totalCost <= 0) return '0.00';

        const gainLoss = this.getGainLoss();
        const percent = (gainLoss / totalCost) * 100;
        return (percent >= 0 ? '+' : '') + percent.toFixed(2);
    }

    /**
     * Get gain/loss CSS class
     */
    getGainLossClass(): string {
        const gainLoss = this.getGainLoss();
        if (gainLoss > 0) return 'positive';
        if (gainLoss < 0) return 'negative';
        return 'neutral';
    }

    /**
     * Handle form submission
     */
    onSubmit(): void {
        if (this.holdingForm.invalid || this.isSubmitting()) {
            this.markFormGroupTouched();
            return;
        }

        this.isSubmitting.set(true);

        if (this.isEditMode()) {
            this.updateHolding();
        } else {
            this.addHolding();
        }
    }

    /**
     * Add new holding
     */
    private addHolding(): void {
        const formValue = this.holdingForm.value;

        const request: CreateHoldingRequest = {
            portfolioId: this.data.portfolio.id,
            symbol: formValue.symbol.trim().toUpperCase(),
            companyName: formValue.companyName.trim(),
            type: formValue.type,
            market: formValue.market,
            currency: formValue.currency,
            quantity: parseFloat(formValue.quantity),
            averagePrice: parseFloat(formValue.averagePrice),
            currentPrice: parseFloat(formValue.currentPrice),
            sector: formValue.sector,
            purchaseDate: formValue.purchaseDate.toISOString()
        }

        this.portfolioService.addHolding(request).subscribe({
            next: (holding: Holding) => {
                this.isSubmitting.set(false);
                this.snackBar.open(
                    `${holding.symbol} added to portfolio successfully!`,
                    'Close',
                    {
                        duration: 5000,
                        panelClass: 'success-snackbar'
                    }
                );
                this.dialogRef.close(holding);
            },
            error: (error) => {
                this.handleSubmissionError(error, 'add');
            }
        });
    }

    private updateHolding(): void {
        if (!this.data?.holding) {
            this.isSubmitting.set(false);
            return;
        }

        const formValue = this.holdingForm.value;
        const updates: Partial<Holding> = {
            symbol: formValue.symbol.trim().toUpperCase(),
            companyName: formValue.companyName.trim(),
            type: formValue.type,
            market: formValue.market,
            currency: formValue.currency,
            quantity: parseFloat(formValue.quantity),
            averagePrice: parseFloat(formValue.averagePrice),
            currentPrice: parseFloat(formValue.currentPrice),
            sector: formValue.sector,
            purchaseDate: formValue.purchaseDate.toISOString(),
            // Recalculate derived values
            totalCost: parseFloat(formValue.quantity) * parseFloat(formValue.averagePrice),
            currentValue: parseFloat(formValue.quantity) * parseFloat(formValue.currentPrice),
            gainLoss: (parseFloat(formValue.quantity) * parseFloat(formValue.currentPrice)) - (parseFloat(formValue.quantity) * parseFloat(formValue.averagePrice)),
            gainLossPercent: ((parseFloat(formValue.currentPrice) - parseFloat(formValue.averagePrice)) / parseFloat(formValue.averagePrice)) * 100
        };

        this.portfolioService.updateHolding(this.data.holding.id, updates).subscribe({
            next: (holding: Holding) => {
                this.isSubmitting.set(false);
                this.snackBar.open(
                    `${holding.symbol} updated successfully!`,
                    'Close',
                    {
                        duration: 5000,
                        panelClass: 'success-snackbar'
                    }
                );
                this.dialogRef.close(holding);
            },
            error: (error) => {
                this.handleSubmissionError(error, 'update');
            }
        });
    }


    /**
     * Mark all form fields as touched
     */
    private markFormGroupTouched(): void {
        Object.keys(this.holdingForm.controls).forEach(key => {
            const control = this.holdingForm.get(key);
            control?.markAsTouched();
        });
    }

    /**
     * Handle submission errors
     */
    private handleSubmissionError(error: any, action: 'add' | 'update'): void {
        this.isSubmitting.set(false);
        console.error(`Failed to ${action} holding:`, error);

        let errorMessage = `Failed to ${action} holding. Please try again.`;

        if (error?.status === 409) {
            errorMessage = 'This holding already exists in the portfolio.';
        } else if (error?.status === 400) {
            errorMessage = error?.error?.message || 'Invalid holding data. Please check your inputs.';
        } else if (error?.status === 403) {
            errorMessage = 'You do not have permission to perform this action.';
        }

        this.snackBar.open(
            errorMessage,
            'Close',
            {
                duration: 7000,
                panelClass: 'error-snackbar'
            }
        );
    }
}