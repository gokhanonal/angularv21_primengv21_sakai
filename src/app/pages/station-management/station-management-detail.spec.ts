import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { LayoutService } from '@/app/layout/service/layout.service';
import { ChargingUnitService } from '@/app/pages/service/charging-unit.service';
import { StationManagementDetail } from './station-management-detail';
import { StationManagementRow } from './station-management.model';
import { StationManagementService } from './station-management.service';

describe('StationManagementDetail', () => {
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

    let detailTabBreadcrumb: WritableSignal<string | null>;
    let routerNavigate: jasmine.Spy;
    let activatedRouteStub: {
        snapshot: { paramMap: ParamMap; fragment: string | null };
        paramMap: Observable<ParamMap>;
    };

    beforeEach(async () => {
        detailTabBreadcrumb = signal<string | null>(null);
        routerNavigate = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));
        const paramMap = convertToParamMap({ stationId: '1' });
        activatedRouteStub = {
            snapshot: { paramMap, fragment: 'tab=2' },
            paramMap: of(paramMap)
        };

        await TestBed.configureTestingModule({
            imports: [StationManagementDetail],
            providers: [
                providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
                I18nService,
                { provide: LayoutService, useValue: { detailTabBreadcrumb } },
                { provide: Router, useValue: { navigate: routerNavigate } },
                { provide: ActivatedRoute, useValue: activatedRouteStub },
                {
                    provide: StationManagementService,
                    useValue: {
                        rows: signal<StationManagementRow[]>([mockRow]),
                        loadError: signal<string | null>(null),
                        load: () => of(undefined),
                        findById: (id: number) => (id === 1 ? mockRow : undefined),
                        removeById: () => {}
                    }
                }
            ]
        })
            .overrideComponent(StationManagementDetail, {
                set: {
                    providers: [
                        {
                            provide: ChargingUnitService,
                            useValue: {
                                getChargingUnits: () => Promise.resolve([]),
                                getByStationId: () => Promise.resolve([])
                            }
                        }
                    ]
                }
            })
            .compileComponents();
    });

    it('applies tab fragment on load and syncs breadcrumb label', async () => {
        const fixture = TestBed.createComponent(StationManagementDetail);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(fixture.componentInstance.activeTab()).toBe('2');
        expect(detailTabBreadcrumb()).toBe('Working hours');
    });

    it('clears layout detail tab breadcrumb on destroy', async () => {
        const fixture = TestBed.createComponent(StationManagementDetail);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(detailTabBreadcrumb()).not.toBeNull();
        fixture.destroy();
        expect(detailTabBreadcrumb()).toBeNull();
    });

    it('onTabChange updates active tab and replaces URL fragment via router.navigate', async () => {
        const fixture = TestBed.createComponent(StationManagementDetail);
        fixture.detectChanges();
        await fixture.whenStable();
        routerNavigate.calls.reset();
        fixture.componentInstance.onTabChange('3');
        expect(fixture.componentInstance.activeTab()).toBe('3');
        expect(routerNavigate).toHaveBeenCalledWith([], {
            relativeTo: activatedRouteStub,
            fragment: 'tab=3',
            replaceUrl: true
        });
    });
});
