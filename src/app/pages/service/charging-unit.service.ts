import { Injectable } from '@angular/core';

export interface ChargingUnit {
    deviceCode: string;
    serialNumber: string;
    chargePointId: number;
    stationId: number;
    lastHeartBeat: string;
    internalAddress: string | null;
    externalAddress: string | null;
    connectorNumber: number;
    createDate: string;
    brandId: number;
    brandName: string;
    modelId: number;
    model: string;
    ocppVersion: number;
    isFreePoint: boolean;
    limitedUsage: boolean;
    investorId: number;
    investor: string;
    status: number;
    hoStatus: string;
    accessTypeId: number;
    accessType: string;
    sendRoaming: boolean;
    RoamingID: string | null;
    isRoaming: number;
    note: string | null;
    photoUrl: string | null;
}

interface ApiResponse<T> {
    success: boolean;
    data: T[];
}

interface ChargingUnitPhoto {
    id: number;
    name: string;
    brandId?: number;
    imageCdnUrl: string | null;
}

interface RawChargingUnit {
    deviceCode: string;
    serialNumber: string;
    chargePointId: number;
    stationId: number;
    lastHeartBeat: string;
    internalAddress: string | null;
    externalAddress: string | null;
    connectorNumber: number;
    createDate: string;
    brandId: number;
    brandName: string;
    modelId: number;
    model: string;
    ocppVersion: number;
    isFreePoint: boolean;
    limitedUsage: boolean;
    investorId: number;
    investor: string;
    status: number;
    hoStatus: string;
    accessTypeId: number;
    accessType: string;
    sendRoaming: boolean;
    RoamingID: string | null;
    isRoaming: number;
    note: string | null;
}

@Injectable()
export class ChargingUnitService {
    async getChargingUnits(): Promise<ChargingUnit[]> {
        try {
            const [unitsRes, photosRes] = await Promise.all([
                fetch('/demo/charging_unit.json').then(r => r.json()) as Promise<ApiResponse<RawChargingUnit>>,
                fetch('/demo/charging_unit_photos.json').then(r => r.json()) as Promise<ApiResponse<ChargingUnitPhoto>>
            ]);

            const units = unitsRes?.success ? unitsRes.data : [];
            const photos = photosRes?.success ? photosRes.data : [];

            const photoMap = new Map<number, string | null>();
            for (const p of photos) {
                photoMap.set(p.id, p.imageCdnUrl);
            }

            return units.map(u => ({
                ...u,
                photoUrl: photoMap.get(u.modelId) ?? null
            }));
        } catch {
            return [];
        }
    }

    async getByStationId(stationId: number): Promise<ChargingUnit[]> {
        const all = await this.getChargingUnits();
        return all.filter(u => u.stationId === stationId);
    }
}
