import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';
import { AppMenuitem } from './app.menuitem';

type SearchableMenuItem = MenuItem & {
    description?: string;
    items?: SearchableMenuItem[];
};

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule, TranslatePipe],
    template: `
        <ul class="layout-menu">
            @for (item of filteredModel(); track trackMenuKey($index, item)) {
                @if (!item.separator) {
                    <li app-menuitem [item]="item" [root]="true"></li>
                } @else {
                    <li class="menu-separator"></li>
                }
            }
        </ul>

        @if (searchTerm().trim() && filteredModel().length === 0) {
            <div class="layout-menu-search-empty">{{ 'sidebar.menuEmpty' | t }}</div>
        }
    `
})
export class AppMenu {
    private readonly i18n = inject(I18nService);

    searchTerm = input<string>('');

    private readonly menuModel = computed(() => {
        this.i18n.lang();
        return this.buildMenuModel();
    });

    filteredModel = computed(() => {
        const term = this.searchTerm().trim().toLowerCase();
        const model = this.menuModel();
        if (!term) {
            return model;
        }
        return this.filterItems(model, term);
    });

    trackMenuKey(index: number, item: SearchableMenuItem): string {
        const rl = item.routerLink;
        if (Array.isArray(rl)) {
            return rl.join('/');
        }
        if (item['path']) {
            return item['path'] as string;
        }
        if (item.url) {
            return item.url;
        }
        return `${item.label ?? 'item'}-${index}`;
    }

