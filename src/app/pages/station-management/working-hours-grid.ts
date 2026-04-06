import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    computed,
    inject,
    input,
    output,
    signal
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';

/** 48 half-hour slots per day, rows labeled 00:00–00:29 … 23:30–23:59 */
const NUM_SLOTS = 48;
const NUM_DAYS = 7;

/** Precomputed slot row indices for `@for` `track` */
const SLOT_INDICES: readonly number[] = Array.from({ length: NUM_SLOTS }, (_, i) => i);
const DAY_INDICES: readonly number[] = Array.from({ length: NUM_DAYS }, (_, i) => i);

/**
 * API `dayOfTheWeek`: 1 = Sunday … 7 = Saturday (stakeholder sample).
 * Internal columns: 0 = Monday … 6 = Sunday.
 */
const INTERNAL_DAY_INDEX_TO_API: readonly number[] = [2, 3, 4, 5, 6, 7, 1];

const DAY_I18N_KEYS: readonly string[] = [
    'stationMgmt.workingHours.mon',
    'stationMgmt.workingHours.tue',
    'stationMgmt.workingHours.wed',
    'stationMgmt.workingHours.thu',
    'stationMgmt.workingHours.fri',
    'stationMgmt.workingHours.sat',
    'stationMgmt.workingHours.sun'
];

export interface WorkingHoursRangePayload {
    stationID: number;
    dayOfTheWeek: number;
    openingTime: string;
    closingTime: string;
    isClosed: false;
}

function cellKey(dayIndex: number, slotIndex: number): string {
    return `${dayIndex}-${slotIndex}`;
}

/** Inclusive slot label e.g. 00:00–00:29 */
function slotRangeLabel(slotIndex: number): string {
    const startTotal = slotIndex * 30;
    const endTotal = startTotal + 29;
    return `${formatHHmm(startTotal)}–${formatHHmm(endTotal)}`;
}

