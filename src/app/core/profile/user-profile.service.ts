import { Injectable, computed, signal } from '@angular/core';
import type { ChangePasswordResult, MockUserProfile } from './user-profile.model';

const PROFILE_STORAGE_KEY = 'priland.mockUserProfile.v1';
const PASSWORD_STORAGE_KEY = 'priland.mockUserPassword.v1';

const DEFAULT_PASSWORD = 'DemoPass1';

const DEFAULT_PROFILE: MockUserProfile = {
    firstName: 'Jane',
    lastName: 'Doe',
    userTypeKey: 'profile.userType.administrator',
    email: 'jane.doe@example.com',
    phones: ['+1 555 0100', '+1 555 0101'],
    avatarDataUrl: null
};

@Injectable({
    providedIn: 'root'
})
export class UserProfileService {
    /** Persisted editable + read-only display fields + avatar */
    private readonly _profile = signal<MockUserProfile>({ ...DEFAULT_PROFILE });

    readonly profile = this._profile.asReadonly();

    readonly avatarDataUrl = computed(() => this._profile().avatarDataUrl);

    constructor() {
        this.loadFromStorage();
    }

    loadFromStorage(): void {
        try {
            const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as Partial<MockUserProfile>;
                this._profile.set({
                    ...DEFAULT_PROFILE,
                    ...parsed,
                    phones: Array.isArray(parsed.phones) ? parsed.phones : DEFAULT_PROFILE.phones,
                    avatarDataUrl:
                        typeof parsed.avatarDataUrl === 'string' || parsed.avatarDataUrl === null
                            ? parsed.avatarDataUrl ?? null
                            : DEFAULT_PROFILE.avatarDataUrl
                });
            } else {
                this._profile.set({ ...DEFAULT_PROFILE });
            }
        } catch {
            this._profile.set({ ...DEFAULT_PROFILE });
        }
    }

    private persistProfile(): void {
        try {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(this._profile()));
        } catch {
            /* quota or private mode */
        }
    }

    private getStoredPassword(): string {
        try {
            return localStorage.getItem(PASSWORD_STORAGE_KEY) ?? DEFAULT_PASSWORD;
        } catch {
            return DEFAULT_PASSWORD;
        }
    }

    private setStoredPassword(value: string): void {
        try {
            localStorage.setItem(PASSWORD_STORAGE_KEY, value);
        } catch {
            /* ignore */
        }
    }

    saveProfile(partial: Pick<MockUserProfile, 'firstName' | 'lastName'>): void {
        this._profile.update((p) => ({
            ...p,
            firstName: partial.firstName.trim(),
            lastName: partial.lastName.trim()
        }));
        this.persistProfile();
    }

    setAvatarFromDataUrl(dataUrl: string | null): void {
        this._profile.update((p) => ({
            ...p,
            avatarDataUrl: dataUrl
        }));
        this.persistProfile();
    }

    /**
     * Mock password change. Persists new password to localStorage on success.
     */
    changePassword(current: string, newPassword: string): Promise<ChangePasswordResult> {
        return new Promise((resolve) => {
            window.setTimeout(() => {
                const stored = this.getStoredPassword();
                if (current !== stored) {
                    resolve({ ok: false, messageKey: 'profile.changePassword.wrongCurrent' });
                    return;
                }
                if (newPassword === current) {
                    resolve({ ok: false, messageKey: 'profile.changePassword.sameAsCurrent' });
                    return;
                }
                this.setStoredPassword(newPassword);
                resolve({ ok: true });
            }, 400);
        });
    }

    /** Logout: clear mock profile-related localStorage keys */
    clearMockSessionStorage(): void {
        try {
            localStorage.removeItem(PROFILE_STORAGE_KEY);
            localStorage.removeItem(PASSWORD_STORAGE_KEY);
        } catch {
            /* ignore */
        }
        this._profile.set({ ...DEFAULT_PROFILE });
    }
}