    private buildMenuModel(): SearchableMenuItem[] {
        const t = (key: string) => this.i18n.t(key);
        return [
            {
                label: t('menu.home'),
                items: [
                    { label: t('menu.dashboard'), icon: 'pi pi-fw pi-home', routerLink: ['/'] },
                    {
                        label: t('menu.locations'),
                        description: t('menu.locationsDesc'),
                        icon: 'pi pi-fw pi-map-marker',
                        routerLink: ['/locations']
                    },
                    {
                        label: t('menu.stations'),
                        description: t('menu.stationsDesc'),
                        icon: 'pi pi-fw pi-bolt',
                        routerLink: ['/dashboard-stations']
                    }
                ]
            },
            {
                label: t('menu.uiComponents'),
                items: [
                    { label: t('menu.formLayout'), description: t('menu.formLayoutDesc'), icon: 'pi pi-fw pi-id-card', routerLink: ['/uikit/formlayout'] },
                    { label: t('menu.input'), description: t('menu.inputDesc'), icon: 'pi pi-fw pi-check-square', routerLink: ['/uikit/input'] },
                    { label: t('menu.button'), description: t('menu.buttonDesc'), icon: 'pi pi-fw pi-mobile', class: 'rotated-icon', routerLink: ['/uikit/button'] },
                    { label: t('menu.table'), description: t('menu.tableDesc'), icon: 'pi pi-fw pi-table', routerLink: ['/uikit/table'] },
                    { label: t('menu.list'), description: t('menu.listDesc'), icon: 'pi pi-fw pi-list', routerLink: ['/uikit/list'] },
                    { label: t('menu.tree'), description: t('menu.treeDesc'), icon: 'pi pi-fw pi-share-alt', routerLink: ['/uikit/tree'] },
                    { label: t('menu.panel'), description: t('menu.panelDesc'), icon: 'pi pi-fw pi-tablet', routerLink: ['/uikit/panel'] },
                    { label: t('menu.overlay'), description: t('menu.overlayDesc'), icon: 'pi pi-fw pi-clone', routerLink: ['/uikit/overlay'] },
                    { label: t('menu.media'), description: t('menu.mediaDesc'), icon: 'pi pi-fw pi-image', routerLink: ['/uikit/media'] },
                    { label: t('menu.menu'), description: t('menu.menuDesc'), icon: 'pi pi-fw pi-bars', routerLink: ['/uikit/menu'] },
                    { label: t('menu.message'), description: t('menu.messageDesc'), icon: 'pi pi-fw pi-comment', routerLink: ['/uikit/message'] },
                    { label: t('menu.file'), description: t('menu.fileDesc'), icon: 'pi pi-fw pi-file', routerLink: ['/uikit/file'] },
                    { label: t('menu.chart'), description: t('menu.chartDesc'), icon: 'pi pi-fw pi-chart-bar', routerLink: ['/uikit/charts'] },
                    { label: t('menu.timeline'), description: t('menu.timelineDesc'), icon: 'pi pi-fw pi-calendar', routerLink: ['/uikit/timeline'] },
                    { label: t('menu.misc'), description: t('menu.miscDesc'), icon: 'pi pi-fw pi-circle', routerLink: ['/uikit/misc'] }
                ]
            },
            {
                label: t('menu.pages'),
                icon: 'pi pi-fw pi-briefcase',
                path: '/pages',
                items: [
                    { label: t('menu.landing'), icon: 'pi pi-fw pi-globe', routerLink: ['/landing'] },
                    {
                        label: t('menu.auth'),
                        icon: 'pi pi-fw pi-user',
                        path: '/auth',
                        items: [
                            { label: t('menu.login'), icon: 'pi pi-fw pi-sign-in', routerLink: ['/auth/login'] },
                            { label: t('menu.forgotPassword'), icon: 'pi pi-fw pi-key', routerLink: ['/auth/forgot-password'] },
                            { label: t('menu.error'), icon: 'pi pi-fw pi-times-circle', routerLink: ['/auth/error'] },
                            { label: t('menu.accessDenied'), icon: 'pi pi-fw pi-lock', routerLink: ['/auth/access'] }
                        ]
                    },
                    { label: t('menu.crud'), icon: 'pi pi-fw pi-pencil', routerLink: ['/pages/crud'] },
                    { label: t('menu.notFound'), icon: 'pi pi-fw pi-exclamation-circle', routerLink: ['/pages/notfound'] },
                    { label: t('menu.empty'), icon: 'pi pi-fw pi-circle-off', routerLink: ['/pages/empty'] }
                ]
            },
            {
                label: t('menu.hierarchy'),
                path: '/hierarchy',
                items: [
                    {
                        label: t('menu.submenu1'),
                        icon: 'pi pi-fw pi-bookmark',
                        path: '/hierarchy/submenu_1',
                        items: [
                            {
                                label: t('menu.submenu11'),
                                icon: 'pi pi-fw pi-bookmark',
                                path: '/hierarchy/submenu_1/submenu_1_1',
                                items: [
                                    { label: t('menu.submenu111'), icon: 'pi pi-fw pi-bookmark' },
                                    { label: t('menu.submenu112'), icon: 'pi pi-fw pi-bookmark' },
                                    { label: t('menu.submenu113'), icon: 'pi pi-fw pi-bookmark' }
                                ]
                            },
                            {
                                label: t('menu.submenu12'),
                                icon: 'pi pi-fw pi-bookmark',
                                path: '/hierarchy/submenu_1/submenu_1_2',
                                items: [{ label: t('menu.submenu121'), icon: 'pi pi-fw pi-bookmark' }]
                            }
                        ]
                    },
                    {
                        label: t('menu.submenu2'),
                        icon: 'pi pi-fw pi-bookmark',
                        path: '/hierarchy/submenu_2',
                        items: [
                            {
                                label: t('menu.submenu21'),
                                icon: 'pi pi-fw pi-bookmark',
                                path: '/hierarchy/submenu_2/submenu_2_1',
                                items: [
                                    { label: t('menu.submenu211'), icon: 'pi pi-fw pi-bookmark' },
                                    { label: t('menu.submenu212'), icon: 'pi pi-fw pi-bookmark' }
                                ]
                            },
                            {
                                label: t('menu.submenu22'),
                                icon: 'pi pi-fw pi-bookmark',
                                path: '/hierarchy/submenu_2/submenu_2_2',
                                items: [{ label: t('menu.submenu221'), icon: 'pi pi-fw pi-bookmark' }]
                            }
                        ]
                    }
                ]
            },
            {
                label: t('menu.getStarted'),
                items: [
                    { label: t('menu.documentation'), icon: 'pi pi-fw pi-book', routerLink: ['/documentation'] },
                    {
                        label: t('menu.viewSource'),
                        icon: 'pi pi-fw pi-github',
                        url: 'https://github.com/primefaces/sakai-ng',
                        target: '_blank'
                    }
                ]
            }
        ];
    }

    private filterItems(items: SearchableMenuItem[], term: string): SearchableMenuItem[] {
        return items.reduce<SearchableMenuItem[]>((accumulator, item) => {
            const childItems = item.items ?? [];
            const filteredChildren = childItems.length ? this.filterItems(childItems, term) : [];
            const itemMatches = this.matchesItem(item, term);

            if (!itemMatches && filteredChildren.length === 0) {
                return accumulator;
            }

            if (itemMatches && childItems.length > 0 && filteredChildren.length === 0) {
                accumulator.push({ ...item, items: childItems });
                return accumulator;
            }

            accumulator.push({ ...item, items: filteredChildren.length ? filteredChildren : childItems });
            return accumulator;
        }, []);
    }

    private matchesItem(item: SearchableMenuItem, term: string): boolean {
        const searchableContent = [item.label ?? '', item.description ?? ''].join(' ').toLowerCase();
        return searchableContent.includes(term);
    }
}
