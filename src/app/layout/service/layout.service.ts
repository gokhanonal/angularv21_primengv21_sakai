import { DestroyRef, Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface LayoutConfig {
    preset: string;
    primary: string;
    surface: string | undefined | null;
    /** User-selected appearance mode (persisted). */
    themeMode: ThemeMode;
    /**
     * Effective dark appearance for PrimeNG / charts (`app-dark` on the document element).
     * Derived from `themeMode` and, when `system`, from `prefers-color-scheme`.
     */
    darkTheme: boolean;
    menuMode: string;
}

interface BrandingSettings {
    company_name: string;
    theme_name: string;
    theme: ThemeMode;
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

const PREFERS_DARK_MQ = '(prefers-color-scheme: dark)';

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    private readonly platformId = inject(PLATFORM_ID);

    private readonly destroyRef = inject(DestroyRef);

    private readonly brandingStorageKey = 'branding';

    private readonly defaultCompanyName = 'OVOLT';

    private systemMql: MediaQueryList | null = null;

    private systemMqlHandler: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null = null;

    private lastAppliedDark: boolean | null = null;

    private storageHandler = (event: StorageEvent): void => {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        if (event.key !== this.brandingStorageKey || event.newValue === null) {
            return;
        }
        try {
            const branding = JSON.parse(event.newValue) as Partial<BrandingSettings>;
            this.applyParsedBranding(branding);
        } catch {
            /* ignore malformed payload from another tab */
        }
    };

    layoutConfig = signal<LayoutConfig>({
        preset: 'Aura',
        primary: 'emerald',
        surface: null,
        themeMode: 'system',
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

    /** @deprecated Prefer `themeMode`; kept for clarity — maps effective appearance to legacy naming. */
    theme = computed(() => (this.layoutConfig().darkTheme ? 'dark' : 'light'));

    themeMode = computed(() => this.layoutConfig().themeMode);

    isSidebarActive = computed(() => this.layoutState().overlayMenuActive || this.layoutState().mobileMenuActive);

    isDarkTheme = computed(() => this.layoutConfig().darkTheme);

    getPrimary = computed(() => this.layoutConfig().primary);

    getSurface = computed(() => this.layoutConfig().surface);

    isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

    transitionComplete = signal<boolean>(false);

    /** Resolved i18n label for station detail active tab; set by detail page, cleared on destroy. */
    readonly detailTabBreadcrumb = signal<string | null>(null);

    constructor() {
        this.loadBrandingFromStorage();
        if (isPlatformBrowser(this.platformId)) {
            this.applyDarkClassToDocument(this.layoutConfig());
            this.lastAppliedDark = this.layoutConfig().darkTheme;
            window.addEventListener('storage', this.storageHandler);
        }
        this.saveBrandingToStorage(this.layoutConfig());

        this.destroyRef.onDestroy(() => {
            this.detachSystemPreferenceListener();
            if (isPlatformBrowser(this.platformId)) {
                window.removeEventListener('storage', this.storageHandler);
            }
        });

        effect(() => {
            const config = this.layoutConfig();
            if (!isPlatformBrowser(this.platformId)) {
                return;
            }
            if (this.lastAppliedDark === config.darkTheme) {
                this.saveBrandingToStorage(config);
                return;
            }
            this.lastAppliedDark = config.darkTheme;
            this.handleDarkModeTransition(config);
            this.saveBrandingToStorage(config);
        });
    }

    setThemeMode(mode: ThemeMode): void {
        const effective = this.computeEffectiveDark(mode);
        this.syncSystemMediaListener(mode);
        this.layoutConfig.update((state) => ({
            ...state,
            themeMode: mode,
            darkTheme: effective
        }));
        if (isPlatformBrowser(this.platformId)) {
            this.saveBrandingToStorage(this.layoutConfig());
        }
    }

    private parseThemeMode(value: unknown): ThemeMode {
        if (value === 'light' || value === 'dark' || value === 'system') {
            return value;
        }
        return 'system';
    }

    private computeEffectiveDark(mode: ThemeMode): boolean {
        if (mode === 'light') {
            return false;
        }
        if (mode === 'dark') {
            return true;
        }
        if (!isPlatformBrowser(this.platformId)) {
            return false;
        }
        if (typeof globalThis.matchMedia !== 'function') {
            return false;
        }
        return globalThis.matchMedia(PREFERS_DARK_MQ).matches;
    }

    private syncSystemMediaListener(mode: ThemeMode): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        if (mode === 'system') {
            this.attachSystemPreferenceListener();
        } else {
            this.detachSystemPreferenceListener();
        }
    }

    private attachSystemPreferenceListener(): void {
        if (!isPlatformBrowser(this.platformId) || this.systemMql !== null) {
            return;
        }
        if (typeof globalThis.matchMedia !== 'function') {
            return;
        }
        this.systemMql = globalThis.matchMedia(PREFERS_DARK_MQ);
        this.systemMqlHandler = () => {
            if (this.layoutConfig().themeMode !== 'system') {
                return;
            }
            const dark = this.systemMql!.matches;
            this.layoutConfig.update((state) => (state.darkTheme === dark ? state : { ...state, darkTheme: dark }));
        };
        this.systemMql.addEventListener('change', this.systemMqlHandler);
    }

    private detachSystemPreferenceListener(): void {
        if (this.systemMql !== null && this.systemMqlHandler !== null) {
            this.systemMql.removeEventListener('change', this.systemMqlHandler);
        }
        this.systemMql = null;
        this.systemMqlHandler = null;
    }

    private applyParsedBranding(branding: Partial<BrandingSettings>): void {
        const themeMode = this.parseThemeMode(branding.theme);
        const hasThemeName = typeof branding.theme_name === 'string';
        const hasPrimaryColor = typeof branding.primary_color === 'string';
        const hasMenuMode = branding.menu_mode === 'static' || branding.menu_mode === 'overlay';
        const hasSurfaceColor = typeof branding.surface_color === 'string' && branding.surface_color.length > 0;

        this.syncSystemMediaListener(themeMode);
        this.layoutConfig.update((current) => ({
            ...current,
            themeMode,
            darkTheme: this.computeEffectiveDark(themeMode),
            ...(hasThemeName ? { preset: branding.theme_name as string } : {}),
            ...(hasPrimaryColor ? { primary: branding.primary_color as string } : {}),
            ...(hasSurfaceColor ? { surface: branding.surface_color as string } : {}),
            ...(hasMenuMode ? { menuMode: branding.menu_mode as string } : {})
        }));
    }

    private loadBrandingFromStorage(): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        try {
            const rawBranding = localStorage.getItem(this.brandingStorageKey);
            if (!rawBranding) {
                const themeMode: ThemeMode = 'system';
                const darkTheme = this.computeEffectiveDark(themeMode);
                this.layoutConfig.update((current) => ({
                    ...current,
                    themeMode,
                    darkTheme
                }));
                this.syncSystemMediaListener(themeMode);
                return;
            }

            const branding = JSON.parse(rawBranding) as Partial<BrandingSettings>;
            this.applyParsedBranding(branding);
        } catch {
            localStorage.removeItem(this.brandingStorageKey);
            const themeMode: ThemeMode = 'system';
            const darkTheme = this.computeEffectiveDark(themeMode);
            this.layoutConfig.update((current) => ({
                ...current,
                themeMode,
                darkTheme
            }));
            this.syncSystemMediaListener(themeMode);
        }
    }

    private saveBrandingToStorage(config: LayoutConfig): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        const branding: BrandingSettings = {
            company_name: this.defaultCompanyName,
            theme_name: config.preset,
            theme: config.themeMode,
            primary_color: config.primary,
            surface_color: config.surface || 'slate',
            menu_mode: config.menuMode
        };

        try {
            const serialized = JSON.stringify(branding);
            if (localStorage.getItem(this.brandingStorageKey) === serialized) {
                return;
            }
            localStorage.setItem(this.brandingStorageKey, serialized);
        } catch {
            /* private mode / quota — in-memory config still applies */
        }
    }

    private handleDarkModeTransition(config: LayoutConfig): void {
        const supportsViewTransition = 'startViewTransition' in document;

        if (supportsViewTransition) {
            this.startViewTransition(config);
        } else {
            this.applyDarkClassToDocument(config);
        }
    }

    private startViewTransition(config: LayoutConfig): void {
        document.startViewTransition(() => {
            this.applyDarkClassToDocument(config);
        });
    }

    private applyDarkClassToDocument(config?: LayoutConfig): void {
        const _config = config ?? this.layoutConfig();
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
