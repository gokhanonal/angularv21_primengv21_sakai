import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { NotificationService } from '@/app/layout/service/notification.service';

@Component({
    selector: 'app-notification-detail',
    standalone: true,
    imports: [CommonModule, DialogModule],
    template: `
        <p-dialog
            [header]="notificationService.selectedNotification()?.title ?? 'Notification'"
            [(visible)]="notificationService.detailDialogVisible"
            [modal]="true"
            [dismissableMask]="true"
            [style]="{ width: '28rem' }"
        >
            @if (notificationService.selectedNotification(); as item) {
                <div class="notification-detail">
                    <div class="notification-detail-type">
                        <i class="pi" [ngClass]="{
                            'pi-info-circle text-blue-500': item.type === 'info',
                            'pi-check-circle text-green-500': item.type === 'success',
                            'pi-exclamation-triangle text-orange-500': item.type === 'warning',
                            'pi-times-circle text-red-500': item.type === 'error'
                        }"></i>
                        <span class="notification-detail-type-label">{{ item.type | titlecase }}</span>
                        <span class="notification-detail-time">{{ item.createdAt }}</span>
                    </div>
                    <p class="notification-detail-desc">{{ item.description }}</p>
                    @if (item.detail) {
                        <p class="notification-detail-body">{{ item.detail }}</p>
                    }
                </div>
            }
        </p-dialog>
    `,
    styles: [`
        .notification-detail {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .notification-detail-type {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
        }

        .notification-detail-type-label {
            font-weight: 600;
            color: var(--text-color);
        }

        .notification-detail-time {
            margin-left: auto;
            color: var(--text-secondary-color);
            font-size: 0.75rem;
        }

        .notification-detail-desc {
            margin: 0;
            color: var(--text-color);
            font-size: 0.9375rem;
            line-height: 1.5;
        }

        .notification-detail-body {
            margin: 0;
            color: var(--text-secondary-color);
            font-size: 0.875rem;
            line-height: 1.5;
        }
    `]
})
export class NotificationDetail {
    notificationService = inject(NotificationService);
}
