import { Routes } from '@angular/router';
import { Login } from './login/login.component';
import { Dashboard } from './dashboard/dashboard.component';
import { PortfolioList } from './portfolio-list/portfolio-list.component';
import { PortfolioFormComponent } from './portfolio-form/portfolio-form.component';
import { PortfolioDetailComponent } from './portfolio-detail/portfolio-detail.component';
import { HoldingListComponent } from './holding-list/holding-list.component';
import { HoldingFormComponent } from './holding-form/holding-form.component';

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
        children: [
            {
                path: '',
                component: PortfolioList
            },
            {
                path: 'new',
                component: PortfolioFormComponent
            },
            {
                path: ':id',
                component: PortfolioDetailComponent,
            },
            {
                path: ':id/edit',
                component: PortfolioFormComponent
            },
            {
                path: ':id/holdings',
                children: [
                    {
                        path: '',
                        component: HoldingListComponent,
                    },
                    {
                        path: 'new',
                        component: HoldingFormComponent
                    },
                    {
                        path: 'edit/:id',
                        component: HoldingFormComponent
                    }
                ]
            }
        ]
    },
    // {
    //     path: 'portfolios/:portfolioId/holdings',
    //     children: [
    //         {
    //             path: '',
    //             component: HoldingListComponent,
    //         },
    //         {
    //             path: 'new',
    //             component: HoldingFormComponent
    //         },
    //         {
    //             path: 'edit/:id',
    //             component: HoldingFormComponent
    //         }
    //     ]
    // },

];
