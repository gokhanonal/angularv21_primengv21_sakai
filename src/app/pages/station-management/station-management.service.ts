import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { StationManagementRow } from './station-management.model';

interface StationsJsonPayload {
    success?: boolean;
    data?: unknown[];
}

@Injectable({ providedIn: 'root' })
export class StationManagementService {
    private readonly http = inject(HttpClient);

    readonly rows = signal<StationManagementRow[]>([]);
    /** i18n key for load error, or null when OK. */
    readonly loadError = signal<string | null>(null);

    load(): Observable<void> {
        this.loadError.set(null);
        return this.http.get<StationsJsonPayload>('/demo/stations.json').pipe(
            map((payload) => this.normalizePayload(payload)),
            tap({
                next: (list) => {
                    this.rows.set(list);
                },
                error: () => {
                    this.rows.set([]);
                    this.loadError.set('stationMgmt.loadErrorHttp');
                }
            }),
            map(() => undefined)
        );
    }

    findById(id: number): StationManagementRow | undefined {
        return this.rows().find((r) => r.id === id);
    }

    removeById(id: number): void {
        this.rows.update((list) => list.filter((r) => r.id !== id));
    }

    private normalizePayload(payload: StationsJsonPayload | null | undefined): StationManagementRow[] {
        if (!payload || payload.success !== true || !Array.isArray(payload.data)) {
            this.loadError.set('stationMgmt.loadErrorPayload');
            return [];
        }
        return payload.data.map((raw, i) => this.normalizeRow(raw, i)).filter((r): r is StationManagementRow => r !== null);
    }

    private normalizeRow(raw: unknown, index: number): StationManagementRow | null {
        if (!raw || typeof raw !== 'object') {
            return null;
        }
        const o = raw as Record<string, unknown>;
        const id = toInt(o['id'], toInt(o['stationInfoId'], index + 1));
        const stationInfoId = toInt(o['stationInfoId'], id);
        return {
            id,
            stationInfoId,
            name: String(o['name'] ?? ''),
            address: String(o['address'] ?? ''),
            phone: String(o['phone'] ?? ''),
            cityName: String(o['cityName'] ?? ''),
            districtName: String(o['districtName'] ?? ''),
            companyName: String(o['companyName'] ?? ''),
            resellerName: String(o['resellerName'] ?? ''),
            isRoaming: Boolean(o['isRoaming']),
            unitCode: String(o['unitCode'] ?? ''),
            isActive: Boolean(o['isActive']),
            isDeleted: Boolean(o['isDeleted'])
        };
    }
}

function toInt(v: unknown, fallback: number): number {
    const n = typeof v === 'number' ? v : Number.parseInt(String(v), 10);
    return Number.isFinite(n) ? n : fallback;
}
