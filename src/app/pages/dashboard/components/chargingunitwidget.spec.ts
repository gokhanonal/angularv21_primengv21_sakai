import { ComponentFixture, TestBed } from '@angular/core/testing';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { ChargingUnitWidget } from './chargingunitwidget';
import { ChargingUnit, ChargingUnitService } from '@/app/pages/service/charging-unit.service';
import { ChargingUnitConnectorService } from '@/app/pages/service/charging-unit-connector.service';
import { I18nService } from '@/app/core/i18n/i18n.service';

describe('ChargingUnitWidget', () => {
    let fixture: ComponentFixture<ChargingUnitWidget>;

    const baseUnit = (): ChargingUnit => ({
        deviceCode: '3434026401',
        serialNumber: 'SN-1',
        chargePointId: 1,
        stationId: 1,
        lastHeartBeat: '2026-01-01T12:00:00.000Z',
        internalAddress: null,
        externalAddress: null,
        connectorNumber: 1,
        createDate: '2026-01-02T15:30:00.000Z',
        brandId: 1,
        brandName: 'B',
        modelId: 1,
        model: 'M',
        ocppVersion: 1600,
        isFreePoint: false,
        limitedUsage: false,
        investorId: 1,
        investor: 'Op',
        status: 1,
        hoStatus: 'OK',
        accessTypeId: 1,
        accessType: 'Public',
        sendRoaming: false,
        RoamingID: null,
        isRoaming: 0,
        note: null,
        photoUrl: null
    });

    const mockUnits: ChargingUnit[] = [baseUnit()];

    async function setup(
        units: ChargingUnit[] = mockUnits,
        getConnectors: () => Promise<unknown> = () => Promise.resolve([]),
        options?: { stationId?: number }
    ): Promise<void> {
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [ChargingUnitWidget],
            providers: [
                providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
                I18nService,
                MessageService
            ]
        })
            .overrideComponent(ChargingUnitWidget, {
                set: {
                    providers: [
                        {
                            provide: ChargingUnitService,
                            useValue: {
                                getChargingUnits: () => Promise.resolve(units),
                                getByStationId: (id: number) =>
                                    Promise.resolve(units.filter((u) => u.stationId === id))
                            }
                        },
                        {
                            provide: ChargingUnitConnectorService,
                            useValue: { getConnectors }
                        },
                        MessageService
                    ]
                }
            })
            .compileComponents();

        fixture = TestBed.createComponent(ChargingUnitWidget);
        if (options?.stationId !== undefined) {
            fixture.componentRef.setInput('stationId', options.stationId);
        }
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    beforeEach(async () => {
        await setup();
    });

    it('renders card chrome, title line, field labels, and loads data from ChargingUnitService', () => {
        const text = fixture.nativeElement.textContent as string;
        expect(text).toContain('Add Charging Unit');
        expect(text).toContain('B - M - 3434026401');
        expect(text).toContain('OK');
        expect(text).toContain('Access Type');
        expect(text).toContain('Public');
        expect(text).toContain('Serial #');
        expect(text).toContain('SN-1');
        expect(text).toContain('Investor');
        expect(text).toContain('Op');
        expect(text).toContain('Creation Date');
        expect(text).toContain('Last Connection');
        expect(text).toContain('Unit IP Address');
        expect(text).toMatch(/\u2014/);
    });

    it('renders three action icon buttons with expected aria-labels on each card', () => {
        const card = fixture.nativeElement.querySelector('.charging-unit-card');
        expect(card).toBeTruthy();
        const buttons = card.querySelectorAll('button.p-button-icon-only');
        expect(buttons.length).toBe(3);
        expect(buttons[0].getAttribute('aria-label')).toBe('Edit');
        expect(buttons[1].getAttribute('aria-label')).toBe('Delete');
        expect(buttons[2].getAttribute('aria-label')).toBe('Configuration');
    });

    it('shows p-paginator when there are more units than page size', async () => {
        const six = Array.from({ length: 6 }, (_, i) => ({
            ...baseUnit(),
            deviceCode: `DEV-${i}`,
            serialNumber: `SN-${i}`
        }));
        await setup(six);
        expect(fixture.nativeElement.querySelector('p-paginator')).toBeTruthy();
    });

    it('renders Connectors section and no-connector copy when device has no connectors', async () => {
        await setup();
        const text = fixture.nativeElement.textContent as string;
        expect(text).toContain('Connectors');
        expect(text).toContain('No connector yet');
    });

    it('without stationId calls getChargingUnits and lists all units from the service', async () => {
        const getChargingUnits = jasmine.createSpy('getChargingUnits').and.returnValue(Promise.resolve(mockUnits));
        const getByStationId = jasmine.createSpy('getByStationId');
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [ChargingUnitWidget],
            providers: [
                providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
                I18nService,
                MessageService
            ]
        })
            .overrideComponent(ChargingUnitWidget, {
                set: {
                    providers: [
                        { provide: ChargingUnitService, useValue: { getChargingUnits, getByStationId } },
                        {
                            provide: ChargingUnitConnectorService,
                            useValue: { getConnectors: () => Promise.resolve([]) }
                        },
                        MessageService
                    ]
                }
            })
            .compileComponents();

        fixture = TestBed.createComponent(ChargingUnitWidget);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(getChargingUnits).toHaveBeenCalled();
        expect(getByStationId).not.toHaveBeenCalled();
        expect(fixture.nativeElement.textContent as string).toContain('B - M - 3434026401');
    });

    it('with stationId calls getByStationId and shows only units for that station', async () => {
        const uStation1 = { ...baseUnit(), stationId: 1, deviceCode: 'S1-DEV' };
        const uStation2 = { ...baseUnit(), stationId: 2, deviceCode: 'S2-DEV', serialNumber: 'SN-2' };
        const getChargingUnits = jasmine.createSpy('getChargingUnits');
        const getByStationId = jasmine
            .createSpy('getByStationId')
            .and.returnValue(Promise.resolve([uStation1]));
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [ChargingUnitWidget],
            providers: [
                providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
                I18nService,
                MessageService
            ]
        })
            .overrideComponent(ChargingUnitWidget, {
                set: {
                    providers: [
                        { provide: ChargingUnitService, useValue: { getChargingUnits, getByStationId } },
                        {
                            provide: ChargingUnitConnectorService,
                            useValue: { getConnectors: () => Promise.resolve([]) }
                        },
                        MessageService
                    ]
                }
            })
            .compileComponents();

        fixture = TestBed.createComponent(ChargingUnitWidget);
        fixture.componentRef.setInput('stationId', 1);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(getByStationId).toHaveBeenCalledWith(1);
        expect(getChargingUnits).not.toHaveBeenCalled();
        const text = fixture.nativeElement.textContent as string;
        expect(text).toContain('S1-DEV');
        expect(text).not.toContain('S2-DEV');
    });

    it('when stationId is set with a shared mock, only matching units appear in the template', async () => {
        const u1 = { ...baseUnit(), stationId: 100, deviceCode: 'ONLY-100' };
        const u2 = { ...baseUnit(), stationId: 200, deviceCode: 'ONLY-200', serialNumber: 'SN-200' };
        await setup([u1, u2], () => Promise.resolve([]), { stationId: 100 });
        const text = fixture.nativeElement.textContent as string;
        expect(text).toContain('ONLY-100');
        expect(text).not.toContain('ONLY-200');
    });

    it('shows error toast and empty connectors when connector load fails', async () => {
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [ChargingUnitWidget],
            providers: [
                providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
                I18nService,
                MessageService
            ]
        })
            .overrideComponent(ChargingUnitWidget, {
                set: {
                    providers: [
                        {
                            provide: ChargingUnitService,
                            useValue: {
                                getChargingUnits: () => Promise.resolve(mockUnits),
                                getByStationId: (id: number) =>
                                    Promise.resolve(mockUnits.filter((u) => u.stationId === id))
                            }
                        },
                        {
                            provide: ChargingUnitConnectorService,
                            useValue: { getConnectors: () => Promise.reject(new Error('fail')) }
                        },
                        MessageService
                    ]
                }
            })
            .compileComponents();

        fixture = TestBed.createComponent(ChargingUnitWidget);
        const messages = fixture.componentRef.injector.get(MessageService);
        spyOn(messages, 'add');
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(messages.add).toHaveBeenCalledWith(
            jasmine.objectContaining({
                severity: 'error',
                summary: 'Connector Load Error',
                detail: 'Connectors could not be loaded. Showing empty connector information.'
            })
        );
        expect(fixture.nativeElement.textContent).toContain('No connector yet');
    });
});
