import { Component, ElementRef, DestroyRef, inject, input, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidationRule } from './validated-input.contract';
import { validate } from './validators';

@Component({
    selector: 'app-validated-input',
    standalone: true,
    imports: [CommonModule],
    template: `
        <ng-content></ng-content>
        @if (errorMessage()) {
            <small class="validated-input-error">{{ errorMessage() }}</small>
        }
    `,
    styles: [`
        :host {
            display: block;
        }

        .validated-input-error {
            display: block;
            color: var(--p-red-500);
            font-size: 0.75rem;
            margin-top: 0.25rem;
        }
    `]
})
export class ValidatedInputComponent {
    rules = input<ValidationRule[]>([]);
    errorMessage = signal<string | null>(null);

    private readonly el = inject(ElementRef);
    private readonly destroyRef = inject(DestroyRef);
    private hasErrored = false;

    constructor() {
        afterNextRender(() => {
            const host: HTMLElement = this.el.nativeElement;

            const onFocusOut = () => this.runValidation();
            const onInput = () => {
                if (this.hasErrored) {
                    this.runValidation();
                }
            };

            host.addEventListener('focusout', onFocusOut);
            host.addEventListener('input', onInput);

            this.destroyRef.onDestroy(() => {
                host.removeEventListener('focusout', onFocusOut);
                host.removeEventListener('input', onInput);
            });
        });
    }

    private runValidation(): void {
        const inputEl = this.el.nativeElement.querySelector('input, textarea');
        if (!inputEl) {
            return;
        }

        const value = inputEl.value;
        const error = validate(value, this.rules());

        this.errorMessage.set(error);

        if (error) {
            this.hasErrored = true;
            inputEl.classList.add('ng-dirty', 'ng-invalid');
        } else {
            this.hasErrored = false;
            inputEl.classList.remove('ng-dirty', 'ng-invalid');
        }
    }
}
