import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '@/app/layout/service/notification.service';
import { NotificationItem, NotificationType } from '@/app/layout/service/notification.contract';
import { NotificationDetail } from './notification-detail';
import { CardMaximizeDirective } from '@/app/shared/directives/card-maximize.directive';

type ReadFilter = 'all' | 'unread' | 'read';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule, NotificationDetail, CardMaximizeDirective],
    template: `
        <div class="card" appCardMaximize>
            <div class="card-header">
                <div class="card-heading">
                    <h3 class="card-title">All Notifications</h3>
                    <p class="card-description">{{ notificationService.notifications().length }} total, {{ notificationService.unreadCount() }} unread</p>
                </div>
            </div>
            <div class="card-header-divider"></div>

            <div class="notification-filters">
                <div class="notification-tab-group">
                    @for (tab of readFilterOptions; track tab.value) {
                        <button
                            type="button"
                            class="notification-tab"
                            [class.notification-tab-active]="readFilter() === tab.value"
                            (click)="readFilter.set(tab.value)"
                        >{{ tab.label }}</button>
                    }
                </div>

                <div class="notification-type-filter">
                    <select class="notification-type-select" [value]="typeFilter()" (change)="typeFilter.set($any($event.target).value)">
                        @for (opt of typeFilterOptions; track opt.value) {
                            <option [value]="opt.value">{{ opt.label }}</option>
                        }
                    </select>
                </div>
            </div>

            @for (item of filteredNotifications(); track item.id) {
                <div class="notification-row" [class.notification-unread]="!item.isRead" (click)="onNotificationClick(item)">
                    <div class="notification-row-icon">
                        <i class="pi" [ngClass]="{
                            'pi-info-circle text-blue-500': item.type === 'info',
                            'pi-check-circle text-green-500': item.type === 'success',
                            'pi-exclamation-triangle text-orange-500': item.type === 'warning',
                            'pi-times-circle text-red-500': item.type === 'error'
                        }"></i>
                    </div>
                    <div class="notification-row-content">
                        <div class="notification-row-title">{{ item.title }}</div>
                        <div class="notification-row-desc">{{ item.description }}</div>
                    </div>
                    <div class="notification-row-time">{{ item.createdAt }}</div>
                </div>
            }

            @if (filteredNotifications().length === 0) {
                <div class="notification-empty">No notifications match the current filter.</div>
            }
        </div>
        <app-notification-detail />
    `,
    styles: [`
        .notification-filters {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 0.75rem;
            flex-wrap: wrap;
        }

        .notification-tab-group {
            display: inline-flex;
            border: 1px solid var(--surface-border);
            border-radius: 9999px;
            overflow: hidden;
        }

        .notification-tab {
            padding: 0.35rem 1rem;
            font-size: 0.8125rem;
            font-weight: 600;
            border: 0;
            background: transparent;
            color: var(--text-secondary-color);
            cursor: pointer;
            transition: background-color 0.15s, color 0.15s;
        }

        .notification-tab:hover {
            background-color: var(--surface-hover);
        }

        .notification-tab-active {
            background-color: var(--primary-color);
            color: var(--primary-contrast-color);
        }

        .notification-tab-active:hover {
            background-color: var(--primary-color);
        }

        .notification-type-select {
            padding: 0.35rem 0.75rem;
            font-size: 0.8125rem;
            border: 1px solid var(--surface-border);
            border-radius: 9999px;
            background-color: var(--surface-card);
            color: var(--text-color);
            outline: none;
            cursor: pointer;
        }

        .notification-row {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            cursor: pointer;
            border-radius: var(--content-border-radius);
            transition: background-color 0.15s;
        }

        .notification-row:hover {
            background-color: var(--surface-hover);
        }

        .notification-unread {
            background-color: var(--highlight-bg);
        }

        .notification-row-icon {
            padding-top: 0.15rem;
            font-size: 1.25rem;
        }

        .notification-row-content {
            flex: 1;
            min-width: 0;
        }

        .notification-row-title {
            font-weight: 600;
            font-size: 0.9375rem;
            color: var(--text-color);
            line-height: 1.3;
        }

        .notification-row-desc {
            font-size: 0.8125rem;
            color: var(--text-secondary-color);
            line-height: 1.35;
            margin-top: 0.1rem;
        }

        .notification-row-time {
            font-size: 0.75rem;
            color: var(--text-secondary-color);
            white-space: nowrap;
            padding-top: 0.15rem;
        }

        .notification-empty {
            text-align: center;
            padding: 2rem 1rem;
            color: var(--text-secondary-color);
            font-size: 0.9375rem;
        }
    `]
})
export class Notifications {
    notificationService = inject(NotificationService);

    readFilter = signal<ReadFilter>('all');

    typeFilter = signal<NotificationType | 'all'>('all');

    readFilterOptions: { label: string; value: ReadFilter }[] = [
        { label: 'All', value: 'all' },
        { label: 'Unread', value: 'unread' },
        { label: 'Read', value: 'read' }
    ];

    typeFilterOptions: { label: string; value: NotificationType | 'all' }[] = [
        { label: 'All Types', value: 'all' },
        { label: 'Info', value: 'info' },
        { label: 'Success', value: 'success' },
        { label: 'Warning', value: 'warning' },
        { label: 'Error', value: 'error' }
    ];

    filteredNotifications = computed(() => {
        let items = this.notificationService.notifications();
        const read = this.readFilter();
        const type = this.typeFilter();

        if (read === 'unread') {
            items = items.filter((n) => !n.isRead);
        } else if (read === 'read') {
            items = items.filter((n) => n.isRead);
        }

        if (type !== 'all') {
            items = items.filter((n) => n.type === type);
        }

        return items;
    });

    onNotificationClick(item: NotificationItem): void {
        this.notificationService.openDetail(item);
    }
}
