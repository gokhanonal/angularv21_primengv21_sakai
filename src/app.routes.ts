import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            {
                path: '',
                component: Dashboard,
                data: {
                    breadcrumb: 'eCommerce',
                    pageTitle: 'eCommerce Dashboard',
                    pageDescription: 'TailAdmin demo ile ayni icerik duzeni (ornek veri).'
                }
            },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            {
                path: 'documentation',
                component: Documentation,
                data: {
                    breadcrumb: 'Documentation',
                    pageTitle: 'Documentation',
                    pageDescription: 'Read setup, usage, and component details.'
                }
            },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
