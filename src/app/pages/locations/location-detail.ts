import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { STATUS_COLORS, getLocationById } from './location.data';
import { CardMaximizeDirective } from '@/app/shared/directives/card-maximize.directive';

function parseLocationIdParam(raw: string | null): number {
    if (raw == null) {
        return Number.NaN;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : Number.NaN;
}

@Component({
    selector: 'app-location-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, CardMaximizeDirective],
    template: `
        @if (location(); as loc) {
            <div class="card flex flex-col gap-4" appCardMaximize [showWindowMaximize]="true">
                <div class="card-header">
                    <div class="card-heading">
                        <h3 class="card-title">{{ loc.site }}</h3>
                        <p class="card-description">{{ loc.location_code }} &middot; {{ loc.city }}, {{ loc.country }}</p>
                    </div>
                    <div class="card-actions">
                        <p-button label="Back to directory" icon="pi pi-arrow-left" [routerLink]="['/locations']" [outlined]="true" />
                    </div>
                </div>
                <div class="card-header-divider"></div>
                <div class="grid grid-cols-12 gap-4">
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">Location ID</label>
                    <div class="col-span-12 md:col-span-9">{{ loc.location_id }}</div>
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">Location code</label>
                    <div class="col-span-12 md:col-span-9 font-mono">{{ loc.location_code }}</div>
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">Site name</label>
                    <div class="col-span-12 md:col-span-9">{{ loc.site }}</div>
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">City</label>
                    <div class="col-span-12 md:col-span-9">{{ loc.city }}</div>
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">Country</label>
                    <div class="col-span-12 md:col-span-9">{{ loc.country }}</div>
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">Region</label>
                    <div class="col-span-12 md:col-span-9">{{ loc.region }}</div>
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">Capacity</label>
                    <div class="col-span-12 md:col-span-9">{{ loc.capacity | number }}</div>
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">Status</label>
                    <div class="col-span-12 md:col-span-9">
                        <span class="font-medium" [style.color]="statusColors[loc.status]">{{ loc.status }}</span>
                    </div>
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">Coordinates</label>
                    <div class="col-span-12 md:col-span-9 text-surface-600 dark:text-surface-300">{{ loc.lat }}, {{ loc.lng }}</div>
                </div>
            </div>
        } @else {
            <div class="card flex flex-col gap-4" appCardMaximize [showWindowMaximize]="true">
                <div class="font-semibold text-xl">Location not found</div>
                <p class="text-surface-500 dark:text-surface-400">No site matches this ID.</p>
                <p-button label="Back to directory" icon="pi pi-arrow-left" [routerLink]="['/locations']" />
            </div>
        }
    `,
})
export class LocationDetail {
    protected readonly statusColors = STATUS_COLORS;

    private readonly route = inject(ActivatedRoute);

    private readonly locationId = toSignal(
        this.route.paramMap.pipe(
            map((params) => parseLocationIdParam(params.get('locationId')))
        ),
        { initialValue: parseLocationIdParam(this.route.snapshot.paramMap.get('locationId')) }
    );

    readonly location = computed(() => {
        const id = this.locationId();
        if (!Number.isFinite(id)) {
            return undefined;
        }
        return getLocationById(id);
    });
}
