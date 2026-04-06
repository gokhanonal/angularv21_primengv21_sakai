import { Component, inject, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ChargingUnitConnector } from '@/app/pages/service/charging-unit-connector.service';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';
import { I18nService } from '@/app/core/i18n/i18n.service';

@Component({
    standalone: true,
    selector: 'app-charging-unit-connectors',
    imports: [CommonModule, DecimalPipe, TagModule, DialogModule, ButtonModule, TranslatePipe],
    template: `@if (connectors().length === 0) {
            <p class="text-muted-color m-0 text-sm">{{ 'dashboard.chargingUnits.connectors.noConnectorYet' | t }}</p>
        } @else {
            <div class="flex flex-wrap gap-3">
                @for (c of connectors(); track c.RID) {
                    <div
                        class="min-w-80 max-w-64 shrink-0 rounded-border border border-surface-200 p-3 dark:border-surface-700"
                    >
                        <div class="mb-3 flex flex-wrap items-center gap-2">
                            <h4 class="m-0 text-sm font-semibold">{{ connectorTitle(c.connectorNr) }}</h4>
                            <p-tag [value]="displayText(c.statusName)" [severity]="statusSeverity(c.status)" />
                        </div>

                        <div class="flex flex-col gap-2 text-sm">
                            <div class="grid grid-cols-[minmax(0,auto)_1fr] items-start gap-x-2 gap-y-1">
                                <span class="text-muted-color whitespace-nowrap">{{
                                    'dashboard.chargingUnits.connectors.labelType' | t
                                }}:</span>
                                <span class="font-medium break-words">{{ displayText(c.stationConnectorName) }}</span>
                            </div>
                            <div class="grid grid-cols-[minmax(0,auto)_1fr] items-center gap-x-2 gap-y-1">
                                <span class="text-muted-color whitespace-nowrap">{{
                                    'dashboard.chargingUnits.connectors.labelPower' | t
                                }}:</span>
                                <span class="font-medium">{{ c.stationConnectorKW }} kW</span>
                            </div>
                            <div class="grid grid-cols-[minmax(0,auto)_1fr] items-center gap-x-2 gap-y-1">
                                <span class="text-muted-color whitespace-nowrap">{{
                                    'dashboard.chargingUnits.connectors.labelAcDc' | t
                                }}:</span>
                                <span class="font-medium">{{
                                    c.stationConnectorAC
                                        ? ('dashboard.chargingUnits.connectors.ac' | t)
                                        : ('dashboard.chargingUnits.connectors.dc' | t)
                                }}</span>
                            </div>
                            <div class="grid grid-cols-[minmax(0,auto)_1fr] items-center gap-x-2 gap-y-1">
                                <span class="text-muted-color whitespace-nowrap">{{
                                    'dashboard.chargingUnits.connectors.labelActive' | t
                                }}:</span>
                                <span class="font-medium">
                                    <i
                                        class="pi text-lg"
                                        [ngClass]="
                                            c.isActive ? 'pi-check text-green-600' : 'pi-times text-red-500'
                                        "
                                        aria-hidden="true"
                                    ></i>
                                </span>
                            </div>
                            <div class="grid grid-cols-[minmax(0,auto)_1fr] items-start gap-x-2 gap-y-1">
                                <span class="text-muted-color whitespace-nowrap">{{
                                    'dashboard.chargingUnits.connectors.labelTariff' | t
                                }}:</span>
                                <span class="font-medium break-words">{{ displayText(c.tariffName) }}</span>
                            </div>
                            <div class="grid grid-cols-[minmax(0,auto)_1fr] items-center gap-x-2 gap-y-1">
                                <span class="text-muted-color whitespace-nowrap">{{
                                    'dashboard.chargingUnits.connectors.labelPrice' | t
                                }}:</span>
                                <span class="font-medium">{{
                                    c.tariffSaleUnitPrice != null
                                        ? (c.tariffSaleUnitPrice | number)
                                        : emDash
                                }}</span>
                            </div>
                            <div class="grid grid-cols-[minmax(0,auto)_1fr] items-start gap-x-2 gap-y-1">
                                <span class="text-muted-color whitespace-nowrap">{{
                                    'dashboard.chargingUnits.connectors.labelChargingStatus' | t
                                }}:</span>
                                <span class="font-medium break-words">{{
                                    c.chargingStatus != null ? c.chargingStatus : emDash
                                }}</span>
                            </div>
                        </div>
                        <div class="mt-3 flex flex-wrap gap-2">
                            <p-button
                                type="button"
                                icon="pi pi-qrcode"
                                [label]="'dashboard.chargingUnits.connectors.btnShowQr' | t"
                                [text]="true"
                                (onClick)="openQrDialog(c)"
                            />
                            <p-button
                                type="button"
                                icon="pi pi-cog"
                                [label]="'dashboard.chargingUnits.connectors.btnOperations' | t"
                                [text]="true"
                                (onClick)="openOpsDialog(c)"
                            />
                        </div>
                    </div>
                }
            </div>

            <p-dialog
                [header]="qrDialogTitle()"
                [(visible)]="qrDialogVisible"
                [modal]="true"
                [closable]="true"
                [dismissableMask]="true"
                [draggable]="false"
                [style]="{ width: 'min(95vw, 24rem)' }"
            >
                <div class="flex flex-col items-center gap-4 py-4">
                    <span class="inline-flex" role="img" [attr.aria-label]="qrImageAltText()">
                        <i class="pi pi-qrcode text-6xl text-muted-color" aria-hidden="true"></i>
                    </span>
                    <p class="text-muted-color m-0 text-center text-sm">
                        {{ 'dashboard.chargingUnits.connectors.qrPlaceholder' | t }}
                    </p>
                </div>
                <ng-template pTemplate="footer">
                    <p-button
                        type="button"
                        [label]="'card.close' | t"
                        (onClick)="qrDialogVisible = false"
                        severity="secondary"
                    />
                </ng-template>
            </p-dialog>

            <p-dialog
                [header]="opsDialogTitle()"
                [(visible)]="opsDialogVisible"
                [modal]="true"
                [closable]="true"
                [dismissableMask]="true"
                [draggable]="false"
                [style]="{ width: 'min(95vw, 30rem)' }"
            >
                <div class="flex flex-col items-center gap-4 py-4">
                    <i class="pi pi-clock text-6xl text-muted-color" aria-hidden="true"></i>
                    <p class="text-muted-color m-0 text-center text-sm">
                        {{ 'dashboard.chargingUnits.connectors.operationsComingSoon' | t }}
                    </p>
                </div>
                <ng-template pTemplate="footer">
                    <p-button
                        type="button"
                        [label]="'card.close' | t"
                        (onClick)="opsDialogVisible = false"
                        severity="secondary"
                    />
                </ng-template>
            </p-dialog>
        }`
})
export class ChargingUnitConnectorsWidget {
    readonly connectors = input<ChargingUnitConnector[]>([]);

