/** Normalized row for Station Management grid/detail (`public/demo/stations.json` → `data[]`). */
export interface StationManagementRow {
    id: number;
    stationInfoId: number;
    name: string;
    address: string;
    phone: string;
    cityName: string;
    districtName: string;
    companyName: string;
    resellerName: string;
    isRoaming: boolean;
    unitCode: string;
    isActive: boolean;
    isDeleted: boolean;
}
