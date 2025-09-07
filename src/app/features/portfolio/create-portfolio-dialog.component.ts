import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { CreatePortfolioRequest, Portfolio } from "../../core/models/portfolio.models";
import { PortfolioService } from "../../core/services/portfolio.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
    selector: 'app-create-portfolio-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInput, MatSelectModule, MatProgressSpinnerModule],
    templateUrl: './create-portfolio-dialog.component.html',
    styleUrl: './create-portfolio-dialog.component.scss'
})
export class CreatePortfolioDialogComponent {
    private readonly portfolioService = inject(PortfolioService);
    private readonly fb = inject(FormBuilder);
    private readonly snackBar = inject(MatSnackBar);
    private readonly dialogRef = inject(MatDialogRef<CreatePortfolioDialogComponent>);

    // Signals
    public readonly isEditMode = signal<boolean>(false);
    public readonly isSubmitting = signal<boolean>(false);

    // Form
    public readonly portfolioForm: FormGroup;

    // Available options
    public readonly availableBrokers = this.portfolioService.brokers();
    // public readonly availableBrokers = signal([
    //     { value: 'Questrade', name: 'Questrade', type: 'Discount Broker', icon: 'trending_up' },
    //     { value: 'Interactive Brokers', name: 'Interactive Brokers', type: 'Professional', icon: 'analytics' },
    //     { value: 'TD Direct Investing', name: 'TD Direct Investing', type: 'Full Service', icon: 'account_balance' },
    //     { value: 'RBC Direct Investing', name: 'RBC Direct Investing', type: 'Full Service', icon: 'account_balance' },
    //     { value: 'BMO InvestorLine', name: 'BMO InvestorLine', type: 'Full Service', icon: 'account_balance' },
    //     { value: 'Scotia iTRADE', name: 'Scotia iTRADE', type: 'Discount Broker', icon: 'trending_up' },
    //     { value: 'CIBC Investor\'s Edge', name: 'CIBC Investor\'s Edge', type: 'Full Service', icon: 'account_balance' },
    //     { value: 'Wealthsimple Trade', name: 'Wealthsimple Trade', type: 'Commission-Free', icon: 'toll_free' },
    //     { value: 'Charles Schwab', name: 'Charles Schwab', type: 'Full Service', icon: 'account_balance' },
    //     { value: 'Fidelity', name: 'Fidelity', type: 'Full Service', icon: 'account_balance' },
    //     { value: 'E*TRADE', name: 'E*TRADE', type: 'Discount Broker', icon: 'trending_up' },
    //     { value: 'Robinhood', name: 'Robinhood', type: 'Commission-Free', icon: 'toll_free' }
    // ]);

    public readonly availableCurrencies = signal([
        { code: 'USD', name: 'US Dollar', flag: 'us' },
        { code: 'CAD', name: 'Canadian Dollar', flag: 'CA' }
    ]);

    constructor() {
        this.portfolioForm = this.fb.group({
            name: ['', [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(100),
                this.noSpecialCharactersValidator
            ]],
            description: ['', [
                Validators.required,
                Validators.minLength(10),
                Validators.maxLength(500)
            ]],
            broker: ['', Validators.required],
            currency: ['USD', Validators.required]
        });
    }

    /**
   * Custom validator for portfolio name
   */
    private noSpecialCharactersValidator(control: any) {
        const value = control.value;
        if (!value) return null;

        const hasSpecialChars = /[<>:"/\\|?*]/.test(value);
        return hasSpecialChars ? { specialCharacters: true } : null;
    }

    /**
   * Get character count for name field
   */
    getNameLength(): number {
        return this.portfolioForm.get('name')?.value?.length || 0;
    }

    /**
   * Get character count for description field
   */
    getDescriptionLength(): number {
        return this.portfolioForm.get('description')?.value?.length || 0;
    }

    /**
   * Check if field has error and is touched
   */
    hasError(fieldName: string): boolean {
        const control = this.portfolioForm.get(fieldName);
        return !!(control?.invalid && control?.touched);
    }

    /**
   * Get error message for field
   */
    getErrorMessage(fieldName: string): string {
        const control = this.portfolioForm.get(fieldName);
        if (!control?.errors) return '';

        const errors = control.errors;

        switch (fieldName) {
            case 'name':
                if (errors['required']) return 'Portfolio name is required';
                if (errors['minlength']) return 'Name must be at least 2 characters';
                if (errors['maxlength']) return 'Name cannot exceed 100 characters';
                if (errors['specialCharacters']) return 'Name cannot contain special characters: < > : " / \\ | ? *';
                break;

            case 'description':
                if (errors['required']) return 'Description is required';
                if (errors['minlength']) return 'Description must be at least 10 characters';
                if (errors['maxlength']) return 'Description cannot exceed 500 characters';
                break;

            case 'broker':
                if (errors['required']) return 'Please select a brokerage';
                break;

            case 'currency':
                if (errors['required']) return 'Please select a base currency';
                break;
        }

        return 'Invalid input';
    }

    /**
   * Handle form submission
   */
    onSubmit(): void {
        if (this.portfolioForm.invalid || this.isSubmitting()) {
            this.markFormGroupTouched();
            return;
        }

        this.isSubmitting.set(true);

        const formValue = this.portfolioForm.value;
        const request: CreatePortfolioRequest = {
            name: formValue.name.trim(),
            description: formValue.description.trim(),
            broker: formValue.broker,
            currency: formValue.currency
        }

        this.portfolioService.createPortfolio(request).subscribe({
            next: (portfolio: Portfolio) => {
                this.isSubmitting.set(false);
                this.snackBar.open(
                    `Portfolio "${portfolio.name}" created successfully!`,
                    'Close',
                    {
                        duration: 5000,
                        panelClass: 'success-snackbar'
                    }
                );
                this.dialogRef.close(portfolio);
            },
            error: (error) => {
                this.isSubmitting.set(false);
                console.error('Failed to create portfolio:', error);
                this.snackBar.open(
                    error.message || 'Failed to create portfolio. Please try again.',
                    'Close',
                    {
                        duration: 5000,
                        panelClass: 'error-snackbar'
                    }
                );
            }
        });
    }

    /**
   * Mark all form fields as touched
   */
    private markFormGroupTouched(): void {
        Object.keys(this.portfolioForm.controls).forEach(key => {
            const control = this.portfolioForm.get(key);
            control?.markAsTouched();
        })
    }
}