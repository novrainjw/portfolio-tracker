import { Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    //Signal to track authentication state
    isAuthenticated = signal(false);

    constructor(private router: Router) {
        // check initial auth state from localStorage
        const token = localStorage.getItem('portfolio-token');
        // !! coerce the value to be a boolean type
        this.isAuthenticated.set(!!token);
    }

    login(username: string, password: string): boolean {
        // replace with real API call later
        if (username.trim() === 'admin' && password.trim() === 'password') {
            localStorage.setItem('portfolio-token', 'dummy-token');
            this.isAuthenticated.set(true);
            this.router.navigate(['/dashboard']);
            return true;
        }
        return false;
    }

    logout(): void {
        localStorage.removeItem('portfolio-token');
        this.isAuthenticated.set(false);
        this.router.navigate(['/login'])
    }
}