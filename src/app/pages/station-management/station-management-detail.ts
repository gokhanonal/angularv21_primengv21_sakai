import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { stationManagementCompanyLogoSrc } from './station-management-logo';
import { StationManagementRow } from './station-management.model';
import { StationManagementService } from './station-management.service';
import { CardMaximizeDirective } from '@/app/shared/directives/card-maximize.directive';

@Component({
    selector: 'app-station-management-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TabsModule, TagModule, TranslatePipe, CardMaximizeDirective],
    template: `
        <div class="card mb-4" appCardMaximize>
            @if (loading()) {
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <p class="text-surface-500 dark:text-surface-400 m-0 min-w-0">{{ 'stationMgmt.loading' | t }}</p>
                    <p-button
                        [label]="'stationMgmt.backToList' | t"
                        icon="pi pi-arrow-left"
                        [outlined]="true"
                        routerLink="/station-management"
                        styleClass="shrink-0 self-start sm:self-center w-full sm:w-auto"
                    />
                </div>
            } @else if (notFound()) {
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div class="min-w-0 flex-1">
                        <h2 class="text-xl font-semibold m-0 mb-2">{{ 'stationMgmt.notFound' | t }}</h2>
                        <p class="text-surface-600 dark:text-surface-400 m-0">{{ 'stationMgmt.notFoundHint' | t }}</p>
                    </div>
                    <p-button
                        [label]="'stationMgmt.backToList' | t"
                        icon="pi pi-arrow-left"
                        [outlined]="true"
                        routerLink="/station-management"
                        styleClass="shrink-0 self-start sm:self-center w-full sm:w-auto"
                    />
                </div>
            } @else if (row(); as r) {
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-2 min-w-0 flex-1">
                        <h2 class="text-2xl font-semibold m-0 truncate min-w-0 max-w-full sm:max-w-[min(100%,36rem)]">{{ r.name }}</h2>
                        <p-tag [value]="statusLabel(r)" [severity]="statusSeverity(r)" class="shrink-0" />
                    </div>
                    <p-button
                        [label]="'stationMgmt.backToList' | t"
                        icon="pi pi-arrow-left"
                        [outlined]="true"
                        routerLink="/station-management"
                        styleClass="shrink-0 self-start sm:self-center w-full sm:w-auto"
                    />
                </div>

                <p-tabs value="0">
                    <p-tablist>
                        <p-tab value="0">{{ 'stationMgmt.tabs.stationInfo' | t }}</p-tab>
                        <p-tab value="1">{{ 'stationMgmt.tabs.chargingUnits' | t }}</p-tab>
                        <p-tab value="2">{{ 'stationMgmt.tabs.workingHours' | t }}</p-tab>
                        <p-tab value="3">{{ 'stationMgmt.tabs.pricing' | t }}</p-tab>
                        <p-tab value="4">{{ 'stationMgmt.tabs.commissions' | t }}</p-tab>
                        <p-tab value="5">{{ 'stationMgmt.tabs.stationUsers' | t }}</p-tab>
                        <p-tab value="6">{{ 'stationMgmt.tabs.accounting' | t }}</p-tab>
                    </p-tablist>
                    <p-tabpanels>
                        <p-tabpanel value="0">
                            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 m-0">
                                <dt class="text-muted-color text-sm m-0">{{ 'stationMgmt.detailIdLabel' | t }}</dt>
                                <dd class="m-0 font-medium">{{ r.id }}</dd>
                                <dt class="text-muted-color text-sm m-0">{{ 'stationMgmt.col.stationCode' | t }}</dt>
                                <dd class="m-0">{{ r.stationInfoId }}</dd>
                                <dt class="text-muted-color text-sm m-0">{{ 'stationMgmt.col.address' | t }}</dt>
                                <dd class="m-0">{{ r.address || '—' }}</dd>
                                <dt class="text-muted-color text-sm m-0">{{ 'stationMgmt.col.phone' | t }}</dt>
                                <dd class="m-0">{{ r.phone || '—' }}</dd>
                                <dt class="text-muted-color text-sm m-0">{{ 'stationMgmt.col.city' | t }}</dt>
                                <dd class="m-0">{{ r.cityName || '—' }}</dd>
                                <dt class="text-muted-color text-sm m-0">{{ 'stationMgmt.col.district' | t }}</dt>
                                <dd class="m-0">{{ r.districtName || '—' }}</dd>
                                <dt class="text-muted-color text-sm m-0">{{ 'stationMgmt.col.company' | t }}</dt>
                                <dd class="m-0 flex items-center gap-2">
                                    @if (companyLogo(r); as logo) {
                                        <img [src]="logo" [alt]="r.companyName" class="max-h-8 w-auto object-contain" />
                                    } @else {
                                        {{ r.companyName || '—' }}
                                    }
                                </dd>
                                <dt class="text-muted-color text-sm m-0">{{ 'stationMgmt.col.reseller' | t }}</dt>
                                <dd class="m-0">{{ r.resellerName || '—' }}</dd>
                                <dt class="text-muted-color text-sm m-0">{{ 'stationMgmt.col.roaming' | t }}</dt>
                                <dd class="m-0">{{ roamingLabel(r) }}</dd>
                                <dt class="text-muted-color text-sm m-0">{{ 'stationMgmt.col.unitCode' | t }}</dt>
                                <dd class="m-0">{{ r.unitCode.trim() ? r.unitCode : '—' }}</dd>
                            </dl>
                        </p-tabpanel>
                        @for (i of otherTabIndices; track i) {
                            <p-tabpanel [value]="otherTabValue(i)">
                                <p class="text-surface-600 dark:text-surface-400 m-0">{{ 'stationMgmt.tabPlaceholder' | t }}</p>
                            </p-tabpanel>
                        }
                    </p-tabpanels>
                </p-tabs>
            }
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
export class StationManagementDetail implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly mgmt = inject(StationManagementService);
    private readonly i18n = inject(I18nService);
    private readonly destroyRef = inject(DestroyRef);

    readonly loading = signal(true);
    readonly row = signal<StationManagementRow | null>(null);
    readonly notFound = signal(false);

    readonly otherTabIndices = [0, 1, 2, 3, 4, 5];

    otherTabValue(i: number): string {
        return String(i + 1);
    }

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('stationId');
        const id = idParam ? Number.parseInt(idParam, 10) : Number.NaN;
        if (!Number.isFinite(id)) {
            this.loading.set(false);
            this.notFound.set(true);
            return;
        }

        this.mgmt
            .load()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    const found = this.mgmt.findById(id);
                    this.row.set(found ?? null);
                    this.notFound.set(!found);
                    this.loading.set(false);
                },
                error: () => {
                    this.row.set(null);
                    this.notFound.set(true);
                    this.loading.set(false);
                }
            });
    }

    companyLogo(r: StationManagementRow): string | null {
        return stationManagementCompanyLogoSrc(r.companyName);
    }

    roamingLabel(r: StationManagementRow): string {
        return r.isRoaming ? this.i18n.t('stationMgmt.roaming.yes') : this.i18n.t('stationMgmt.roaming.no');
    }

    statusLabel(r: StationManagementRow): string {
        if (r.isDeleted) {
            return this.i18n.t('stationMgmt.status.deleted');
        }
        return r.isActive ? this.i18n.t('stationMgmt.status.active') : this.i18n.t('stationMgmt.status.inactive');
    }

    statusSeverity(r: StationManagementRow): 'danger' | 'success' | 'warn' {
        if (r.isDeleted) {
            return 'danger';
        }
        return r.isActive ? 'success' : 'warn';
    }
}
