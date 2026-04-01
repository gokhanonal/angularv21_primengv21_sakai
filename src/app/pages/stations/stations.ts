import { AfterViewInit, Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import * as L from 'leaflet';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LazyLoadMeta, SortMeta } from 'primeng/api';
import { StationRow } from './stations.model';
import { StationsService } from './stations.service';

const MARKER_ICON_SIZE: L.PointExpression = [32, 32];
const MARKER_ICON_ANCHOR: L.PointExpression = [16, 32];

@Component({
    selector: 'app-stations',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TableModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        MessageModule,
        SkeletonModule,
        ButtonModule,
        ToggleButtonModule
    ],
    template: `
        @if (loadError(); as errMsg) {
            <p-message severity="error" styleClass="mb-4 w-full">{{ errMsg }}</p-message>
        }

        <div class="card mb-4">
            <div class="font-semibold text-xl mb-1">{{ widgetTitle() }}</div>
            <p class="text-surface-500 dark:text-surface-400 text-sm mb-4">
                @if (loading()) {
                    Loading stations…
                } @else {
                    {{ filteredStations().length }} of {{ allRows.length }} stations &middot; map markers use <code class="text-xs">iconUrl</code> from data
                }
            </p>

            @if (loading()) {
                <p-skeleton width="100%" height="380px" styleClass="rounded-lg border border-surface-200 dark:border-surface-700" />
            } @else {
                <div class="relative rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
                    @if (!loadError() && uniqueStatuses().length > 0) {
                        <div
                            class="absolute top-2 right-2 z-[800] flex flex-wrap gap-2 justify-end items-start max-w-[min(100%-0.75rem,36rem)] pointer-events-none"
                        >
                            <div class="flex flex-wrap gap-2 justify-end pointer-events-auto" role="group" aria-label="Filter stations by status">
                                @for (st of uniqueStatuses(); track st) {
                                    <p-togglebutton
                                        [ngModel]="statusFilterOn()[st]"
                                        (ngModelChange)="onStatusToggle(st, $event)"
                                        [onLabel]="st"
                                        [offLabel]="st"
                                        styleClass="text-sm max-w-[12rem] whitespace-normal h-auto min-h-[2.25rem] py-1.5"
                                    />
                                }
                            </div>
                        </div>
                    }
                    <div #mapContainer class="locations-map rounded-none border-0"></div>
                </div>
            }
        </div>

        @if (loading()) {
            <div class="card">
                <p-skeleton width="10rem" height="1.5rem" styleClass="mb-4" />
                @for (rowIdx of skeletonPlaceholders; track rowIdx) {
                    <div class="flex gap-4 mb-3">
                        <p-skeleton width="55%" height="1.25rem" />
                        <p-skeleton width="30%" height="1.25rem" />
                    </div>
                }
            </div>
        } @else if (!loadError()) {
            <div class="card">
                <div class="font-semibold text-xl mb-4">Stations</div>
                <p-table
                    #stationsDt
                    [value]="tableRows"
                    [lazy]="true"
                    (onLazyLoad)="onLazyLoad($event)"
                    [paginator]="true"
                    [rows]="10"
                    [rowsPerPageOptions]="[10, 25, 50]"
                    [totalRecords]="lazyTotal"
                    [globalFilterFields]="['name', 'status', 'location_code', 'location_id']"
                    [showCurrentPageReport]="true"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                    dataKey="stationKey"
                    sortMode="multiple"
                    [scrollable]="true"
                    scrollHeight="500px"
                    [tableStyle]="{ 'min-width': '48rem' }"
                >
                    <ng-template #caption>
                        <div class="flex items-center justify-between flex-column sm:flex-row gap-2">
                            <button
                                pButton
                                type="button"
                                label="Clear filters"
                                icon="pi pi-filter-slash"
                                class="p-button-outlined"
                                [disabled]="!allRows.length"
                                (click)="clearAllFilters(stationsDt)"
                            ></button>
                            <p-iconfield class="sm:ml-auto w-full sm:w-auto">
                                <p-inputicon class="pi pi-search" />
                                <input
                                    pInputText
                                    type="text"
                                    class="w-full"
                                    placeholder="Search…"
                                    (input)="onGlobalFilter(stationsDt, $event)"
                                />
                            </p-iconfield>
                        </div>
                    </ng-template>
                    <ng-template #header>
                        <tr>
                            <th pSortableColumn="name">
                                <div class="flex justify-between items-center gap-2 flex-wrap">
                                    <span class="inline-flex items-center gap-1">Name <p-sortIcon field="name" /></span>
                                    <p-columnFilter type="text" field="name" display="menu" placeholder="Filter by name" />
                                </div>
                            </th>
                            <th pSortableColumn="status">
                                <div class="flex justify-between items-center gap-2 flex-wrap">
                                    <span class="inline-flex items-center gap-1">Status <p-sortIcon field="status" /></span>
                                    <p-columnFilter type="text" field="status" display="menu" placeholder="Filter by status" />
                                </div>
                            </th>
                            <th style="min-width: 7rem" alignFrozen="right" pFrozenColumn [frozen]="true" class="text-end">Detail</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-row>
                        <tr>
                            <td class="font-medium">{{ row.name }}</td>
                            <td>{{ row.status }}</td>
                            <td alignFrozen="right" pFrozenColumn [frozen]="true" class="text-end">
                                <p-button
                                    type="button"
                                    label="Detail"
                                    icon="pi pi-arrow-right"
                                    iconPos="right"
                                    [routerLink]="['/stations', row.location_id]"
                                    [rounded]="true"
                                    [text]="true"
                                />
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        }
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
export class Stations implements OnInit, AfterViewInit {
    @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLElement>;
    @ViewChild('stationsDt') stationsTable: Table | undefined;

    readonly skeletonPlaceholders = [0, 1, 2, 3, 4, 5, 6, 7];

    allRows: StationRow[] = [];
    tableRows: StationRow[] = [];
    lazyTotal = 0;
    filteredStations = signal<StationRow[]>([]);
    loading = signal(true);
    loadError = signal<string | null>(null);
    widgetTitle = signal('Charging stations');
    uniqueStatuses = signal<string[]>([]);
    statusFilterOn = signal<Record<string, boolean>>({});

    private map: L.Map | undefined;
    private markers: L.Marker[] = [];
    private resizeObserver: ResizeObserver | null = null;
    private invalidateRafId = 0;
    private mapInitScheduled = false;

    private readonly destroyRef = inject(DestroyRef);
    private readonly stationsService = inject(StationsService);

    constructor() {
        this.destroyRef.onDestroy(() => {
            cancelAnimationFrame(this.invalidateRafId);
            this.resizeObserver?.disconnect();
            this.resizeObserver = null;
            this.map?.remove();
            this.map = undefined;
        });
    }

    ngOnInit(): void {
        this.stationsService
            .loadDemo()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: ({ widgetTitle, summaries }) => {
                    this.widgetTitle.set(widgetTitle);
                    this.allRows = summaries.map((s) => ({
                        ...s,
                        stationKey: `station-${s.location_id}-${s.latitude}-${s.longitude}`
                    }));
                    const statuses = [...new Set(this.allRows.map((r) => r.status))].sort((a, b) => a.localeCompare(b));
                    this.uniqueStatuses.set(statuses);
                    const onMap: Record<string, boolean> = {};
                    for (const s of statuses) {
                        onMap[s] = true;
                    }
                    this.statusFilterOn.set(onMap);
                    this.loadError.set(null);
                    this.loading.set(false);
                    this.scheduleMapAndTableInit();
                },
                error: () => {
                    this.allRows = [];
                    this.tableRows = [];
                    this.lazyTotal = 0;
                    this.filteredStations.set([]);
                    this.uniqueStatuses.set([]);
                    this.statusFilterOn.set({});
                    this.loading.set(false);
                    this.loadError.set('Could not load station data from /demo/locations.json.');
                }
            });
    }

    ngAfterViewInit(): void {
        if (!this.loading()) {
            this.scheduleMapAndTableInit();
        }
    }

    onLazyLoad(meta: LazyLoadMeta): void {
        if (!this.allRows.length) {
            this.tableRows = [];
            this.lazyTotal = 0;
            this.filteredStations.set([]);
            this.updateMarkers();
            return;
        }
        const filteredSorted = this.applyFiltersSort(meta);
        this.lazyTotal = filteredSorted.length;
        this.filteredStations.set(filteredSorted);

        const first = meta.first ?? 0;
        const rows = meta.rows ?? 10;
        this.tableRows = filteredSorted.slice(first, first + rows);
        this.updateMarkers();
    }

    onGlobalFilter(table: Table, event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        table.filterGlobal(value, 'contains');
    }

    onStatusToggle(status: string, on: boolean): void {
        this.statusFilterOn.update((m) => ({ ...m, [status]: on }));
        this.reloadLazyFromTable();
    }

    clearAllFilters(table: Table): void {
        const statuses = this.uniqueStatuses();
        const onMap: Record<string, boolean> = {};
        for (const s of statuses) {
            onMap[s] = true;
        }
        this.statusFilterOn.set(onMap);
        table.clear();
        setTimeout(() => this.reloadLazyFromTable(), 0);
    }

    private scheduleMapAndTableInit(): void {
        if (this.mapInitScheduled || this.loading()) {
            return;
        }
        this.mapInitScheduled = true;
        setTimeout(() => {
            this.initMap();
            this.reloadLazyFromTable();
        }, 0);
    }

    private reloadLazyFromTable(): void {
        const run = (): void => {
            const table = this.stationsTable;
            if (!table || !this.allRows.length) {
                return;
            }
            const meta =
                typeof table.createLazyLoadMetadata === 'function' ? table.createLazyLoadMetadata() : { first: 0, rows: 10 };
            this.onLazyLoad(meta as LazyLoadMeta);
        };
        run();
        if (this.allRows.length && this.stationsTable === undefined) {
            setTimeout(run, 50);
        }
    }

    private applyFiltersSort(meta: LazyLoadMeta): StationRow[] {
        const activeStatuses = Object.entries(this.statusFilterOn())
            .filter(([, on]) => on)
            .map(([s]) => s);
        let data: StationRow[];
        if (activeStatuses.length === 0) {
            data = [];
        } else {
            data = this.allRows.filter((r) => activeStatuses.includes(r.status));
        }

        const gfRaw = meta.globalFilter;
        const gf = typeof gfRaw === 'string' ? gfRaw : Array.isArray(gfRaw) ? String(gfRaw[0] ?? '') : '';
        if (gf.trim()) {
            const term = gf.toLowerCase();
            data = data.filter(
                (r) =>
                    r.name.toLowerCase().includes(term) ||
                    r.status.toLowerCase().includes(term) ||
                    r.location_code.toLowerCase().includes(term) ||
                    String(r.location_id).includes(term)
            );
        }

        const filters = meta.filters;
        if (filters) {
            for (const field of ['name', 'status'] as const) {
                const fm = filters[field];
                if (fm == null) {
                    continue;
                }
                const rules = Array.isArray(fm) ? fm : [fm];
                for (const rule of rules) {
                    const v = rule?.value;
                    if (v == null || v === '') {
                        continue;
                    }
                    const needle = String(v).toLowerCase();
                    if (field === 'name') {
                        data = data.filter((r) => r.name.toLowerCase().includes(needle));
                    } else {
                        data = data.filter((r) => r.status.toLowerCase().includes(needle));
                    }
                }
            }
        }

        const multi = meta.multiSortMeta?.filter((m) => m.field) ?? [];
        if (multi.length > 0) {
            data = [...data].sort((a, b) => this.compareMulti(a, b, multi));
        } else if (meta.sortField != null && meta.sortOrder != null) {
            const field = Array.isArray(meta.sortField) ? meta.sortField[0] : meta.sortField;
            const order = meta.sortOrder ?? 1;
            if (field) {
                data = [...data].sort((a, b) => this.compareField(a, b, field, order));
            }
        }

        return data;
    }

    private compareMulti(a: StationRow, b: StationRow, metaList: SortMeta[]): number {
        for (const s of metaList) {
            if (!s.field) {
                continue;
            }
            const c = this.compareField(a, b, s.field, s.order ?? 1);
            if (c !== 0) {
                return c;
            }
        }
        return 0;
    }

    private compareField(a: StationRow, b: StationRow, field: string, order: number): number {
        const va = this.sortKey(a, field);
        const vb = this.sortKey(b, field);
        if (va < vb) {
            return order === 1 ? -1 : 1;
        }
        if (va > vb) {
            return order === 1 ? 1 : -1;
        }
        return 0;
    }

    private sortKey(row: StationRow, field: string): string {
        if (field === 'name') {
            return row.name.toLowerCase();
        }
        if (field === 'status') {
            return row.status.toLowerCase();
        }
        return '';
    }

    private initMap(): void {
        if (this.map) {
            return;
        }
        const host = this.mapContainer?.nativeElement;
        if (!host) {
            return;
        }

        this.map = L.map(host, {
            center: [39, 35],
            zoom: 6,
            scrollWheelZoom: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(this.map);

        this.addMarkers(this.filteredStations());

        this.resizeObserver = new ResizeObserver(() => {
            cancelAnimationFrame(this.invalidateRafId);
            this.invalidateRafId = requestAnimationFrame(() => {
                this.map?.invalidateSize({ animate: false });
            });
        });
        this.resizeObserver.observe(host);

        this.map.whenReady(() => {
            this.refreshMapLayout();
        });
    }

    private refreshMapLayout(): void {
        if (!this.map) {
            return;
        }
        const fix = (): void => {
            if (!this.map) {
                return;
            }
            this.map.invalidateSize({ animate: false });
            if (this.markers.length > 0) {
                this.fitMapToMarkers();
            }
        };
        requestAnimationFrame(fix);
        setTimeout(fix, 0);
        setTimeout(fix, 250);
    }

    private fitMapToMarkers(): void {
        if (!this.map || this.markers.length === 0) {
            return;
        }
        const group = L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.15));
    }

    private addMarkers(rows: StationRow[]): void {
        if (!this.map) {
            return;
        }
        for (const row of rows) {
            const icon = L.icon({
                iconUrl: row.iconUrl,
                iconSize: MARKER_ICON_SIZE,
                iconAnchor: MARKER_ICON_ANCHOR,
                popupAnchor: [0, -28]
            });
            const marker = L.marker([row.latitude, row.longitude], { icon }).addTo(this.map);

            marker.bindTooltip(`<strong>${this.escapeHtml(row.name)}</strong><br>${this.escapeHtml(row.status)}`, {
                direction: 'top',
                offset: [0, -8]
            });

            this.markers.push(marker);
        }
    }

    private escapeHtml(text: string): string {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    private updateMarkers(): void {
        if (!this.map) {
            return;
        }
        for (const m of this.markers) {
            m.remove();
        }
        this.markers = [];
        this.addMarkers(this.filteredStations());
        this.refreshMapLayout();
    }
}
