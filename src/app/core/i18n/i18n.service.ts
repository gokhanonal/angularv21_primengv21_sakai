import { Injectable, inject, signal } from '@angular/core';
import { PrimeNG } from 'primeng/config';
import type { Translation } from 'primeng/api';
import { APP_LANGUAGES, AppLanguage, isAppLanguage } from './app-language';
import { TRANSLATIONS } from './translations';

const STORAGE_KEY = 'app.language';

const PRIME_LOCALE_OVERRIDES: Record<AppLanguage, Partial<Translation>> = {
    en: {},
    tr: {
        accept: 'Tamam',
        reject: 'İptal',
        cancel: 'İptal',
        clear: 'Temizle',
        apply: 'Uygula',
        today: 'Bugün',
        emptyFilterMessage: 'Sonuç yok',
        searchMessage: '{0} sonuç mevcut',
        emptySearchMessage: 'Sonuç bulunamadı'
    },
    fr: {
        accept: 'Accepter',
        reject: 'Refuser',
        cancel: 'Annuler',
        clear: 'Effacer',
        apply: 'Appliquer',
        today: "Aujourd'hui",
        emptyFilterMessage: 'Aucun résultat',
        searchMessage: '{0} résultats disponibles',
        emptySearchMessage: 'Aucun résultat'
    },
    de: {
        accept: 'OK',
        reject: 'Ablehnen',
        cancel: 'Abbrechen',
        clear: 'Löschen',
        apply: 'Anwenden',
        today: 'Heute',
        emptyFilterMessage: 'Keine Ergebnisse',
        searchMessage: '{0} Ergebnisse verfügbar',
        emptySearchMessage: 'Keine Ergebnisse'
    }
};

@Injectable({ providedIn: 'root' })
export class I18nService {
    private readonly primeNG = inject(PrimeNG);

    readonly lang = signal<AppLanguage>(this.readStoredLanguage());

    constructor() {
        this.applyDocumentLang();
        this.applyPrimeTranslation();
    }

    t(key: string): string {
        const lang = this.lang();
        const table = TRANSLATIONS[lang] ?? TRANSLATIONS.en;
        return table[key] ?? TRANSLATIONS.en[key] ?? key;
    }

    /** Replace `{{param}}` placeholders in a translated string. */
    tf(key: string, params: Record<string, string | number>): string {
        let s = this.t(key);
        for (const [k, v] of Object.entries(params)) {
            s = s.split(`{{${k}}}`).join(String(v));
        }
        return s;
    }

    setLang(lang: AppLanguage): void {
        if (!APP_LANGUAGES.includes(lang)) {
            return;
        }
        this.lang.set(lang);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, lang);
        }
        this.applyDocumentLang();
        this.applyPrimeTranslation();
    }

    /** Flag emoji + label for UI (templates); `value` is the locale code. */
    readonly languageOptions: { flag: string; label: string; value: AppLanguage }[] = [
        { flag: '🇬🇧', label: 'English', value: 'en' },
        { flag: '🇹🇷', label: 'Türkçe', value: 'tr' },
        { flag: '🇫🇷', label: 'Français', value: 'fr' },
        { flag: '🇩🇪', label: 'Deutsch', value: 'de' }
    ];

    private readStoredLanguage(): AppLanguage {
        if (typeof localStorage === 'undefined') {
            return 'en';
        }
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw && isAppLanguage(raw) ? raw : 'en';
    }

    private applyDocumentLang(): void {
        if (typeof document === 'undefined') {
            return;
        }
        document.documentElement.lang = this.lang();
    }

    private applyPrimeTranslation(): void {
        const patch = PRIME_LOCALE_OVERRIDES[this.lang()] ?? {};
        if (Object.keys(patch).length === 0) {
            return;
        }
        this.primeNG.setTranslation({
            ...this.primeNG.translation,
            ...patch
        });
    }
}
