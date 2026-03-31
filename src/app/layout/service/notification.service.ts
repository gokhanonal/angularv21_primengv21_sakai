import { Injectable, computed, signal } from '@angular/core';
import { NotificationItem, NotificationType, countUnreadNotifications } from './notification.contract';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private readonly notificationsState = signal<NotificationItem[]>(NotificationService.getInitialNotifications());

    private static getInitialNotifications(): NotificationItem[] {
        return [
            { id: '1', title: 'New order received', description: 'Order #1042 has been placed by customer.', createdAt: '2 min ago', isRead: false, type: 'info' },
            { id: '2', title: 'Payment confirmed', description: 'Payment for Order #1039 was successful.', createdAt: '15 min ago', isRead: false, type: 'success' },
            { id: '3', title: 'Low stock warning', description: 'Product "Widget A" stock is below threshold.', createdAt: '1 hour ago', isRead: false, type: 'warning' },
            { id: '4', title: 'Server error detected', description: 'API endpoint /orders returned 500 errors.', createdAt: '2 hours ago', isRead: true, type: 'error' },
            { id: '5', title: 'New user registered', description: 'User jane.doe@example.com signed up.', createdAt: '3 hours ago', isRead: true, type: 'info' },
            { id: '6', title: 'Deployment complete', description: 'v2.4.1 deployed to production successfully.', createdAt: '5 hours ago', isRead: true, type: 'success' },
            { id: '7', title: 'Scheduled maintenance', description: 'System maintenance planned for tonight 02:00.', createdAt: '6 hours ago', isRead: true, type: 'warning' },
            { id: '8', title: 'Report generated', description: 'Monthly sales report is ready for download.', createdAt: '1 day ago', isRead: true, type: 'info' }
        ];
    }

    notifications = computed(() => this.notificationsState());

    unreadCount = computed(() => countUnreadNotifications(this.notificationsState()));

    latestFive = computed(() => this.notificationsState().slice(0, 5));

    selectedNotification = signal<NotificationItem | null>(null);

    detailDialogVisible = false;

    setNotifications(notifications: NotificationItem[]): void {
        this.notificationsState.set(notifications);
    }

    markAsRead(id: string): void {
        this.notificationsState.update((items) =>
            items.map((item) => (item.id === id ? { ...item, isRead: true } : item))
        );
    }

    openDetail(item: NotificationItem): void {
        this.markAsRead(item.id);
        this.selectedNotification.set({ ...item, isRead: true });
        this.detailDialogVisible = true;
    }

    closeDetail(): void {
        this.detailDialogVisible = false;
        this.selectedNotification.set(null);
    }
}
