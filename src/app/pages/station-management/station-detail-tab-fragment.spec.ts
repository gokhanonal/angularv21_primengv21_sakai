import { parseStationDetailTabFragment } from './station-detail-tab-fragment';

describe('parseStationDetailTabFragment', () => {
    it('returns "0" for null fragment', () => {
        expect(parseStationDetailTabFragment(null)).toBe('0');
    });

    it('returns "0" for empty fragment', () => {
        expect(parseStationDetailTabFragment('')).toBe('0');
    });

    it('parses tab=0 through tab=6', () => {
        expect(parseStationDetailTabFragment('tab=0')).toBe('0');
        expect(parseStationDetailTabFragment('tab=6')).toBe('6');
    });

    it('returns "0" for out-of-range digit', () => {
        expect(parseStationDetailTabFragment('tab=7')).toBe('0');
        expect(parseStationDetailTabFragment('tab=9')).toBe('0');
    });

    it('returns "0" for multi-digit tab value', () => {
        expect(parseStationDetailTabFragment('tab=10')).toBe('0');
        expect(parseStationDetailTabFragment('tab=01')).toBe('0');
    });

    it('returns "0" for non-numeric tab value', () => {
        expect(parseStationDetailTabFragment('tab=x')).toBe('0');
    });

    it('returns "0" for unknown fragment keys', () => {
        expect(parseStationDetailTabFragment('foo=2')).toBe('0');
        expect(parseStationDetailTabFragment('other')).toBe('0');
    });
});
