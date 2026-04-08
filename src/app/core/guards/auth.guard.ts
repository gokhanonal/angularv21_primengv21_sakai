import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { readStoredAuthToken } from '@/app/core/auth/auth-token';

export const authGuard: CanActivateFn = (_route, state) => {
    const router = inject(Router);
    const token = readStoredAuthToken();
    if (token) {
        return true;
    }
    return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};
