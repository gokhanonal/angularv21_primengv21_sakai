import {
    applyScrollableColumnWidthsToTable,
    computeScrollableColumnWidthsPx,
    parseCssLengthToPx,
    readScrollableHeaderDomWidthsPx,
    STATION_MGMT_AUTO_SIZE_HEADER_EXTRA_PX,
    STATION_MGMT_AUTO_SIZE_HEADER_TEXT_MEASURE_SCALE,
    STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX,
    STATION_MGMT_FROZEN_LEFT_TH_COUNT
} from './station-management-column-autosize';

describe('station-management-column-autosize', () => {
    describe('parseCssLengthToPx', () => {
        it('parses rem using root px', () => {
            expect(parseCssLengthToPx('9rem', 16)).toBe(144);
        });

        it('parses px', () => {
            expect(parseCssLengthToPx('120px', 16)).toBe(120);
        });

        it('returns 0 for empty or unknown', () => {
            expect(parseCssLengthToPx('', 16)).toBe(0);
            expect(parseCssLengthToPx('auto', 16)).toBe(0);
        });
    });

    describe('computeScrollableColumnWidthsPx', () => {
        const measure = (t: string): number => (t?.length ?? 0) * 5;

        it('never goes below min width from rem', () => {
            const cols = [{ field: 'phone', minWidthCss: '10rem', headerText: 'P', cellTexts: ['1'] }];
            expect(computeScrollableColumnWidthsPx(cols, measure, STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX)['phone']).toBeGreaterThanOrEqual(160);
        });

        it('clamps to maxWidthPx', () => {
            const long = 'x'.repeat(500);
            const cols = [{ field: 'a', minWidthCss: '1rem', headerText: long, cellTexts: [long] }];
            expect(computeScrollableColumnWidthsPx(cols, (t) => t.length * 10, 200)['a']).toBe(200);
        });

        it('when header text is longer than all cell samples, width is at least header-based floor', () => {
            const measure = (text: string): number => (text?.length ?? 0) * 7;
            const headerLen = 18;
            const headerText = 'H'.repeat(headerLen);
            const cols = [
                {
                    field: 'boolish',
                    minWidthCss: '1rem',
                    headerText,
                    cellTexts: ['N', 'Y']
                }
            ];
            const headerPx = measure(headerText);
            const expectedFloor =
                Math.ceil(headerPx * STATION_MGMT_AUTO_SIZE_HEADER_TEXT_MEASURE_SCALE) +
                STATION_MGMT_AUTO_SIZE_HEADER_EXTRA_PX;
            const cellMaxPx = Math.max(measure('N'), measure('Y')) + 28;
            expect(cellMaxPx).toBeLessThan(expectedFloor);
            expect(expectedFloor).toBeLessThanOrEqual(STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX);
            expect(computeScrollableColumnWidthsPx(cols, measure, STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX)['boolish']).toBe(
                expectedFloor
            );
        });

        it('with empty first page, header-based width still applies (no cell samples)', () => {
            const measure = (text: string): number => (text?.length ?? 0) * 6;
            const headerText = 'VeryLongStationManagementColumnHeader';
            const cols = [{ field: 'x', minWidthCss: '1rem', headerText, cellTexts: [] }];
            const expectedFloor =
                Math.ceil(measure(headerText) * STATION_MGMT_AUTO_SIZE_HEADER_TEXT_MEASURE_SCALE) +
                STATION_MGMT_AUTO_SIZE_HEADER_EXTRA_PX;
            expect(computeScrollableColumnWidthsPx(cols, measure, STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX)['x']).toBe(
                Math.min(expectedFloor, STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX)
            );
        });

        it('uses headerDomWidths as header floor when larger than canvas header and cell content', () => {
            const measure = (text: string): number => (text?.length ?? 0) * 5;
            const cols = [{ field: 'f', minWidthCss: '1rem', headerText: 'S', cellTexts: ['a', 'b'] }];
            const canvasHeaderFloor =
                Math.ceil(measure('S') * STATION_MGMT_AUTO_SIZE_HEADER_TEXT_MEASURE_SCALE) +
                STATION_MGMT_AUTO_SIZE_HEADER_EXTRA_PX;
            const cellMax = Math.max(measure('a'), measure('b')) + 28;
            expect(cellMax).toBeLessThan(canvasHeaderFloor);
            const domHeaderPx = 260;
            expect(domHeaderPx).toBeGreaterThan(canvasHeaderFloor);
            expect(
                computeScrollableColumnWidthsPx(
                    cols,
                    measure,
                    STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX,
                    STATION_MGMT_AUTO_SIZE_HEADER_EXTRA_PX,
                    28,
                    16,
                    STATION_MGMT_AUTO_SIZE_HEADER_TEXT_MEASURE_SCALE,
                    { f: domHeaderPx }
                )['f']
            ).toBe(Math.min(domHeaderPx, STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX));
        });

        it('falls back to canvas header floor when headerDomWidths field is 0', () => {
            const measure = (text: string): number => (text?.length ?? 0) * 7;
            const headerText = 'H'.repeat(12);
            const cols = [{ field: 'g', minWidthCss: '1rem', headerText, cellTexts: ['x'] }];
            expect(
                computeScrollableColumnWidthsPx(
                    cols,
                    measure,
                    STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX,
                    STATION_MGMT_AUTO_SIZE_HEADER_EXTRA_PX,
                    28,
                    16,
                    STATION_MGMT_AUTO_SIZE_HEADER_TEXT_MEASURE_SCALE,
                    { g: 0 }
                )['g']
            ).toBe(
                computeScrollableColumnWidthsPx(cols, measure, STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX)['g']
            );
        });

        it('falls back to canvas header floor when headerDomWidths omits the field', () => {
            const measure = (text: string): number => (text?.length ?? 0) * 7;
            const headerText = 'LongHeaderText';
            const cols = [{ field: 'h', minWidthCss: '1rem', headerText, cellTexts: ['y'] }];
            expect(
                computeScrollableColumnWidthsPx(
                    cols,
                    measure,
                    STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX,
                    STATION_MGMT_AUTO_SIZE_HEADER_EXTRA_PX,
                    28,
                    16,
                    STATION_MGMT_AUTO_SIZE_HEADER_TEXT_MEASURE_SCALE,
                    { otherColumn: 999 }
                )['h']
            ).toBe(computeScrollableColumnWidthsPx(cols, measure, STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX)['h']);
        });
    });

    describe('readScrollableHeaderDomWidthsPx', () => {
        it('maps each scrollable field to its th scrollWidth when thead matches expected layout', () => {
            const table = document.createElement('table');
            table.innerHTML = `
                <thead><tr>
                    <th></th><th></th><th></th>
                    <th id="h0" style="width:1px;overflow:hidden"><div style="width:200px;height:1px"></div></th>
                    <th></th>
                </tr></thead>
            `;
            Object.defineProperty(table.querySelector('#h0')!, 'scrollWidth', { configurable: true, value: 200 });
            const w = readScrollableHeaderDomWidthsPx(table, ['colA'], STATION_MGMT_FROZEN_LEFT_TH_COUNT);
            expect(w['colA']).toBe(200);
        });

        it('returns {} when th count does not match scrollable columns + frozen + actions', () => {
            const table = document.createElement('table');
            table.innerHTML = `<thead><tr><th></th><th></th><th></th></tr></thead>`;
            expect(readScrollableHeaderDomWidthsPx(table, ['a', 'b'], STATION_MGMT_FROZEN_LEFT_TH_COUNT)).toEqual({});
        });
    });

    describe('applyScrollableColumnWidthsToTable', () => {
        it('sets width on scrollable header and body cells by index', () => {
            const table = document.createElement('table');
            table.innerHTML = `
                <thead><tr>
                    <th></th><th></th><th></th><th id="h0"></th><th></th>
                </tr></thead>
                <tbody><tr>
                    <td></td><td></td><td></td><td id="c0"></td><td></td>
                </tr></tbody>
            `;
            applyScrollableColumnWidthsToTable(table, ['x'], { x: 222 }, 3, (el, n, v) => {
                el.style.setProperty(n, v);
            });
            expect((table.querySelector('#h0') as HTMLElement).style.width).toBe('222px');
            expect((table.querySelector('#c0') as HTMLElement).style.width).toBe('222px');
        });

        it('skips body rows with unexpected td count', () => {
            const table = document.createElement('table');
            table.innerHTML = `
                <thead><tr>
                    <th></th><th></th><th></th><th id="h0"></th><th></th>
                </tr></thead>
                <tbody>
                    <tr><td colspan="5"></td></tr>
                    <tr>
                        <td></td><td></td><td></td><td id="c0"></td><td></td>
                    </tr>
                </tbody>
            `;
            applyScrollableColumnWidthsToTable(table, ['x'], { x: 99 }, 3, (el, n, v) => {
                el.style.setProperty(n, v);
            });
            expect((table.querySelector('#h0') as HTMLElement).style.width).toBe('99px');
            expect((table.querySelector('#c0') as HTMLElement).style.width).toBe('99px');
        });
    });
});
