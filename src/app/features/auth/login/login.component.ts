import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthService, LoginCredentials } from "../../../core/services/auth.service";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit{
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly snackBar = inject(MatSnackBar);

    // Signals
    public readonly hidePassword = signal<boolean>(true);
    public readonly loginForm: FormGroup;

    // Computed form service
    public readonly isLoading = this.authService.isLoading;
    public readonly isAuthenticated = this.authService.isAuthenticated;

    constructor(){
        this.loginForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            password: ['', [Validators.required, Validators.minLength(3)]]
        });
    }

    ngOnInit(): void {
        // Redirect if already authenticated
        if(this.isAuthenticated()){
            this.router.navigate(['/dashboard']);
        }
    }

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility(): void{
        this.hidePassword.update(value => !value);
    }

    /**
     * Handle form submission
     */
    onSubmit(): void{
        if(this.loginForm.valid && !this.isLoading()){
            const credentials: LoginCredentials = this.loginForm.value;

            this.authService.login(credentials).subscribe({
                next:(response) => {
                    this.snackBar.open('Login successful!', 'Close', {
                        duration: 3000,
                        horizontalPosition: 'end',
                        verticalPosition: 'top'
                    });
                    this.router.navigate(['/dashboard']);
                },
                error: (error) => {
                    this.snackBar.open(
                        error.message || 'Login failed. Please try again.',
                        'Close',
                        {
                            duration: 5000,
                            horizontalPosition: 'end',
                            verticalPosition:'top'
                        }
                    );
                    this.loginForm.patchValue({password: ''});
                }
            });
        } else{
            this.markFormGroupTouched();
        }
    }

    /**
     * Mark all form fields as touched to trigger validation messages
     */
    private markFormGroupTouched(): void{
        Object.keys(this.loginForm.controls).forEach(key => {
            const control = this.loginForm.get(key);
            control?.markAsTouched();
        });
    }

    /**
     * Get form field error message
     */
    getErrorMessage(fieldName: string):string{
        const control = this.loginForm.get(fieldName);

        if(control?.hasError('required')){
            return `${this.getFieldDisplayName(fieldName)} is required`;
        }

        if(control?.hasError('minlength')){
            const minLength = control.errors?.['minlength'].requredLength;
            return `${this.getFieldDisplayName(fieldName)} must be at least ${minLength} characters`;
        }
        return '';
    }

    /**
     * Get display name for form field
     */
    private getFieldDisplayName(fieldName: string): string{
        const fieldNames:{[key:string]:string} = {
            username: 'Username',
            password: 'Password'
        }

        return fieldNames[fieldName] || fieldName;
    }

    /**
     * Check if field has error and is touched
     */
    hasError(fieldName: string):boolean{
        const control = this.loginForm.get(fieldName);
        return !!(control?.invalid&&control?.touched);
    }
}