import { Routes } from '@angular/router';
import { ButtonDemo } from './buttondemo';
import { ChartDemo } from './chartdemo';
import { FileDemo } from './filedemo';
import { FormLayoutDemo } from './formlayoutdemo';
import { InputDemo } from './inputdemo';
import { ListDemo } from './listdemo';
import { MediaDemo } from './mediademo';
import { MessagesDemo } from './messagesdemo';
import { MiscDemo } from './miscdemo';
import { PanelsDemo } from './panelsdemo';
import { TimelineDemo } from './timelinedemo';
import { TableDemo } from './tabledemo';
import { OverlayDemo } from './overlaydemo';
import { TreeDemo } from './treedemo';
import { MenuDemo } from './menudemo';

export default [
    { path: 'button', data: { breadcrumbKey: 'menu.button', breadcrumb: 'Button' }, component: ButtonDemo },
    { path: 'charts', data: { breadcrumbKey: 'menu.chart', breadcrumb: 'Charts' }, component: ChartDemo },
    { path: 'file', data: { breadcrumbKey: 'menu.file', breadcrumb: 'File' }, component: FileDemo },
    { path: 'formlayout', data: { breadcrumbKey: 'menu.formLayout', breadcrumb: 'Form Layout' }, component: FormLayoutDemo },
    { path: 'input', data: { breadcrumbKey: 'menu.input', breadcrumb: 'Input' }, component: InputDemo },
    { path: 'list', data: { breadcrumbKey: 'menu.list', breadcrumb: 'List' }, component: ListDemo },
    { path: 'media', data: { breadcrumbKey: 'menu.media', breadcrumb: 'Media' }, component: MediaDemo },
    { path: 'message', data: { breadcrumbKey: 'menu.message', breadcrumb: 'Message' }, component: MessagesDemo },
    { path: 'misc', data: { breadcrumbKey: 'menu.misc', breadcrumb: 'Misc' }, component: MiscDemo },
    { path: 'panel', data: { breadcrumbKey: 'menu.panel', breadcrumb: 'Panel' }, component: PanelsDemo },
    { path: 'timeline', data: { breadcrumbKey: 'menu.timeline', breadcrumb: 'Timeline' }, component: TimelineDemo },
    { path: 'table', data: { breadcrumbKey: 'menu.table', breadcrumb: 'Table' }, component: TableDemo },
    { path: 'overlay', data: { breadcrumbKey: 'menu.overlay', breadcrumb: 'Overlay' }, component: OverlayDemo },
    { path: 'tree', data: { breadcrumbKey: 'menu.tree', breadcrumb: 'Tree' }, component: TreeDemo },
    { path: 'menu', data: { breadcrumbKey: 'menu.menu', breadcrumb: 'Menu' }, component: MenuDemo },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
