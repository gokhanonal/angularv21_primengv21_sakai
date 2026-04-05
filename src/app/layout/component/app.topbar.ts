import { Component, computed, effect, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { MenuModule } from 'primeng/menu';
import { AppConfigurator } from './app.configurator';
import { AppLanguageSwitcher } from './app.language-switcher';
import { LayoutService } from '@/app/layout/service/layout.service';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NotificationService } from '@/app/layout/service/notification.service';
import { NotificationDetail } from '@/app/pages/notifications/notification-detail';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';
import { UserProfileService } from '@/app/core/profile/user-profile.service';

interface BreadcrumbItem {
    label: string;
    url: string;
}

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [CommonModule, RouterModule, StyleClassModule, MenuModule, AppConfigurator, AppLanguageSwitcher, NotificationDetail, TranslatePipe],
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
                <div class="relative flex shrink-0 items-center justify-center">
                    <button
                        type="button"
                        class="layout-topbar-action"
                        (click)="themeMenu.toggle($event)"
                        [attr.aria-label]="themeMenuAria()"
                        [attr.title]="'topbar.theme' | t"
                        [attr.aria-haspopup]="'menu'"
                    >
                        <i [class]="themeTriggerIconClass()"></i>
                    </button>
                    <p-menu #themeMenu [popup]="true" [model]="themeMenuItems()" [appendTo]="'body'" styleClass="layout-topbar-theme-menu" />
                </div>
                <div class="relative">  
                    <button
                        class="layout-topbar-action layout-topbar-action-palette"
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
                        <span>{{ 'topbar.calendar' | t }}</span>
                    </button>
                    <div class="relative">
                        <button
                            type="button"
                            class="layout-topbar-action"
                            pStyleClass="@next"
                            enterFromClass="hidden"
                            enterActiveClass="animate-scalein"
                            leaveToClass="hidden"
                            leaveActiveClass="animate-fadeout"
                            [hideOnOutsideClick]="true"
                        >
                            <span class="layout-topbar-notification">
                                <i class="pi pi-inbox"></i>
                                @if (unreadCount() > 0 && unreadCount() <= 9) {
                                    <span class="layout-topbar-badge">{{ unreadCount() }}</span>
                                } @else if (unreadCount() > 9) {
                                    <span class="layout-topbar-dot"></span>
                                }
                            </span>
                            <span>{{ 'topbar.messages' | t }}</span>
                        </button>
                        <div class="layout-notification-dropdown hidden">
                            <div class="layout-notification-dropdown-header">{{ 'topbar.notifications' | t }}</div>
                            @for (item of notificationService.latestFive(); track item.id) {
                                <a class="layout-notification-item" [ngClass]="{ 'is-unread': !item.isRead }" (click)="notificationService.openDetail(item)">
                                    <i class="pi" [ngClass]="{
                                        'pi-info-circle text-blue-500': item.type === 'info',
                                        'pi-check-circle text-green-500': item.type === 'success',
                                        'pi-exclamation-triangle text-orange-500': item.type === 'warning',
                                        'pi-times-circle text-red-500': item.type === 'error'
                                    }"></i>
                                    <div class="layout-notification-item-content">
                                        <div class="layout-notification-item-title">{{ item.title }}</div>
                                        <div class="layout-notification-item-desc">{{ item.description }}</div>
                                    </div>
                                </a>
                            }
                            @if (notificationService.latestFive().length === 0) {
                                <div class="layout-notification-empty">{{ 'topbar.noNotifications' | t }}</div>
                            }
                            <a routerLink="/notifications" class="layout-notification-show-all">{{ 'topbar.showAll' | t }}</a>
                        </div>
                    </div>
                    <app-language-switcher variant="topbar" />
                    <div class="relative flex shrink-0 items-center justify-center">
                        <button
                            type="button"
                            class="layout-topbar-action layout-topbar-profile-trigger"
                            (click)="profileMenu.toggle($event)"
                            [attr.aria-label]="profileMenuAria()"
                            [attr.title]="'topbar.profile' | t"
                            [attr.aria-haspopup]="'menu'"
                        >
                            @if (userProfile.avatarDataUrl(); as avatarUrl) {
                                <img [src]="avatarUrl" alt="" class="layout-topbar-profile-img" />
                            } @else {
                                <i class="pi pi-user"></i>
                            }
                        </button>
                        <p-menu #profileMenu [popup]="true" [model]="profileMenuItems()" [appendTo]="'body'" styleClass="layout-topbar-profile-menu" />
                    </div>
                </div>
            </div>
        </div>
        <app-notification-detail />
    </div>`
})
export class AppTopbar {
    items!: MenuItem[];

    router = inject(Router);

    activatedRoute = inject(ActivatedRoute);

    layoutService = inject(LayoutService);

    notificationService = inject(NotificationService);

    readonly i18n = inject(I18nService);

    readonly userProfile = inject(UserProfileService);

    profileMenuAria = computed(() => {
        this.i18n.lang();
        return this.i18n.t('topbar.profileMenuAria');
    });

    themeMenuAria = computed(() => {
        this.i18n.lang();
        return this.i18n.t('topbar.theme');
    });

    themeTriggerIconClass = computed(() => {
        const mode = this.layoutService.layoutConfig().themeMode;
        if (mode === 'light') {
            return 'pi pi-sun';
        }
        if (mode === 'dark') {
            return 'pi pi-moon';
        }
        return 'pi pi-desktop';
    });

    themeMenuItems = computed((): MenuItem[] => {
        this.i18n.lang();
        return [
            {
                label: this.i18n.t('theme.light'),
                icon: 'pi pi-sun',
                command: () => {
                    this.layoutService.setThemeMode('light');
                }
            },
            {
                label: this.i18n.t('theme.dark'),
                icon: 'pi pi-moon',
                command: () => {
                    this.layoutService.setThemeMode('dark');
                }
            },
            {
                label: this.i18n.t('theme.system'),
                icon: 'pi pi-desktop',
                command: () => {
                    this.layoutService.setThemeMode('system');
                }
            }
        ];
    });

    profileMenuItems = computed((): MenuItem[] => {
        this.i18n.lang();
        return [
            {
                label: this.i18n.t('topbar.profileMenu.profile'),
                icon: 'pi pi-user',
                command: () => {
                    void this.router.navigate(['/profile']);
                }
            },
            {
                label: this.i18n.t('topbar.profileMenu.changePassword'),
                icon: 'pi pi-key',
                command: () => {
                    void this.router.navigate(['/change-password']);
                }
            },
            { separator: true },
            {
                label: this.i18n.t('topbar.profileMenu.logout'),
                icon: 'pi pi-sign-out',
                command: () => {
                    this.userProfile.clearMockSessionStorage();
                    void this.router.navigate(['/auth/login']);
                }
            }
        ];
    });

    breadcrumbs = signal<BreadcrumbItem[]>([]);

    unreadCount = computed(() => this.notificationService.unreadCount());

    pageTitle = computed(() => {
        this.i18n.lang();
        const crumbs = this.breadcrumbs();
        if (crumbs.length > 1) {
            return crumbs[crumbs.length - 1].label;
        }

        return this.i18n.t('menu.dashboard');
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
        effect(() => {
            this.i18n.lang();
            this.updateBreadcrumbs();
        });
        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
            this.updateBreadcrumbs();
        });
    }

    private updateBreadcrumbs(): void {
        const crumbs: BreadcrumbItem[] = [{ label: this.i18n.t('breadcrumb.home'), url: '/' }];
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
            const data = routeSnapshot.data as Record<string, unknown>;
            const key = data['breadcrumbKey'] as string | undefined;
            const raw = data['breadcrumb'] as string | undefined;
            const label = key ? this.i18n.t(key) : raw ?? this.formatLabel(segment);

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
