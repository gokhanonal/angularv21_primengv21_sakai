import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { providePrimeNG } from 'primeng/config';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { StationManagementList } from './station-management-list';
import { StationManagementRow } from './station-management.model';
import { StationManagementService } from './station-management.service';

class MockMediaQueryList implements MediaQueryList {
    private listeners = new Map<string, Set<EventListener>>();

    constructor(public matches: boolean) {}

    readonly media = '(min-width: 768px)';
    onchange: MediaQueryList['onchange'] = null;

    addEventListener(type: string, listener: EventListener): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(listener);
    }

    removeEventListener(type: string, listener: EventListener): void {
        this.listeners.get(type)?.delete(listener);
    }

    dispatchEvent(_event: Event): boolean {
        return true;
    }

    addListener(): void {}

    removeListener(): void {}

    emitChange(matches: boolean): void {
        this.matches = matches;
        const ev = { matches, media: this.media } as MediaQueryListEvent;
        for (const fn of this.listeners.get('change') ?? []) {
            (fn as (e: MediaQueryListEvent) => void)(ev);
        }
    }
}

describe('StationManagementList', () => {
    const mockRow: StationManagementRow = {
        id: 1,
        stationInfoId: 42,
        name: 'Station A',
        address: '1 Main St',
        phone: '555',
        cityName: 'C',
        districtName: 'D',
        companyName: 'Co',
        resellerName: 'R',
        isRoaming: false,
        unitCode: 'U1',
        isActive: true,
        isDeleted: false,
        statusCategory: 'active'
    };

    let fixture: ComponentFixture<StationManagementList>;
    let mockMql: MockMediaQueryList;

    beforeEach(async () => {
        mockMql = new MockMediaQueryList(true);
        spyOn(window, 'matchMedia').and.callFake(() => mockMql as unknown as MediaQueryList);

        await TestBed.configureTestingModule({
            imports: [StationManagementList],
            providers: [
                provideRouter([]),
                providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
                I18nService,
                {
                    provide: StationManagementService,
                    useValue: {
                        rows: signal<StationManagementRow[]>([mockRow]),
                        loadError: signal<string | null>(null),
                        load: () => of(undefined),
                        findById: () => undefined,
                        removeById: () => {}
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(StationManagementList);
    });

    it('sets isDesktop from matchMedia on init', () => {
        mockMql.matches = false;
        fixture.detectChanges();
        expect(fixture.componentInstance.isDesktop()).toBe(false);
    });

    it('updates isDesktop and drops frozen column class when matchMedia goes narrow', async () => {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(fixture.componentInstance.isDesktop()).toBe(true);
        const th0 = fixture.nativeElement.querySelector('thead th');
        expect(th0?.classList.contains('p-datatable-frozen-column')).toBe(true);

        mockMql.emitChange(false);
        fixture.detectChanges();

        expect(fixture.componentInstance.isDesktop()).toBe(false);
        const th0After = fixture.nativeElement.querySelector('thead th');
        expect(th0After?.classList.contains('p-datatable-frozen-column')).toBe(false);
    });
});
