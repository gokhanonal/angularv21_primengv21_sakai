import { HttpInterceptorFn } from '@angular/common/http';
import { readStoredAuthToken } from '@/app/core/auth/auth-token';

const AUTH_PATH_FRAGMENTS = ['/Auth/LoginWithOTP', '/Auth/LoginValidateOTP', '/Auth/SendOTP'] as const;

function shouldSkipAuthHeader(url: string): boolean {
    return AUTH_PATH_FRAGMENTS.some((fragment) => url.includes(fragment));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    if (shouldSkipAuthHeader(req.url)) {
        return next(req);
    }
    const token = readStoredAuthToken();
    if (!token) {
        return next(req);
    }
    const authReq = req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });
    return next(authReq);
};
