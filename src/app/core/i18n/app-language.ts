export const APP_LANGUAGES = ['en', 'tr', 'fr', 'de'] as const;

export type AppLanguage = (typeof APP_LANGUAGES)[number];

export function isAppLanguage(value: string): value is AppLanguage {
    return (APP_LANGUAGES as readonly string[]).includes(value);
}
