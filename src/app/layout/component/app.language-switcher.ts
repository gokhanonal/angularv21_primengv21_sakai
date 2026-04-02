import { Component, computed, inject, input } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { I18nService } from '@/app/core/i18n/i18n.service';

@Component({
    selector: 'app-language-switcher',
    standalone: true,
    imports: [ButtonModule, MenuModule],
    template: `
        <div
            [class]="
                variant() === 'topbar'
                    ? 'layout-topbar-lang relative flex shrink-0 items-center justify-center'
                    : 'relative inline-flex items-center'
            "
        >
            @if (variant() === 'topbar') {
                <button
                    type="button"
                    class="layout-topbar-action layout-topbar-lang-trigger"
                    (click)="langMenu.toggle($event)"
                    [attr.aria-label]="languageSelectAria()"
                    [attr.title]="currentLanguageLabel()"
                    [attr.aria-haspopup]="'menu'"
                >
                    <span
                        class="layout-topbar-lang-flag text-xl leading-none select-none"
                        role="img"
                        [attr.aria-hidden]="true"
                        >{{ currentLanguageFlag() }}</span>
                </button>
            } @else {
                <p-button
                    type="button"
                    (click)="langMenu.toggle($event)"
                    [rounded]="true"
                    severity="secondary"
                    [attr.aria-label]="languageSelectAria()"
                    [attr.title]="currentLanguageLabel()"
                    [attr.aria-haspopup]="'menu'"
                >
                    <span
                        class="inline-flex min-w-8 justify-center text-xl leading-none select-none"
                        role="img"
                        [attr.aria-hidden]="true"
                        >{{ currentLanguageFlag() }}</span>
                </p-button>
            }
            <p-menu #langMenu [popup]="true" [model]="languageMenuItems()" [appendTo]="'body'" styleClass="layout-topbar-lang-menu" />
        </div>
    `
})
export class AppLanguageSwitcher {
    readonly variant = input<'topbar' | 'floating'>('floating');

    readonly i18n = inject(I18nService);

    languageSelectAria = computed(() => {
        this.i18n.lang();
        return this.i18n.t('topbar.language');
    });

    currentLanguageFlag = computed(() => {
        const code = this.i18n.lang();
        const opt = this.i18n.languageOptions.find((o) => o.value === code);
        return opt?.flag ?? '🌐';
    });

    currentLanguageLabel = computed(() => {
        const code = this.i18n.lang();
        return this.i18n.languageOptions.find((o) => o.value === code)?.label ?? '';
    });

    languageMenuItems = computed((): MenuItem[] => {
        const current = this.i18n.lang();
        return this.i18n.languageOptions.map((opt) => ({
            label: `${opt.flag}\u00A0${opt.label}`,
            styleClass: opt.value === current ? 'layout-topbar-lang-menu-item-active' : undefined,
            command: () => {
                this.i18n.setLang(opt.value);
            }
        }));
    });
}
