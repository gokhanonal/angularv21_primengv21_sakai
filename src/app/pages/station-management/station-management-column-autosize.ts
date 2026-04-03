/** Pure helpers for first-load scrollable column width estimation (Station Management grid). */

export const STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX = 384; /** ~24rem @ 16px root */
/**
 * Horizontal space beyond measured header label text: `th` padding, `gap-2` between header cluster and
 * `p-columnFilter`, inline `gap-1` before `p-sortIcon`, sort icon column, and filter trigger (PrimeNG menu).
 * Tuned so long i18n headers do not clip when cell samples are short.
 */
export const STATION_MGMT_AUTO_SIZE_HEADER_EXTRA_PX = 148;
/** Slight upscale on canvas-measured header width to absorb theme / subpixel vs. painted text. */
export const STATION_MGMT_AUTO_SIZE_HEADER_TEXT_MEASURE_SCALE = 1.035;
export const STATION_MGMT_AUTO_SIZE_CELL_PADDING_PX = 28;
export const STATION_MGMT_AUTO_SIZE_REM_PX = 16;
export const STATION_MGMT_AUTO_SIZE_COMPANY_FLOOR_PX = 112;
export const STATION_MGMT_AUTO_SIZE_STATUS_TAG_EXTRA_PX = 44;

export type StationMgmtColumnWidthSample = {
    field: string;
    minWidthCss: string;
    headerText: string;
    cellTexts: string[];
};

/**
 * Parses `NNrem` or `NNpx` lengths used in column `minWidth` styles. Unknown → 0.
 */
export function parseCssLengthToPx(value: string, rootFontPx: number = STATION_MGMT_AUTO_SIZE_REM_PX): number {
    const s = (value ?? '').trim();
    const rem = /^(\d+(?:\.\d+)?)rem$/i.exec(s);
    if (rem) {
        return Math.ceil(parseFloat(rem[1]) * rootFontPx);
    }
    const px = /^(\d+(?:\.\d+)?)px$/i.exec(s);
    if (px) {
        return Math.ceil(parseFloat(px[1]));
    }
    return 0;
}

export type TextMeasureFn = (text: string, font: string) => number;

/** Browser canvas measurer; safe fallback when `document` / canvas is unavailable (SSR/tests). */
export function createCanvasTextMeasureFn(): TextMeasureFn {
    let ctx: CanvasRenderingContext2D | null = null;
    return (text: string, font: string): number => {
        if (typeof document === 'undefined') {
            return (text?.length ?? 0) * 8;
        }
        if (!ctx) {
            const c = document.createElement('canvas');
            ctx = c.getContext('2d');
        }
        if (!ctx) {
            return (text?.length ?? 0) * 8;
        }
        ctx.font = font;
        const t = text && text.length > 0 ? text : ' ';
        return ctx.measureText(t).width;
    };
}

/** 14px + system stack: canvas `measureText` is most reliable with px sizes (rem parsing varies by engine). */
const HEADER_FONT =
    '600 14px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"';
const BODY_FONT =
    '400 14px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"';

/**
 * Computes pixel widths for scrollable columns from header + cell text samples.
 * Clamps each column to [minWidthPx, maxWidthPx]. Special floors for company / status columns.
 */
