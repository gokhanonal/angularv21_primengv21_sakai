import { ChargingUnitConnectorService } from './charging-unit-connector.service';

describe('ChargingUnitConnectorService', () => {
    let service: ChargingUnitConnectorService;
    let fetchSpy: jasmine.Spy;

    const row = {
        deviceCode: 'D1',
        RID: 1,
        modelId: 1,
        stationChargePointID: 1,
        status: 1,
        statusName: 'A',
        isActive: true,
        connectorNr: 1,
        chargingStatusMessage: null,
        chargingStatus: null,
        meterStartDate: null,
        energyUsed: null,
        stationConnectorName: 'T2',
        stationConnectorKW: 22,
        stationConnectorAC: true,
        epdkSocketNumber: '',
        tariffId: 1,
        tariffName: 'Tar',
        tariffSaleUnitPrice: 35,
        RoamingID: null,
        IsRoaming: 0
    };

    beforeEach(() => {
        service = new ChargingUnitConnectorService();
        fetchSpy = spyOn(window, 'fetch');
    });

    it('returns data array when response is ok and success is true', async () => {
        fetchSpy.and.returnValue(
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ success: true, data: [row] })
            } as Response)
        );
        const out = await service.getConnectors();
        expect(out.length).toBe(1);
        expect(out[0].deviceCode).toBe('D1');
        expect(out[0].RID).toBe(1);
    });

    it('throws when response is not ok', async () => {
        fetchSpy.and.returnValue(
            Promise.resolve({
                ok: false,
                status: 500,
                json: () => Promise.resolve({})
            } as Response)
        );
        await expectAsync(service.getConnectors()).toBeRejectedWithError();
    });

    it('throws when success is false', async () => {
        fetchSpy.and.returnValue(
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ success: false, data: [row] })
            } as Response)
        );
        await expectAsync(service.getConnectors()).toBeRejectedWithError();
    });

    it('throws when fetch rejects', async () => {
        fetchSpy.and.returnValue(Promise.reject(new Error('network')));
        await expectAsync(service.getConnectors()).toBeRejectedWithError();
    });

    it('throws when json() rejects', async () => {
        fetchSpy.and.returnValue(
            Promise.resolve({
                ok: true,
                json: () => Promise.reject(new Error('bad json'))
            } as Response)
        );
        await expectAsync(service.getConnectors()).toBeRejectedWithError();
    });
});
