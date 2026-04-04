import {
    Directive,
    ElementRef,
    HostListener,
    OnDestroy,
    OnInit,
    PLATFORM_ID,
    Renderer2,
    effect,
    inject
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

    private maximized = false;
    private toggleBtn: HTMLButtonElement | null = null;
    private iconEl: HTMLElement | null = null;
    private backdropEl: HTMLElement | null = null;
    private backdropClickUnlisten: (() => void) | null = null;
    private toggleClickUnlisten: (() => void) | null = null;

    constructor() {
        effect(() => {
            this.i18n.lang();
            if (this.toggleBtn) {
                this.updateButtonState();
            }
        });
    }

    ngOnInit(): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
        this.createToggleButton();
    }

    ngOnDestroy(): void {
        if (this.maximized) {
            this.restore();
        }
        this.removeToggleButton();
        if (isPlatformBrowser(this.platformId)) {
            this.renderer.removeStyle(this.el.nativeElement, 'position');
        }
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

    private createToggleButton(): void {
        const btn = this.renderer.createElement('button') as HTMLButtonElement;
        btn.type = 'button';
        for (const c of [
            'p-button',
            'p-button-text',
            'p-button-rounded',
            'p-button-icon-only',
            'card-maximize-toggle'
        ]) {
            this.renderer.addClass(btn, c);
        }
        const icon = this.renderer.createElement('i') as HTMLElement;
        this.renderer.addClass(icon, 'pi');
        this.renderer.addClass(icon, 'pi-window-maximize');
        this.renderer.appendChild(btn, icon);
        this.renderer.appendChild(this.el.nativeElement, btn);
        this.toggleBtn = btn;
        this.iconEl = icon;
        this.toggleClickUnlisten = this.renderer.listen(btn, 'click', (e: Event) => {
            e.stopPropagation();
            this.toggle();
        });
        this.updateButtonState();
    }

    private removeToggleButton(): void {
        if (this.toggleClickUnlisten) {
            this.toggleClickUnlisten();
            this.toggleClickUnlisten = null;
        }
        if (this.toggleBtn) {
            this.renderer.removeChild(this.el.nativeElement, this.toggleBtn);
            this.toggleBtn = null;
            this.iconEl = null;
        }
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
        this.updateButtonState();
        queueMicrotask(() => this.toggleBtn?.focus());
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
        this.updateButtonState();
        queueMicrotask(() => this.toggleBtn?.focus());
    }

    private updateButtonState(): void {
        if (!this.toggleBtn || !this.iconEl) {
            return;
        }
        const label = this.i18n.t(this.maximized ? 'card.restore' : 'card.maximize');
        this.renderer.setAttribute(this.toggleBtn, 'aria-label', label);
        this.renderer.setAttribute(this.toggleBtn, 'title', label);
        this.renderer.removeClass(this.iconEl, 'pi-window-maximize');
        this.renderer.removeClass(this.iconEl, 'pi-window-minimize');
        const icon = this.maximized ? 'pi-window-minimize' : 'pi-window-maximize';
        this.renderer.addClass(this.iconEl, icon);
    }
}
