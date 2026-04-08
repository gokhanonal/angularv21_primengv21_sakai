import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    AbstractControl,
    FormBuilder,
    ReactiveFormsModule,
    ValidationErrors,
    Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { interval, merge, Subscription } from 'rxjs';
import { readStoredAuthToken, writeStoredAuthToken } from '@/app/core/auth/auth-token';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';
import { AuthApiService } from '@/app/core/services/auth-api.service';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

const OTP_COUNTDOWN_SECONDS = 180;

function usernameTrimmedRequired(control: AbstractControl): ValidationErrors | null {
    const raw = control.value;
    if (raw == null || String(raw).trim() === '') {
        return { required: true };
    }
    return null;
}

function passwordSpecialCharValidator(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    if (v == null || v === '') {
        return null;
    }
    return /[^a-zA-Z0-9]/.test(String(v)) ? null : { specialChar: true };
}

function sanitizeReturnUrl(raw: string | undefined): string {
    if (!raw || typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) {
        return '/';
    }
    return raw;
}

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PasswordModule,
        RouterModule,
        RippleModule,
        DialogModule,
        ToastModule,
        AppFloatingConfigurator,
        TranslatePipe
    ],
    providers: [MessageService],
    template: `
        <p-toast position="top-right" />
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div
                    style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)"
                >
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="mb-8 w-16 shrink-0 mx-auto">
                                <path
                                    fill-rule="evenodd"
                                    clip-rule="evenodd"
                                    d="M17.1637 19.2467C17.1566 19.4033 17.1529 19.561 17.1529 19.7194C17.1529 25.3503 21.7203 29.915 27.3546 29.915C32.9887 29.915 37.5561 25.3503 37.5561 19.7194C37.5561 19.5572 37.5524 19.3959 37.5449 19.2355C38.5617 19.0801 39.5759 18.9013 40.5867 18.6994L40.6926 18.6782C40.7191 19.0218 40.7326 19.369 40.7326 19.7194C40.7326 27.1036 34.743 33.0896 27.3546 33.0896C19.966 33.0896 13.9765 27.1036 13.9765 19.7194C13.9765 19.374 13.9896 19.0316 14.0154 18.6927L14.0486 18.6994C15.0837 18.9062 16.1223 19.0886 17.1637 19.2467ZM33.3284 11.4538C31.6493 10.2396 29.5855 9.52381 27.3546 9.52381C25.1195 9.52381 23.0524 10.2421 21.3717 11.4603C20.0078 11.3232 18.6475 11.1387 17.2933 10.907C19.7453 8.11308 23.3438 6.34921 27.3546 6.34921C31.36 6.34921 34.9543 8.10844 37.4061 10.896C36.0521 11.1292 34.692 11.3152 33.3284 11.4538ZM43.826 18.0518C43.881 18.6003 43.9091 19.1566 43.9091 19.7194C43.9091 28.8568 36.4973 36.2642 27.3546 36.2642C18.2117 36.2642 10.8 28.8568 10.8 19.7194C10.8 19.1615 10.8276 18.61 10.8816 18.0663L7.75383 17.4411C7.66775 18.1886 7.62354 18.9488 7.62354 19.7194C7.62354 30.6102 16.4574 39.4388 27.3546 39.4388C38.2517 39.4388 47.0855 30.6102 47.0855 19.7194C47.0855 18.9439 47.0407 18.1789 46.9536 17.4267L43.826 18.0518ZM44.2613 9.54743L40.9084 10.2176C37.9134 5.95821 32.9593 3.1746 27.3546 3.1746C21.7442 3.1746 16.7856 5.96385 13.7915 10.2305L10.4399 9.56057C13.892 3.83178 20.1756 0 27.3546 0C34.5281 0 40.8075 3.82591 44.2613 9.54743Z"
                                    fill="var(--primary-color)"
                                />
                            </svg>
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">{{ 'auth.login.welcome' | t }}</div>
                            <span class="text-muted-color font-medium">{{ 'auth.login.subtitle' | t }}</span>
                        </div>

                        <form [formGroup]="form" (ngSubmit)="onSubmitLogin()">
                            <label for="username1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">{{
                                'auth.login.usernameLabel' | t
                            }}</label>
                            <input
                                pInputText
                                id="username1"
                                type="text"
                                autocomplete="username"
                                [placeholder]="'auth.login.usernamePlaceholder' | t"
                                class="w-full md:w-120"
                                formControlName="userName"
                            />
                            @if (showUsernameError()) {
                                <small class="text-red-500 block mb-4 mt-1">{{ usernameErrorText() }}</small>
                            } @else {
                                <div class="mb-4"></div>
                            }

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">{{
                                'auth.login.passwordLabel' | t
                            }}</label>
                            <p-password
                                id="password1"
                                formControlName="password"
                                [placeholder]="'auth.login.passwordPlaceholder' | t"
                                [toggleMask]="true"
                                styleClass="mb-1"
                                [fluid]="true"
                                [feedback]="false"
                                autocomplete="current-password"
                            ></p-password>
                            @if (showPasswordError()) {
                                <small class="text-red-500 block mb-4 mt-1">{{ passwordErrorText() }}</small>
                            } @else {
                                <div class="mb-4"></div>
                            }

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox formControlName="rememberMe" inputId="rememberme1" binary class="mr-2"></p-checkbox>
                                    <label for="rememberme1">{{ 'auth.login.rememberMe' | t }}</label>
                                </div>
                                <a
                                    routerLink="/auth/forgot-password"
                                    class="font-medium no-underline ml-2 text-right cursor-pointer text-primary"
                                    >{{ 'auth.login.forgotPassword' | t }}</a
                                >
                            </div>
                            <p-button
                                type="submit"
                                [label]="loginSubmitting() ? ('auth.login.loading' | t) : ('auth.login.signIn' | t)"
                                styleClass="w-full"
                                [loading]="loginSubmitting()"
                                [disabled]="loginSubmitting()"
                            />
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <p-dialog
            [header]="'auth.otp.title' | t"
            [visible]="otpDialogVisible()"
            (visibleChange)="onOtpVisibleChange($event)"
            [modal]="true"
            [closable]="true"
            [closeOnEscape]="true"
            [dismissableMask]="true"
            [style]="{ width: '24rem' }"
        >
            <p class="text-muted-color mb-4">{{ 'auth.otp.subtitle' | t }}</p>

            <label for="otpInput" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">{{ 'auth.otp.codeLabel' | t }}</label>
            <input
                pInputText
                id="otpInput"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                class="w-full mb-2"
                [formControl]="otpCode"
                (input)="onOtpInput($event)"
                (keydown.enter)="onSubmitOtp()"
            />
            @if (otpInlineErrorVisible()) {
                <small class="text-red-500 block mb-3">{{ 'auth.validation.otpSixDigits' | t }}</small>
            }

            @if (resendSecondsLeft() > 0) {
                <p class="text-muted-color text-sm mb-4">{{ resendCountdownText() }}</p>
            }

            <div class="flex flex-col gap-2 mt-4">
                <p-button
                    type="button"
                    [label]="'auth.otp.resendButton' | t"
                    [disabled]="resendSecondsLeft() > 0 || otpResending()"
                    [loading]="otpResending()"
                    styleClass="w-full"
                    severity="secondary"
                    (onClick)="onResendOtp()"
                />
                <p-button
                    type="button"
                    [label]="otpVerifying() ? ('auth.otp.loading' | t) : ('auth.otp.submit' | t)"
                    styleClass="w-full"
                    [loading]="otpVerifying()"
                    [disabled]="otpVerifying() || otpCode.invalid"
                    (onClick)="onSubmitOtp()"
                />
            </div>
        </p-dialog>
    `
})
export class Login {
    private readonly fb = inject(FormBuilder);

