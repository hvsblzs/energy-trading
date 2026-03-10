import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
    },
    {
        path: 'marketplace',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'price-history',
        loadComponent: () => import('./features/price-history/price-history').then(m => m.PriceHistoryComponent),
        canActivate: [authGuard]
    },
    {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then(m => m.ProfileComponent),
        canActivate: [authGuard]
    },
    {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory').then(m => m.InventoryComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['COMPANY_USER']}
    },
    {
        path: 'trade-offers',
        loadComponent: () => import('./features/trade-offers/trade-offers').then(m => m.TradeOffersComponent),
        canActivate: [authGuard, roleGuard],
        data: {roles: ['ADMIN', 'DISPATCHER']}
    },
    {
        path: 'companies',
        loadComponent: () => import('./features/companies/companies').then(m => m.CompaniesComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN', 'DISPATCHER'] }
    },
    {
        path: 'users',
        loadComponent: () => import('./features/users/users').then(m => m.UsersComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN', 'DISPATCHER'] }
    },
    {
        path: '',
        redirectTo: 'marketplace',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: 'marketplace'
    }
];
