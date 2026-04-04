import { TestBed } from '@angular/core/testing';
import { GridStateService } from './grid-state.service';
import { GridState } from './grid-state.model';

describe('GridStateService', () => {
    const keysUsed: string[] = [];

    function trackKey(pageName: string, gridName: string): string {
        const key = `grid.${pageName}.${gridName}`;
        keysUsed.push(key);
        return key;
    }

    beforeEach(() => {
        TestBed.configureTestingModule({});
        keysUsed.length = 0;
    });

    afterEach(() => {
        for (const key of keysUsed) {
            localStorage.removeItem(key);
        }
        keysUsed.length = 0;
    });

    function injectService(): GridStateService {
        return TestBed.inject(GridStateService);
    }

    it('save/load round-trip preserves all four properties', () => {
        const service = injectService();
        const state: GridState = {
            visibleColumns: ['a', 'b'],
            columnOrder: ['b', 'a'],
            columnWidths: { a: '100px', b: '200px' },
            sortState: [{ field: 'a', order: 1 }]
        };
        trackKey('round-trip', 'grid');
        service.save('round-trip', 'grid', state);
        const loaded = service.load('round-trip', 'grid');
        expect(loaded).not.toBeNull();
        expect(loaded!.visibleColumns).toEqual(['a', 'b']);
        expect(loaded!.columnOrder).toEqual(['b', 'a']);
        expect(loaded!.columnWidths).toEqual({ a: '100px', b: '200px' });
        expect(loaded!.sortState).toEqual([{ field: 'a', order: 1 }]);
    });

    it('load returns null when key does not exist', () => {
        const service = injectService();
        expect(service.load('no-such-page', 'no-such-grid')).toBeNull();
    });

    it('clear removes stored state so load returns null', () => {
        const service = injectService();
        const state: GridState = {
            visibleColumns: ['x'],
            columnOrder: ['x'],
            columnWidths: {},
            sortState: []
        };
        trackKey('clear-test', 'main');
        service.save('clear-test', 'main', state);
        expect(service.load('clear-test', 'main')).not.toBeNull();
        service.clear('clear-test', 'main');
        expect(service.load('clear-test', 'main')).toBeNull();
    });

    it('uses localStorage key grid.station-management.main for that page and grid', () => {
        const service = injectService();
        const state: GridState = {
            visibleColumns: ['c'],
            columnOrder: ['c'],
            columnWidths: {},
            sortState: []
        };
        trackKey('station-management', 'main');
        service.save('station-management', 'main', state);
        expect(localStorage.getItem('grid.station-management.main')).toBe(JSON.stringify(state));
    });

    it('load returns null for corrupt JSON at the key', () => {
        const service = injectService();
        const key = trackKey('corrupt', 'grid');
        localStorage.setItem(key, 'not-json{');
        expect(service.load('corrupt', 'grid')).toBeNull();
    });

    it('load returns null when JSON object is missing required properties', () => {
        const service = injectService();
        const key = trackKey('invalid-shape', 'grid');
        localStorage.setItem(
            key,
            JSON.stringify({
                visibleColumns: [],
                columnOrder: [],
                columnWidths: {}
            })
        );
        expect(service.load('invalid-shape', 'grid')).toBeNull();
    });

    it('load returns null when visibleColumns is not a string array', () => {
        const service = injectService();
        const key = trackKey('wrong-types', 'grid');
        localStorage.setItem(
            key,
            JSON.stringify({
                visibleColumns: 42,
                columnOrder: [],
                columnWidths: {},
                sortState: []
            })
        );
        expect(service.load('wrong-types', 'grid')).toBeNull();
    });

    it('load returns null when sortState entries have wrong field or order types', () => {
        const service = injectService();
        const key = trackKey('bad-sort', 'grid');
        localStorage.setItem(
            key,
            JSON.stringify({
                visibleColumns: [],
                columnOrder: [],
                columnWidths: {},
                sortState: [{ field: 123, order: 'asc' }]
            })
        );
        expect(service.load('bad-sort', 'grid')).toBeNull();
    });

    it('different page and grid names map to different keys and isolated state', () => {
        const service = injectService();
        const stateA: GridState = {
            visibleColumns: ['1'],
            columnOrder: ['1'],
            columnWidths: {},
            sortState: [{ field: '1', order: -1 }]
        };
        const stateB: GridState = {
            visibleColumns: ['2'],
            columnOrder: ['2'],
            columnWidths: {},
            sortState: [{ field: '2', order: 1 }]
        };
        trackKey('page-a', 'grid-x');
        trackKey('page-b', 'grid-y');
        service.save('page-a', 'grid-x', stateA);
        service.save('page-b', 'grid-y', stateB);
        expect(service.load('page-a', 'grid-x')).toEqual(stateA);
        expect(service.load('page-b', 'grid-y')).toEqual(stateB);
    });

    it('save/load round-trip with empty arrays and empty columnWidths', () => {
        const service = injectService();
        const state: GridState = {
            visibleColumns: [],
            columnOrder: [],
            columnWidths: {},
            sortState: []
        };
        trackKey('empty', 'grid');
        service.save('empty', 'grid', state);
        expect(service.load('empty', 'grid')).toEqual(state);
    });
});
