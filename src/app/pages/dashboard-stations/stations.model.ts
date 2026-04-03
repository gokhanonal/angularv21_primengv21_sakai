export interface DashboardMapItemSummary {
    location_id: number;
    location_code: string;
    latitude: number;
    longitude: number;
    name: string;
    isAC: boolean;
    iconUrl: string;
    status: string;
}

export interface LocationsDemoPayload {
    success: boolean;
    data: {
        widgetTitle?: string | null;
        dashboardMapItemDataSummaries: RawMapItemSummary[];
    };
}

/** Shape as returned by JSON (may omit ids for older files). */
export interface RawMapItemSummary {
    location_id?: number;
    location_code?: string;
    latitude: number;
    longitude: number;
    name: string;
    isAC: boolean;
    iconUrl: string;
    status: string;
}

/** Row in the grid with a stable key for PrimeNG `dataKey`. */
export interface StationRow extends DashboardMapItemSummary {
    stationKey: string;
}
