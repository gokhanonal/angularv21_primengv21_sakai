import { Component, computed, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/layout/service/layout.service';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';

interface BreadcrumbItem {
    label: string;
    url: string;
}

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [CommonModule, RouterModule, StyleClassModule, AppConfigurator],
    template: ` <div class="layout-topbar">
        <div class="topbar-start">
            @if (showMenuButton()) {
                <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                    <i class="pi pi-bars"></i>
                </button>
            }
            <div class="layout-page-header">
                <div class="layout-page-breadcrumb">
                    @for (crumb of breadcrumbs(); track crumb.url; let isLast = $last) {
                        @if (!isLast) {
                            <a [routerLink]="crumb.url">{{ crumb.label }}</a>
                            <i class="pi pi-angle-right"></i>
                        } @else {
                            <span>{{ crumb.label }}</span>
                        }
                    }
                </div>
                <h1 class="layout-page-title">{{ pageTitle() }}</h1>
            </div>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-calendar"></i>
                        <span>Calendar</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-inbox"></i>
                        <span>Messages</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-user"></i>
                        <span>Profile</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar {
    items!: MenuItem[];

    router = inject(Router);

    activatedRoute = inject(ActivatedRoute);

    layoutService = inject(LayoutService);

    breadcrumbs = signal<BreadcrumbItem[]>([{ label: 'Home', url: '/' }]);

    pageTitle = computed(() => {
        const crumbs = this.breadcrumbs();
        if (crumbs.length > 1) {
            return crumbs[crumbs.length - 1].label;
        }

        return 'Dashboard';
    });

    showMenuButton = computed(() => {
        const config = this.layoutService.layoutConfig();
        const state = this.layoutService.layoutState();

        if (config.menuMode === 'overlay') {
            return true;
        }

        if (!this.layoutService.isDesktop()) {
            return true;
        }

        return state.staticMenuDesktopInactive;
    });

    constructor() {
        this.updateBreadcrumbs();
        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
            this.updateBreadcrumbs();
        });
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }

    private updateBreadcrumbs(): void {
        const crumbs: BreadcrumbItem[] = [{ label: 'Home', url: '/' }];
        let currentRoute = this.activatedRoute.root;
        let currentUrl = '';
        let nextRoute = currentRoute.firstChild;

        while (nextRoute) {
            currentRoute = nextRoute;
            const routeSnapshot = currentRoute.snapshot;
            const segment = (routeSnapshot?.url ?? []).map((part) => part.path).join('/');

            if (!segment) {
                nextRoute = currentRoute.firstChild;
                continue;
            }

            currentUrl = `${currentUrl}/${segment}`;
            const label = (routeSnapshot?.data?.['breadcrumb'] as string) || this.formatLabel(segment);

            crumbs.push({
                label,
                url: currentUrl
            });

            nextRoute = currentRoute.firstChild;
        }

        this.breadcrumbs.set(crumbs);
    }

    private formatLabel(value: string): string {
        return value
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }
}
