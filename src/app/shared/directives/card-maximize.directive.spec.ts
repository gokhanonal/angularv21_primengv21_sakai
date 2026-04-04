import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { CardMaximizeDirective } from './card-maximize.directive';

@Component({
    template: '<div class="card" appCardMaximize>Content</div>',
    standalone: true,
    imports: [CardMaximizeDirective]
})
class TestHostComponent {}

function removeBackdropsFromBody(): void {
    document.querySelectorAll('.card-maximize-backdrop').forEach((el) => el.remove());
}

describe('CardMaximizeDirective', () => {
    let fixture: ComponentFixture<TestHostComponent>;

    function hostEl(): HTMLElement {
        return fixture.nativeElement.querySelector('.card') as HTMLElement;
    }

    function toggleBtn(): HTMLButtonElement {
        return hostEl().querySelector('.card-maximize-toggle') as HTMLButtonElement;
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

    it('creates toggle button on init', () => {
        expect(toggleBtn()).toBeTruthy();
        expect(hostEl().contains(toggleBtn())).toBeTrue();
    });

    it('button has maximize icon initially', () => {
        const icon = toggleBtn().querySelector('i');
        expect(icon?.classList.contains('pi-window-maximize')).toBeTrue();
    });

    it('click toggles to maximized', () => {
        toggleBtn().click();
        fixture.detectChanges();
        expect(hostEl().classList.contains('card--maximized')).toBeTrue();
    });

    it('click again restores', () => {
        toggleBtn().click();
        fixture.detectChanges();
        toggleBtn().click();
        fixture.detectChanges();
        expect(hostEl().classList.contains('card--maximized')).toBeFalse();
    });

    it('backdrop is created on maximize', () => {
        toggleBtn().click();
        fixture.detectChanges();
        expect(document.body.querySelector('.card-maximize-backdrop')).toBeTruthy();
    });

    it('backdrop is removed on restore', () => {
        toggleBtn().click();
        fixture.detectChanges();
        toggleBtn().click();
        fixture.detectChanges();
        expect(document.body.querySelector('.card-maximize-backdrop')).toBeNull();
    });

    it('backdrop click restores', () => {
        toggleBtn().click();
        fixture.detectChanges();
        expect(hostEl().classList.contains('card--maximized')).toBeTrue();
        document.body.querySelector('.card-maximize-backdrop')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();
        expect(hostEl().classList.contains('card--maximized')).toBeFalse();
        expect(document.body.querySelector('.card-maximize-backdrop')).toBeNull();
    });

    it('Escape key restores', () => {
        toggleBtn().click();
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
        expect(document.body.querySelector('.card-maximize-backdrop')).toBeNull();
    });

    it('cleanup on destroy', () => {
        toggleBtn().click();
        fixture.detectChanges();
        expect(document.body.querySelector('.card-maximize-backdrop')).toBeTruthy();
        fixture.destroy();
        expect(document.body.querySelector('.card-maximize-backdrop')).toBeNull();
    });
});
