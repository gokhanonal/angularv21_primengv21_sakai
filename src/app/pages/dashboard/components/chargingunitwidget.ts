import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import type { PaginatorState } from 'primeng/paginator';
import { ChargingUnit, ChargingUnitService } from '@/app/pages/service/charging-unit.service';
import {
    ChargingUnitConnector,
    ChargingUnitConnectorService
} from '@/app/pages/service/charging-unit-connector.service';
import { CardMaximizeDirective } from '@/app/shared/directives/card.directive';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { ChargingUnitConnectorsWidget } from '@/app/pages/dashboard/components/chargingunitconnectorswidget';

@Component({
    standalone: true,
    selector: 'app-charging-unit-widget',
    imports: [
        CommonModule,
        DatePipe,
        ButtonModule,
        RippleModule,
        PaginatorModule,
        TagModule,
        ToastModule,
        CardMaximizeDirective,
        TranslatePipe,
        ChargingUnitConnectorsWidget
    ],
    template: `<div class="card mb-8!" appCardMaximize [showWindowMaximize]="true">
        <div class="card-header">
            <div class="card-actions">
                <a href="#" class="card-action-link" (click)="$event.preventDefault()">
                    <i class="pi pi-plus"></i>
                    {{ 'dashboard.chargingUnits.addNew' | t }}
                </a>
            </div>
        </div>
        <div class="card-header-divider"></div>

        <div class="flex flex-col gap-4">
            @for (unit of pagedUnits(); track unit.deviceCode) {
                <div
                    class="charging-unit-card rounded-border border border-surface-200 dark:border-surface-700 p-4"
                    [attr.data-device-code]="unit.deviceCode"
                >
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
                            <div class="min-w-0 flex-1">
                                <div class="mb-3 flex flex-wrap items-center gap-2">
                                    <h3 class="m-0 text-lg font-semibold">
                                        {{ unit.brandName }} - {{ unit.model }} - {{ unit.deviceCode }}
                                    </h3>
                                    <p-tag [value]="hoStatusDisplay(unit)" />
                                </div>
                                <div class="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                                    <div class="grid grid-cols-[minmax(0,auto)_1fr] items-center gap-x-3 gap-y-1 text-sm">
                                        <span class="text-muted-color whitespace-nowrap">{{
                                            'dashboard.chargingUnits.labelAccessType' | t
                                        }}</span>
                                        <span class="font-medium break-words">{{ displayText(unit.accessType) }}</span>
                                    </div>
                                    <div class="grid grid-cols-[minmax(0,auto)_1fr] items-center gap-x-3 gap-y-1 text-sm">
                                        <span class="text-muted-color whitespace-nowrap">{{
                                            'dashboard.chargingUnits.labelRoaming' | t
                                        }}</span>
                                        <span class="font-medium">
                                            <i
                                                class="pi text-lg"
                                                [ngClass]="
                                                    unit.sendRoaming
                                                        ? 'pi-check text-green-600'
                                                        : 'pi-times text-red-500'
                                                "
                                                aria-hidden="true"
                                            ></i>
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-[minmax(0,auto)_1fr] items-center gap-x-3 gap-y-1 text-sm">
                                        <span class="text-muted-color whitespace-nowrap">{{
                                            'dashboard.chargingUnits.labelIsFree' | t
                                        }}</span>
                                        <span class="font-medium">
                                            <i
                                                class="pi text-lg"
                                                [ngClass]="
                                                    unit.isFreePoint
                                                        ? 'pi-check text-green-600'
                                                        : 'pi-times text-red-500'
                                                "
                                                aria-hidden="true"
                                            ></i>
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-[minmax(0,auto)_1fr] items-center gap-x-3 gap-y-1 text-sm">
                                        <span class="text-muted-color whitespace-nowrap">{{
                                            'dashboard.chargingUnits.labelSerial' | t
                                        }}</span>
                                        <span class="font-medium break-words">{{ displayText(unit.serialNumber) }}</span>
                                    </div>
                                    <div class="grid grid-cols-[minmax(0,auto)_1fr] items-center gap-x-3 gap-y-1 text-sm">
                                        <span class="text-muted-color whitespace-nowrap">{{
                                            'dashboard.chargingUnits.labelInvestor' | t
                                        }}</span>
                                        <span class="font-medium break-words">{{ displayText(unit.investor) }}</span>
                                    </div>
                                    <div class="grid grid-cols-[minmax(0,auto)_1fr] items-center gap-x-3 gap-y-1 text-sm">
                                        <span class="text-muted-color whitespace-nowrap">{{
                                            'dashboard.chargingUnits.labelCreationDate' | t
                                        }}</span>
                                        <span class="font-medium break-words">{{
                                            unit.createDate ? (unit.createDate | date: 'medium') : emDash
                                        }}</span>
                                    </div>
                                    <div class="grid grid-cols-[minmax(0,auto)_1fr] items-center gap-x-3 gap-y-1 text-sm">
                                        <span class="text-muted-color whitespace-nowrap">{{
                                            'dashboard.chargingUnits.labelLastConnection' | t
                                        }}</span>
                                        <span class="font-medium break-words">{{
                                            unit.lastHeartBeat ? (unit.lastHeartBeat | date: 'medium') : emDash
                                        }}</span>
                                    </div>
                                    <div class="grid grid-cols-[minmax(0,auto)_1fr] items-center gap-x-3 gap-y-1 text-sm">
                                        <span class="text-muted-color whitespace-nowrap">{{
                                            'dashboard.chargingUnits.labelUnitIp' | t
                                        }}</span>
                                        <span class="font-medium break-words">{{
                                            displayText(unit.externalAddress)
                                        }}</span>
                                    </div>
                                </div>
                            </div>
                            <div
                                class="flex shrink-0 justify-center lg:w-36 lg:justify-end"
                                [attr.aria-label]="'dashboard.chargingUnits.photoAlt' | t"
                            >
                                @if (showUnitPhoto(unit)) {
                                    <img
                                        [src]="unit.photoUrl!"
                                        [alt]="unit.brandName + ' ' + unit.model + ' ' + unit.deviceCode"
                                        class="h-60 w-60 rounded-border border border-surface-200 object-cover dark:border-surface-700"
                                        (error)="onPhotoError(unit)"
                                    />
                                } @else {
                                    <span
                                        class="inline-flex h-28 w-28 items-center justify-center rounded-border border border-surface-200 dark:border-surface-700"
                                        role="img"
                                    >
                                        <i class="pi pi-bolt text-3xl text-muted-color" aria-hidden="true"></i>
                                    </span>
                                }
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-1">
                            <button
                                pButton
                                pRipple
                                type="button"
                                icon="pi pi-pencil"
                                class="p-button p-component p-button-text p-button-rounded p-button-icon-only mr-1"
                                [attr.aria-label]="'dashboard.chargingUnits.editAria' | t"
                                (click)="$event.preventDefault()"
                            ></button>
                            <button
                                pButton
                                pRipple
                                type="button"
                                icon="pi pi-trash"
                                class="p-button p-component p-button-text p-button-rounded p-button-icon-only mr-1"
                                [attr.aria-label]="'dashboard.chargingUnits.deleteAria' | t"
                                (click)="$event.preventDefault()"
                            ></button>
                            <button
                                pButton
                                pRipple
                                type="button"
                                icon="pi pi-cog"
                                class="p-button p-component p-button-text p-button-rounded p-button-icon-only"
                                [attr.aria-label]="'dashboard.chargingUnits.configAria' | t"
                                (click)="$event.preventDefault()"
                            ></button>
                        </div>
                        <div class="border-t border-surface-200 pt-3 dark:border-surface-700">
                            <div class="mb-2 text-sm font-medium text-muted-color">
                                {{ 'dashboard.chargingUnits.connectors.sectionTitle' | t }}
                            </div>
                            <div class="card-actions mb-2">
                                <a href="#" class="card-action-link" (click)="$event.preventDefault()">
                                    <i class="pi pi-plus"></i>
                                    {{ 'dashboard.chargingUnits.connectors.addNew' | t }}
                                </a>
                            </div>
                            <app-charging-unit-connectors [connectors]="getConnectorsForUnit(unit.deviceCode)" />
                        </div>
                    </div>
                </div>
            } @empty {
                <p class="text-muted-color m-0 text-sm">{{ 'dashboard.chargingUnits.empty' | t }}</p>
            }
        </div>

        @if (units().length > pageSize) {
            <p-paginator
                class="mt-4"
                [rows]="pageSize"
                [totalRecords]="units().length"
                [first]="first()"
                (onPageChange)="onPageChange($event)"
            />
        }
    </div>`,
    providers: [ChargingUnitConnectorService, MessageService]
})
export class ChargingUnitWidget implements OnInit {
    readonly stationId = input<number>();

