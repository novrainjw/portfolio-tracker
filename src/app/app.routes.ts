import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'portfolio/:id',
    loadComponent: () => import('./features/portfolio/portfolio-detail.component').then(c => c.PortfolioDetailComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'portfolios',
    children: [
      {
        path: ':id',
        loadComponent: () => import('./features/portfolio/portfolio-detail.component').then(c => c.PortfolioDetailComponent),
        canActivate: [AuthGuard]
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/page-not-found.component').then(c => c.PageNotFoundComponent)
  }
];