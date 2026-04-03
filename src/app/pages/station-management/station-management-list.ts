import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { Table, TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { stationManagementCompanyLogoSrc } from './station-management-logo';
import { StationManagementRow } from './station-management.model';
import { StationManagementService } from './station-management.service';

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
        SplitButtonModule,
        TranslatePipe
    ],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast />
        <p-confirmDialog />

        @if (mgmt.loadError(); as errKey) {
            <p-message severity="error" styleClass="mb-4 w-full">{{ errKey | t }}</p-message>
            <p-button [label]="'stationMgmt.retry' | t" icon="pi pi-refresh" (onClick)="reload()" class="mb-4" />
        }

        <div class="card">
            <h3 class="card-title mb-1">{{ 'stationMgmt.pageTitle' | t }}</h3>
            <p class="text-surface-500 dark:text-surface-400 text-sm mb-4">{{ 'stationMgmt.subtitle' | t }}</p>

            @if (loading()) {
                <p-skeleton width="100%" height="2.5rem" styleClass="mb-3" />
                <p-skeleton width="100%" height="22rem" />
            } @else if (!mgmt.loadError()) {
                <p-table
                    #dt
                    [value]="mgmt.rows()"
                    dataKey="id"
                    selectionMode="multiple"
                    [(selection)]="selectedRows"
                    [scrollable]="true"
                    scrollHeight="480px"
                    [tableStyle]="{ 'min-width': '75rem' }"
                    [reorderableColumns]="true"
                    sortMode="multiple"
                    [paginator]="true"
                    [rows]="10"
                    [rowsPerPageOptions]="[10, 25, 50]"
                    [showCurrentPageReport]="true"
                    [currentPageReportTemplate]="'stationMgmt.pageReport' | t"
                    [globalFilterFields]="globalFilterFieldsForTable"
                    (onSort)="clearTableSelection()"
                    (onFilter)="clearTableSelection()"
                >
                    <ng-template #caption>
                        <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center justify-between">
                            <div class="flex flex-wrap gap-2 items-center">
                                <p-button
                                    type="button"
                                    [label]="'stationMgmt.refresh' | t"
                                    icon="pi pi-refresh"
                                    [outlined]="true"
                                    (onClick)="reload()"
                                />
                                <p-button
                                    type="button"
                                    [label]="'stationMgmt.clearFilters' | t"
                                    icon="pi pi-filter-slash"
                                    [outlined]="true"
                                    (onClick)="clearAllFilters(dt, globalFilterInput)"
                                />
                                <p-splitbutton
                                    type="button"
                                    icon="pi pi-file-export"
                                    [label]="''"
                                    [outlined]="true"
                                    [model]="exportSplitMenuItems(dt)"
                                    (onClick)="exportExcel(dt)"
                                    [tooltip]="exportSplitTooltipText()"
                                    [buttonProps]="exportSplitMainButtonProps()"
                                    [expandAriaLabel]="exportSplitExpandAria()"
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
                            <p-iconfield class="w-full sm:w-auto sm:ml-auto">
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
                        </div>
                    </ng-template>
                    <ng-template #header>
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
                                <span class="inline-flex items-center gap-1">{{ 'stationMgmt.col.stationCode' | t }} <p-sortIcon field="stationInfoId" /></span>
                            </th>
                            <th pSortableColumn="name" pFrozenColumn alignFrozen="left" style="min-width: 14rem">
                                <div class="flex justify-between items-center gap-2 flex-wrap">
                                    <span class="inline-flex items-center gap-1">{{ 'stationMgmt.col.name' | t }} <p-sortIcon field="name" /></span>
                                    <p-columnFilter
                                        type="text"
                                        field="name"
                                        display="menu"
                                        [placeholder]="'stationMgmt.filterByName' | t"
                                    />
                                </div>
                            </th>
                            @if (isDataColumnVisible('status')) {
                                <th style="min-width: 9rem">{{ 'stationMgmt.col.status' | t }}</th>
                            }
                            @if (isDataColumnVisible('address')) {
                                <th pSortableColumn="address" style="min-width: 12rem">
                                    <span class="inline-flex items-center gap-1">{{ 'stationMgmt.col.address' | t }} <p-sortIcon field="address" /></span>
                                </th>
                            }
                            @if (isDataColumnVisible('phone')) {
                                <th pSortableColumn="phone" style="min-width: 10rem">
                                    <span class="inline-flex items-center gap-1">{{ 'stationMgmt.col.phone' | t }} <p-sortIcon field="phone" /></span>
                                </th>
                            }
                            @if (isDataColumnVisible('cityName')) {
                                <th pSortableColumn="cityName" style="min-width: 9rem">
                                    <div class="flex justify-between items-center gap-2 flex-wrap">
                                        <span class="inline-flex items-center gap-1">{{ 'stationMgmt.col.city' | t }} <p-sortIcon field="cityName" /></span>
                                        <p-columnFilter
                                            type="text"
                                            field="cityName"
                                            display="menu"
                                            [placeholder]="'stationMgmt.filterByCity' | t"
                                        />
                                    </div>
                                </th>
                            }
                            @if (isDataColumnVisible('districtName')) {
                                <th pSortableColumn="districtName" style="min-width: 10rem">
                                    <span class="inline-flex items-center gap-1">{{ 'stationMgmt.col.district' | t }} <p-sortIcon field="districtName" /></span>
                                </th>
                            }
                            @if (isDataColumnVisible('companyName')) {
                                <th style="min-width: 10rem">{{ 'stationMgmt.col.company' | t }}</th>
                            }
                            @if (isDataColumnVisible('resellerName')) {
                                <th pSortableColumn="resellerName" style="min-width: 9rem">
                                    <span class="inline-flex items-center gap-1">{{ 'stationMgmt.col.reseller' | t }} <p-sortIcon field="resellerName" /></span>
                                </th>
                            }
                            @if (isDataColumnVisible('isRoaming')) {
                                <th pSortableColumn="isRoaming" style="min-width: 8rem">
                                    <span class="inline-flex items-center gap-1">{{ 'stationMgmt.col.roaming' | t }} <p-sortIcon field="isRoaming" /></span>
                                </th>
                            }
                            @if (isDataColumnVisible('unitCode')) {
                                <th pSortableColumn="unitCode" style="min-width: 9rem">
                                    <span class="inline-flex items-center gap-1">{{ 'stationMgmt.col.unitCode' | t }} <p-sortIcon field="unitCode" /></span>
                                </th>
                            }
                            <th
                                pFrozenColumn
                                alignFrozen="right"
                                style="min-width: 13rem"
                                class="text-end"
                            >
                                {{ 'stationMgmt.col.actions' | t }}
                            </th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-row>
                        <tr>
                            <td pFrozenColumn alignFrozen="left" class="text-center" style="width: 3rem">
                                <p-tableCheckbox [value]="row" [ariaLabel]="rowSelectAriaLabel(row)" />
                            </td>
                            <td pFrozenColumn alignFrozen="left" class="font-mono text-sm">{{ row.stationInfoId }}</td>
                            <td pFrozenColumn alignFrozen="left" class="font-medium">{{ row.name }}</td>
                            @if (isDataColumnVisible('status')) {
                                <td>
                                    <p-tag [value]="statusLabel(row)" [severity]="statusSeverity(row)" />
                                </td>
                            }
                            @if (isDataColumnVisible('address')) {
                                <td>{{ row.address }}</td>
                            }
                            @if (isDataColumnVisible('phone')) {
                                <td>{{ row.phone }}</td>
                            }
                            @if (isDataColumnVisible('cityName')) {
                                <td>{{ row.cityName }}</td>
                            }
                            @if (isDataColumnVisible('districtName')) {
                                <td>{{ row.districtName }}</td>
                            }
                            @if (isDataColumnVisible('companyName')) {
                                <td>
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
                                </td>
                            }
                            @if (isDataColumnVisible('resellerName')) {
                                <td>{{ row.resellerName }}</td>
                            }
                            @if (isDataColumnVisible('isRoaming')) {
                                <td>{{ roamingLabel(row) }}</td>
                            }
                            @if (isDataColumnVisible('unitCode')) {
                                <td>{{ row.unitCode?.trim() ? row.unitCode : '—' }}</td>
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

    readonly mgmt = inject(StationManagementService);
    private readonly confirm = inject(ConfirmationService);
    private readonly messages = inject(MessageService);
    private readonly i18n = inject(I18nService);
    private readonly destroyRef = inject(DestroyRef);

    readonly loading = signal(true);
    readonly editVisible = signal(false);
    readonly editRow = signal<StationManagementRow | null>(null);

    /** Cleared when sort, filters, or global search change the visible row set (see tasks.md — Station Management). */
    selectedRows: StationManagementRow[] = [];

    /** Keys of optional (non-frozen) data columns currently shown in the grid. */
    visibleDataColumnKeys: string[] = [...STATION_MGMT_DATA_COLUMN_KEYS];

    readonly columnPickerOptions = computed(() => {
        this.i18n.lang();
        return STATION_MGMT_DATA_COLUMN_OPTIONS.map((d) => ({
            key: d.key,
            label: this.i18n.t(d.labelKey)
        }));
    });

    /** Main segment = Excel; menu = CSV + HTML (BA default — no duplicate Excel in menu). */
    readonly exportSplitMainButtonProps = computed(() => {
        this.i18n.lang();
        return { ariaLabel: this.i18n.t('stationMgmt.export.splitAria') };
    });

    readonly exportSplitExpandAria = computed(() => {
        this.i18n.lang();
        return this.i18n.t('stationMgmt.export.expandAria');
    });

    readonly exportSplitTooltipText = computed(() => {
        this.i18n.lang();
        return this.i18n.t('stationMgmt.export.splitTooltip');
    });

    exportSplitMenuItems(dt: Table): MenuItem[] {
        return [
            {
                label: this.i18n.t('stationMgmt.export.csv'),
                icon: 'pi pi-file',
                command: () => this.exportCsv(dt)
            },
            {
                label: this.i18n.t('stationMgmt.export.html'),
                icon: 'pi pi-code',
                command: () => this.exportHtml(dt)
            }
        ];
    }

    /** Global search only scans name plus optional columns that are visible (WYSIWYG with column picker). */
    get globalFilterFieldsForTable(): string[] {
        const optional = ['address', 'phone', 'cityName', 'districtName', 'companyName', 'resellerName', 'unitCode'];
        return ['name', ...optional.filter((k) => this.visibleDataColumnKeys.includes(k))];
    }

    ngOnInit(): void {
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
                },
                error: () => this.loading.set(false)
            });
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

    isDataColumnVisible(key: string): boolean {
        return this.visibleDataColumnKeys.includes(key);
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
        this.clearTableSelection();
        table._filter();
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
        for (const opt of STATION_MGMT_DATA_COLUMN_OPTIONS) {
            if (this.visibleDataColumnKeys.includes(opt.key)) {
                cols.push({ field: opt.key, headerLabel: this.i18n.t(opt.labelKey) });
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
