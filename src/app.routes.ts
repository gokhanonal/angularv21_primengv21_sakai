import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { Notifications } from './app/pages/notifications/notifications';
import { Locations } from './app/pages/locations/locations';
import { LocationDetail } from './app/pages/locations/location-detail';
import { Stations } from './app/pages/stations/stations';
import { StationDetail } from './app/pages/stations/station-detail';

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
            {
                path: 'locations',
                component: Locations,
                data: {
                    breadcrumb: 'Locations',
                    pageTitle: 'Locations',
                    pageDescription: 'View regional data center sites on a map and in a directory.'
                }
            },
            {
                path: 'locations/:locationId',
                component: LocationDetail,
                data: {
                    breadcrumb: 'Location detail',
                    pageTitle: 'Location detail',
                    pageDescription: 'Site information and coordinates.'
                }
            },
            {
                path: 'stations',
                component: Stations,
                data: {
                    breadcrumb: 'Stations',
                    pageTitle: 'Stations',
                    pageDescription: 'Map and list from demo JSON (dashboardMapItemDataSummaries).'
                }
            },
            {
                path: 'stations/:locationId',
                component: StationDetail,
                data: {
                    breadcrumb: 'Station detail',
                    pageTitle: 'Station detail',
                    pageDescription: 'Station fields from demo JSON.'
                }
            },
            {
                path: 'notifications',
                component: Notifications,
                data: {
                    breadcrumb: 'Notifications',
                    pageTitle: 'Notifications',
                    pageDescription: 'View and manage all your notifications.'
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