    private readonly i18n = inject(I18nService);

    readonly emDash = '\u2014';

    qrDialogVisible = false;
    opsDialogVisible = false;
    private activeQrConnector: ChargingUnitConnector | null = null;
    private activeOpsConnector: ChargingUnitConnector | null = null;

    connectorTitle(connectorNr: number): string {
        return this.i18n.tf('dashboard.chargingUnits.connectors.titleConnector', { nr: connectorNr });
    }

    displayText(value: string | null | undefined): string {
        if (value === null || value === undefined || String(value).trim() === '') {
            return this.emDash;
        }
        return value;
    }

    statusSeverity(status: number): 'success' | 'info' | 'danger' | 'warn' | 'secondary' {
        switch (status) {
            case 1:
                return 'success';
            case 2:
                return 'info';
            case 3:
                return 'danger';
            case 4:
                return 'warn';
            default:
                return 'secondary';
        }
    }

    openQrDialog(connector: ChargingUnitConnector): void {
        this.activeQrConnector = connector;
        this.qrDialogVisible = true;
    }

    openOpsDialog(connector: ChargingUnitConnector): void {
        this.activeOpsConnector = connector;
        this.opsDialogVisible = true;
    }

    qrDialogTitle(): string {
        return this.i18n.t('dashboard.chargingUnits.connectors.dialogQrTitle');
    }

    opsDialogTitle(): string {
        return this.i18n.t('dashboard.chargingUnits.connectors.dialogOperationsTitle');
    }

    qrImageAltText(): string {
        const c = this.activeQrConnector;
        if (c == null) {
            return this.i18n.t('dashboard.chargingUnits.connectors.dialogQrTitle');
        }
        return this.i18n.tf('dashboard.chargingUnits.connectors.qrImageAlt', { nr: c.connectorNr });
    }
}
