import { Injectable, effect, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

export interface LayoutConfig {
    preset: string;
    primary: string;
    surface: string | undefined | null;
    darkTheme: boolean;
    menuMode: string;
}

interface BrandingSettings {
    company_name: string;
    theme_name: string;
    theme: 'light' | 'dark';
    primary_color: string;
    surface_color: string;
    menu_mode: string;
}

interface LayoutState {
    staticMenuDesktopInactive: boolean;
    overlayMenuActive: boolean;
    configSidebarVisible: boolean;
    mobileMenuActive: boolean;
    menuHoverActive: boolean;
    activePath: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    private readonly platformId = inject(PLATFORM_ID);

    private readonly brandingStorageKey = 'branding';

    private readonly defaultCompanyName = 'OVOLT';

    layoutConfig = signal<LayoutConfig>({
        preset: 'Aura',
        primary: 'emerald',
        surface: null,
        darkTheme: false,
        menuMode: 'static'
    });

    layoutState = signal<LayoutState>({
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        configSidebarVisible: false,
        mobileMenuActive: false,
        menuHoverActive: false,
        activePath: null
    });

    theme = computed(() => (this.layoutConfig().darkTheme ? 'light' : 'dark'));

    isSidebarActive = computed(() => this.layoutState().overlayMenuActive || this.layoutState().mobileMenuActive);

    isDarkTheme = computed(() => this.layoutConfig().darkTheme);

    getPrimary = computed(() => this.layoutConfig().primary);

    getSurface = computed(() => this.layoutConfig().surface);

    isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

    transitionComplete = signal<boolean>(false);

    private initialized = false;

    constructor() {
        this.loadBrandingFromStorage();
        this.saveBrandingToStorage(this.layoutConfig());

        effect(() => {
            const config = this.layoutConfig();

            if (!this.initialized || !config) {
                this.initialized = true;
                return;
            }

            this.handleDarkModeTransition(config);
            this.saveBrandingToStorage(config);
        });
    }

    private loadBrandingFromStorage(): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        try {
            const rawBranding = localStorage.getItem(this.brandingStorageKey);
            if (!rawBranding) {
                return;
            }

            const branding = JSON.parse(rawBranding) as Partial<BrandingSettings>;
            const hasThemeName = typeof branding.theme_name === 'string';
            const hasTheme = branding.theme === 'light' || branding.theme === 'dark';
            const hasPrimaryColor = typeof branding.primary_color === 'string';
            const hasMenuMode = branding.menu_mode === 'static' || branding.menu_mode === 'overlay';
            const hasSurfaceColor = typeof branding.surface_color === 'string' && branding.surface_color.length > 0;

            this.layoutConfig.update((current) => ({
                ...current,
                ...(hasThemeName ? { preset: branding.theme_name as string } : {}),
                ...(hasTheme ? { darkTheme: branding.theme === 'dark' } : {}),
                ...(hasPrimaryColor ? { primary: branding.primary_color as string } : {}),
                ...(hasSurfaceColor ? { surface: branding.surface_color as string } : {}),
                ...(hasMenuMode ? { menuMode: branding.menu_mode as string } : {})
            }));
        } catch {
            localStorage.removeItem(this.brandingStorageKey);
        }
    }

    private saveBrandingToStorage(config: LayoutConfig): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        const branding: BrandingSettings = {
            company_name: this.defaultCompanyName,
            theme_name: config.preset,
            theme: config.darkTheme ? 'dark' : 'light',
            primary_color: config.primary,
            surface_color: config.surface || 'slate',
            menu_mode: config.menuMode
        };

        localStorage.setItem(this.brandingStorageKey, JSON.stringify(branding));
    }

    private handleDarkModeTransition(config: LayoutConfig): void {
        const supportsViewTransition = 'startViewTransition' in document;

        if (supportsViewTransition) {
            this.startViewTransition(config);
        } else {
            this.toggleDarkMode(config);
        }
    }

    private startViewTransition(config: LayoutConfig): void {
        document.startViewTransition(() => {
            this.toggleDarkMode(config);
        });
    }

    toggleDarkMode(config?: LayoutConfig): void {
        const _config = config || this.layoutConfig();
        if (_config.darkTheme) {
            document.documentElement.classList.add('app-dark');
        } else {
            document.documentElement.classList.remove('app-dark');
        }
    }

    onMenuToggle() {
        if (this.isDesktop()) {
            if (this.isOverlay()) {
                this.layoutState.update((prev) => ({ ...prev, overlayMenuActive: !this.layoutState().overlayMenuActive }));
            } else {
                this.layoutState.update((prev) => ({ ...prev, staticMenuDesktopInactive: !this.layoutState().staticMenuDesktopInactive }));
            }
        } else {
            this.layoutState.update((prev) => ({ ...prev, mobileMenuActive: !this.layoutState().mobileMenuActive }));
        }
    }

    showConfigSidebar() {
        this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: true }));
    }

    hideConfigSidebar() {
        this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: false }));
    }

    isDesktop() {
        return window.innerWidth > 991;
    }

    isMobile() {
        return !this.isDesktop();
    }
}
