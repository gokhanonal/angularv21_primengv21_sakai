/**
 * Map known company names to assets under `src/assets/branding/logo/`.
 * Returns a URL suitable for `<img [src]>`.
 */
export function stationManagementCompanyLogoSrc(companyName: string | null | undefined): string | null {
    if (!companyName?.trim()) {
        return null;
    }
    const n = companyName.trim().toLowerCase();
    if (n === 'ovolt') {
        return 'assets/branding/logo/ovolt.png';
    }
    if (n === 'sharz.net') {
        return 'assets/branding/logo/sharz.svg';
    }
    return null;
}
