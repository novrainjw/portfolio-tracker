import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const AuthGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Check if user is authenticated
    if (authService.isAuthenticated()) {
        // Check if token is expired
        if (authService.isTokenExpired()) {
            // Token is expired, logout and redirect to login
            authService.logout();
            return router.createUrlTree(['/login'], {
                queryParams: {
                    returnUrl: state.url,
                    message: 'Your session has expired. Please log in again.'
                }
            });
        }
        // User is authenticated and token is valid
        return true;
    }

    // User is not authenticated, redirect to login
    return router.createUrlTree(['/login'],{
        queryParams:{
            returnUrl: state.url
        }
    });
};