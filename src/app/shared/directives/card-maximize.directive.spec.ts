import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { CardMaximizeDirective } from './card-maximize.directive';

@Component({
    template: '<div class="card" appCardMaximize [showWindowMaximize]="showMax" [showClose]="showClose" (closed)="onClosed()">Content</div>',
    standalone: true,
    imports: [CardMaximizeDirective]
})
class TestHostComponent {
    showMax = true;
    showClose = false;
    closedCount = 0;
    onClosed(): void {
        this.closedCount++;
    }
}

function removeBackdropsFromBody(): void {
    document.querySelectorAll('.card-maximize-backdrop').forEach((el) => el.remove());
}

describe('CardMaximizeDirective', () => {
    let fixture: ComponentFixture<TestHostComponent>;

    function hostEl(): HTMLElement {
        return fixture.nativeElement.querySelector('.card') as HTMLElement;
    }

    function controlsWrapper(): HTMLElement | null {
        return hostEl().querySelector('.card-controls');
    }

    function toggleBtn(): HTMLButtonElement | null {
        return hostEl().querySelector('.card-maximize-toggle');
    }

    function closeBtn(): HTMLButtonElement | null {
        return hostEl().querySelector('.card-close-btn');
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } })]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
    });

    afterEach(() => {
        if (fixture && !fixture.componentRef.hostView.destroyed) {
            fixture.destroy();
        }
        removeBackdropsFromBody();
    });

    it('creates controls wrapper and toggle when showWindowMaximize is true', () => {
        expect(controlsWrapper()).toBeTruthy();
        expect(toggleBtn()).toBeTruthy();
    });

    it('does not render toggle when showWindowMaximize is false', () => {
        fixture.componentInstance.showMax = false;
        fixture.detectChanges();
        expect(toggleBtn()).toBeNull();
    });

    it('does not render close button by default', () => {
        expect(closeBtn()).toBeNull();
    });

    it('renders close button when showClose is true', () => {
        fixture.componentInstance.showClose = true;
        fixture.detectChanges();
        expect(closeBtn()).toBeTruthy();
    });

    it('renders both buttons side by side when both inputs are true', () => {
        fixture.componentInstance.showMax = true;
        fixture.componentInstance.showClose = true;
        fixture.detectChanges();
        const wrapper = controlsWrapper()!;
        expect(wrapper.children.length).toBe(2);
        expect(wrapper.children[0].classList.contains('card-maximize-toggle')).toBeTrue();
        expect(wrapper.children[1].classList.contains('card-close-btn')).toBeTrue();
    });

    it('removes controls wrapper when both inputs become false', () => {
        fixture.componentInstance.showMax = false;
        fixture.detectChanges();
        expect(controlsWrapper()).toBeNull();
    });

    it('button has maximize icon initially', () => {
        const icon = toggleBtn()!.querySelector('i');
        expect(icon?.classList.contains('pi-window-maximize')).toBeTrue();
    });

    it('click toggles to maximized', () => {
        toggleBtn()!.click();
        fixture.detectChanges();
        expect(hostEl().classList.contains('card--maximized')).toBeTrue();
    });

    it('click again restores', () => {
        toggleBtn()!.click();
        fixture.detectChanges();
        toggleBtn()!.click();
        fixture.detectChanges();
        expect(hostEl().classList.contains('card--maximized')).toBeFalse();
    });

    it('backdrop is created on maximize', () => {
        toggleBtn()!.click();
        fixture.detectChanges();
        expect(document.body.querySelector('.card-maximize-backdrop')).toBeTruthy();
    });

    it('backdrop is removed on restore', () => {
        toggleBtn()!.click();
        fixture.detectChanges();
        toggleBtn()!.click();
        fixture.detectChanges();
        expect(document.body.querySelector('.card-maximize-backdrop')).toBeNull();
    });

    it('backdrop click restores', () => {
        toggleBtn()!.click();
        fixture.detectChanges();
        expect(hostEl().classList.contains('card--maximized')).toBeTrue();
        document.body.querySelector('.card-maximize-backdrop')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();
        expect(hostEl().classList.contains('card--maximized')).toBeFalse();
    });

    it('Escape key restores', () => {
        toggleBtn()!.click();
        fixture.detectChanges();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        fixture.detectChanges();
        expect(hostEl().classList.contains('card--maximized')).toBeFalse();
    });

    it('Escape does nothing when not maximized', () => {
        expect(hostEl().classList.contains('card--maximized')).toBeFalse();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        fixture.detectChanges();
        expect(hostEl().classList.contains('card--maximized')).toBeFalse();
    });

    it('close button hides card and emits closed event', () => {
        fixture.componentInstance.showClose = true;
        fixture.detectChanges();
        expect(fixture.componentInstance.closedCount).toBe(0);
        closeBtn()!.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.closedCount).toBe(1);
        expect(hostEl().style.display).toBe('none');
    });

    it('close while maximized restores first then hides', () => {
        fixture.componentInstance.showClose = true;
        fixture.detectChanges();
        toggleBtn()!.click();
        fixture.detectChanges();
        expect(hostEl().classList.contains('card--maximized')).toBeTrue();
        expect(document.body.querySelector('.card-maximize-backdrop')).toBeTruthy();
        closeBtn()!.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.closedCount).toBe(1);
        expect(hostEl().classList.contains('card--maximized')).toBeFalse();
        expect(document.body.querySelector('.card-maximize-backdrop')).toBeNull();
        expect(hostEl().style.display).toBe('none');
    });

    it('cleanup on destroy', () => {
        toggleBtn()!.click();
        fixture.detectChanges();
        expect(document.body.querySelector('.card-maximize-backdrop')).toBeTruthy();
        fixture.destroy();
        expect(document.body.querySelector('.card-maximize-backdrop')).toBeNull();
    });

    it('disabling showWindowMaximize while maximized restores', () => {
        toggleBtn()!.click();
        fixture.detectChanges();
        expect(hostEl().classList.contains('card--maximized')).toBeTrue();
        fixture.componentInstance.showMax = false;
        fixture.detectChanges();
        expect(hostEl().classList.contains('card--maximized')).toBeFalse();
        expect(document.body.querySelector('.card-maximize-backdrop')).toBeNull();
    });
});
