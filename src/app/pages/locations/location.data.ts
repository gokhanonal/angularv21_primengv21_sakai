export type SiteStatus = 'Active' | 'Planned';

export interface SiteLocation {
    location_id: number;
    location_code: string;
    site: string;
    city: string;
    country: string;
    region: string;
    capacity: number;
    status: SiteStatus;
    lat: number;
    lng: number;
}

export const STATUS_COLORS: Record<SiteStatus, string> = {
    Active: '#22c55e',
    Planned: '#f97316',
};

export const MOCK_LOCATIONS: SiteLocation[] = [
    { location_id: 1, location_code: 'EMEA-SE-STO', site: 'Nordic DC', city: 'Stockholm', country: 'Sweden', region: 'EMEA', capacity: 420, status: 'Active', lat: 59.33, lng: 18.07 },
    { location_id: 2, location_code: 'EMEA-UK-LON', site: 'Thames Hub', city: 'London', country: 'UK', region: 'EMEA', capacity: 890, status: 'Active', lat: 51.51, lng: -0.13 },
    { location_id: 3, location_code: 'EMEA-UK-EDI', site: 'Castle Edge', city: 'Edinburgh', country: 'UK', region: 'EMEA', capacity: 310, status: 'Active', lat: 55.95, lng: -3.19 },
    { location_id: 4, location_code: 'EMEA-DE-BER', site: 'Spree Campus', city: 'Berlin', country: 'Germany', region: 'EMEA', capacity: 640, status: 'Active', lat: 52.52, lng: 13.4 },
    { location_id: 5, location_code: 'EMEA-NL-AMS', site: 'Canal Node', city: 'Amsterdam', country: 'Netherlands', region: 'EMEA', capacity: 510, status: 'Planned', lat: 52.37, lng: 4.9 },
    { location_id: 6, location_code: 'EMEA-FR-PAR', site: 'Seine Works', city: 'Paris', country: 'France', region: 'EMEA', capacity: 720, status: 'Active', lat: 48.86, lng: 2.35 },
    { location_id: 7, location_code: 'AMER-US-NYC', site: 'Hudson Yard Ops', city: 'New York', country: 'USA', region: 'Americas', capacity: 1200, status: 'Active', lat: 40.71, lng: -74.01 },
    { location_id: 8, location_code: 'AMER-US-SFO', site: 'Bay Stack', city: 'San Francisco', country: 'USA', region: 'Americas', capacity: 980, status: 'Active', lat: 37.77, lng: -122.42 },
    { location_id: 9, location_code: 'AMER-US-CHI', site: 'Lakeside Row', city: 'Chicago', country: 'USA', region: 'Americas', capacity: 560, status: 'Active', lat: 41.88, lng: -87.63 },
    { location_id: 10, location_code: 'AMER-CA-YYZ', site: 'Maple Core', city: 'Toronto', country: 'Canada', region: 'Americas', capacity: 440, status: 'Planned', lat: 43.65, lng: -79.38 },
    { location_id: 11, location_code: 'APAC-AU-SYD', site: 'Harbour Bridge DC', city: 'Sydney', country: 'Australia', region: 'APAC', capacity: 750, status: 'Active', lat: -33.87, lng: 151.21 },
    { location_id: 12, location_code: 'APAC-SG-SIN', site: 'Marina Link', city: 'Singapore', country: 'Singapore', region: 'APAC', capacity: 1100, status: 'Active', lat: 1.35, lng: 103.82 },
    { location_id: 13, location_code: 'APAC-JP-TYO', site: 'Sakura Grid', city: 'Tokyo', country: 'Japan', region: 'APAC', capacity: 930, status: 'Active', lat: 35.68, lng: 139.69 },
    { location_id: 14, location_code: 'APAC-IN-BOM', site: 'Gateway Peak', city: 'Mumbai', country: 'India', region: 'APAC', capacity: 680, status: 'Planned', lat: 19.08, lng: 72.88 },
    { location_id: 15, location_code: 'AMER-BR-GRU', site: 'Pampa Edge', city: 'São Paulo', country: 'Brazil', region: 'Americas', capacity: 520, status: 'Active', lat: -23.55, lng: -46.63 },
    { location_id: 16, location_code: 'EMEA-DE-FRA', site: 'Rhine Vault', city: 'Frankfurt', country: 'Germany', region: 'EMEA', capacity: 870, status: 'Active', lat: 50.11, lng: 8.68 },
    { location_id: 17, location_code: 'APAC-HK-HKG', site: 'Pearl Delta', city: 'Hong Kong', country: 'China', region: 'APAC', capacity: 960, status: 'Planned', lat: 22.32, lng: 114.17 },
    { location_id: 18, location_code: 'EMEA-NO-OSL', site: 'Fjord Station', city: 'Oslo', country: 'Norway', region: 'EMEA', capacity: 380, status: 'Active', lat: 59.91, lng: 10.75 },
];

export function getLocationById(id: number): SiteLocation | undefined {
    return MOCK_LOCATIONS.find((l) => l.location_id === id);
}
