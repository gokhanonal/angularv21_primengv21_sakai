import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { AppLanguageSwitcher } from './app.language-switcher';
import { LayoutService } from '@/app/layout/service/layout.service';
import { I18nService } from '@/app/core/i18n/i18n.service';

@Component({
    selector: 'app-floating-configurator',
    imports: [CommonModule, ButtonModule, MenuModule, StyleClassModule, AppConfigurator, AppLanguageSwitcher],
    template: `
        <div class="flex gap-4 top-8 right-8" [ngClass]="{ fixed: float() }">
            <app-language-switcher variant="floating" />
            <div class="relative flex shrink-0 items-center justify-center">
                <p-button
                    type="button"
                    (onClick)="themeMenu.toggle($event)"
                    [rounded]="true"
                    [icon]="themeTriggerIconClass()"
                    severity="secondary"
                    [attr.aria-label]="themeMenuAria()"
                    [attr.title]="themeMenuAria()"
                />
                <p-menu #themeMenu [popup]="true" [model]="themeMenuItems()" [appendTo]="'body'" styleClass="layout-floating-theme-menu" />
            </div>
            <div class="relative">
                <p-button icon="pi pi-palette" styleClass="layout-floating-palette-button" severity="secondary" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true" type="button" rounded />
                <app-configurator />
            </div>
        </div>
    `
})
export class AppFloatingConfigurator {
    readonly LayoutService = inject(LayoutService);

    readonly i18n = inject(I18nService);

    float = input<boolean>(true);

    themeMenuAria = computed(() => {
        this.i18n.lang();
        return this.i18n.t('topbar.theme');
    });

    themeTriggerIconClass = computed(() => {
        const mode = this.LayoutService.layoutConfig().themeMode;
        if (mode === 'light') {
            return 'pi pi-sun';
        }
        if (mode === 'dark') {
            return 'pi pi-moon';
        }
        return 'pi pi-desktop';
    });

    themeMenuItems = computed((): MenuItem[] => {
        this.i18n.lang();
        return [
            {
                label: this.i18n.t('theme.light'),
                icon: 'pi pi-sun',
                command: () => {
                    this.LayoutService.setThemeMode('light');
                }
            },
            {
                label: this.i18n.t('theme.dark'),
                icon: 'pi pi-moon',
                command: () => {
                    this.LayoutService.setThemeMode('dark');
                }
            },
            {
                label: this.i18n.t('theme.system'),
                icon: 'pi pi-desktop',
                command: () => {
                    this.LayoutService.setThemeMode('system');
                }
            }
        ];
    });
}