export function computeScrollableColumnWidthsPx(
    columns: readonly StationMgmtColumnWidthSample[],
    measure: TextMeasureFn,
    maxWidthPx: number = STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX,
    headerExtraPx: number = STATION_MGMT_AUTO_SIZE_HEADER_EXTRA_PX,
    cellPaddingPx: number = STATION_MGMT_AUTO_SIZE_CELL_PADDING_PX,
    remPx: number = STATION_MGMT_AUTO_SIZE_REM_PX,
    headerTextMeasureScale: number = STATION_MGMT_AUTO_SIZE_HEADER_TEXT_MEASURE_SCALE,
    /** Per-field `<th>` `scrollWidth` from the live table; `> 0` replaces canvas header estimate for that column. */
    headerDomWidths?: Readonly<Record<string, number>>
): Record<string, number> {
    const out: Record<string, number> = {};
    for (const col of columns) {
        const minPx = parseCssLengthToPx(col.minWidthCss, remPx);
        const headerTextPx = measure(col.headerText, HEADER_FONT);
        const canvasHeaderBasedPx = Math.ceil(headerTextPx * headerTextMeasureScale) + headerExtraPx;
        const domPx = headerDomWidths?.[col.field];
        const headerBasedPx =
            typeof domPx === 'number' && domPx > 0 ? domPx : canvasHeaderBasedPx;
        let maxContent = headerBasedPx;
        for (const cell of col.cellTexts) {
            maxContent = Math.max(maxContent, measure(cell, BODY_FONT) + cellPaddingPx);
        }
        if (col.field === 'companyName') {
            maxContent = Math.max(maxContent, minPx, STATION_MGMT_AUTO_SIZE_COMPANY_FLOOR_PX);
        }
        if (col.field === 'statusCategory') {
            maxContent = Math.max(maxContent, minPx, measure('Inactive', BODY_FONT) + STATION_MGMT_AUTO_SIZE_STATUS_TAG_EXTRA_PX);
        }
        const clamped = Math.max(minPx, Math.min(Math.ceil(maxContent), maxWidthPx));
        out[col.field] = clamped;
    }
    return out;
}

export const STATION_MGMT_FROZEN_LEFT_TH_COUNT = 3;

/**
 * Reads each scrollable header cell's `scrollWidth` (full header chrome: label, sort, filter, padding).
 * Returns `{}` if thead structure does not match `scrollableFieldsInOrder` (same guard as {@link applyScrollableColumnWidthsToTable}).
 */
export function readScrollableHeaderDomWidthsPx(
    table: HTMLTableElement,
    scrollableFieldsInOrder: readonly string[],
    frozenLeftThCount: number = STATION_MGMT_FROZEN_LEFT_TH_COUNT
): Record<string, number> {
    const headerTr = table.querySelector(':scope > thead > tr');
    if (!headerTr) {
        return {};
    }
    const ths = headerTr.querySelectorAll<HTMLTableCellElement>(':scope > th');
    const expectedTh = frozenLeftThCount + scrollableFieldsInOrder.length + 1;
    if (ths.length !== expectedTh) {
        return {};
    }
    const out: Record<string, number> = {};
    scrollableFieldsInOrder.forEach((field, i) => {
        const th = ths.item(frozenLeftThCount + i);
        if (th) {
            out[field] = th.scrollWidth;
        }
    });
    return out;
}

/**
 * Applies `width` (px) to scrollable header/body cells by column index. Skips rows that do not match full column count.
 */
export function applyScrollableColumnWidthsToTable(
    table: HTMLTableElement,
    scrollableFieldsInOrder: readonly string[],
    widthsPx: Readonly<Record<string, number>>,
    frozenLeftThCount: number = STATION_MGMT_FROZEN_LEFT_TH_COUNT,
    setStyle: (el: HTMLElement, name: string, value: string) => void = (el, name, value) => {
        el.style.setProperty(name, value);
    }
): void {
    const headerTr = table.querySelector(':scope > thead > tr');
    if (!headerTr) {
        return;
    }
    const ths = headerTr.querySelectorAll<HTMLTableCellElement>(':scope > th');
    const expectedTh = frozenLeftThCount + scrollableFieldsInOrder.length + 1;
    if (ths.length !== expectedTh) {
        return;
    }
    scrollableFieldsInOrder.forEach((field, i) => {
        const w = widthsPx[field];
        if (w == null) {
            return;
        }
        const idx = frozenLeftThCount + i;
        const th = ths.item(idx);
        if (th) {
            setStyle(th, 'width', `${w}px`);
        }
        const bodyRows = table.querySelectorAll<HTMLTableRowElement>(':scope > tbody tr');
        bodyRows.forEach((tr) => {
            const tds = tr.querySelectorAll<HTMLTableCellElement>(':scope > td');
            if (tds.length !== expectedTh) {
                return;
            }
            const td = tds.item(idx);
            if (td) {
                setStyle(td, 'width', `${w}px`);
            }
        });
    });
}
