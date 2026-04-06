/** Valid `p-tabs` values for station management detail (FR-2). */
export const STATION_DETAIL_VALID_TAB_VALUES = new Set(['0', '1', '2', '3', '4', '5', '6']);

/**
 * Parses `#tab=N` fragment (canonical: single digit 0–6). Invalid → `"0"`.
 */
export function parseStationDetailTabFragment(fragment: string | null): string {
    if (!fragment) {
        return '0';
    }
    const match = fragment.match(/^tab=(\d)$/);
    if (match && STATION_DETAIL_VALID_TAB_VALUES.has(match[1])) {
        return match[1];
    }
    return '0';
}
