import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { Notifications } from './app/pages/notifications/notifications';
import { Locations } from './app/pages/locations/locations';
import { LocationDetail } from './app/pages/locations/location-detail';
import { Stations } from './app/pages/dashboard-stations/stations';
import { StationDetail } from './app/pages/dashboard-stations/station-detail';
import { Profile } from './app/pages/profile/profile';
import { ChangePassword } from './app/pages/profile/change-password';
import { StationManagementList } from './app/pages/station-management/station-management-list';
import { StationManagementDetail } from './app/pages/station-management/station-management-detail';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            {
                path: '',
                component: Dashboard,
                data: {
                    breadcrumbKey: 'breadcrumb.ecommerce',
                    breadcrumb: 'eCommerce',
                    pageTitle: 'eCommerce Dashboard',
                    pageDescription: 'Sales and revenue data.'
                }
            },
            {
                path: 'uikit',
                loadChildren: () => import('./app/pages/uikit/uikit.routes'),
                data: { breadcrumbKey: 'menu.uiComponents', breadcrumb: 'UI Components' }
            },
            {
                path: 'documentation',
                component: Documentation,
                data: {
                    breadcrumbKey: 'breadcrumb.documentation',
                    breadcrumb: 'Documentation',
                    pageTitle: 'Documentation',
                    pageDescription: 'Read setup, usage, and component details.'
                }
            },
            {
                path: 'locations',
                component: Locations,
                data: {
                    breadcrumbKey: 'breadcrumb.locations',
                    breadcrumb: 'Locations',
                    pageTitle: 'Locations',
                    pageDescription: 'View regional data center sites on a map and in a directory.'
                }
            },
            {
                path: 'locations/:locationId',
                component: LocationDetail,
                data: {
                    breadcrumbKey: 'breadcrumb.locationDetail',
                    breadcrumb: 'Location detail',
                    pageTitle: 'Location detail',
                    pageDescription: 'Site information and coordinates.'
                }
            },
            {
                path: 'dashboard-stations',
                component: Stations,
                data: {
                    breadcrumbKey: 'breadcrumb.stations',
                    breadcrumb: 'Stations',
                    pageTitle: 'Stations',
                    pageDescription: 'Map and list from demo JSON'
                }
            },
            {
                path: 'dashboard-stations/:locationId',
                component: StationDetail,
                data: {
                    breadcrumbKey: 'breadcrumb.stationDetail',
                    breadcrumb: 'Station detail',
                    pageTitle: 'Station detail',
                    pageDescription: 'Station fields from demo JSON.'
                }
            },
            {
                path: 'notifications',
                component: Notifications,
                data: {
                    breadcrumbKey: 'breadcrumb.notifications',
                    breadcrumb: 'Notifications',
                    pageTitle: 'Notifications',
                    pageDescription: 'View and manage all your notifications.'
                }
            },
            {
                path: 'profile',
                component: Profile,
                data: {
                    breadcrumbKey: 'breadcrumb.profile',
                    breadcrumb: 'Profile',
                    pageTitle: 'Profile',
                    pageDescription: 'View and update your profile and photo.'
                }
            },
            {
                path: 'change-password',
                component: ChangePassword,
                data: {
                    breadcrumbKey: 'breadcrumb.changePassword',
                    breadcrumb: 'Change password',
                    pageTitle: 'Change password',
                    pageDescription: 'Update your account password.'
                }
            },
            {
                path: 'station-management',
                component: StationManagementList,
                data: {
                    breadcrumbKey: 'breadcrumb.stationManagement',
                    breadcrumb: 'Station Management',
                    pageTitle: 'Station Management',
                    pageDescription: 'Manage station information including pricing, commissions, and users.'
                }
            },
            {
                path: 'station-management/:stationId',
                component: StationManagementDetail,
                data: {
                    breadcrumbKey: 'breadcrumb.stationManagementDetail',
                    breadcrumb: 'Station details',
                    pageTitle: '',
                    pageDescription: ''
                }
            },
            {
                path: 'pages',
                loadChildren: () => import('./app/pages/pages.routes'),
                data: { breadcrumbKey: 'menu.pages', breadcrumb: 'Pages' }
            }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
