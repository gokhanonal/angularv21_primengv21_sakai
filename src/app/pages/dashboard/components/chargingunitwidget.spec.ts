import { ComponentFixture, TestBed } from '@angular/core/testing';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { ChargingUnitWidget } from './chargingunitwidget';
import { ChargingUnit, ChargingUnitService } from '@/app/pages/service/charging-unit.service';
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

    async function setup(units: ChargingUnit[] = mockUnits): Promise<void> {
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [ChargingUnitWidget],
            providers: [providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }), I18nService]
        })
            .overrideComponent(ChargingUnitWidget, {
                set: {
                    providers: [
                        {
                            provide: ChargingUnitService,
                            useValue: { getChargingUnits: () => Promise.resolve(units) }
                        }
                    ]
                }
            })
            .compileComponents();

        fixture = TestBed.createComponent(ChargingUnitWidget);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    beforeEach(async () => {
        await setup();
    });

    it('renders card chrome, title line, field labels, and loads data from ChargingUnitService', () => {
        const text = fixture.nativeElement.textContent as string;
        expect(text).toContain('Add New');
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
});
