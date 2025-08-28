import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { computed, inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment";
import { catchError, map, Observable, of, tap, throwError } from "rxjs";

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    lastLoginAt: string;
    isActive: boolean;
}

export interface AuthResponse {
    user: User;
    token: string;
    expiresAt: number;
}

export interface ApiUser {
    id: string;
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    lastLoginAt: string;
    isActive: boolean;
}


@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    // Private signals
    private readonly _currentUser = signal<User | null>(null);
    private readonly _isLoading = signal<boolean>(false);
    private readonly _token = signal<string | null>(null);

    // public readonly signals
    public readonly currentUser = this._currentUser.asReadonly();
    public readonly isLoading = this._isLoading.asReadonly();
    public readonly token = this._token.asReadonly();
    public readonly isAuthenticated = computed(() => !!this._currentUser() && !!this._token());

    private readonly STORAGE_KEY = 'portfolio_auth';
    private readonly API_URL = environment.apiUrl;

    constructor() {
        this.initializeAuth();
    }

    private initializeAuth(): void {
        const storedAuth = localStorage.getItem(this.STORAGE_KEY);
        if (storedAuth) {
            try {
                const authData = JSON.parse(storedAuth);
                if (authData.expiresAt > Date.now) {
                    this._currentUser.set(authData.user);
                    this._token.set(authData.token);
                } else {
                    this.clearAuthData();
                }
            } catch (error) {
                console.error('Error parsing stored auth data:', error);
                this.clearAuthData();
            }
        } else {

        }
    }

    /**
     * Login with credentials by checking against json-server users
     */
    login(credentials: LoginCredentials): Observable<AuthResponse> {
        this._isLoading.set(true);

        // Query users from json-server
        return this.http.get<ApiUser[]>(`${this.API_URL}/users`, {
            params: {
                username: credentials.username.trim()
            }
        }).pipe(
            map((users: ApiUser[]) => {
                const user = users.find(u =>
                    u.username === credentials.username.trim() &&
                    u.password === credentials.password &&
                    u.isActive === true
                );

                if (!user) {
                    throw new Error('Invalid username or password');
                }

                // convert ApiUser to User (exclude password)
                const authenticatedUser: User = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    createdAt: user.createdAt,
                    lastLoginAt: user.lastLoginAt,
                    isActive: user.isActive
                }

                const token = this.generateMockJWT(user);
                const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

                const authResponse: AuthResponse = {
                    user: authenticatedUser,
                    token,
                    expiresAt
                };

                return authResponse;
            }),
            tap((authResponse: AuthResponse) => {
                // store auth data
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authResponse));

                // Update signals
                this._currentUser.set(authResponse.user);
                this._token.set(authResponse.token);
                this._isLoading.set(false);

                // Update user's last login time(might want to do this on the backend)
                this.updateLastLogin(authResponse.user.id).subscribe({
                    error: (error) => console.warn('Failed to update last login:', error)
                });
            }),
            catchError((error: HttpErrorResponse) => {
                this._isLoading.set(false);
                if (error.status === 0) {
                    return throwError(() => ({
                        message: 'Unable to connect to server. Please check if json-server is running.'
                    }));
                }

                return throwError(() => ({
                    message: error.error?.message || 'Login failed. Please try again.'
                }));
            })
        );
    }

    /**
     * Update user's last login time
     */
    private updateLastLogin(userId: string): Observable<any> {
        const updateData = {
            lastLoginAt: new Date().toISOString()
        };

        return this.http.patch(`${this.API_URL}/users/${userId}`, updateData).pipe(
            catchError(error => {
                // Don't fail the login if we can't update the timestamp
                console.warn('Failed to update last login timestamp:', error);
                return of(null);
            })
        );
    }

    /**
     * Logout user
     */
    logout(): void {
        this.clearAuthData();
        this.router.navigate(['/login']);
    }

    /**
     * Clear authentication data
     */
    private clearAuthData(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        this._currentUser.set(null);
        this._token.set(null);
    }

    /**
     * Generate mock JWT token
     */
    private generateMockJWT(user: ApiUser): string {
        const header = btoa(JSON.stringify({ alg: 'HS256', type: 'JWT' }));
        const payload = btoa(JSON.stringify({
            sub: user.id,
            username: user.username,
            email: user.email,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) //24 hours
        }));
        const signature = 'mock-signature-' + user.id;

        return `${header}.${payload}.${signature}`;
    }

    /**
     * Check if token is expired
     */
    isTokenExpired(): boolean {
        const storedAuth = localStorage.getItem(this.STORAGE_KEY);
        if (!storedAuth) return true;

        try {
            const authData = JSON.parse(storedAuth);
            return authData.expiresAt <= Date.now();
        } catch {
            return true;
        }
    }

    /**
     * Get all users
     */
    getUsers(): Observable<User[]> {
        return this.http.get<ApiUser[]>(`${this.API_URL}/users`).pipe(
            map((apiUsers: ApiUser[]) =>
                apiUsers
                    .filter(user => user.isActive)
                    .map(user => ({
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        createdAt: user.createdAt,
                        lastLoginAt: user.lastLoginAt,
                        isActive: user.isActive
                    }))
            )
        );
    }

    /**
     * Register new user
     */
    register(userData: Omit<ApiUser, 'id' | 'createdAt' | 'lastLoginAt'>): Observable<User> {
        const newUser: Omit<ApiUser, 'id'> = {
            ...userData,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
        };

        return this.http.post<ApiUser>(`${this.API_URL}/users`, newUser).pipe(
            map((apiUser: ApiUser) => ({
                id: apiUser.id,
                username: apiUser.username,
                email: apiUser.email,
                firstName: apiUser.firstName,
                lastName: apiUser.lastName,
                createdAt: apiUser.createdAt,
                lastLoginAt: apiUser.lastLoginAt,
                isActive: apiUser.isActive
            }))
        );
    }

    /**
     * Refresh token
     */
    refreshToken(): Observable<AuthResponse> {
        return throwError(() => new Error('Token refresh not implemented'));
    }
}