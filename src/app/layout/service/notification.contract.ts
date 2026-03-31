export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    isRead: boolean;
    type: NotificationType;
    detail?: string;
    link?: string;
}

/**
 * Unread rule:
 * A notification is counted as unread only when isRead is false.
 */
export function isNotificationUnread(notification: NotificationItem): boolean {
    return !notification.isRead;
}

export function countUnreadNotifications(notifications: NotificationItem[]): number {
    return notifications.filter(isNotificationUnread).length;
}
