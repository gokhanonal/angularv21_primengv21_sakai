import { CommonModule } from '@angular/common';
import {
    Component,
    DestroyRef,
    Injector,
    OnInit,
    Renderer2,
    ViewChild,
    afterNextRender,
    computed,
    inject,
    signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    ConfirmationService,
    FilterMatchMode,
    FilterService,
    MenuItem,
    MessageService,
    SortMeta
} from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { Table, TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { stationManagementCompanyLogoSrc } from './station-management-logo';
import {
    applyScrollableColumnWidthsToTable,
    computeScrollableColumnWidthsPx,
    createCanvasTextMeasureFn,
    readScrollableHeaderDomWidthsPx,
    STATION_MGMT_AUTO_SIZE_CELL_PADDING_PX,
    STATION_MGMT_AUTO_SIZE_HEADER_EXTRA_PX,
    STATION_MGMT_AUTO_SIZE_HEADER_TEXT_MEASURE_SCALE,
    STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX,
    STATION_MGMT_AUTO_SIZE_REM_PX,
    STATION_MGMT_FROZEN_LEFT_TH_COUNT,
    type StationMgmtColumnWidthSample
} from './station-management-column-autosize';
import { StationManagementRow } from './station-management.model';
import { StationManagementService } from './station-management.service';
import { GridState } from '@/app/core/grid/grid-state.model';
import { GridStateService } from '@/app/core/grid/grid-state.service';
import { CardMaximizeDirective } from '@/app/shared/directives/card-maximize.directive';

const STATION_MGMT_GRID_PAGE = 'station-management';
const STATION_MGMT_GRID_NAME = 'main';

/** Non-frozen data columns only (selection, station code, name, actions stay always visible). */
const STATION_MGMT_DATA_COLUMN_OPTIONS: readonly { key: string; labelKey: string }[] = [
    { key: 'address', labelKey: 'stationMgmt.col.address' },
    { key: 'phone', labelKey: 'stationMgmt.col.phone' },
    { key: 'cityName', labelKey: 'stationMgmt.col.city' },
    { key: 'districtName', labelKey: 'stationMgmt.col.district' },
    { key: 'companyName', labelKey: 'stationMgmt.col.company' },
    { key: 'resellerName', labelKey: 'stationMgmt.col.reseller' },
    { key: 'isRoaming', labelKey: 'stationMgmt.col.roaming' },
    { key: 'unitCode', labelKey: 'stationMgmt.col.unitCode' },
    { key: 'status', labelKey: 'stationMgmt.col.status' }
];

const STATION_MGMT_DATA_COLUMN_KEYS: string[] = STATION_MGMT_DATA_COLUMN_OPTIONS.map((o) => o.key);

/** Default column order (status first to match prior grid). */
const STATION_MGMT_DEFAULT_DATA_COLUMN_ORDER: string[] = [
    'status',
    'address',
    'phone',
    'cityName',
    'districtName',
    'companyName',
    'resellerName',
    'isRoaming',
    'unitCode'
];

const ROAMING_FILTER_MATCH_MODE = 'stationMgmtRoamingTri';

export interface StationMgmtScrollableColumnDef {
    field: string;
    header: string;
    minWidth: string;
}

function escapeCsvCell(value: string): string {
    const s = value ?? '';
    if (/[",\r\n]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function escapeHtmlText(value: string): string {
    return (value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

@Component({
    selector: 'app-station-management-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        TagModule,
        MessageModule,
        SkeletonModule,
        ToastModule,
        ConfirmDialogModule,
        DialogModule,
        MultiSelectModule,
        SelectModule,
        MenuModule,
        TooltipModule,
        TranslatePipe,
        CardMaximizeDirective
    ],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast />
        <p-confirmDialog />

        @if (mgmt.loadError(); as errKey) {
            <p-message severity="error" styleClass="mb-4 w-full">{{ errKey | t }}</p-message>
            <p-button [label]="'stationMgmt.retry' | t" icon="pi pi-refresh" (onClick)="reload()" class="mb-4" />
        }

        <div class="card" appCardMaximize [showWindowMaximize]="true">
            @if (pageTitleText()) {
                <h3 class="card-title mb-1">{{ pageTitleText() }}</h3>
            }
            @if (subtitleText()) {
                <p class="text-surface-500 dark:text-surface-400 text-sm mb-4">{{ subtitleText() }}</p>
            }
            @if (loading() && !mgmt.loadError()) {
                <div
                    role="status"
                    aria-live="polite"
                    [attr.aria-busy]="true"
                    [attr.aria-label]="'stationMgmt.loading' | t"
                    class="station-mgmt-grid-skeleton"
                >
                    <div
                        class="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center justify-between mb-3"
                    >
                        <div class="flex flex-wrap gap-2 items-center">
                            <p-skeleton width="5.25rem" height="2.5rem" />
                            <p-skeleton width="6.5rem" height="2.5rem" />
                            <p-skeleton width="3rem" height="2.5rem" />
                            <p-skeleton width="10rem" height="2.5rem" />
                        </div>
                        <div class="w-full sm:w-auto sm:ml-auto sm:min-w-[12rem] sm:max-w-[24rem]">
                            <p-skeleton width="100%" height="2.5rem" />
                        </div>
                    </div>
                    <div
                        class="rounded-md border border-surface-200 dark:border-surface-700 overflow-x-auto"
                        style="min-width: 75rem"
                    >
                        <div class="flex flex-col" style="height: 480px">
                            <div
                                class="flex shrink-0 items-stretch border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800"
                                style="min-height: 3.25rem"
                            >
                                <div
                                    class="flex items-center justify-center shrink-0 border-e border-surface-200 dark:border-surface-700 px-1"
                                    style="width: 3rem; min-width: 3rem"
                                >
                                    <p-skeleton shape="circle" size="1.25rem" />
                                </div>
                                <div
                                    class="flex items-center px-2 border-e border-surface-200 dark:border-surface-700 shrink-0"
                                    style="min-width: 9rem"
                                >
                                    <p-skeleton width="85%" height="1rem" />
                                </div>
                                <div
                                    class="flex items-center px-2 border-e border-surface-200 dark:border-surface-700 shrink-0"
                                    style="min-width: 14rem"
                                >
                                    <p-skeleton width="70%" height="1rem" />
                                </div>
                                @for (col of scrollableColumns; track col.field) {
                                    <div
                                        class="flex items-center px-2 border-e border-surface-200 dark:border-surface-700 shrink-0"
                                        [style.min-width]="col.minWidth"
                                    >
                                        <p-skeleton width="78%" height="1rem" />
                                    </div>
                                }
                                <div
                                    class="flex items-center justify-end gap-1 px-2 shrink-0"
                                    style="min-width: 13rem"
                                >
                                    <p-skeleton width="2rem" height="2rem" borderRadius="9999px" />
                                    <p-skeleton width="2rem" height="2rem" borderRadius="9999px" />
                                    <p-skeleton width="2rem" height="2rem" borderRadius="9999px" />
                                </div>
                            </div>
                            <div
                                class="flex flex-col flex-1 min-h-0 divide-y divide-surface-200 dark:divide-surface-700"
                            >
                                @for (row of skeletonBodyRowIndexes; track row) {
                                    <div class="flex flex-1 items-stretch min-h-0">
                                        <div
                                            class="flex items-center justify-center shrink-0 border-e border-surface-200 dark:border-surface-700 px-1"
                                            style="width: 3rem; min-width: 3rem"
                                        >
                                            <p-skeleton shape="circle" size="1.25rem" />
                                        </div>
                                        <div
                                            class="flex items-center px-2 border-e border-surface-200 dark:border-surface-700 shrink-0"
                                            style="min-width: 9rem"
                                        >
                                            <p-skeleton width="60%" height="0.875rem" />
                                        </div>
                                        <div
                                            class="flex items-center px-2 border-e border-surface-200 dark:border-surface-700 shrink-0"
                                            style="min-width: 14rem"
                                        >
                                            <p-skeleton width="90%" height="0.875rem" />
                                        </div>
                                        @for (col of scrollableColumns; track col.field) {
                                            <div
                                                class="flex items-center px-2 border-e border-surface-200 dark:border-surface-700 shrink-0"
                                                [style.min-width]="col.minWidth"
                                            >
                                                <p-skeleton width="88%" height="0.875rem" />
                                            </div>
                                        }
                                        <div
                                            class="flex items-center justify-end gap-1 px-2 shrink-0"
                                            style="min-width: 13rem"
                                        >
                                            <p-skeleton width="2rem" height="2rem" borderRadius="9999px" />
                                            <p-skeleton width="2rem" height="2rem" borderRadius="9999px" />
                                            <p-skeleton width="2rem" height="2rem" borderRadius="9999px" />
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            } @else if (!mgmt.loadError()) {
                <p-table
                    #dt
                    [value]="mgmt.rows()"
                    [columns]="scrollableColumns"
                    dataKey="id"
                    selectionMode="multiple"
                    [(selection)]="selectedRows"
                    [scrollable]="true"
                    scrollHeight="480px"
                    [tableStyle]="{ 'min-width': '75rem' }"
                    [resizableColumns]="true"
                    columnResizeMode="expand"
                    [reorderableColumns]="true"
                    sortMode="multiple"
                    [multiSortMeta]="multiSortMeta"
                    [paginator]="true"
                    [rows]="tableRowsPerPage"
                    [rowsPerPageOptions]="[10, 25, 50]"
                    [showCurrentPageReport]="true"
                    [currentPageReportTemplate]="'stationMgmt.pageReport' | t"
                    [globalFilterFields]="globalFilterFieldsForTable"
                    (onSort)="onSort($event)"
                    (onFilter)="clearTableSelection()"
                    (onColReorder)="onColReorder($event)"
                    (onColResize)="onColResize()"
                >
                    <ng-template #caption>
                        <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center justify-between">
                            <div class="flex flex-wrap gap-2 items-center">
                                <p-button
                                    type="button"
                                    icon="pi pi-refresh"
                                    [outlined]="true"
                                    [pTooltip]="refreshTooltip()"
                                    (onClick)="reload()"
                                />
                                <p-button
                                    type="button"
                                    icon="pi pi-filter-slash"
                                    [outlined]="true"
                                    [pTooltip]="clearFiltersTooltip()"
                                    (onClick)="clearAllFilters(dt, globalFilterInput)"
                                />
                                <p-multiselect
                                    [options]="columnPickerOptions()"
                                    [ngModel]="visibleDataColumnKeys"
                                    (ngModelChange)="onVisibleDataColumnsChange(dt, $event)"
                                    optionLabel="label"
                                    optionValue="key"
                                    display="chip"
                                    [filter]="true"
                                    [showToggleAll]="true"
                                    [placeholder]="'stationMgmt.columns.placeholder' | t"
                                    [ariaLabel]="'stationMgmt.columns.aria' | t"
                                    [maxSelectedLabels]="2"
                                    [selectedItemsLabel]="'stationMgmt.columns.selectedSummary' | t"
                                    appendTo="body"
                                    styleClass="min-w-[12rem] max-w-[20rem] sm:max-w-[24rem]"
                                />
                            </div>
                            <div class="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                                <p-iconfield class="flex-1 sm:flex-initial">
                                    <p-inputicon class="pi pi-search" />
                                    <input
                                        #globalFilterInput
                                        pInputText
                                        type="text"
                                        class="w-full"
                                        [placeholder]="'stationMgmt.search' | t"
                                        (input)="onGlobalFilter(dt, $event)"
                                    />
                                </p-iconfield>
                                <p-button
                                    type="button"
                                    icon="pi pi-undo"
                                    [rounded]="true"
                                    [text]="true"
                                    [pTooltip]="resetGridConfigurationTooltip()"
                                    tooltipPosition="top"
                                    (onClick)="resetGridState(dt, globalFilterInput)"
                                    [attr.aria-label]="resetGridConfigurationTooltip()"
                                />
                                <p-button
                                    type="button"
                                    icon="pi pi-download"
                                    [rounded]="true"
                                    [text]="true"
                                    [pTooltip]="exportDownloadTooltip()"
                                    tooltipPosition="top"
                                    (onClick)="exportMenu.toggle($event)"
                                    [attr.aria-label]="exportDownloadTooltip()"
                                />
                                <p-menu #exportMenu [model]="exportMenuItems" [popup]="true" appendTo="body" />
                            </div>
                        </div>
                    </ng-template>
                    <ng-template #header let-columns>
                        <tr>
                            <th
                                pFrozenColumn
                                alignFrozen="left"
                                style="width: 3rem; min-width: 3rem"
                                class="text-center"
                                scope="col"
                            >
                                <p-tableHeaderCheckbox [ariaLabel]="'stationMgmt.selection.selectAll' | t" />
                            </th>
                            <th pSortableColumn="stationInfoId" pFrozenColumn alignFrozen="left" style="min-width: 9rem">
                                <div class="flex justify-between items-center gap-2 flex-wrap">
                                    <span class="inline-flex items-center gap-1"
                                        >{{ 'stationMgmt.col.stationCode' | t }} <p-sortIcon field="stationInfoId" /></span
                                    >
                                    <p-columnFilter
                                        type="text"
                                        field="stationInfoId"
                                        display="menu"
                                        matchMode="contains"
                                        [placeholder]="'stationMgmt.filterByStationCode' | t"
                                    />
                                </div>
                            </th>
                            <th pSortableColumn="name" pFrozenColumn alignFrozen="left" style="min-width: 14rem">
                                <div class="flex justify-between items-center gap-2 flex-wrap">
                                    <span class="inline-flex items-center gap-1">{{ 'stationMgmt.col.name' | t }} <p-sortIcon field="name" /></span>
                                    <p-columnFilter
                                        type="text"
                                        field="name"
                                        display="menu"
                                        matchMode="contains"
                                        [placeholder]="'stationMgmt.filterByName' | t"
                                    />
                                </div>
                            </th>
                            @for (col of columns; track col.field) {
                                <th
                                    pReorderableColumn
                                    pResizableColumn
                                    [pSortableColumn]="col.field"
                                    [style.min-width]="col.minWidth"
                                    scope="col"
                                >
                                    <div class="flex justify-between items-center gap-2 flex-wrap">
                                        <span class="inline-flex items-center gap-1">{{ col.header }} <p-sortIcon [field]="col.field" /></span>
                                        @switch (col.field) {
                                            @case ('statusCategory') {
                                                <p-columnFilter
                                                    type="text"
                                                    field="statusCategory"
                                                    display="menu"
                                                    [matchMode]="FilterMatchMode.IN"
                                                    [showMatchModes]="false"
                                                    [placeholder]="'stationMgmt.filterByStatus' | t"
                                                >
                                                    <ng-template pTemplate="filter" let-value let-filterCallback="filterCallback">
                                                        <p-multiSelect
                                                            [options]="statusFilterOptions()"
                                                            [ngModel]="value"
                                                            (ngModelChange)="filterCallback($event)"
                                                            optionLabel="label"
                                                            optionValue="value"
                                                            [placeholder]="'stationMgmt.filterByStatus' | t"
                                                            display="chip"
                                                            [filter]="false"
                                                            styleClass="w-full min-w-[12rem]"
                                                            appendTo="body"
                                                        />
                                                    </ng-template>
                                                </p-columnFilter>
                                            }
                                            @case ('isRoaming') {
                                                <p-columnFilter
                                                    type="text"
                                                    field="isRoaming"
                                                    display="menu"
                                                    [matchMode]="roamingFilterMatchMode"
                                                    [showMatchModes]="false"
                                                    [placeholder]="'stationMgmt.filterByRoaming' | t"
                                                >
                                                    <ng-template pTemplate="filter" let-value let-filterCallback="filterCallback">
                                                        <p-select
                                                            [options]="roamingFilterOptions()"
                                                            [ngModel]="value === undefined || value === null ? 'any' : roamingFilterSelectValue(value)"
                                                            (ngModelChange)="filterCallback($event === 'any' ? null : $event)"
                                                            optionLabel="label"
                                                            optionValue="value"
                                                            [placeholder]="'stationMgmt.filterByRoaming' | t"
                                                            styleClass="w-full min-w-[10rem]"
                                                            appendTo="body"
                                                        />
                                                    </ng-template>
                                                </p-columnFilter>
                                            }
                                            @default {
                                                <p-columnFilter
                                                    type="text"
                                                    [field]="col.field"
                                                    display="menu"
                                                    matchMode="contains"
                                                    [placeholder]="filterPlaceholder(col.field) | t"
                                                />
                                            }
                                        }
                                    </div>
                                </th>
                            }
                            <th pFrozenColumn alignFrozen="right" style="min-width: 13rem" class="text-end" scope="col">
                                {{ 'stationMgmt.col.actions' | t }}
                            </th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-row let-columns="columns">
                        <tr>
                            <td pFrozenColumn alignFrozen="left" class="text-center" style="width: 3rem">
                                <p-tableCheckbox [value]="row" [ariaLabel]="rowSelectAriaLabel(row)" />
                            </td>
                            <td pFrozenColumn alignFrozen="left" class="font-mono text-sm">{{ row.stationInfoId }}</td>
                            <td pFrozenColumn alignFrozen="left" class="font-medium">{{ row.name }}</td>
                            @for (col of columns; track col.field) {
                                <td>
                                    @switch (col.field) {
                                        @case ('statusCategory') {
                                            <p-tag [value]="statusLabel(row)" [severity]="statusSeverity(row)" />
                                        }
                                        @case ('companyName') {
                                            @if (showCompanyLogo(row)) {
                                                <img
                                                    [src]="companyLogoUrl(row)!"
                                                    [alt]="row.companyName"
                                                    class="max-h-8 w-auto object-contain"
                                                    (error)="onLogoBroken(row)"
                                                />
                                            } @else {
                                                <span>{{ row.companyName }}</span>
                                            }
                                        }
                                        @case ('isRoaming') {
                                            {{ roamingLabel(row) }}
                                        }
                                        @case ('unitCode') {
                                            {{ row.unitCode?.trim() ? row.unitCode : '—' }}
                                        }
                                        @default {
                                            {{ rowDataCell(row, col.field) }}
                                        }
                                    }
                                </td>
                            }
                            <td pFrozenColumn alignFrozen="right" class="text-end whitespace-nowrap">
                                <p-button
                                    type="button"
                                    [text]="true"
                                    [rounded]="true"
                                    icon="pi pi-eye"
                                    [attr.aria-label]="'stationMgmt.actions.view' | t"
                                    [routerLink]="['/station-management', row.id]"
                                />
                                <p-button
                                    type="button"
                                    [text]="true"
                                    [rounded]="true"
                                    icon="pi pi-pencil"
                                    [attr.aria-label]="'stationMgmt.actions.edit' | t"
                                    (onClick)="openEdit(row)"
                                />
                                <p-button
                                    type="button"
                                    [text]="true"
                                    [rounded]="true"
                                    severity="danger"
                                    icon="pi pi-trash"
                                    [attr.aria-label]="'stationMgmt.actions.delete' | t"
                                    (onClick)="confirmDelete(row)"
                                />
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            }
        </div>

        <p-dialog
            [header]="'stationMgmt.editDialog.title' | t"
            [visible]="editVisible()"
            (visibleChange)="editVisible.set($event)"
            [modal]="true"
            [style]="{ width: '28rem' }"
            [draggable]="false"
            [resizable]="false"
        >
            @if (editRow(); as er) {
                <p class="font-medium m-0 mb-2">{{ er.name }}</p>
            }
            <p class="m-0 text-surface-600 dark:text-surface-400 mb-4">{{ 'stationMgmt.editDialog.body' | t }}</p>
            <div class="flex justify-end">
                <p-button [label]="'stationMgmt.editDialog.close' | t" (onClick)="editVisible.set(false)" />
            </div>
        </p-dialog>
    `,
    styles: [
        `
            :host {
                display: block;
                width: 100%;
            }
        `
    ]
})
export class StationManagementList implements OnInit {
    @ViewChild('dt') tableRef: Table | undefined;

    readonly FilterMatchMode = FilterMatchMode;
    readonly roamingFilterMatchMode = ROAMING_FILTER_MATCH_MODE;

    readonly mgmt = inject(StationManagementService);
    private readonly confirm = inject(ConfirmationService);
    private readonly messages = inject(MessageService);
    private readonly i18n = inject(I18nService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly filterService = inject(FilterService);
    private readonly injector = inject(Injector);
    private readonly renderer = inject(Renderer2);
    private readonly gridState = inject(GridStateService);
    private readonly measureCellText = createCanvasTextMeasureFn();

    readonly loading = signal(true);

    /** Matches `[rows]` on `p-table` (samples first page for auto column widths). */
    readonly tableRowsPerPage = 10;

    /** Skeleton table body row placeholders. */
    readonly skeletonBodyRowIndexes: readonly number[] = [0, 1, 2, 3, 4, 5];
    readonly editVisible = signal(false);
    readonly editRow = signal<StationManagementRow | null>(null);

    /** Cleared when sort, filters, or global search change the visible row set (see tasks.md — Station Management). */
    selectedRows: StationManagementRow[] = [];

    /** Keys of optional (non-frozen) data columns currently shown in the grid. */
    visibleDataColumnKeys: string[] = [...STATION_MGMT_DATA_COLUMN_KEYS];

    /** Master order of all optional data keys (visible + hidden); drives export order and picker visibility order subset. */
    dataColumnOrder: string[] = [...STATION_MGMT_DEFAULT_DATA_COLUMN_ORDER];

    /** Visible scrollable columns passed to PrimeNG (mutated in place on reorder). */
    scrollableColumns: StationMgmtScrollableColumnDef[] = [];

    multiSortMeta: SortMeta[] | undefined;

    private storedColumnWidths: Record<string, string> | null = null;

    readonly columnPickerOptions = computed(() => {
        this.i18n.lang();
        return STATION_MGMT_DATA_COLUMN_OPTIONS.map((d) => ({
            key: d.key,
            label: this.i18n.t(d.labelKey)
        }));
    });

    readonly statusFilterOptions = computed(() => {
        this.i18n.lang();
        return [
            { label: this.i18n.t('stationMgmt.status.deleted'), value: 'deleted' as const },
            { label: this.i18n.t('stationMgmt.status.active'), value: 'active' as const },
            { label: this.i18n.t('stationMgmt.status.inactive'), value: 'inactive' as const }
        ];
    });

    roamingFilterOptions(): { label: string; value: string }[] {
        return [
            { label: this.i18n.t('stationMgmt.filter.roaming.any'), value: 'any' },
            { label: this.i18n.t('stationMgmt.filter.roaming.yes'), value: 'yes' },
            { label: this.i18n.t('stationMgmt.filter.roaming.no'), value: 'no' }
        ];
    }

    constructor() {
        this.filterService.register(ROAMING_FILTER_MATCH_MODE, (value: boolean, filter: unknown): boolean => {
            if (filter === null || filter === undefined || filter === '') {
                return true;
            }
            if (filter === 'any') {
                return true;
            }
            if (filter === 'yes' || filter === true) {
                return value === true;
            }
            if (filter === 'no' || filter === false) {
                return value === false;
            }
            return true;
        });
    }

    /** Shown only when the translation is non-empty (keys default to '' in translations). */
    readonly pageTitleText = computed(() => {
        this.i18n.lang();
        return this.i18n.t('stationMgmt.pageTitle').trim();
    });

    readonly subtitleText = computed(() => {
        this.i18n.lang();
        return this.i18n.t('stationMgmt.subtitle').trim();
    });

    readonly exportDownloadTooltip = computed(() => {
        this.i18n.lang();
        return this.i18n.t('stationMgmt.export.download');
    });

    readonly resetGridConfigurationTooltip = computed(() => {
        this.i18n.lang();
        return this.i18n.t('stationMgmt.resetGridConfiguration');
    });

    readonly clearFiltersTooltip = computed(() => {
        this.i18n.lang();
        return this.i18n.t('stationMgmt.clearFilters');
    });

    readonly refreshTooltip = computed(() => {
        this.i18n.lang();
        return this.i18n.t('stationMgmt.refreshGridData');
    });

    readonly exportMenuItems: MenuItem[] = [
        {
            label: this.i18n.t('stationMgmt.export.csv'),
            icon: 'pi pi-file',
            command: () => this.tableRef && this.exportCsv(this.tableRef)
        },
        {
            label: this.i18n.t('stationMgmt.export.excel'),
            icon: 'pi pi-file-excel',
            command: () => this.tableRef && this.exportExcel(this.tableRef)
        },
        {
            label: this.i18n.t('stationMgmt.export.html'),
            icon: 'pi pi-code',
            command: () => this.tableRef && this.exportHtml(this.tableRef)
        }
    ];

    /** Global search only scans name plus optional columns that are visible (WYSIWYG with column picker). */
    get globalFilterFieldsForTable(): string[] {
        const optional = ['address', 'phone', 'cityName', 'districtName', 'companyName', 'resellerName', 'unitCode'];
        return ['stationInfoId', 'name', ...optional.filter((k) => this.visibleDataColumnKeys.includes(k))];
    }

    ngOnInit(): void {
        this.restoreGridState();
        this.rebuildScrollableColumns();
        this.reload();
    }

    reload(): void {
        this.loading.set(true);
        this.mgmt
            .load()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.clearTableSelection();
                    this.loading.set(false);
                    this.scheduleApplyScrollableColumnAutoWidths();
                },
                error: () => this.loading.set(false)
            });
    }

    /**
     * First-load / refresh auto column widths use the current i18n headers and first page of rows.
     * Language changes take effect on the next successful reload (no live re-measure).
     */
    private scheduleApplyScrollableColumnAutoWidths(): void {
        afterNextRender(
            () => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this.applyScrollableColumnAutoWidthsToDom();
                    });
                });
            },
            { injector: this.injector }
        );
    }

    private applyScrollableColumnAutoWidthsToDom(): void {
        if (this.loading() || this.mgmt.loadError()) {
            return;
        }
        const samples = this.buildColumnWidthSamples();
        const tableEl = this.tableRef?.tableViewChild?.nativeElement as HTMLTableElement | undefined;
        if (!tableEl || this.scrollableColumns.length === 0) {
            return;
        }
        const fields = this.scrollableColumns.map((c) => c.field);
        const headerDomWidths = readScrollableHeaderDomWidthsPx(tableEl, fields, STATION_MGMT_FROZEN_LEFT_TH_COUNT);
        const widths = computeScrollableColumnWidthsPx(
            samples,
            this.measureCellText,
            STATION_MGMT_AUTO_SIZE_MAX_WIDTH_PX,
            STATION_MGMT_AUTO_SIZE_HEADER_EXTRA_PX,
            STATION_MGMT_AUTO_SIZE_CELL_PADDING_PX,
            STATION_MGMT_AUTO_SIZE_REM_PX,
            STATION_MGMT_AUTO_SIZE_HEADER_TEXT_MEASURE_SCALE,
            headerDomWidths
        );
        applyScrollableColumnWidthsToTable(tableEl, fields, widths, STATION_MGMT_FROZEN_LEFT_TH_COUNT, (el, prop, value) => {
            this.renderer.setStyle(el, prop, value);
        });
        this.applyStoredColumnWidths();
    }

    private applyStoredColumnWidths(): void {
        if (!this.storedColumnWidths) {
            return;
        }
        const tableEl = this.tableRef?.tableViewChild?.nativeElement as HTMLTableElement | undefined;
        if (!tableEl) {
            return;
        }
        const fields = this.scrollableColumns.map((c) => c.field);
        const frozenCount = STATION_MGMT_FROZEN_LEFT_TH_COUNT;
        const headerRow = tableEl.querySelector('thead tr') as HTMLTableRowElement | null;
        if (!headerRow) {
            return;
        }
        const ths = Array.from(headerRow.children) as HTMLElement[];
        for (let i = 0; i < fields.length; i++) {
            const width = this.storedColumnWidths[fields[i]];
            if (width) {
                const thIndex = frozenCount + i;
                if (thIndex < ths.length) {
                    this.renderer.setStyle(ths[thIndex], 'width', width);
                    this.renderer.setStyle(ths[thIndex], 'min-width', width);
                }
            }
        }
        this.storedColumnWidths = null;
    }

    private restoreGridState(): void {
        const stored = this.gridState.load(STATION_MGMT_GRID_PAGE, STATION_MGMT_GRID_NAME);
        if (!stored) {
            return;
        }
        const validKeys = new Set(STATION_MGMT_DATA_COLUMN_KEYS);
        const visibleColumns = stored.visibleColumns.filter((k) => validKeys.has(k));
        const columnOrder = stored.columnOrder.filter((k) => validKeys.has(k));

        if (visibleColumns.length > 0) {
            this.visibleDataColumnKeys = visibleColumns;
        }
        if (columnOrder.length > 0) {
            this.dataColumnOrder = columnOrder;
        }

        const visibleFields = new Set(this.visibleDataColumnKeys.map((k) => (k === 'status' ? 'statusCategory' : k)));
        visibleFields.add('stationInfoId');
        visibleFields.add('name');
        const restoredSort = stored.sortState.filter((s) => visibleFields.has(s.field));
        this.multiSortMeta = restoredSort.length > 0 ? restoredSort : undefined;

        this.storedColumnWidths = stored.columnWidths;
    }

    private saveGridState(): void {
        const columnWidths = this.readColumnWidthsFromDom();
        const state: GridState = {
            visibleColumns: [...this.visibleDataColumnKeys],
            columnOrder: [...this.dataColumnOrder],
            columnWidths,
            sortState: this.multiSortMeta?.length ? [...this.multiSortMeta] : []
        };
        this.gridState.save(STATION_MGMT_GRID_PAGE, STATION_MGMT_GRID_NAME, state);
    }

    private readColumnWidthsFromDom(): Record<string, string> {
        const widths: Record<string, string> = {};
        const tableEl = this.tableRef?.tableViewChild?.nativeElement as HTMLTableElement | undefined;
        if (!tableEl) {
            return widths;
        }
        const fields = this.scrollableColumns.map((c) => c.field);
        const headerRow = tableEl.querySelector('thead tr') as HTMLTableRowElement | null;
        if (!headerRow) {
            return widths;
        }
        const ths = Array.from(headerRow.children) as HTMLElement[];
        for (let i = 0; i < fields.length; i++) {
            const thIndex = STATION_MGMT_FROZEN_LEFT_TH_COUNT + i;
            if (thIndex < ths.length) {
                const w = ths[thIndex].style.width;
                if (w) {
                    widths[fields[i]] = w;
                }
            }
        }
        return widths;
    }

    onSort(event: unknown): void {
        if (event && typeof event === 'object' && 'multisortmeta' in event) {
            const m = (event as { multisortmeta: SortMeta[] | null | undefined }).multisortmeta;
            this.multiSortMeta = m?.length ? [...m] : undefined;
        }
        this.clearTableSelection();
        this.saveGridState();
    }

    onColResize(): void {
        this.saveGridState();
    }

    resetGridState(table: Table, searchInput?: HTMLInputElement | null): void {
        this.gridState.clear(STATION_MGMT_GRID_PAGE, STATION_MGMT_GRID_NAME);
        this.visibleDataColumnKeys = [...STATION_MGMT_DATA_COLUMN_KEYS];
        this.dataColumnOrder = [...STATION_MGMT_DEFAULT_DATA_COLUMN_ORDER];
        this.multiSortMeta = undefined;
        this.storedColumnWidths = null;
        this.rebuildScrollableColumns();
        this.clearTableSelection();
        table.clear();
        table.filterGlobal('', 'contains');
        if (searchInput) {
            searchInput.value = '';
        }
        this.scheduleApplyScrollableColumnAutoWidths();
    }

    private buildColumnWidthSamples(): StationMgmtColumnWidthSample[] {
        const rows = this.mgmt.rows();
        const sampleRows =
            rows.length === 0 ? [] : rows.slice(0, Math.min(this.tableRowsPerPage, rows.length));
        return this.scrollableColumns.map((col) => ({
            field: col.field,
            minWidthCss: col.minWidth,
            headerText: col.header,
            cellTexts: sampleRows.map((row) => this.cellSampleTextForAutoWidth(row, col.field))
        }));
    }

    private cellSampleTextForAutoWidth(row: StationManagementRow, field: string): string {
        switch (field) {
            case 'statusCategory':
                return this.statusLabel(row);
            case 'isRoaming':
                return this.roamingLabel(row);
            case 'companyName':
                return row.companyName;
            case 'unitCode':
                return row.unitCode?.trim() ? row.unitCode : '—';
            default:
                return this.rowDataCell(row, field);
        }
    }

    onGlobalFilter(table: Table, event: Event): void {
        const v = (event.target as HTMLInputElement).value;
        table.filterGlobal(v, 'contains');
    }

    clearAllFilters(table: Table, searchInput?: HTMLInputElement | null): void {
        table.clear();
        table.filterGlobal('', 'contains');
        if (searchInput) {
            searchInput.value = '';
        }
    }

    clearTableSelection(): void {
        this.selectedRows = [];
    }

    onColReorder(event: { columns?: { field: string }[] }): void {
        const cols = event.columns;
        if (!cols?.length) {
            return;
        }
        const newOrder = cols.map((c) => this.dataKeyFromScrollableField(c.field));
        this.mergeDataColumnOrderFromVisibleReorder(newOrder);
        this.scheduleApplyScrollableColumnAutoWidths();
        this.saveGridState();
    }

    private mergeDataColumnOrderFromVisibleReorder(newVisibleOrder: string[]): void {
        const vis = new Set(this.visibleDataColumnKeys);
        const out: string[] = [];
        let inserted = false;
        for (const k of this.dataColumnOrder) {
            if (vis.has(k)) {
                if (!inserted) {
                    out.push(...newVisibleOrder);
                    inserted = true;
                }
            } else {
                out.push(k);
            }
        }
        if (!inserted) {
            out.push(...newVisibleOrder);
        }
        this.dataColumnOrder = out;
    }

    onVisibleDataColumnsChange(table: Table, keys: string[] | null | undefined): void {
        const next = keys?.length ? [...keys] : [...STATION_MGMT_DATA_COLUMN_KEYS];
        this.visibleDataColumnKeys = next;
        const visible = new Set(this.visibleDataColumnKeys);
        for (const k of STATION_MGMT_DATA_COLUMN_KEYS) {
            if (!visible.has(k) && table.filters?.[k]) {
                delete table.filters[k];
            }
        }
        if (!visible.has('status') && table.filters?.['statusCategory']) {
            delete table.filters['statusCategory'];
        }
        if (!visible.has('isRoaming') && table.filters?.['isRoaming']) {
            delete table.filters['isRoaming'];
        }
        this.rebuildScrollableColumns();
        this.clearTableSelection();
        table._filter();
        this.scheduleApplyScrollableColumnAutoWidths();
        this.saveGridState();
    }

    private rebuildScrollableColumns(): void {
        this.scrollableColumns = this.dataColumnOrder
            .filter((k) => this.visibleDataColumnKeys.includes(k))
            .map((k) => ({
                field: this.fieldForDataColumnKey(k),
                header: this.i18n.t(this.labelKeyForDataColumnKey(k)),
                minWidth: this.minWidthForDataColumnKey(k)
            }));
    }

    private fieldForDataColumnKey(key: string): string {
        return key === 'status' ? 'statusCategory' : key;
    }

    private dataKeyFromScrollableField(field: string): string {
        return field === 'statusCategory' ? 'status' : field;
    }

    private labelKeyForDataColumnKey(key: string): string {
        const opt = STATION_MGMT_DATA_COLUMN_OPTIONS.find((o) => o.key === key);
        return opt?.labelKey ?? 'stationMgmt.col.status';
    }

    private minWidthForDataColumnKey(key: string): string {
        switch (key) {
            case 'status':
                return '9rem';
            case 'address':
                return '12rem';
            case 'phone':
                return '10rem';
            case 'cityName':
                return '9rem';
            case 'districtName':
                return '10rem';
            case 'companyName':
                return '10rem';
            case 'resellerName':
                return '9rem';
            case 'isRoaming':
                return '8rem';
            case 'unitCode':
                return '9rem';
            default:
                return '9rem';
        }
    }

    filterPlaceholder(field: string): string {
        const map: Record<string, string> = {
            address: 'stationMgmt.filterByAddress',
            phone: 'stationMgmt.filterByPhone',
            cityName: 'stationMgmt.filterByCity',
            districtName: 'stationMgmt.filterByDistrict',
            companyName: 'stationMgmt.filterByCompany',
            resellerName: 'stationMgmt.filterByReseller',
            unitCode: 'stationMgmt.filterByUnitCode'
        };
        return map[field] ?? 'stationMgmt.search';
    }

    /** Map current filter value to p-select model (null/undefined → handled in template as 'any'). */
    roamingFilterSelectValue(v: unknown): string {
        if (v === true || v === 'yes') {
            return 'yes';
        }
        if (v === false || v === 'no') {
            return 'no';
        }
        return 'any';
    }

    rowDataCell(row: StationManagementRow, field: string): string {
        const v = (row as unknown as Record<string, unknown>)[field];
        if (v === null || v === undefined) {
            return '';
        }
        return String(v);
    }

    rowSelectAriaLabel(row: StationManagementRow): string {
        return this.i18n.tf('stationMgmt.selection.selectRow', { name: row.name });
    }

    private readonly logoLoadFailedIds = signal<Set<number>>(new Set());

    companyLogoUrl(row: StationManagementRow): string | null {
        return stationManagementCompanyLogoSrc(row.companyName);
    }

    showCompanyLogo(row: StationManagementRow): boolean {
        const url = stationManagementCompanyLogoSrc(row.companyName);
        return !!url && !this.logoLoadFailedIds().has(row.id);
    }

    onLogoBroken(row: StationManagementRow): void {
        this.logoLoadFailedIds.update((prev) => new Set(prev).add(row.id));
    }

    roamingLabel(row: StationManagementRow): string {
        if (row.isRoaming) {
            return this.i18n.t('stationMgmt.roaming.yes');
        }
        return this.i18n.t('stationMgmt.roaming.no');
    }

    statusLabel(row: StationManagementRow): string {
        if (row.isDeleted) {
            return this.i18n.t('stationMgmt.status.deleted');
        }
        return row.isActive ? this.i18n.t('stationMgmt.status.active') : this.i18n.t('stationMgmt.status.inactive');
    }

    statusSeverity(row: StationManagementRow): 'danger' | 'success' | 'warn' {
        if (row.isDeleted) {
            return 'danger';
        }
        return row.isActive ? 'success' : 'warn';
    }

    openEdit(row: StationManagementRow): void {
        this.editRow.set(row);
        this.editVisible.set(true);
    }

    confirmDelete(row: StationManagementRow): void {
        this.confirm.confirm({
            message: this.i18n.t('stationMgmt.delete.confirm'),
            header: this.i18n.t('stationMgmt.delete.header'),
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.mgmt.removeById(row.id);
                this.clearTableSelection();
                this.messages.add({
                    severity: 'info',
                    summary: this.i18n.t('stationMgmt.toast.deletedTitle'),
                    detail: this.i18n.t('stationMgmt.toast.deletedDetail')
                });
            }
        });
    }

    /** WYSIWYG: all rows matching current filter/sort (all pages); columns match visible grid (no checkbox/actions). */
    exportCsv(table: Table): void {
        const { cols, rows } = this.buildExportPayload(table);
        const lines: string[] = [cols.map((c) => escapeCsvCell(c.headerLabel)).join(',')];
        for (const row of rows) {
            lines.push(cols.map((c) => escapeCsvCell(this.exportDisplayValue(row, c.field))).join(','));
        }
        const bom = '\uFEFF';
        this.downloadTextFile(bom + lines.join('\r\n'), `${this.exportBaseFilename()}.csv`, 'text/csv;charset=utf-8');
        this.clearTableSelection();
    }

    exportHtml(table: Table): void {
        const { cols, rows } = this.buildExportPayload(table);
        const ths = cols.map((c) => `<th>${escapeHtmlText(c.headerLabel)}</th>`).join('');
        const body = rows
            .map((row) => {
                const tds = cols.map((c) => `<td>${escapeHtmlText(this.exportDisplayValue(row, c.field))}</td>`).join('');
                return `<tr>${tds}</tr>`;
            })
            .join('');
        const title = escapeHtmlText(this.i18n.t('stationMgmt.pageTitle'));
        const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>${title}</title></head><body><table border="1" cellspacing="0" cellpadding="4"><thead><tr>${ths}</tr></thead><tbody>${body}</tbody></table></body></html>`;
        this.downloadTextFile(html, `${this.exportBaseFilename()}.html`, 'text/html;charset=utf-8');
        this.clearTableSelection();
    }

    /** Real OOXML `.xlsx` via `exceljs` (dynamic import — chunk loads on first export). */
    exportExcel(table: Table): void {
        void this.exportExcelWorkbook(table);
    }

    private async exportExcelWorkbook(table: Table): Promise<void> {
        try {
            const { default: ExcelJS } = await import('exceljs');
            const { cols, rows } = this.buildExportPayload(table);
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet(this.sanitizeExcelSheetName(this.i18n.t('stationMgmt.pageTitle')));
            sheet.addRow(cols.map((c) => c.headerLabel));
            for (const row of rows) {
                sheet.addRow(cols.map((c) => this.exportDisplayValue(row, c.field)));
            }
            const buf = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buf], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            this.downloadBlob(blob, `${this.exportBaseFilename()}.xlsx`);
            this.clearTableSelection();
        } catch {
            this.messages.add({
                severity: 'error',
                summary: this.i18n.t('stationMgmt.export.excelErrorTitle'),
                detail: this.i18n.t('stationMgmt.export.excelErrorDetail')
            });
        }
    }

    /** Excel sheet names: max 31 chars; cannot contain `:\\/?*[]`. */
    private sanitizeExcelSheetName(title: string): string {
        const s = title.replace(/[\\/:*?\[\]]/g, '-').trim();
        return s.length > 0 ? s.slice(0, 31) : 'Sheet1';
    }

    private buildExportPayload(table: Table): {
        cols: { field: string; headerLabel: string }[];
        rows: StationManagementRow[];
    } {
        const rows = (table.processedData ?? []) as StationManagementRow[];
        const cols: { field: string; headerLabel: string }[] = [
            { field: 'stationInfoId', headerLabel: this.i18n.t('stationMgmt.col.stationCode') },
            { field: 'name', headerLabel: this.i18n.t('stationMgmt.col.name') }
        ];
        for (const key of this.dataColumnOrder) {
            if (this.visibleDataColumnKeys.includes(key)) {
                const opt = STATION_MGMT_DATA_COLUMN_OPTIONS.find((o) => o.key === key);
                if (opt) {
                    cols.push({ field: opt.key, headerLabel: this.i18n.t(opt.labelKey) });
                }
            }
        }
        return { cols, rows };
    }

    private exportDisplayValue(row: StationManagementRow, field: string): string {
        switch (field) {
            case 'stationInfoId':
                return String(row.stationInfoId);
            case 'name':
                return row.name ?? '';
            case 'address':
                return row.address ?? '';
            case 'phone':
                return row.phone ?? '';
            case 'cityName':
                return row.cityName ?? '';
            case 'districtName':
                return row.districtName ?? '';
            case 'companyName':
                return row.companyName ?? '';
            case 'resellerName':
                return row.resellerName ?? '';
            case 'isRoaming':
                return this.roamingLabel(row);
            case 'unitCode':
                return row.unitCode?.trim() ? row.unitCode : '—';
            case 'status':
                return this.statusLabel(row);
            default:
                return '';
        }
    }

    private exportBaseFilename(): string {
        const d = new Date();
        const p = (n: number) => String(n).padStart(2, '0');
        return `station-management-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
    }

    private downloadTextFile(content: string, filename: string, mime: string): void {
        const blob = new Blob([content], { type: mime });
        this.downloadBlob(blob, filename);
    }

    private downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
}
