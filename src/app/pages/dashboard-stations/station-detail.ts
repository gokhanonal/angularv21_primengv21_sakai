import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { DashboardMapItemSummary } from './stations.model';
import { StationsService } from './stations.service';
import { CardMaximizeDirective } from '@/app/shared/directives/card.directive';

function parseLocationIdParam(raw: string | null): number {
    if (raw == null) {
        return Number.NaN;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : Number.NaN;
}

@Component({
    selector: 'app-station-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, SkeletonModule, MessageModule, CardMaximizeDirective],
    template: `
        @if (loadError(); as err) {
            <p-message severity="error" styleClass="mb-4 w-full">{{ err }}</p-message>
            <p-button label="Back to stations" icon="pi pi-arrow-left" [routerLink]="['/stations']" />
        } @else if (loading()) {
            <div class="card flex flex-col gap-4" appCardMaximize [showWindowMaximize]="true">
                <p-skeleton width="40%" height="2rem" />
                <p-skeleton width="100%" height="1rem" />
                @for (i of skeletonLines; track i) {
                    <p-skeleton width="100%" height="1.25rem" />
                }
            </div>
        } @else if (station(); as st) {
            <div class="card flex flex-col gap-4" appCardMaximize [showWindowMaximize]="true">
                <div class="card-header">
                    <div class="card-heading">
                        <h3 class="card-title">{{ st.name }}</h3>
                        <p class="card-description font-mono text-sm">{{ st.location_code }} &middot; ID {{ st.location_id }}</p>
                    </div>
                    <div class="card-actions">
                        <p-button label="Back to stations" icon="pi pi-arrow-left" [routerLink]="['/stations']" [outlined]="true" />
                    </div>
                </div>
                <div class="card-header-divider"></div>
                <div class="grid grid-cols-12 gap-4">
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">Location ID</label>
                    <div class="col-span-12 md:col-span-9">{{ st.location_id }}</div>
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">Location code</label>
                    <div class="col-span-12 md:col-span-9 font-mono">{{ st.location_code }}</div>
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">Name</label>
                    <div class="col-span-12 md:col-span-9">{{ st.name }}</div>
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">Latitude</label>
                    <div class="col-span-12 md:col-span-9">{{ st.latitude }}</div>
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">Longitude</label>
                    <div class="col-span-12 md:col-span-9">{{ st.longitude }}</div>
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">AC charging</label>
                    <div class="col-span-12 md:col-span-9">{{ st.isAC ? 'Yes' : 'No' }}</div>
                    <label class="col-span-12 md:col-span-3 text-surface-500 dark:text-surface-400 font-medium">Status</label>
                    <div class="col-span-12 md:col-span-9">{{ st.status }}</div>
                </div>
            </div>
        } @else {
            <div class="card flex flex-col gap-4" appCardMaximize [showWindowMaximize]="true">
                <div class="font-semibold text-xl">Station not found</div>
                <p class="text-surface-500 dark:text-surface-400">No station matches this location ID.</p>
                <p-button label="Back to stations" icon="pi pi-arrow-left" [routerLink]="['/stations']" />
            </div>
        }
    `
})
export class StationDetail implements OnInit {
    readonly skeletonLines = [0, 1, 2, 3, 4, 5];

    private readonly route = inject(ActivatedRoute);
    private readonly stationsService = inject(StationsService);
    private readonly destroyRef = inject(DestroyRef);

    loading = signal(true);
    loadError = signal<string | null>(null);
    private summariesSignal = signal<DashboardMapItemSummary[]>([]);

    private readonly locationId = toSignal(
        this.route.paramMap.pipe(map((params) => parseLocationIdParam(params.get('locationId')))),
        { initialValue: parseLocationIdParam(this.route.snapshot.paramMap.get('locationId')) }
    );

    readonly station = computed(() => {
        const id = this.locationId();
        if (!Number.isFinite(id)) {
            return undefined;
        }
        return this.summariesSignal().find((s) => s.location_id === id);
    });

    ngOnInit(): void {
        this.stationsService
            .loadDemo()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: ({ summaries }) => {
                    this.summariesSignal.set(summaries);
                    this.loading.set(false);
                    this.loadError.set(null);
                },
                error: () => {
                    this.summariesSignal.set([]);
                    this.loading.set(false);
                    this.loadError.set('Could not load station data from /demo/locations.json.');
                }
            });
    }
}