function formatHHmm(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** openingTime for a slot index (start of 30-minute block) */
function slotOpeningHHmm(slotIndex: number): string {
    return formatHHmm(slotIndex * 30);
}

/**
 * closingTime for a contiguous range ending at `lastSlotIndex` (inclusive):
 * end of that slot minus one minute → (lastSlot+1)*30 - 1 minutes from midnight.
 */
function rangeClosingHHmm(lastSlotIndex: number): string {
    return formatHHmm((lastSlotIndex + 1) * 30 - 1);
}

function formatDurationFromTemplate(fmt: string, totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return fmt.replaceAll('{h}', String(h)).replaceAll('{m}', String(m));
}

@Component({
    selector: 'app-working-hours-grid',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ButtonModule, TranslatePipe],
    template: `
        <div
            class="working-hours-card surface-card border border-surface-200 dark:border-surface-700 rounded-border p-4"
            [class.working-hours-dragging]="dragActive()"
        >
            <div class="working-hours-grid-scroll overflow-auto max-h-[min(70vh,42rem)] rounded-border border border-surface-200 dark:border-surface-700">
                <table class="working-hours-table w-full border-collapse text-sm">
                    <thead>
                        <tr>
                            <th
                                class="working-hours-corner sticky left-0 z-20 bg-[var(--p-surface-0)] dark:bg-[var(--p-surface-900)] border border-surface-200 dark:border-surface-700 p-2"
                            ></th>
                            @for (d of dayIndices; track d) {
                                <th
                                    class="working-hours-day-header sticky top-0 z-10 cursor-pointer select-none border border-surface-200 dark:border-surface-700 bg-[var(--p-surface-50)] dark:bg-[var(--p-surface-800)] p-2 text-center font-semibold text-[var(--p-text-color)] hover:bg-[var(--p-surface-100)] dark:hover:bg-[var(--p-surface-700)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p-primary-color)]"
                                    scope="col"
                                    (dblclick)="onHeaderDoubleClick(d); $event.preventDefault()"
                                    (mousedown)="$event.preventDefault()"
                                >
                                    {{ dayI18nKeys[d] | t }}
                                </th>
                            }
                        </tr>
                    </thead>
                    <tbody>
                        @for (slot of slotIndices; track slot) {
                            <tr>
                                <th
                                    scope="row"
                                    class="sticky left-0 z-[5] whitespace-nowrap border border-surface-200 dark:border-surface-700 bg-[var(--p-surface-0)] dark:bg-[var(--p-surface-900)] px-2 py-1 text-left text-xs font-normal text-muted-color"
                                >
                                    {{ slotLabel(slot) }}
                                </th>
                                @for (d of dayIndices; track d) {
                                    <td
                                        class="working-hours-cell border border-surface-200 dark:border-surface-700 p-0 text-center align-middle min-w-[4.5rem]"
                                        (mousedown)="onCellMouseDown(d, slot, $event)"
                                        (mouseenter)="onCellMouseEnter(d, slot)"
                                    >
                                        <span
                                            class="working-hours-cell-inner block min-h-[1.75rem] leading-[1.75rem] px-1 cursor-pointer transition-colors"
                                            [class.working-hours-selected]="isSelected(d, slot)"
                                        ></span>
                                    </td>
                                }
                            </tr>
                        }
                    </tbody>
                    <tfoot>
                        <tr>
                            <th
                                scope="row"
                                class="sticky left-0 z-[5] border border-surface-200 dark:border-surface-700 bg-[var(--p-surface-50)] dark:bg-[var(--p-surface-800)] px-2 py-2 text-left font-semibold"
                            >
                                {{ 'stationMgmt.workingHours.totalLabel' | t }}
                            </th>
                            @for (d of dayIndices; track d) {
                                <td
                                    class="border border-surface-200 dark:border-surface-700 bg-[var(--p-surface-50)] dark:bg-[var(--p-surface-800)] px-2 py-2 text-center font-medium"
                                >
                                    {{ dayTotalLabels()[d] }}
                                </td>
                            }
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="mt-4 flex justify-end">
                <p-button
                    type="button"
                    [label]="'stationMgmt.workingHours.save' | t"
                    icon="pi pi-save"
                    [disabled]="saveDisabled()"
                    (onClick)="onSave()"
                />
            </div>
        </div>
    `,
    styles: [
        `
            .working-hours-dragging {
                user-select: none;
                -webkit-user-select: none;
            }

            .working-hours-cell-inner.working-hours-selected {
                background: var(--p-primary-color);
                color: var(--p-primary-contrast-color);
            }

            .working-hours-cell-inner:not(.working-hours-selected):hover {
                background: var(--p-surface-100);
            }

            :host-context(.dark) .working-hours-cell-inner:not(.working-hours-selected):hover,
            .app-dark .working-hours-cell-inner:not(.working-hours-selected):hover {
                background: var(--p-surface-700);
            }
        `
    ]
})
export class WorkingHoursGrid {
    private readonly i18n = inject(I18nService);
    private readonly destroyRef = inject(DestroyRef);

    readonly stationId = input.required<number>();

    readonly savePayload = output<WorkingHoursRangePayload[]>();

    protected readonly slotIndices = SLOT_INDICES;
    protected readonly dayIndices = DAY_INDICES;
    protected readonly dayI18nKeys = DAY_I18N_KEYS;

    /** Selected cells: key `${dayIndex}-${slotIndex}` */
    private readonly selectedKeys = signal<ReadonlySet<string>>(new Set());

    protected readonly dragActive = signal(false);
    private dragDayIndex: number | null = null;
    /** true = paint select, false = paint deselect */
    private paintSelect = true;

    constructor() {
        const endDrag = (): void => this.onDocumentMouseUp();
        if (typeof document !== 'undefined') {
            document.addEventListener('mouseup', endDrag);
            this.destroyRef.onDestroy(() => document.removeEventListener('mouseup', endDrag));
        }
    }

    /** One summary string per day column; avoids O(7×48) work per template pass. */
    protected readonly dayTotalLabels = computed(() => {
        this.i18n.lang();
        const fmt = this.i18n.t('stationMgmt.workingHours.hoursFormat');
        const set = this.selectedKeys();
        return DAY_INDICES.map((d) => {
            let n = 0;
            for (let s = 0; s < NUM_SLOTS; s++) {
                if (set.has(cellKey(d, s))) {
                    n++;
                }
            }
            return formatDurationFromTemplate(fmt, n * 30);
        });
    });

    protected slotLabel(slot: number): string {
        return slotRangeLabel(slot);
    }

