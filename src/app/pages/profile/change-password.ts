import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { UserProfileService } from '@/app/core/profile/user-profile.service';
import { ValidatedInputComponent } from '@/app/shared/validated-input/validated-input.component';
import { ValidationRule } from '@/app/shared/validated-input/validated-input.contract';
import { validate } from '@/app/shared/validated-input/validators';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';
import { CardMaximizeDirective } from '@/app/shared/directives/card-maximize.directive';

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, MessageModule, ValidatedInputComponent, TranslatePipe, CardMaximizeDirective],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12 lg:col-span-8 xl:col-span-6">
                <div class="card flex flex-col gap-6" appCardMaximize [showWindowMaximize]="true">
                    <div>
                        <div class="font-semibold text-xl mb-1">{{ 'profile.changePassword.title' | t }}</div>
                        <p class="text-muted-color m-0">{{ 'profile.changePassword.subtitle' | t }}</p>
                    </div>

                    <p-message severity="info" [text]="'profile.changePassword.mockHint' | t" styleClass="w-full" />

                    @if (apiError()) {
                        <p-message severity="error" [text]="apiError()!" styleClass="w-full" />
                    }

                    @if (submitting()) {
                        <p-message severity="info" [text]="'profile.changePassword.submitting' | t" styleClass="w-full" />
                    }

                    <div>
                        <label for="cp-current" class="block font-medium mb-2">{{ 'profile.changePassword.current' | t }}</label>
                        <app-validated-input [rules]="currentRules()">
                            <input
                                pInputText
                                id="cp-current"
                                name="cp-current"
                                type="password"
                                autocomplete="current-password"
                                class="w-full"
                                [(ngModel)]="currentPassword"
                            />
                        </app-validated-input>
                    </div>

                    <div>
                        <label for="cp-new" class="block font-medium mb-2">{{ 'profile.changePassword.new' | t }}</label>
                        <app-validated-input [rules]="newRules()">
                            <input
                                pInputText
                                id="cp-new"
                                name="cp-new"
                                type="password"
                                autocomplete="new-password"
                                class="w-full"
                                [(ngModel)]="newPassword"
                            />
                        </app-validated-input>
                        @if (newSameAsCurrentError()) {
                            <small class="validated-input-error block text-red-500 text-xs mt-1">{{ 'profile.changePassword.sameAsCurrent' | t }}</small>
                        }
                    </div>

                    <div>
                        <label for="cp-repeat" class="block font-medium mb-2">{{ 'profile.changePassword.repeat' | t }}</label>
                        <app-validated-input [rules]="repeatRules()">
                            <input
                                pInputText
                                id="cp-repeat"
                                name="cp-repeat"
                                type="password"
                                autocomplete="new-password"
                                class="w-full"
                                [(ngModel)]="repeatPassword"
                            />
                        </app-validated-input>
                        @if (repeatMismatchError()) {
                            <small class="validated-input-error block text-red-500 text-xs mt-1">{{ 'profile.changePassword.mismatch' | t }}</small>
                        }
                    </div>

                    <div class="flex justify-end gap-2">
                        <p-button
                            type="button"
                            [label]="'profile.changePassword.submit' | t"
                            icon="pi pi-key"
                            [disabled]="submitting()"
                            (onClick)="onSubmit()"
                        />
                    </div>
                </div>
            </div>
        </div>
    `
})
export class ChangePassword {
    private readonly profileService = inject(UserProfileService);
    private readonly i18n = inject(I18nService);
    private readonly router = inject(Router);

    currentPassword = '';
    newPassword = '';
    repeatPassword = '';

    readonly submitting = signal(false);
    readonly apiError = signal<string | null>(null);
    readonly newSameAsCurrentError = signal(false);
    readonly repeatMismatchError = signal(false);

    readonly currentRules = computed((): ValidationRule[] => [
        { type: 'required', message: this.i18n.t('profile.changePassword.currentRequired') }
    ]);

    readonly newRules = computed((): ValidationRule[] => [
        { type: 'required', message: this.i18n.t('profile.changePassword.newRequired') },
        { minLength: 8, message: this.i18n.t('profile.changePassword.newMinLength') }
    ]);

    readonly repeatRules = computed((): ValidationRule[] => [
        { type: 'required', message: this.i18n.t('profile.changePassword.repeatRequired') }
    ]);

    async onSubmit(): Promise<void> {
        this.apiError.set(null);
        this.newSameAsCurrentError.set(false);
        this.repeatMismatchError.set(false);

        const cErr = validate(this.currentPassword, this.currentRules());
        const nErr = validate(this.newPassword, this.newRules());
        const rErr = validate(this.repeatPassword, this.repeatRules());

        if (cErr || nErr || rErr) {
            return;
        }

        if (this.newPassword !== this.repeatPassword) {
            this.repeatMismatchError.set(true);
            return;
        }

        if (this.newPassword === this.currentPassword) {
            this.newSameAsCurrentError.set(true);
            return;
        }

        this.submitting.set(true);
        const result = await this.profileService.changePassword(this.currentPassword, this.newPassword);
        this.submitting.set(false);

        if (!result.ok) {
            const key = result.messageKey ?? 'profile.changePassword.genericError';
            this.apiError.set(this.i18n.t(key));
            return;
        }

        await this.router.navigateByUrl('/');
    }
}
