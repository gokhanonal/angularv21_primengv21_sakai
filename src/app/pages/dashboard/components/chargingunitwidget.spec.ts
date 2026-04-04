import { ComponentFixture, TestBed } from '@angular/core/testing';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { ChargingUnitWidget } from './chargingunitwidget';
import { ChargingUnit, ChargingUnitService } from '@/app/pages/service/charging-unit.service';
import { I18nService } from '@/app/core/i18n/i18n.service';

describe('ChargingUnitWidget', () => {
    let fixture: ComponentFixture<ChargingUnitWidget>;

    const mockUnits: ChargingUnit[] = [
        {
            deviceCode: '3434026401',
            serialNumber: 'SN-1',
            chargePointId: 1,
            stationId: 1,
            lastHeartBeat: '2026-01-01T00:00:00.000',
            internalAddress: null,
            externalAddress: null,
            connectorNumber: 1,
            createDate: '2026-01-01T00:00:00.000',
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
        }
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ChargingUnitWidget],
            providers: [providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }), I18nService]
        })
            .overrideComponent(ChargingUnitWidget, {
                set: {
                    providers: [
                        {
                            provide: ChargingUnitService,
                            useValue: { getChargingUnits: () => Promise.resolve(mockUnits) }
                        }
                    ]
                }
            })
            .compileComponents();

        fixture = TestBed.createComponent(ChargingUnitWidget);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it('renders card title and loads rows from ChargingUnitService', () => {
        const text = fixture.nativeElement.textContent as string;
        expect(text).toContain('Charging units');
        expect(text).toContain('3434026401');
        expect(text).toContain('SN-1');
    });

    it('renders three action buttons with expected aria-labels', () => {
        const row = fixture.nativeElement.querySelector('tbody tr');
        expect(row).toBeTruthy();
        const buttons = row.querySelectorAll('button.p-button-icon-only');
        expect(buttons.length).toBe(3);
        expect(buttons[0].getAttribute('aria-label')).toBe('Edit');
        expect(buttons[1].getAttribute('aria-label')).toBe('Delete');
        expect(buttons[2].getAttribute('aria-label')).toBe('Configuration');
    });
});
