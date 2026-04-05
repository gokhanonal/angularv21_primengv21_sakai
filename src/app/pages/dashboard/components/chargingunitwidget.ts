import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ChargingUnit, ChargingUnitService } from '@/app/pages/service/charging-unit.service';
import { CardMaximizeDirective } from '@/app/shared/directives/card-maximize.directive';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';

@Component({
    standalone: true,
    selector: 'app-charging-unit-widget',
    imports: [CommonModule, TableModule, ButtonModule, RippleModule, CardMaximizeDirective, TranslatePipe],
    template: `<div class="card mb-8!" appCardMaximize [showWindowMaximize]="true">
        <div class="card-header">

            <div class="card-actions">
                <a href="#" class="card-action-link" (click)="$event.preventDefault()">
                    {{ 'dashboard.chargingUnits.addNew' | t }}
                    <i class="pi pi-angle-right"></i>
                </a>
            </div>
        </div>
        <div class="card-header-divider"></div>

        <p-table [value]="units()" [paginator]="true" [rows]="5" responsiveLayout="scroll">
            <ng-template #header>
                <tr>
                    <th>{{ 'dashboard.chargingUnits.colPhoto' | t }}</th>
                    <th pSortableColumn="deviceCode">
                        {{ 'dashboard.chargingUnits.colDeviceCode' | t }}
                        <p-sortIcon field="deviceCode"></p-sortIcon>
                    </th>
                    <th pSortableColumn="serialNumber">
                        {{ 'dashboard.chargingUnits.colSerial' | t }}
                        <p-sortIcon field="serialNumber"></p-sortIcon>
                    </th>
                    <th>{{ 'dashboard.chargingUnits.colActions' | t }}</th>
                </tr>
            </ng-template>
            <ng-template #body let-unit>
                <tr>
                    <td style="width: 15%; min-width: 5rem;">
                        <span
                            class="inline-flex items-center justify-center w-[3.125rem] h-[3.125rem] rounded-border border border-surface-200 dark:border-surface-700"
                            role="img"
                            [attr.aria-label]="'dashboard.chargingUnits.photoAlt' | t"
                        >
                            <i class="pi pi-bolt text-xl text-muted-color" aria-hidden="true"></i>
                        </span>
                    </td>
                    <td style="width: 35%; min-width: 7rem;">{{ unit.deviceCode }}</td>
                    <td style="width: 35%; min-width: 8rem;">{{ unit.serialNumber }}</td>
                    <td style="width: 15%;">
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
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>`,
    providers: [ChargingUnitService]
})
export class ChargingUnitWidget implements OnInit {
    readonly units = signal<ChargingUnit[]>([]);

    private readonly chargingUnitService = inject(ChargingUnitService);

    ngOnInit(): void {
        this.chargingUnitService.getChargingUnits().then((data) => this.units.set(data));
    }
}
