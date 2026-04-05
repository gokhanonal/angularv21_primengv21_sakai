import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
    const brandingKey = 'branding';

    /** Fresh `LayoutService` per test (avoids reusing the root singleton across specs). */
    const browserTestProviders = [
        { provide: PLATFORM_ID, useValue: 'browser' },
        LayoutService
    ];

    function minimalBranding(theme: string): string {
        return JSON.stringify({
            company_name: 'OVOLT',
            theme_name: 'Aura',
            theme,
            primary_color: 'emerald',
            surface_color: 'slate',
            menu_mode: 'static'
        });
    }

    function createMatchMediaStub(initialMatches: boolean): {
        mql: MediaQueryList;
        setMatches: (v: boolean) => void;
        listeners: Array<(ev: MediaQueryListEvent) => void>;
    } {
        let matches = initialMatches;
        const listeners: Array<(ev: MediaQueryListEvent) => void> = [];
        const mql = {
            get matches() {
                return matches;
            },
            media: '(prefers-color-scheme: dark)',
            addEventListener: (_type: 'change', fn: (ev: MediaQueryListEvent) => void) => {
                listeners.push(fn);
            },
            removeEventListener: (_type: 'change', fn: (ev: MediaQueryListEvent) => void) => {
                const i = listeners.indexOf(fn);
                if (i >= 0) {
                    listeners.splice(i, 1);
                }
            }
        } as MediaQueryList;
        return {
            mql,
            setMatches(v: boolean) {
                matches = v;
            },
            listeners
        };
    }

    beforeEach(() => {
        localStorage.removeItem(brandingKey);
        document.documentElement.classList.remove('app-dark');
        TestBed.resetTestingModule();
    });

    it('defaults to system with light effective appearance when storage is empty and OS prefers light', () => {
        const { mql } = createMatchMediaStub(false);
        spyOn(window, 'matchMedia').and.returnValue(mql);
        TestBed.configureTestingModule({
            providers: browserTestProviders
        });
        const service = TestBed.inject(LayoutService);
        expect(service.layoutConfig().themeMode).toBe('system');
        expect(service.layoutConfig().darkTheme).toBe(false);
        expect(document.documentElement.classList.contains('app-dark')).toBe(false);
        expect(JSON.parse(localStorage.getItem(brandingKey)!).theme).toBe('system');
    });

    it('defaults to system with dark effective appearance when storage is empty and OS prefers dark', () => {
        const { mql } = createMatchMediaStub(true);
        spyOn(window, 'matchMedia').and.returnValue(mql);
        TestBed.configureTestingModule({
            providers: browserTestProviders
        });
        const service = TestBed.inject(LayoutService);
        expect(service.layoutConfig().themeMode).toBe('system');
        expect(service.layoutConfig().darkTheme).toBe(true);
        expect(document.documentElement.classList.contains('app-dark')).toBe(true);
    });

    it('loads legacy light and dark branding themes unchanged', () => {
        const { mql } = createMatchMediaStub(true);
        spyOn(window, 'matchMedia').and.returnValue(mql);
        localStorage.setItem(brandingKey, minimalBranding('light'));
        TestBed.configureTestingModule({
            providers: browserTestProviders
        });
        const lightSvc = TestBed.inject(LayoutService);
        expect(lightSvc.layoutConfig().themeMode).toBe('light');
        expect(lightSvc.layoutConfig().darkTheme).toBe(false);

        TestBed.resetTestingModule();
        localStorage.setItem(brandingKey, minimalBranding('dark'));
        TestBed.configureTestingModule({
            providers: browserTestProviders
        });
        const darkSvc = TestBed.inject(LayoutService);
        expect(darkSvc.layoutConfig().themeMode).toBe('dark');
        expect(darkSvc.layoutConfig().darkTheme).toBe(true);
    });

    it('maps invalid theme string to system', () => {
        const { mql } = createMatchMediaStub(false);
        spyOn(window, 'matchMedia').and.returnValue(mql);
        localStorage.setItem(brandingKey, minimalBranding('not-a-valid-theme'));
        TestBed.configureTestingModule({
            providers: browserTestProviders
        });
        const service = TestBed.inject(LayoutService);
        expect(service.layoutConfig().themeMode).toBe('system');
    });

    it('setThemeMode persists three-value theme and fixes effective dark for light and dark', () => {
        const { mql } = createMatchMediaStub(true);
        spyOn(window, 'matchMedia').and.returnValue(mql);
        TestBed.configureTestingModule({
            providers: browserTestProviders
        });
        const service = TestBed.inject(LayoutService);
        service.setThemeMode('light');
        expect(service.layoutConfig().themeMode).toBe('light');
        expect(service.layoutConfig().darkTheme).toBe(false);
        expect(JSON.parse(localStorage.getItem(brandingKey)!).theme).toBe('light');
        service.setThemeMode('dark');
        expect(service.layoutConfig().themeMode).toBe('dark');
        expect(service.layoutConfig().darkTheme).toBe(true);
        expect(JSON.parse(localStorage.getItem(brandingKey)!).theme).toBe('dark');
    });

    it('updates effective dark from prefers-color-scheme while in system mode', () => {
        const { mql, setMatches, listeners } = createMatchMediaStub(false);
        spyOn(window, 'matchMedia').and.returnValue(mql);
        TestBed.configureTestingModule({
            providers: browserTestProviders
        });
        const service = TestBed.inject(LayoutService);
        service.setThemeMode('system');
        expect(listeners.length).toBe(1);
        expect(service.layoutConfig().darkTheme).toBe(false);
        setMatches(true);
        listeners[0]!({ matches: true } as MediaQueryListEvent);
        expect(service.layoutConfig().darkTheme).toBe(true);
    });

    it('does not apply OS changes when mode is fixed light', () => {
        const { mql, setMatches, listeners } = createMatchMediaStub(false);
        spyOn(window, 'matchMedia').and.returnValue(mql);
        TestBed.configureTestingModule({
            providers: browserTestProviders
        });
        const service = TestBed.inject(LayoutService);
        service.setThemeMode('light');
        expect(listeners.length).toBe(0);
        setMatches(true);
        expect(service.layoutConfig().darkTheme).toBe(false);
    });

    it('removes matchMedia change listener when switching away from system', () => {
        const { mql, listeners } = createMatchMediaStub(false);
        spyOn(window, 'matchMedia').and.returnValue(mql);
        TestBed.configureTestingModule({
            providers: browserTestProviders
        });
        const service = TestBed.inject(LayoutService);
        service.setThemeMode('system');
        expect(listeners.length).toBe(1);
        service.setThemeMode('dark');
        expect(listeners.length).toBe(0);
    });

    it('syncs theme from storage events (other tab)', () => {
        const { mql } = createMatchMediaStub(false);
        spyOn(window, 'matchMedia').and.returnValue(mql);
        localStorage.setItem(brandingKey, minimalBranding('light'));
        TestBed.configureTestingModule({
            providers: browserTestProviders
        });
        const service = TestBed.inject(LayoutService);
        expect(service.layoutConfig().themeMode).toBe('light');
        window.dispatchEvent(
            new StorageEvent('storage', {
                key: brandingKey,
                newValue: minimalBranding('dark'),
                oldValue: minimalBranding('light')
            })
        );
        expect(service.layoutConfig().themeMode).toBe('dark');
        expect(service.layoutConfig().darkTheme).toBe(true);
    });

    it('falls back to light effective when matchMedia is unavailable', () => {
        const original = window.matchMedia;
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: undefined
        });
        try {
            TestBed.configureTestingModule({
                providers: browserTestProviders
            });
            const service = TestBed.inject(LayoutService);
            service.setThemeMode('system');
            expect(service.layoutConfig().darkTheme).toBe(false);
        } finally {
            Object.defineProperty(window, 'matchMedia', {
                configurable: true,
                value: original
            });
        }
    });
});
