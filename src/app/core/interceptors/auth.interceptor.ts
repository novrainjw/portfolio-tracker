import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  // Get the auth token from the service
  const authToken = authService.getToken();

  // Clone the request and add the authorization header if token exists
  let authReq = req;
  if (authToken && !authService.isTokenExpired()) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });
  }

  // Handle the request and catch any auth errors
  return next(authReq).pipe(
    catchError((error) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401) {
        // Token is invalid or expired
        authService.logout();
        router.navigate(['/login'], {
          queryParams: {
            returnUrl: router.url,
            message: 'Your session has expired. Please log in again.'
          }
        });
        
        snackBar.open('Your session has expired. Please log in again.', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }

      // Handle 403 Forbidden errors
      if (error.status === 403) {
        snackBar.open('You do not have permission to perform this action.', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }

      // Handle 500 Server errors
      if (error.status >= 500) {
        snackBar.open('Server error. Please try again later.', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }

      return throwError(() => error);
    })
  );
};