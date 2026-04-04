import { ChargingUnitService } from './charging-unit.service';

describe('ChargingUnitService', () => {
    let service: ChargingUnitService;
    let fetchSpy: jasmine.Spy;

    const unitRow = {
        deviceCode: 'D1',
        serialNumber: 'S1',
        chargePointId: 1,
        stationId: 100,
        lastHeartBeat: '2026-01-01T00:00:00.000',
        internalAddress: null,
        externalAddress: null,
        connectorNumber: 1,
        createDate: '2026-01-01T00:00:00.000',
        brandId: 1,
        brandName: 'B',
        modelId: 42,
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
        note: null
    };

    function mockFetches(unitsBody: unknown, photosBody: unknown): void {
        fetchSpy.and.callFake((url: string) => {
            const json = url.includes('charging_unit.json') ? unitsBody : photosBody;
            return Promise.resolve({
                json: () => Promise.resolve(json)
            } as Response);
        });
    }

    beforeEach(() => {
        service = new ChargingUnitService();
        fetchSpy = spyOn(window, 'fetch');
    });

    it('returns mapped units with photoUrl from photos when success is true', async () => {
        mockFetches(
            { success: true, data: [unitRow] },
            {
                success: true,
                data: [{ id: 42, name: 'p', brandId: 1, imageCdnUrl: 'https://cdn.example/img.png' }]
            }
        );
        const out = await service.getChargingUnits();
        expect(out.length).toBe(1);
        expect(out[0].deviceCode).toBe('D1');
        expect(out[0].photoUrl).toBe('https://cdn.example/img.png');
    });

    it('returns empty array when units response success is false', async () => {
        mockFetches({ success: false, data: [unitRow] }, { success: true, data: [] });
        expect(await service.getChargingUnits()).toEqual([]);
    });

    it('returns empty array when fetch rejects', async () => {
        fetchSpy.and.returnValue(Promise.reject(new Error('network')));
        expect(await service.getChargingUnits()).toEqual([]);
    });

    it('returns empty array when json() rejects', async () => {
        fetchSpy.and.returnValue(
            Promise.resolve({
                json: () => Promise.reject(new Error('bad json'))
            } as Response)
        );
        expect(await service.getChargingUnits()).toEqual([]);
    });

    it('getByStationId filters by stationId', async () => {
        mockFetches(
            {
                success: true,
                data: [
                    { ...unitRow, stationId: 1, deviceCode: 'A' },
                    { ...unitRow, stationId: 2, deviceCode: 'B' }
                ]
            },
            { success: true, data: [] }
        );
        const filtered = await service.getByStationId(2);
        expect(filtered.length).toBe(1);
        expect(filtered[0].deviceCode).toBe('B');
    });
});
