import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { AppTopbar } from './app.topbar';
import { AppSidebar } from './app.sidebar';
import { AppFooter } from './app.footer';
import { LayoutService } from '@/app/layout/service/layout.service';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, AppTopbar, AppSidebar, RouterModule, AppFooter],
    template: `<div class="layout-wrapper" [ngClass]="containerClass()">
        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <div class="layout-main">
                <div class="layout-content-header">
                    <h2 class="layout-content-title">{{ pageTitle() }}</h2>
                    <p class="layout-content-description">{{ pageDescription() }}</p>
                </div>
                <router-outlet></router-outlet>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask"></div>
    </div> `
})
export class AppLayout {
    layoutService = inject(LayoutService);

    router = inject(Router);

    activatedRoute = inject(ActivatedRoute);

    pageTitle = signal('Dashboard');

    pageDescription = signal('Manage and monitor your dashboard content from this page.');

    constructor() {
        effect(() => {
            const state = this.layoutService.layoutState();
            if (state.mobileMenuActive) {
                document.body.classList.add('blocked-scroll');
            } else {
                document.body.classList.remove('blocked-scroll');
            }
        });

        this.updatePageHeader();
        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
            this.updatePageHeader();
        });
    }

    containerClass = computed(() => {
        const config = this.layoutService.layoutConfig();
        const state = this.layoutService.layoutState();
        return {
            'layout-overlay': config.menuMode === 'overlay',
            'layout-static': config.menuMode === 'static',
            'layout-static-inactive': state.staticMenuDesktopInactive && config.menuMode === 'static',
            'layout-overlay-active': state.overlayMenuActive,
            'layout-mobile-active': state.mobileMenuActive
        };
    });

    private updatePageHeader(): void {
        const routeSnapshot = this.getDeepestSnapshot();
        const segment = (routeSnapshot.url ?? []).map((part) => part.path).join('/');
        const breadcrumbTitle = routeSnapshot.data?.['breadcrumb'] as string | undefined;
        const customTitle = routeSnapshot.data?.['pageTitle'] as string | undefined;
        const customDescription = routeSnapshot.data?.['pageDescription'] as string | undefined;
        const title = customTitle || breadcrumbTitle || this.formatLabel(segment) || 'Dashboard';

        this.pageTitle.set(title);
        this.pageDescription.set(customDescription || `Manage and monitor ${title.toLowerCase()} from this page.`);
    }

    private getDeepestSnapshot() {
        let current = this.activatedRoute.snapshot;
        while (current.firstChild) {
            current = current.firstChild;
        }
        return current;
    }

    private formatLabel(value: string): string {
        if (!value) {
            return '';
        }

        return value
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }
}
