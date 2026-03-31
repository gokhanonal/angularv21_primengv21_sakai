export type SiteStatus = 'Active' | 'Planned';

export interface SiteLocation {
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
    { site: 'Nordic DC', city: 'Stockholm', country: 'Sweden', region: 'EMEA', capacity: 420, status: 'Active', lat: 59.33, lng: 18.07 },
    { site: 'Thames Hub', city: 'London', country: 'UK', region: 'EMEA', capacity: 890, status: 'Active', lat: 51.51, lng: -0.13 },
    { site: 'Castle Edge', city: 'Edinburgh', country: 'UK', region: 'EMEA', capacity: 310, status: 'Active', lat: 55.95, lng: -3.19 },
    { site: 'Spree Campus', city: 'Berlin', country: 'Germany', region: 'EMEA', capacity: 640, status: 'Active', lat: 52.52, lng: 13.40 },
    { site: 'Canal Node', city: 'Amsterdam', country: 'Netherlands', region: 'EMEA', capacity: 510, status: 'Planned', lat: 52.37, lng: 4.90 },
    { site: 'Seine Works', city: 'Paris', country: 'France', region: 'EMEA', capacity: 720, status: 'Active', lat: 48.86, lng: 2.35 },
    { site: 'Hudson Yard Ops', city: 'New York', country: 'USA', region: 'Americas', capacity: 1200, status: 'Active', lat: 40.71, lng: -74.01 },
    { site: 'Bay Stack', city: 'San Francisco', country: 'USA', region: 'Americas', capacity: 980, status: 'Active', lat: 37.77, lng: -122.42 },
    { site: 'Lakeside Row', city: 'Chicago', country: 'USA', region: 'Americas', capacity: 560, status: 'Active', lat: 41.88, lng: -87.63 },
    { site: 'Maple Core', city: 'Toronto', country: 'Canada', region: 'Americas', capacity: 440, status: 'Planned', lat: 43.65, lng: -79.38 },
    { site: 'Harbour Bridge DC', city: 'Sydney', country: 'Australia', region: 'APAC', capacity: 750, status: 'Active', lat: -33.87, lng: 151.21 },
    { site: 'Marina Link', city: 'Singapore', country: 'Singapore', region: 'APAC', capacity: 1100, status: 'Active', lat: 1.35, lng: 103.82 },
    { site: 'Sakura Grid', city: 'Tokyo', country: 'Japan', region: 'APAC', capacity: 930, status: 'Active', lat: 35.68, lng: 139.69 },
    { site: 'Gateway Peak', city: 'Mumbai', country: 'India', region: 'APAC', capacity: 680, status: 'Planned', lat: 19.08, lng: 72.88 },
    { site: 'Pampa Edge', city: 'São Paulo', country: 'Brazil', region: 'Americas', capacity: 520, status: 'Active', lat: -23.55, lng: -46.63 },
    { site: 'Rhine Vault', city: 'Frankfurt', country: 'Germany', region: 'EMEA', capacity: 870, status: 'Active', lat: 50.11, lng: 8.68 },
    { site: 'Pearl Delta', city: 'Hong Kong', country: 'China', region: 'APAC', capacity: 960, status: 'Planned', lat: 22.32, lng: 114.17 },
    { site: 'Fjord Station', city: 'Oslo', country: 'Norway', region: 'EMEA', capacity: 380, status: 'Active', lat: 59.91, lng: 10.75 },
];
