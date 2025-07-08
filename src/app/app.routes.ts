import { Routes } from '@angular/router';
import { Login } from './login/login.component';

export const routes: Routes = [
    {
        path: 'login',
        component: Login
        // path: 'login',
        // loadComponent: () => import('./login/login').then(m => m.Login)
    }
];
