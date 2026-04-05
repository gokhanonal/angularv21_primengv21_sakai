import { CommonModule } from '@angular/common';
import {
    Component,
    DestroyRef,
    ElementRef,
    OnInit,
    computed,
    effect,
    inject,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { stationManagementCompanyLogoSrc } from './station-management-logo';
import { StationManagementRow } from './station-management.model';
import { StationManagementService } from './station-management.service';
import { CardMaximizeDirective } from '@/app/shared/directives/card.directive';
import { AvatarEditorDialogComponent } from '@/app/shared/image-editor/avatar-editor-dialog.component';
import { ChargingUnit, ChargingUnitService } from '@/app/pages/service/charging-unit.service';
import { ChargingUnitWidget } from '@/app/pages/dashboard/components/chargingunitwidget';

const MAX_STATION_PICTURES = 10;
const MAX_PICTURE_BYTES = 1048576 * 2;

export interface StationPicture {
    id: string;
    dataUrl: string;
    caption: string;
    isNew: boolean;
    addedAt: number;
}

@Component({
    selector: 'app-station-management-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ButtonModule,
        CarouselModule,
        InputTextModule,
        MessageModule,
        TabsModule,
        TagModule,
        TooltipModule,
        TranslatePipe,
        CardMaximizeDirective,
        AvatarEditorDialogComponent,
        ChargingUnitWidget
    ],
    providers: [ChargingUnitService],
    template: `
        <div class="card mb-4" appCardMaximize [showWindowMaximize]="false">
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
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div class="card m-0" appCardMaximize [showWindowMaximize]="true">
                                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 m-0 self-start">
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
                            </div>

                            <div class="card m-0" appCardMaximize [showWindowMaximize]="true">
                                <h3 class="card-title">{{ 'stationMgmt.pictures.cardTitle' | t }}</h3>

                                @if (fileError(); as fe) {
                                    <p-message severity="error" [text]="fe" styleClass="w-full" />
                                }

                                @if (sortedPictures().length === 0) {
                                    <div class="flex flex-col items-center justify-center py-8">
                                        <p class="text-muted-color m-0 mb-4">{{ 'stationMgmt.pictures.empty' | t }}</p>
                                        <p-button
                                            type="button"
                                            [label]="'stationMgmt.pictures.add' | t"
                                            icon="pi pi-image"
                                            severity="secondary"
                                            (onClick)="onAddPicture()"
                                        />
                                    </div>
                                } @else {
                                    <p-carousel
                                        [value]="sortedPictures()"
                                        [numVisible]="3"
                                        [numScroll]="3"
                                        [circular]="false"
                                    >
                                        <ng-template let-pic #item>
                                            <div class="p-2">
                                                <div class="relative">
                                                    <img [src]="pic.dataUrl" [alt]="pic.caption" class="w-full rounded-border" />
                                                    @if (pic.isNew) {
                                                        <div class="absolute top-2 right-2">
                                                            <p-tag [value]="'stationMgmt.pictures.newBadge' | t" severity="success" />
                                                        </div>
                                                    }
                                                    <div class="absolute bottom-2 left-2 flex gap-1">
                                                        <p-button
                                                            type="button"
                                                            icon="pi pi-image"
                                                            [rounded]="true"
                                                            [text]="true"
                                                            severity="contrast"
                                                            [pTooltip]="'stationMgmt.pictures.change' | t"
                                                            tooltipPosition="top"
                                                            (onClick)="onChangePicture(pic.id)"
                                                        />
                                                        <p-button
                                                            type="button"
                                                            icon="pi pi-trash"
                                                            [rounded]="true"
                                                            [text]="true"
                                                            severity="danger"
                                                            [pTooltip]="'stationMgmt.pictures.delete' | t"
                                                            tooltipPosition="top"
                                                            (onClick)="onDeletePicture(pic.id)"
                                                        />
                                                    </div>
                                                </div>
                                                <input
                                                    pInputText
                                                    type="text"
                                                    [value]="pic.caption"
                                                    (input)="onCaptionChange(pic.id, $event)"
                                                    [placeholder]="'stationMgmt.pictures.captionPlaceholder' | t"
                                                    class="w-full mt-2"
                                                />
                                            </div>
                                        </ng-template>
                                    </p-carousel>
                                    <div class="flex flex-col items-center mt-4">
                                        <p-button
                                            type="button"
                                            [label]="'stationMgmt.pictures.add' | t"
                                            icon="pi pi-plus"
                                            severity="secondary"
                                            [disabled]="atMaxPictures()"
                                            (onClick)="onAddPicture()"
                                        />
                                        @if (atMaxPictures()) {
                                            <p class="text-muted-color text-sm m-0 mt-2">{{ 'stationMgmt.pictures.maxReached' | t }}</p>
                                        }
                                    </div>
                                }

                                <input
                                    #fileInput
                                    type="file"
                                    accept="image/*"
                                    class="hidden"
                                    (change)="onFileSelected($event)"
                                />
                            </div>
                            </div>
                        </p-tabpanel>
                        <p-tabpanel value="1">
                            <app-charging-unit-widget />
                            @if (stationChargingUnits().length === 0) {
                                <p class="text-surface-600 dark:text-surface-400 m-0">{{ 'stationMgmt.tabPlaceholder' | t }}</p>
                            } @else {
                                @for (unit of stationChargingUnits(); track unit.deviceCode) {
                                    <div class="mb-3 p-3 border border-surface-200 dark:border-surface-700 rounded-md">
                                        <span class="font-medium">{{ unit.deviceCode }}</span>
                                        <span class="text-surface-500 dark:text-surface-400 ml-2">{{ unit.serialNumber }}</span>
                                    </div>
                                }
                            }
                        </p-tabpanel>
                        @for (i of placeholderTabIndices; track i) {
                            <p-tabpanel [value]="placeholderTabValue(i)">
                                <p class="text-surface-600 dark:text-surface-400 m-0">{{ 'stationMgmt.tabPlaceholder' | t }}</p>
                            </p-tabpanel>
                        }
                    </p-tabpanels>
                </p-tabs>
            }
        </div>

        <app-avatar-editor-dialog
            [visible]="editorOpen()"
            (visibleChange)="onEditorVisibleChange($event)"
            [imageSrc]="editorObjectUrl() ?? ''"
            (confirmed)="onEditorConfirmed($event)"
        />
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

    private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

    private prevPicturesStationKey: number | null = null;

    readonly loading = signal(true);
    readonly row = signal<StationManagementRow | null>(null);
    readonly notFound = signal(false);

    readonly pictures = signal<StationPicture[]>([]);
    readonly sortedPictures = computed(() =>
        [...this.pictures()].sort((a, b) => b.addedAt - a.addedAt)
    );
    readonly editorOpen = signal(false);
    readonly editorObjectUrl = signal<string | null>(null);
    readonly pendingItemId = signal<string | null>(null);
    readonly fileError = signal<string | null>(null);
    private readonly nextCaptionSeq = signal(1);

    readonly atMaxPictures = computed(() => this.pictures().length >= MAX_STATION_PICTURES);

    readonly stationChargingUnits = signal<ChargingUnit[]>([]);
    private readonly chargingUnitService = inject(ChargingUnitService);

    readonly placeholderTabIndices = [0, 1, 2, 3, 4];

    constructor() {
        effect(() => {
            const r = this.row();
            const key = r?.id ?? null;
            if (key === this.prevPicturesStationKey) {
                return;
            }
            untracked(() => {
                this.pictures.set([]);
                this.nextCaptionSeq.set(1);
                this.fileError.set(null);
                this.pendingItemId.set(null);
                this.editorOpen.set(false);
                const prevUrl = this.editorObjectUrl();
                if (prevUrl?.startsWith('blob:')) {
                    URL.revokeObjectURL(prevUrl);
                }
                this.editorObjectUrl.set(null);
            });
            this.prevPicturesStationKey = key;
        });
    }

    placeholderTabValue(i: number): string {
        return String(i + 2);
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
                    if (found) {
                        this.chargingUnitService.getByStationId(found.id).then(units => this.stationChargingUnits.set(units));
                    }
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

    onAddPicture(): void {
        this.pendingItemId.set(null);
        this.fileInputRef()?.nativeElement.click();
    }

    onChangePicture(id: string): void {
        this.pendingItemId.set(id);
        this.fileInputRef()?.nativeElement.click();
    }

    onDeletePicture(id: string): void {
        this.pictures.update((list) => list.filter((p) => p.id !== id));
    }

    onCaptionChange(id: string, event: Event): void {
        const v = (event.target as HTMLInputElement).value;
        this.pictures.update((list) => list.map((p) => (p.id === id ? { ...p, caption: v } : p)));
    }

    onFileSelected(event: Event): void {
        this.fileError.set(null);
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file) {
            return;
        }
        if (!file.type.startsWith('image/')) {
            this.fileError.set(this.i18n.t('stationMgmt.pictures.errorFileType'));
            return;
        }
        if (file.size > MAX_PICTURE_BYTES) {
            this.fileError.set(this.i18n.t('stationMgmt.pictures.errorFileSize'));
            return;
        }
        const pending = this.pendingItemId();
        if (pending === null && this.pictures().length >= MAX_STATION_PICTURES) {
            this.fileError.set(this.i18n.t('stationMgmt.pictures.maxReached'));
            return;
        }
        const url = URL.createObjectURL(file);
        const prev = this.editorObjectUrl();
        if (prev?.startsWith('blob:')) {
            URL.revokeObjectURL(prev);
        }
        this.editorObjectUrl.set(url);
        this.editorOpen.set(true);
    }

    onEditorVisibleChange(open: boolean): void {
        this.editorOpen.set(open);
        if (!open) {
            const prev = this.editorObjectUrl();
            if (prev?.startsWith('blob:')) {
                URL.revokeObjectURL(prev);
            }
            this.editorObjectUrl.set(null);
        }
    }

    onEditorConfirmed(dataUrl: string): void {
        const stationName = this.row()?.name?.trim() || this.i18n.t('stationMgmt.col.name');
        const pending = this.pendingItemId();
        if (pending === null) {
            if (this.pictures().length >= MAX_STATION_PICTURES) {
                return;
            }
            const n = this.nextCaptionSeq();
            this.nextCaptionSeq.set(n + 1);
            this.pictures.update((list) => [
                ...list,
                {
                    id: crypto.randomUUID(),
                    dataUrl,
                    caption: `${stationName} ${n}`,
                    isNew: true,
                    addedAt: Date.now()
                }
            ]);
        } else {
            this.pictures.update((list) =>
                list.map((p) => (p.id === pending ? { ...p, dataUrl, isNew: false } : p))
            );
        }
        this.pendingItemId.set(null);
    }
}
