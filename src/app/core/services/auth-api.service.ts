import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Login step succeeds with HTTP 200; body shape is backend-specific. */
export type LoginResponse = Record<string, unknown>;

function extractTokenFromBody(body: unknown): string | null {
    if (body === null || typeof body !== 'object') {
        return null;
    }
    const o = body as Record<string, unknown>;
    const direct = o['token'] ?? o['accessToken'] ?? o['access_token'];
    if (typeof direct === 'string' && direct.length > 0) {
        return direct;
    }
    const data = o['data'];
    if (data !== null && typeof data === 'object') {
        const t = (data as Record<string, unknown>)['token'];
        if (typeof t === 'string' && t.length > 0) {
            return t;
        }
    }
    const data2 = (o['token'] as Record<string, unknown>)['result'];
    if (data2 !== null && typeof data2 === 'string') {
        return data2;
    }
    return null;
}

function extractTokenFromHeaders(headers: { get(name: string): string | null }): string | null {
    const auth = headers.get('Authorization') ?? headers.get('authorization');
    if (!auth) {
        return null;
    }
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
    return m?.[1]?.trim() && m[1].length > 0 ? m[1].trim() : null;
}

@Injectable({
    providedIn: 'root'
})
export class AuthApiService {
    private readonly http = inject(HttpClient);
    private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

    private baseUrl(): string {
        const base = (environment as { baseApiUrl?: string }).baseApiUrl;
        if (!base) {
            throw new Error('environment.baseApiUrl is not configured');
        }
        return base.replace(/\/$/, '');
    }

    login(userName: string, password: string): Observable<LoginResponse> {
        const path = (environment as { loginApiUrl?: string }).loginApiUrl;
        if (!path) {
            return throwError(() => new Error('loginApiUrl not configured'));
        }
        const url = `${this.baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
        return this.http.post<LoginResponse>(url, { userName, password }, { headers: this.jsonHeaders });
    }

    validateOtp(userName: string, password: string, otpCode: string): Observable<string> {
        const path = (environment as { validateOtpApiUrl?: string }).validateOtpApiUrl;
        if (!path) {
            return throwError(() => new Error('validateOtpApiUrl not configured'));
        }
        const url = `${this.baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
        return this.http
            .post<unknown>(url, { userName, password, otpCode }, {
                observe: 'response',
                headers: this.jsonHeaders
            })
            .pipe(
                map((res: HttpResponse<unknown>) => {
                    const fromHeader = extractTokenFromHeaders(res.headers);
                    if (fromHeader) {
                        return fromHeader;
                    }
                    const fromBody = extractTokenFromBody(res.body);
                    if (fromBody) {
                        return fromBody;
                    }
                    throw new Error('VALIDATE_OTP_NO_TOKEN');
                })
            );
    }

    sendOtp(userName: string): Observable<void> {
        const path = (environment as { sendOtpApiUrl?: string }).sendOtpApiUrl;
        if (!path) {
            return throwError(() => new Error('sendOtpApiUrl not configured'));
        }
        const url = `${this.baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
        return this.http
            .post(url, { userName }, { observe: 'response', headers: this.jsonHeaders })
            .pipe(map(() => undefined));
    }
}
