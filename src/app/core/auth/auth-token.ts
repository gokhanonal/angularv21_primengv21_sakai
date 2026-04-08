/** JWT storage key for authenticated API calls (see auth guard + HTTP interceptor). */
export const AUTH_TOKEN_STORAGE_KEY = 'app.auth.token';

export function readStoredAuthToken(): string | null {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    try {
        const t = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
        return t && t.length > 0 ? t : null;
    } catch {
        return null;
    }
}

export function writeStoredAuthToken(token: string): void {
    if (typeof localStorage === 'undefined') {
        return;
    }
    try {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } catch {
        /* quota / private mode */
    }
}

export function clearStoredAuthToken(): void {
    if (typeof localStorage === 'undefined') {
        return;
    }
    try {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
        /* ignore */
    }
}

/**
 * Extract payload data from a JWT token without external dependencies.
 * JWT format: header.payload.signature (base64url encoded)
 */
export function extractDataFromJwtToken(token: string): any | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        const payload = parts[1];
        // Base64url decode: replace - with +, _ with /, add padding
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        const decoded = atob(padded);
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}