    readonly units = signal<ChargingUnit[]>([]);
    readonly first = signal(0);
    readonly pageSize = 5;
    readonly emDash = '\u2014';

    readonly connectorsByDevice = signal<Map<string, ChargingUnitConnector[]>>(new Map());

    readonly pagedUnits = computed(() => {
        const list = this.units();
        const start = this.first();
        return list.slice(start, start + this.pageSize);
    });

    private readonly photoBrokenKeys = signal<ReadonlySet<string>>(new Set());

    private readonly chargingUnitService = inject(ChargingUnitService);
    private readonly connectorService = inject(ChargingUnitConnectorService);
    private readonly messages = inject(MessageService);
    private readonly i18n = inject(I18nService);

    ngOnInit(): void {
        const sid = this.stationId();
        const unitsPromise =
            sid !== undefined
                ? this.chargingUnitService.getByStationId(sid)
                : this.chargingUnitService.getChargingUnits();

        void unitsPromise.then((data) => {
            this.first.set(0);
            this.photoBrokenKeys.set(new Set());
            this.units.set(data);
        });

        void this.connectorService
            .getConnectors()
            .then((list) => {
                const map = new Map<string, ChargingUnitConnector[]>();
                for (const c of list) {
                    const existing = map.get(c.deviceCode);
                    if (existing) {
                        existing.push(c);
                    } else {
                        map.set(c.deviceCode, [c]);
                    }
                }
                for (const arr of map.values()) {
                    arr.sort((a, b) => {
                        if (a.connectorNr !== b.connectorNr) {
                            return a.connectorNr - b.connectorNr;
                        }
                        return a.RID - b.RID;
                    });
                }
                this.connectorsByDevice.set(map);
            })
            .catch(() => {
                this.messages.add({
                    severity: 'error',
                    summary: this.i18n.t('dashboard.chargingUnits.connectors.loadErrorToastSummary'),
                    detail: this.i18n.t('dashboard.chargingUnits.connectors.loadErrorToastDetail')
                });
                this.connectorsByDevice.set(new Map());
            });
    }

    getConnectorsForUnit(deviceCode: string): ChargingUnitConnector[] {
        return this.connectorsByDevice().get(deviceCode) ?? [];
    }

    onPageChange(event: PaginatorState): void {
        this.first.set(event.first ?? 0);
    }

    displayText(value: string | null | undefined): string {
        if (value === null || value === undefined || String(value).trim() === '') {
            return this.emDash;
        }
        return value;
    }

    hoStatusDisplay(unit: ChargingUnit): string {
        const v = unit.hoStatus?.trim();
        return v ? v : this.emDash;
    }

    showUnitPhoto(unit: ChargingUnit): boolean {
        return !!unit.photoUrl && !this.photoBrokenKeys().has(unit.deviceCode);
    }

    onPhotoError(unit: ChargingUnit): void {
        const next = new Set(this.photoBrokenKeys());
        next.add(unit.deviceCode);
        this.photoBrokenKeys.set(next);
    }
}
