import { CommonModule } from "@angular/common";
import { Component, Inject, inject, OnInit, signal } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { CreatePortfolioRequest, Portfolio, UpdatePortfolioRequest } from "../../core/models/portfolio.models";
import { PortfolioService } from "../../core/services/portfolio.service";
import { MatSnackBar } from "@angular/material/snack-bar";

interface DialogData {
    mode: 'create' | 'edit';
    portfolio?: Portfolio;
}

@Component({
    selector: 'app-create-portfolio-dialog',
    standalone: true,
    imports: [CommonModule,
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,                                                                 
        MatInput,
        MatSelectModule,
        MatProgressSpinnerModule],
    templateUrl: './create-portfolio-dialog.component.html',
    styleUrl: './create-portfolio-dialog.component.scss'
})
export class CreatePortfolioDialogComponent implements OnInit {
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

    public readonly availableCurrencies = signal([
        { code: 'USD', name: 'US Dollar', flag: 'us' },
        { code: 'CAD', name: 'Canadian Dollar', flag: 'CA' }
    ]);

    constructor(@Inject(MAT_DIALOG_DATA) private data: DialogData) {
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

    ngOnInit(): void {
        this.isEditMode.set(this.data?.mode === 'edit');
        // Pre-fill form if editing
        if (this.isEditMode() && this.data.portfolio) {
            const portfolio = this.data.portfolio;
            this.portfolioForm.patchValue({
                name: portfolio.name,
                description: portfolio.description,
                broker: portfolio.broker,
                currency: portfolio.currency
            });
        }
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

        if (this.isEditMode()) {
            this.updatePortfolio();
        } else {
            this.createPortfolio();
        }
    }

    /**
     * Create new portfolio
     */
    private createPortfolio(): void {
        const formValue = this.portfolioForm.value;

        const request: CreatePortfolioRequest = {
            name: formValue.name.trim(),
            description: formValue.description.trim(),
            broker: formValue.broker,
            currency: formValue.currency
        };

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
                this.handleSubmissionError(error, 'create');
            }
        });
    }

    /**
     * Update existing portfolio
     */
    private updatePortfolio(): void {
        if (!this.data?.portfolio) {
            this.isSubmitting.set(false);
            return;
        }

        const formValue = this.portfolioForm.value;
        const request: UpdatePortfolioRequest = {
            id: this.data.portfolio.id,
            name: formValue.name.trim(),
            description: formValue.description.trim(),
            broker: formValue.broker,
            currency: formValue.currency
        };

        this.portfolioService.updatePortfolio(request).subscribe({
            next: (portfolio: Portfolio) => {
                this.isSubmitting.set(false);
                this.snackBar.open(
                    `Portfolio "${portfolio.name}" updated successfully!`,
                    'Close',
                    {
                        duration: 5000,
                        panelClass: 'success-snackbar'
                    }
                );
                this.dialogRef.close(portfolio);
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
        Object.keys(this.portfolioForm.controls).forEach(key => {
            const control = this.portfolioForm.get(key);
            control?.markAsTouched();
        })
    }

    /**
     * Handle submission errors
     */
    private handleSubmissionError(error: any, action: 'create' | 'update'): void {
        this.isSubmitting.set(false);
        console.error(`Failed to ${action} portfolio. Please try again`);

        let errorMessage = `Failed to {$action} portfolio. Please try again.`

        // Handle specific error types
        if (error?.status === 409) {
            errorMessage = 'A portfolio with this name already exists. Please choose a different name.';
        } else if (error?.status === 400) {
            errorMessage = error?.error?.message || 'Invalid portfolio data. Please check your inputs.';
        } else if (error?.status === 403) {
            errorMessage = 'You do not have permission to perform this action.';
        } else if (error?.message) {
            errorMessage = error.message;
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
