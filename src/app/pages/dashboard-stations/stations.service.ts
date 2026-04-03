import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DashboardMapItemSummary, LocationsDemoPayload, RawMapItemSummary } from './stations.model';

export interface StationsDemoData {
    widgetTitle: string;
    summaries: DashboardMapItemSummary[];
}

function normalizeSummaries(raw: RawMapItemSummary[]): DashboardMapItemSummary[] {
    return raw.map((s, i) => {
        const location_id = s.location_id ?? i + 1;
        const code = s.location_code?.trim();
        return {
            location_id,
            location_code: code && code.length > 0 ? code : `STATION_${location_id}`,
            latitude: s.latitude,
            longitude: s.longitude,
            name: s.name,
            isAC: s.isAC,
            iconUrl: s.iconUrl,
            status: s.status
        };
    });
}

@Injectable({ providedIn: 'root' })
export class StationsService {
    private readonly http = inject(HttpClient);

    private static readonly DEMO_URL = '/demo/locations.json';

    loadDemo(): Observable<StationsDemoData> {
        return this.http.get<LocationsDemoPayload>(StationsService.DEMO_URL).pipe(
            map((res) => {
                const title = res.data?.widgetTitle?.trim();
                return {
                    widgetTitle: title && title.length > 0 ? title : 'Stations',
                    summaries: normalizeSummaries(res.data?.dashboardMapItemDataSummaries ?? [])
                };
            })
        );
    }
}
