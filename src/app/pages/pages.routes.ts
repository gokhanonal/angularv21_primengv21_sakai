import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';

export default [
    {
        path: 'documentation',
        component: Documentation,
        data: {
            breadcrumbKey: 'menu.documentation',
            breadcrumb: 'Documentation',
            pageTitle: 'Documentation',
            pageDescription: 'Review documentation and integration notes.'
        }
    },
    {
        path: 'crud',
        component: Crud,
        data: {
            breadcrumbKey: 'menu.crud',
            breadcrumb: 'Crud',
            pageTitle: 'CRUD',
            pageDescription: 'Manage records with create, update, and delete actions.'
        }
    },
    {
        path: 'empty',
        component: Empty,
        data: {
            breadcrumbKey: 'menu.empty',
            breadcrumb: 'Empty',
            pageTitle: 'Empty Page',
            pageDescription: 'Use this page as a starting point for custom content.'
        }
    },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
