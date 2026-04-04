import { afterNextRender, Component, effect, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { LayoutService } from '@/app/layout/service/layout.service';
import { CardMaximizeDirective } from '@/app/shared/directives/card-maximize.directive';

@Component({
    standalone: true,
    selector: 'app-revenue-stream-widget',
    imports: [ChartModule, CardMaximizeDirective],
    template: `<div class="card mb-8!" appCardMaximize [showWindowMaximize]="true">
        <div class="card-header">
            <div class="card-heading">
                <h3 class="card-title">Monthly Target</h3>
                <p class="card-description">Target you've set for each month</p>
            </div>
            <div class="card-actions">
                <a href="#" class="card-action-link" (click)="$event.preventDefault()">
                    View More
                    <i class="pi pi-angle-right"></i>
                </a>
                <button type="button" class="card-action-icon" aria-label="Delete target">
                    <i class="pi pi-trash text-red-500"></i>
                </button>
            </div>
        </div>
        <div class="card-header-divider"></div>
        <p-chart type="bar" [data]="chartData()" [options]="chartOptions()" class="h-100" />
    </div>`
})
export class RevenueStreamWidget {
    layoutService = inject(LayoutService);

    chartData = signal<any>(null);

    chartOptions = signal<any>(null);

    constructor() {
        afterNextRender(() => {
            setTimeout(() => {
                this.initChart();
            }, 150);
        });

        effect(() => {
            this.layoutService.layoutConfig().darkTheme;
            setTimeout(() => {
                this.initChart();
            }, 150);
        });
    }

    initChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const borderColor = documentStyle.getPropertyValue('--surface-border');
        const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

        this.chartData.set({
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [
                {
                    type: 'bar',
                    label: 'Subscriptions',
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-400'),
                    data: [4000, 10000, 15000, 4000],
                    barThickness: 32
                },
                {
                    type: 'bar',
                    label: 'Advertising',
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-300'),
                    data: [2100, 8400, 2400, 7500],
                    barThickness: 32
                },
                {
                    type: 'bar',
                    label: 'Affiliate',
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-200'),
                    data: [4100, 5200, 3400, 7400],
                    borderRadius: {
                        topLeft: 8,
                        topRight: 8,
                        bottomLeft: 0,
                        bottomRight: 0
                    },
                    borderSkipped: false,
                    barThickness: 32
                }
            ]
        });

        this.chartOptions.set({
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        color: textMutedColor
                    },
                    grid: {
                        color: 'transparent',
                        borderColor: 'transparent'
                    }
                },
                y: {
                    stacked: true,
                    ticks: {
                        color: textMutedColor
                    },
                    grid: {
                        color: borderColor,
                        borderColor: 'transparent',
                        drawTicks: false
                    }
                }
            }
        });
    }
}