    private readonly authApi = inject(AuthApiService);

    private readonly router = inject(Router);

    private readonly route = inject(ActivatedRoute);

    private readonly messages = inject(MessageService);

    private readonly i18n = inject(I18nService);

    private readonly destroyRef = inject(DestroyRef);

    readonly form = this.fb.nonNullable.group({
        userName: ['', [usernameTrimmedRequired]],
        password: ['', [Validators.required, Validators.minLength(8), passwordSpecialCharValidator]],
        rememberMe: [false]
    });

    readonly otpCode = this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^\d{6}$/)]);

    readonly loginSubmitting = signal(false);

    readonly otpDialogVisible = signal(false);

    readonly otpVerifying = signal(false);

    readonly otpResending = signal(false);

    readonly resendSecondsLeft = signal(0);

    readonly submitted = signal(false);

    private pendingUserName = '';

    private pendingPassword = '';

    private otpFlowSucceeded = false;

    private countdownSub: Subscription | null = null;

    /** Bumps on form/OTP control changes so validation messages refresh under zoneless CD. */
    private readonly formUiTick = signal(0);

    readonly resendCountdownText = computed(() => {
        this.i18n.lang();
        return this.i18n.tf('auth.otp.resendIn', { seconds: this.resendSecondsLeft() });
    });

    readonly usernameErrorText = computed(() => {
        this.formUiTick();
        this.i18n.lang();
        this.submitted();
        const c = this.form.controls.userName;
        if (!c.errors) {
            return '';
        }
        if (c.errors['required']) {
            return this.i18n.t('auth.validation.usernameRequired');
        }
        return '';
    });

    readonly passwordErrorText = computed(() => {
        this.formUiTick();
        this.i18n.lang();
        this.submitted();
        const c = this.form.controls.password;
        if (!c.errors) {
            return '';
        }
        if (c.errors['required']) {
            return this.i18n.t('auth.validation.passwordRequired');
        }
        if (c.errors['minlength']) {
            return this.i18n.t('auth.validation.passwordMinLength');
        }
        if (c.errors['specialChar']) {
            return this.i18n.t('auth.validation.passwordSpecialChar');
        }
        return '';
    });

    readonly showUsernameError = computed(() => {
        this.formUiTick();
        this.submitted();
        const c = this.form.controls.userName;
        return c.invalid && (c.dirty || c.touched || this.submitted());
    });

    readonly showPasswordError = computed(() => {
        this.formUiTick();
        this.submitted();
        const c = this.form.controls.password;
        return c.invalid && (c.dirty || c.touched || this.submitted());
    });

    readonly otpInlineErrorVisible = computed(() => {
        this.formUiTick();
        const c = this.otpCode;
        return c.invalid && (c.dirty || c.touched) && c.value.length > 0;
    });

    constructor() {
        this.destroyRef.onDestroy(() => this.clearCountdown());
        merge(this.form.statusChanges, this.form.valueChanges, this.otpCode.statusChanges, this.otpCode.valueChanges)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.formUiTick.update((n) => n + 1));
        const token = readStoredAuthToken();
        if (token) {
            const ret = sanitizeReturnUrl(this.route.snapshot.queryParams['returnUrl']);
            void this.router.navigateByUrl(ret);
        }
    }

    onSubmitLogin(): void {
        this.submitted.set(true);
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        if (this.loginSubmitting()) {
            return;
        }
        const userName = this.form.controls.userName.value.trim();
        const password = this.form.controls.password.value;
        this.pendingUserName = userName;
        this.pendingPassword = password;
        this.loginSubmitting.set(true);
        this.authApi.login(userName, password).subscribe({
            next: () => {
                this.loginSubmitting.set(false);
                this.openOtpDialog();
            },
            error: (err: unknown) => {
                this.loginSubmitting.set(false);
                this.toastApiError(err, 'auth.error.loginFailed');
            }
        });
    }

    onOtpVisibleChange(visible: boolean): void {
        this.otpDialogVisible.set(visible);
        if (!visible) {
            this.handleOtpDialogClosed();
        }
    }

    onOtpInput(ev: Event): void {
        const el = ev.target as HTMLInputElement;
        const digits = el.value.replace(/\D/g, '').slice(0, 6);
        if (el.value !== digits) {
            el.value = digits;
        }
        this.otpCode.setValue(digits, { emitEvent: true });
    }

    onResendOtp(): void {
        if (this.resendSecondsLeft() > 0 || this.otpResending()) {
            return;
        }
        this.otpResending.set(true);
        this.authApi.sendOtp(this.pendingUserName).subscribe({
            next: () => {
                this.otpResending.set(false);
                this.messages.add({
                    severity: 'success',
                    summary: this.i18n.t('auth.success.otpSent'),
                    life: 4000
                });
                this.startCountdown();
            },
            error: (err: unknown) => {
                this.otpResending.set(false);
                this.toastApiError(err, 'auth.error.network');
            }
        });
    }

    onSubmitOtp(): void {
        this.otpCode.markAsTouched();
        if (this.otpCode.invalid || this.otpVerifying()) {
            return;
        }
        const otp = this.otpCode.value;
        this.otpVerifying.set(true);
        this.authApi.validateOtp(this.pendingUserName, this.pendingPassword, otp).subscribe({
            next: (token) => {
                this.otpVerifying.set(false);
                this.otpFlowSucceeded = true;
                writeStoredAuthToken(token);
                this.clearCountdown();
                this.otpDialogVisible.set(false);
                const returnUrl = sanitizeReturnUrl(this.route.snapshot.queryParams['returnUrl']);
                void this.router.navigateByUrl(returnUrl);
            },
            error: (err: unknown) => {
                this.otpVerifying.set(false);
                if (err instanceof Error && err.message === 'VALIDATE_OTP_NO_TOKEN') {
                    this.messages.add({
                        severity: 'error',
                        summary: this.i18n.t('auth.error.otpFailed'),
                        life: 5000
                    });
                    return;
                }
                this.toastApiError(err, 'auth.error.otpFailed');
            }
        });
    }

    private openOtpDialog(): void {
        this.otpFlowSucceeded = false;
        this.otpCode.setValue('');
        this.otpCode.markAsUntouched();
        this.otpDialogVisible.set(true);
        this.startCountdown();
    }

    private startCountdown(): void {
        this.clearCountdown();
        this.resendSecondsLeft.set(OTP_COUNTDOWN_SECONDS);
        this.countdownSub = interval(1000).subscribe(() => {
            const v = this.resendSecondsLeft();
            if (v <= 0) {
                this.clearCountdown();
                return;
            }
            this.resendSecondsLeft.set(v - 1);
        });
    }

    private clearCountdown(): void {
        this.countdownSub?.unsubscribe();
        this.countdownSub = null;
    }

    private handleOtpDialogClosed(): void {
        this.clearCountdown();
        this.otpCode.setValue('');
        this.otpCode.markAsUntouched();
        if (this.otpFlowSucceeded) {
            this.otpFlowSucceeded = false;
            return;
        }
        this.form.patchValue({ password: '' });
    }

    private toastApiError(err: unknown, fallbackKey: string): void {
        const isNetwork =
            err instanceof HttpErrorResponse && (err.status === 0 || err.error instanceof ProgressEvent);
        const key = isNetwork ? 'auth.error.network' : fallbackKey;
        this.messages.add({
            severity: 'error',
            summary: this.i18n.t(key),
            life: 5000
        });
    }
}