    protected isSelected(dayIndex: number, slotIndex: number): boolean {
        return this.selectedKeys().has(cellKey(dayIndex, slotIndex));
    }

    protected readonly saveDisabled = computed(() => {
        const id = this.stationId();
        return !Number.isFinite(id) || id < 1;
    });

    onHeaderDoubleClick(dayIndex: number): void {
        let all = true;
        for (let s = 0; s < NUM_SLOTS; s++) {
            if (!this.selectedKeys().has(cellKey(dayIndex, s))) {
                all = false;
                break;
            }
        }
        this.selectedKeys.update((prev) => {
            const next = new Set(prev);
            if (all) {
                for (let s = 0; s < NUM_SLOTS; s++) {
                    next.delete(cellKey(dayIndex, s));
                }
            } else {
                for (let s = 0; s < NUM_SLOTS; s++) {
                    next.add(cellKey(dayIndex, s));
                }
            }
            return next;
        });
    }

    onCellMouseDown(dayIndex: number, slotIndex: number, event: MouseEvent): void {
        if (event.button !== 0) {
            return;
        }
        event.preventDefault();
        const key = cellKey(dayIndex, slotIndex);
        const wasSelected = this.selectedKeys().has(key);
        this.paintSelect = !wasSelected;
        this.dragDayIndex = dayIndex;
        this.dragActive.set(true);
        this.applyPaint(key);
    }

    onCellMouseEnter(dayIndex: number, slotIndex: number): void {
        if (!this.dragActive() || this.dragDayIndex !== dayIndex) {
            return;
        }
        this.applyPaint(cellKey(dayIndex, slotIndex));
    }

    private onDocumentMouseUp(): void {
        if (!this.dragActive()) {
            return;
        }
        this.dragActive.set(false);
        this.dragDayIndex = null;
    }

    private applyPaint(key: string): void {
        const select = this.paintSelect;
        this.selectedKeys.update((prev) => {
            const next = new Set(prev);
            if (select) {
                next.add(key);
            } else {
                next.delete(key);
            }
            return next;
        });
    }

    onSave(): void {
        const id = this.stationId();
        if (!Number.isFinite(id) || id < 1) {
            return;
        }
        const payload = buildSavePayload(id, this.selectedKeys());
        console.debug('[WorkingHours] Save payload:', payload);
        this.savePayload.emit(payload);
    }
}

function buildSavePayload(stationID: number, keys: ReadonlySet<string>): WorkingHoursRangePayload[] {
    const byDay: number[][] = Array.from({ length: NUM_DAYS }, () => []);
    for (const key of keys) {
        const [d, s] = key.split('-').map((x) => Number.parseInt(x, 10));
        if (!Number.isFinite(d) || !Number.isFinite(s) || d < 0 || d >= NUM_DAYS || s < 0 || s >= NUM_SLOTS) {
            continue;
        }
        byDay[d]!.push(s);
    }

    const rows: WorkingHoursRangePayload[] = [];

    for (let dayIndex = 0; dayIndex < NUM_DAYS; dayIndex++) {
        const slots = byDay[dayIndex]!.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
        if (slots.length === 0) {
            continue;
        }

        const apiDay = INTERNAL_DAY_INDEX_TO_API[dayIndex]!;

        if (slots.length === NUM_SLOTS) {
            rows.push({
                stationID,
                dayOfTheWeek: apiDay,
                openingTime: '00:00',
                closingTime: '23:59',
                isClosed: false
            });
            continue;
        }

        let runStart = slots[0]!;
        let prev = slots[0]!;
        for (let i = 1; i <= slots.length; i++) {
            const cur = slots[i];
            if (cur !== undefined && cur === prev + 1) {
                prev = cur;
                continue;
            }
            rows.push({
                stationID,
                dayOfTheWeek: apiDay,
                openingTime: slotOpeningHHmm(runStart),
                closingTime: rangeClosingHHmm(prev),
                isClosed: false
            });
            if (cur !== undefined) {
                runStart = cur;
                prev = cur;
            }
        }
    }

    rows.sort((a, b) => {
        const da = a.dayOfTheWeek - b.dayOfTheWeek;
        if (da !== 0) {
            return da;
        }
        return a.openingTime.localeCompare(b.openingTime);
    });

    return rows;
}
