import { Injectable } from '@angular/core';

export interface ChargingUnitConnector {
    deviceCode: string;
    RID: number;
    modelId: number;
    stationChargePointID: number;
    status: number;
    statusName: string;
    isActive: boolean;
    connectorNr: number;
    chargingStatusMessage: string | null;
    chargingStatus: string | null;
    meterStartDate: string | null;
    energyUsed: number | null;
    stationConnectorName: string;
    stationConnectorKW: number;
    stationConnectorAC: boolean;
    epdkSocketNumber: string;
    tariffId: number;
    tariffName: string;
    tariffSaleUnitPrice: number | null;
    RoamingID: string | null;
    IsRoaming: number;
}

interface ApiResponse<T> {
    success: boolean;
    data: T[];
}

@Injectable()
export class ChargingUnitConnectorService {
    async getConnectors(): Promise<ChargingUnitConnector[]> {
        let res: ApiResponse<ChargingUnitConnector>;
        try {
            const r = await fetch('/demo/charging_unit_connectors.json');
            if (!r.ok) {
                throw new Error('Charging unit connectors request failed');
            }
            res = (await r.json()) as ApiResponse<ChargingUnitConnector>;
        } catch {
            throw new Error('Charging unit connectors could not be loaded');
        }
        if (!res?.success) {
            throw new Error('Charging unit connectors could not be loaded');
        }
        return res.data ?? [];
    }
}
