import { ComponentFixture, TestBed } from '@angular/core/testing';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { ChargingUnitConnectorsWidget } from './chargingunitconnectorswidget';
import type { ChargingUnitConnector } from '@/app/pages/service/charging-unit-connector.service';
import { I18nService } from '@/app/core/i18n/i18n.service';

describe('ChargingUnitConnectorsWidget', () => {
    let fixture: ComponentFixture<ChargingUnitConnectorsWidget>;

    const sampleConnector = (): ChargingUnitConnector => ({
        deviceCode: '3434026406',
        RID: 3526,
        modelId: 3,
        stationChargePointID: 9689,
        status: 3,
        statusName: 'Kullanım Dışı',
        isActive: true,
        connectorNr: 1,
        chargingStatusMessage: null,
        chargingStatus: null,
        meterStartDate: null,
        energyUsed: null,
        stationConnectorName: 'Type 2',
        stationConnectorKW: 22,
        stationConnectorAC: true,
        epdkSocketNumber: '',
        tariffId: 39,
        tariffName: 'AC Tarife',
        tariffSaleUnitPrice: 35,
        RoamingID: null,
        IsRoaming: 0
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ChargingUnitConnectorsWidget],
            providers: [providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }), I18nService]
        }).compileComponents();

        fixture = TestBed.createComponent(ChargingUnitConnectorsWidget);
    });

    it('shows no-connector message when connectors input is empty', () => {
        fixture.componentRef.setInput('connectors', []);
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('No connector yet');
    });

    it('renders connector type, power, tariff and maps status to p-tag severity', () => {
        fixture.componentRef.setInput('connectors', [sampleConnector()]);
        fixture.detectChanges();
        const text = fixture.nativeElement.textContent as string;
        expect(text).toContain('Connector 1');
        expect(text).toContain('Type 2');
        expect(text).toContain('22 kW');
        expect(text).toContain('AC Tarife');
        expect(fixture.nativeElement.querySelector('p-tag')).toBeTruthy();
    });

    it('statusSeverity maps status codes to PrimeNG severities', () => {
        const cmp = fixture.componentInstance;
        expect(cmp.statusSeverity(1)).toBe('success');
        expect(cmp.statusSeverity(2)).toBe('info');
        expect(cmp.statusSeverity(3)).toBe('danger');
        expect(cmp.statusSeverity(4)).toBe('warn');
        expect(cmp.statusSeverity(99)).toBe('secondary');
    });

    it('renders Show QR and Operations actions when connectors exist', () => {
        fixture.componentRef.setInput('connectors', [sampleConnector()]);
        fixture.detectChanges();
        const text = fixture.nativeElement.textContent as string;
        expect(text).toContain('Show QR');
        expect(text).toContain('Operations');
    });

    it('openQrDialog sets active connector, shows dialog, and qrImageAltText uses connector number', () => {
        const cmp = fixture.componentInstance;
        const c = sampleConnector();
        cmp.openQrDialog(c);
        expect(cmp.qrDialogVisible).toBe(true);
        expect(cmp.qrImageAltText()).toBe('QR code for Connector 1');
    });

    it('openOpsDialog shows operations dialog', () => {
        const cmp = fixture.componentInstance;
        cmp.openOpsDialog(sampleConnector());
        expect(cmp.opsDialogVisible).toBe(true);
    });

    it('qrDialogTitle and opsDialogTitle return translated headers', () => {
        const cmp = fixture.componentInstance;
        expect(cmp.qrDialogTitle()).toBe('QR Code');
        expect(cmp.opsDialogTitle()).toBe('Operations');
    });
});
