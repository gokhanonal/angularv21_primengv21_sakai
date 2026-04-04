import {
    Directive,
    ElementRef,
    HostListener,
    OnDestroy,
    OnInit,
    PLATFORM_ID,
    Renderer2,
    effect,
    inject,
    input,
    output
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { I18nService } from '@/app/core/i18n/i18n.service';

@Directive({
    selector: '[appCardMaximize]',
    standalone: true
})
export class CardMaximizeDirective implements OnInit, OnDestroy {
    private static activeInstance: CardMaximizeDirective | null = null;

    private readonly el = inject(ElementRef<HTMLElement>);
    private readonly renderer = inject(Renderer2);
    private readonly i18n = inject(I18nService);
    private readonly platformId = inject(PLATFORM_ID);

    readonly showWindowMaximize = input(false);
    readonly showClose = input(false);
    readonly closed = output<void>();

    private maximized = false;
    private initialized = false;
    private controlsWrapper: HTMLElement | null = null;
    private maximizeBtn: HTMLButtonElement | null = null;
    private maximizeIconEl: HTMLElement | null = null;
    private closeBtn: HTMLButtonElement | null = null;
    private backdropEl: HTMLElement | null = null;
    private backdropClickUnlisten: (() => void) | null = null;
    private maximizeClickUnlisten: (() => void) | null = null;
    private closeClickUnlisten: (() => void) | null = null;

    constructor() {
        effect(() => {
            const showMax = this.showWindowMaximize();
            const showClose = this.showClose();
            this.i18n.lang();
            if (this.initialized) {
                this.syncControls(showMax, showClose);
            }
        });
    }

    ngOnInit(): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
        this.initialized = true;
        this.syncControls(this.showWindowMaximize(), this.showClose());
    }

    ngOnDestroy(): void {
        if (this.maximized) {
            this.restore();
        }
        this.destroyMaximizeBtn();
        this.destroyCloseBtn();
        this.destroyControlsWrapper();
        if (isPlatformBrowser(this.platformId)) {
            this.renderer.removeStyle(this.el.nativeElement, 'position');
        }
        this.initialized = false;
    }

    @HostListener('document:keydown.escape')
    onDocumentEscape(): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        if (CardMaximizeDirective.activeInstance !== this || !this.maximized) {
            return;
        }
        this.restore();
    }

    private syncControls(showMax: boolean, showClose: boolean): void {
        if (!showMax && !showClose) {
            if (this.maximized) {
                this.restore();
            }
            this.destroyMaximizeBtn();
            this.destroyCloseBtn();
            this.destroyControlsWrapper();
            return;
        }

        this.ensureControlsWrapper();

        if (showMax && !this.maximizeBtn) {
            this.createMaximizeBtn();
        } else if (!showMax && this.maximizeBtn) {
            if (this.maximized) {
                this.restore();
            }
            this.destroyMaximizeBtn();
        }
        this.updateMaximizeBtnState();

        if (showClose && !this.closeBtn) {
            this.createCloseBtn();
        } else if (!showClose && this.closeBtn) {
            this.destroyCloseBtn();
        }
        this.updateCloseBtnState();
    }

    private ensureControlsWrapper(): void {
        if (this.controlsWrapper) {
            return;
        }
        const wrapper = this.renderer.createElement('div') as HTMLElement;
        this.renderer.addClass(wrapper, 'card-controls');
        this.renderer.appendChild(this.el.nativeElement, wrapper);
        this.controlsWrapper = wrapper;
    }

    private destroyControlsWrapper(): void {
        if (!this.controlsWrapper) {
            return;
        }
        this.renderer.removeChild(this.el.nativeElement, this.controlsWrapper);
        this.controlsWrapper = null;
    }

    private createMaximizeBtn(): void {
        if (!this.controlsWrapper) {
            return;
        }
        const btn = this.renderer.createElement('button') as HTMLButtonElement;
        btn.type = 'button';
        for (const c of ['p-button', 'p-button-text', 'p-button-rounded', 'p-button-icon-only', 'card-maximize-toggle']) {
            this.renderer.addClass(btn, c);
        }
        const icon = this.renderer.createElement('i') as HTMLElement;
        this.renderer.addClass(icon, 'pi');
        this.renderer.addClass(icon, 'pi-window-maximize');
        this.renderer.appendChild(btn, icon);

        if (this.closeBtn) {
            this.renderer.insertBefore(this.controlsWrapper, btn, this.closeBtn);
        } else {
            this.renderer.appendChild(this.controlsWrapper, btn);
        }

        this.maximizeBtn = btn;
        this.maximizeIconEl = icon;
        this.maximizeClickUnlisten = this.renderer.listen(btn, 'click', (e: Event) => {
            e.stopPropagation();
            this.toggle();
        });
    }

    private destroyMaximizeBtn(): void {
        if (this.maximizeClickUnlisten) {
            this.maximizeClickUnlisten();
            this.maximizeClickUnlisten = null;
        }
        if (this.maximizeBtn && this.controlsWrapper) {
            this.renderer.removeChild(this.controlsWrapper, this.maximizeBtn);
        }
        this.maximizeBtn = null;
        this.maximizeIconEl = null;
    }

    private createCloseBtn(): void {
        if (!this.controlsWrapper) {
            return;
        }
        const btn = this.renderer.createElement('button') as HTMLButtonElement;
        btn.type = 'button';
        for (const c of ['p-button', 'p-button-text', 'p-button-rounded', 'p-button-icon-only', 'card-close-btn']) {
            this.renderer.addClass(btn, c);
        }
        const icon = this.renderer.createElement('i') as HTMLElement;
        this.renderer.addClass(icon, 'pi');
        this.renderer.addClass(icon, 'pi-times');
        this.renderer.appendChild(btn, icon);
        this.renderer.appendChild(this.controlsWrapper, btn);
        this.closeBtn = btn;
        this.closeClickUnlisten = this.renderer.listen(btn, 'click', (e: Event) => {
            e.stopPropagation();
            this.hideCard();
        });
    }

    private destroyCloseBtn(): void {
        if (this.closeClickUnlisten) {
            this.closeClickUnlisten();
            this.closeClickUnlisten = null;
        }
        if (this.closeBtn && this.controlsWrapper) {
            this.renderer.removeChild(this.controlsWrapper, this.closeBtn);
        }
        this.closeBtn = null;
    }

    private toggle(): void {
        if (this.maximized) {
            this.restore();
        } else {
            this.maximize();
        }
    }

    private maximize(): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        const other = CardMaximizeDirective.activeInstance;
        if (other && other !== this) {
            other.restore();
        }
        const host = this.el.nativeElement;
        this.renderer.addClass(host, 'card--maximized');
        const backdrop = this.renderer.createElement('div') as HTMLElement;
        this.renderer.addClass(backdrop, 'card-maximize-backdrop');
        this.backdropClickUnlisten = this.renderer.listen(backdrop, 'click', () => this.restore());
        this.backdropEl = backdrop;
        this.renderer.appendChild(document.body, backdrop);
        CardMaximizeDirective.activeInstance = this;
        this.maximized = true;
        this.updateMaximizeBtnState();
        queueMicrotask(() => this.maximizeBtn?.focus());
    }

    private restore(): void {
        if (!this.maximized) {
            return;
        }
        const host = this.el.nativeElement;
        this.renderer.removeClass(host, 'card--maximized');
        if (this.backdropClickUnlisten) {
            this.backdropClickUnlisten();
            this.backdropClickUnlisten = null;
        }
        if (this.backdropEl && isPlatformBrowser(this.platformId)) {
            this.renderer.removeChild(document.body, this.backdropEl);
            this.backdropEl = null;
        } else {
            this.backdropEl = null;
        }
        if (CardMaximizeDirective.activeInstance === this) {
            CardMaximizeDirective.activeInstance = null;
        }
        this.maximized = false;
        this.updateMaximizeBtnState();
        queueMicrotask(() => this.maximizeBtn?.focus());
    }

    private updateMaximizeBtnState(): void {
        if (!this.maximizeBtn || !this.maximizeIconEl) {
            return;
        }
        const label = this.i18n.t(this.maximized ? 'card.restore' : 'card.maximize');
        this.renderer.setAttribute(this.maximizeBtn, 'aria-label', label);
        this.renderer.setAttribute(this.maximizeBtn, 'title', label);
        this.renderer.removeClass(this.maximizeIconEl, 'pi-window-maximize');
        this.renderer.removeClass(this.maximizeIconEl, 'pi-window-minimize');
        this.renderer.addClass(this.maximizeIconEl, this.maximized ? 'pi-window-minimize' : 'pi-window-maximize');
    }

    private hideCard(): void {
        if (this.maximized) {
            this.restore();
        }
        this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
        this.closed.emit();
        if (isPlatformBrowser(this.platformId)) {
            (document.activeElement as HTMLElement)?.blur();
        }
    }

    private updateCloseBtnState(): void {
        if (!this.closeBtn) {
            return;
        }
        const label = this.i18n.t('card.close');
        this.renderer.setAttribute(this.closeBtn, 'aria-label', label);
        this.renderer.setAttribute(this.closeBtn, 'title', label);
    }
}
