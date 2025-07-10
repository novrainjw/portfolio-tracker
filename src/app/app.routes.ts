import { Routes } from '@angular/router';
import { Login } from './login/login.component';
import { Dashboard } from './dashboard/dashboard.component';
import { PortfolioList } from './portfolio-list/portfolio-list.component';
import { PortfolioForm } from './portfolio-form/portfolio-form.component';

export const routes: Routes = [
    {
        path: 'login',
        component: Login
        // path: 'login',
        // loadComponent: () => import('./login/login').then(m => m.Login)
    },
    {
        path: 'dashboard',
        component: Dashboard
    },
    {
        path: 'portfolios',
        children:[
            {
                path:'',
                component:PortfolioList
            },
            {
                path:'new',
                component:PortfolioForm
            }
        ]
    }
];
