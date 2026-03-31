import { AfterViewInit, Component, DestroyRef, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import * as L from 'leaflet';
import { MOCK_LOCATIONS, STATUS_COLORS, SiteLocation } from './location.data';

@Component({
    selector: 'app-locations',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, InputTextModule, TagModule, IconFieldModule, InputIconModule],
    template: `
        <div class="card mb-4">
            <div class="font-semibold text-xl mb-1">Regional sites</div>
            <p class="text-surface-500 dark:text-surface-400 text-sm mb-4">{{ filteredSites().length }} of {{ sites.length }} sites &middot; marker fill = Status column color</p>
            <div #mapContainer class="locations-map rounded-lg border border-surface-200 dark:border-surface-700"></div>
        </div>

        <div class="card">
            <div class="font-semibold text-xl mb-4">Sites directory</div>
            <p-table
                #dt
                [value]="sites"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[10, 25, 50]"
                [globalFilterFields]="['site', 'city', 'country', 'region', 'status']"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                responsiveLayout="scroll"
                dataKey="site"
            >
                <ng-template #caption>
                    <div class="flex items-center justify-between">
                        <div></div>
                        <p-iconfield>
                            <p-inputicon class="pi pi-search" />
                            <input pInputText type="text" placeholder="Search..." (input)="onGlobalFilter($event)" />
                        </p-iconfield>
                    </div>
                </ng-template>
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="site">Site <p-sortIcon field="site" /></th>
                        <th pSortableColumn="city">City <p-sortIcon field="city" /></th>
                        <th pSortableColumn="country">Country <p-sortIcon field="country" /></th>
                        <th pSortableColumn="region">Region <p-sortIcon field="region" /></th>
                        <th pSortableColumn="capacity">Capacity <p-sortIcon field="capacity" /></th>
                        <th pSortableColumn="status">Status <p-sortIcon field="status" /></th>
                        <th>Lat / Lng</th>
                    </tr>
                </ng-template>
                <ng-template #body let-site>
                    <tr>
                        <td class="font-medium">{{ site.site }}</td>
                        <td>{{ site.city }}</td>
                        <td>{{ site.country }}</td>
                        <td>{{ site.region }}</td>
                        <td>{{ site.capacity | number }}</td>
                        <td>
                            <span class="font-medium" [style.color]="getStatusColor(site.status)">{{ site.status }}</span>
                        </td>
                        <td class="text-surface-500 text-sm">{{ site.lat }}, {{ site.lng }}</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
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
export class Locations implements AfterViewInit {
    @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLElement>;
    @ViewChild('dt') table!: any;

    sites: SiteLocation[] = MOCK_LOCATIONS;
    filteredSites = signal<SiteLocation[]>(MOCK_LOCATIONS);

    private map: L.Map | undefined;
    private markers: L.CircleMarker[] = [];
    private resizeObserver: ResizeObserver | null = null;
    private invalidateRafId = 0;

    private readonly destroyRef = inject(DestroyRef);

    constructor() {
        this.destroyRef.onDestroy(() => {
            cancelAnimationFrame(this.invalidateRafId);
            this.resizeObserver?.disconnect();
            this.resizeObserver = null;
            this.map?.remove();
            this.map = undefined;
        });
    }

    ngAfterViewInit(): void {
        queueMicrotask(() => this.initMap());
    }

    onGlobalFilter(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.table.filterGlobal(value, 'contains');

        if (!value.trim()) {
            this.filteredSites.set(this.sites);
        } else {
            const term = value.toLowerCase();
            this.filteredSites.set(
                this.sites.filter(
                    s =>
                        s.site.toLowerCase().includes(term) ||
                        s.city.toLowerCase().includes(term) ||
                        s.country.toLowerCase().includes(term) ||
                        s.region.toLowerCase().includes(term) ||
                        s.status.toLowerCase().includes(term)
                )
            );
        }
        this.updateMarkers();
    }

    getStatusColor(status: string): string {
        return STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? '#6b7280';
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
            center: [20, 0],
            zoom: 2,
            scrollWheelZoom: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(this.map);

        this.addMarkers(this.sites);

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

    /** Recompute map pixel size (sidebar/layout transitions) and refit markers. */
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
        this.map.fitBounds(group.getBounds().pad(0.25));
    }

    private addMarkers(sites: SiteLocation[]): void {
        if (!this.map) {
            return;
        }
        for (const site of sites) {
            const color = this.getStatusColor(site.status);
            const marker = L.circleMarker([site.lat, site.lng], {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            }).addTo(this.map);

            marker.bindTooltip(
                `<strong>${site.site}</strong><br>${site.city}, ${site.country}<br>Capacity: ${site.capacity}<br>Status: ${site.status}`,
                {
                    direction: 'top',
                    offset: [0, -8]
                }
            );

            this.markers.push(marker);
        }
    }

    private updateMarkers(): void {
        if (!this.map) {
            return;
        }
        for (const m of this.markers) {
            m.remove();
        }
        this.markers = [];
        this.addMarkers(this.filteredSites());

        this.refreshMapLayout();
    }
}
