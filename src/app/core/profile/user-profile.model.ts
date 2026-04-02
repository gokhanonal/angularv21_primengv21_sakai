/**
 * Mock profile persisted to localStorage; replaceable with HTTP later.
 */
export interface MockUserProfile {
    firstName: string;
    lastName: string;
    /** i18n key for read-only user type label */
    userTypeKey: string;
    email: string;
    phones: string[];
    /** Square avatar as data URL (~256px JPEG), optional */
    avatarDataUrl: string | null;
}

export interface ChangePasswordResult {
    ok: boolean;
    /** i18n key when ok is false */
    messageKey?: string;
}
