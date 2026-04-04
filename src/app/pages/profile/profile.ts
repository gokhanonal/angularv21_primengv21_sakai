import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { UserProfileService } from '@/app/core/profile/user-profile.service';
import { ValidatedInputComponent } from '@/app/shared/validated-input/validated-input.component';
import { ValidationRule } from '@/app/shared/validated-input/validated-input.contract';
import { validate } from '@/app/shared/validated-input/validators';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';
import { AvatarEditorDialogComponent } from '@/app/shared/image-editor/avatar-editor-dialog.component';
import { CardMaximizeDirective } from '@/app/shared/directives/card-maximize.directive';

const MAX_BYTES = 1048576;

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        MessageModule,
        ValidatedInputComponent,
        TranslatePipe,
        AvatarEditorDialogComponent,
        CardMaximizeDirective
    ],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12 lg:col-span-8 xl:col-span-6">
                <div class="card flex flex-col gap-6" appCardMaximize [showWindowMaximize]="true">
                    <div>
                        <h3 class="card-title">{{ 'profile.title' | t }}</h3>
                        <p class="text-muted-color m-0">{{ 'profile.subtitle' | t }}</p>
                    </div>

                    @if (saveSuccess()) {
                        <p-message severity="success" [text]="'profile.saveSuccess' | t" styleClass="w-full" />
                    }
                    @if (saveError()) {
                        <p-message severity="error" [text]="saveError()!" styleClass="w-full" />
                    }
                    @if (fileError()) {
                        <p-message severity="error" [text]="fileError()!" styleClass="w-full" />
                    }

                    <div class="flex flex-col sm:flex-row gap-6 items-start">
                        <div class="flex flex-col items-center gap-2 shrink-0">
                            <div
                                class="w-32 h-32 rounded-border border border-surface-200 dark:border-surface-700 overflow-hidden bg-surface-100 dark:bg-surface-800 flex items-center justify-center"
                            >
                                @if (displayAvatar(); as src) {
                                    <img [src]="src" alt="" class="w-full h-full object-cover" />
                                } @else {
                                    <i class="pi pi-user text-4xl text-muted-color"></i>
                                }
                            </div>
                            <input
                                #fileInput
                                type="file"
                                accept="image/*"
                                class="hidden"
                                (change)="onFileSelected($event)"
                            />
                            <p-button
                                type="button"
                                [label]="'profile.choosePhoto' | t"
                                icon="pi pi-image"
                                severity="secondary"
                                (onClick)="fileInput.click()"
                            />
                        </div>

                        <div class="flex flex-col gap-4 flex-1 min-w-0 w-full">
                            <div>
                                <label for="profile-first" class="block font-medium mb-2">{{ 'profile.firstName' | t }}</label>
                                <app-validated-input [rules]="firstNameRules()">
                                    <input
                                        pInputText
                                        id="profile-first"
                                        name="profile-first"
                                        type="text"
                                        autocomplete="given-name"
                                        class="w-full"
                                        [(ngModel)]="draftFirstName"
                                    />
                                </app-validated-input>
                            </div>
                            <div>
                                <label for="profile-last" class="block font-medium mb-2">{{ 'profile.lastName' | t }}</label>
                                <app-validated-input [rules]="lastNameRules()">
                                    <input
                                        pInputText
                                        id="profile-last"
                                        name="profile-last"
                                        type="text"
                                        autocomplete="family-name"
                                        class="w-full"
                                        [(ngModel)]="draftLastName"
                                    />
                                </app-validated-input>
                            </div>

                            <div>
                                <span class="block font-medium mb-2">{{ 'profile.userType' | t }}</span>
                                <p class="m-0 text-muted-color">{{ userTypeLabel() }}</p>
                            </div>
                            <div>
                                <span class="block font-medium mb-2">{{ 'profile.email' | t }}</span>
                                <p class="m-0 text-muted-color break-all">{{ profile().email }}</p>
                            </div>
                            <div>
                                <span class="block font-medium mb-2">{{ 'profile.phones' | t }}</span>
                                @if (profile().phones.length === 0) {
                                    <p class="m-0 text-muted-color">{{ 'profile.phonesEmpty' | t }}</p>
                                } @else {
                                    <ul class="list-none m-0 p-0 flex flex-col gap-1">
                                        @for (p of profile().phones; track $index) {
                                            <li class="text-muted-color">{{ p }}</li>
                                        }
                                    </ul>
                                }
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2">
                        <p-button type="button" [label]="'profile.save' | t" icon="pi pi-check" (onClick)="onSave()" />
                    </div>
                </div>
            </div>
        </div>

        <app-avatar-editor-dialog
            [visible]="editorOpen()"
            (visibleChange)="onEditorVisibleChange($event)"
            [imageSrc]="editorObjectUrl() ?? ''"
            (confirmed)="onEditorConfirmed($event)"
        />
    `
})
export class Profile implements OnInit {
    private readonly profileService = inject(UserProfileService);
    private readonly i18n = inject(I18nService);

    readonly profile = this.profileService.profile;

    draftFirstName = '';
    draftLastName = '';

    readonly pendingAvatarDataUrl = signal<string | null>(null);
    readonly editorOpen = signal(false);
    readonly editorObjectUrl = signal<string | null>(null);

    readonly saveSuccess = signal(false);
    readonly saveError = signal<string | null>(null);
    readonly fileError = signal<string | null>(null);

    readonly displayAvatar = computed(() => this.pendingAvatarDataUrl() ?? this.profile().avatarDataUrl);

    readonly userTypeLabel = computed(() => {
        this.i18n.lang();
        const key = this.profile().userTypeKey;
        return this.i18n.t(key);
    });

    readonly firstNameRules = computed((): ValidationRule[] => [
        { type: 'required', message: this.i18n.t('profile.validation.firstNameRequired') }
    ]);

    readonly lastNameRules = computed((): ValidationRule[] => [
        { type: 'required', message: this.i18n.t('profile.validation.lastNameRequired') }
    ]);

    ngOnInit(): void {
        const p = this.profileService.profile();
        this.draftFirstName = p.firstName;
        this.draftLastName = p.lastName;
    }

    onFileSelected(event: Event): void {
        this.fileError.set(null);
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file) {
            return;
        }
        if (!file.type.startsWith('image/')) {
            this.fileError.set(this.i18n.t('profile.fileNotImage'));
            return;
        }
        if (file.size > MAX_BYTES) {
            this.fileError.set(this.i18n.t('profile.fileTooLarge'));
            return;
        }
        const url = URL.createObjectURL(file);
        const prev = this.editorObjectUrl();
        if (prev?.startsWith('blob:')) {
            URL.revokeObjectURL(prev);
        }
        this.editorObjectUrl.set(url);
        this.editorOpen.set(true);
    }

    onEditorVisibleChange(open: boolean): void {
        this.editorOpen.set(open);
        if (!open) {
            const prev = this.editorObjectUrl();
            if (prev?.startsWith('blob:')) {
                URL.revokeObjectURL(prev);
            }
            this.editorObjectUrl.set(null);
        }
    }

    onEditorConfirmed(dataUrl: string): void {
        this.pendingAvatarDataUrl.set(dataUrl);
    }

    onSave(): void {
        this.saveSuccess.set(false);
        this.saveError.set(null);

        const fnErr = validate(this.draftFirstName, this.firstNameRules());
        const lnErr = validate(this.draftLastName, this.lastNameRules());
        if (fnErr || lnErr) {
            this.saveError.set(this.i18n.t('profile.validation.fixFields'));
            return;
        }

        this.profileService.saveProfile({
            firstName: this.draftFirstName,
            lastName: this.draftLastName
        });
        const pending = this.pendingAvatarDataUrl();
        if (pending !== null) {
            this.profileService.setAvatarFromDataUrl(pending);
            this.pendingAvatarDataUrl.set(null);
        }
        this.saveSuccess.set(true);
    }
}
