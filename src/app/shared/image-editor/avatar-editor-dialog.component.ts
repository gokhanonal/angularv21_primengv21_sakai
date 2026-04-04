import { Component, ElementRef, input, output, viewChild, effect, untracked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';

const VIEWPORT_SIZE = 320;

@Component({
    selector: 'app-avatar-editor-dialog',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule, TranslatePipe],
    template: `
        <p-dialog
            [header]="dialogTitle() | t"
            [modal]="true"
            [dismissableMask]="true"
            [style]="{ width: 'min(95vw, 28rem)' }"
            [visible]="visible()"
            (visibleChange)="onDialogVisibleChange($event)"
            [draggable]="false"
            [resizable]="false"
        >
            <div class="flex flex-col gap-4">
                <div
                    class="mx-auto rounded-border border border-surface-200 dark:border-surface-700 overflow-hidden bg-surface-100 dark:bg-surface-800 touch-none"
                    [style.width.px]="viewportSize"
                    [style.height.px]="viewportSize"
                >
                    <canvas
                        #viewportCanvas
                        [width]="viewportSize"
                        [height]="viewportSize"
                        class="block max-w-full cursor-grab active:cursor-grabbing"
                        (mousedown)="onPanStart($event)"
                        (touchstart)="onTouchStart($event)"
                    ></canvas>
                </div>

                <div class="flex flex-wrap gap-2 justify-center">
                    <p-button type="button" [label]="'profile.editor.rotateLeft' | t" icon="pi pi-replay" severity="secondary" (onClick)="rotate(-90)" />
                    <p-button type="button" [label]="'profile.editor.rotateRight' | t" icon="pi pi-refresh" severity="secondary" (onClick)="rotate(90)" />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2" for="avatar-zoom">{{ 'profile.editor.zoom' | t }}</label>
                    <input
                        id="avatar-zoom"
                        type="range"
                        min="0.5"
                        max="4"
                        step="0.05"
                        [value]="zoomModel"
                        (input)="onZoomInput($event)"
                        class="w-full accent-primary"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2" for="avatar-brightness">{{ 'profile.editor.brightness' | t }}</label>
                    <input
                        id="avatar-brightness"
                        type="range"
                        min="-60"
                        max="60"
                        step="1"
                        [value]="brightnessModel"
                        (input)="onBrightnessInput($event)"
                        class="w-full accent-primary"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2" for="avatar-contrast">{{ 'profile.editor.contrast' | t }}</label>
                    <input
                        id="avatar-contrast"
                        type="range"
                        min="60"
                        max="180"
                        step="1"
                        [value]="contrastModel"
                        (input)="onContrastInput($event)"
                        class="w-full accent-primary"
                    />
                </div>

                <p class="text-muted-color text-sm m-0">{{ 'profile.editor.panHint' | t }}</p>

                <div class="flex justify-end gap-2 pt-2">
                    <p-button type="button" [label]="'profile.editor.cancel' | t" severity="secondary" (onClick)="cancel()" />
                    <p-button type="button" [label]="'profile.editor.confirm' | t" (onClick)="confirm()" />
                </div>
            </div>
        </p-dialog>
    `
})
export class AvatarEditorDialogComponent implements OnDestroy {
    readonly visible = input(false);

    readonly visibleChange = output<boolean>();

    /** Object URL or data URL of the image to edit */
    readonly imageSrc = input<string>('');

    readonly confirmed = output<string>();

    readonly outputWidth = input(256);

    readonly outputHeight = input(256);

    readonly dialogTitle = input('profile.editor.title');

    readonly outputFormat = input('image/jpeg');

    readonly outputQuality = input(0.92);

    readonly viewportCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('viewportCanvas');

    readonly viewportSize = VIEWPORT_SIZE;

    zoomModel = 1;
    brightnessModel = 0;
    contrastModel = 100;

    onZoomInput(event: Event): void {
        const v = Number((event.target as HTMLInputElement).value);
        this.zoomModel = v;
        this.redraw();
    }

    onBrightnessInput(event: Event): void {
        const v = Number((event.target as HTMLInputElement).value);
        this.brightnessModel = v;
        this.redraw();
    }

    onContrastInput(event: Event): void {
        const v = Number((event.target as HTMLInputElement).value);
        this.contrastModel = v;
        this.redraw();
    }

    private rotationDeg = 0;
    private panX = 0;
    private panY = 0;

    private image: HTMLImageElement | null = null;

    private dragging = false;
    private lastClientX = 0;
    private lastClientY = 0;

    private readonly boundMove = (e: MouseEvent) => this.onPanMove(e);
    private readonly boundUp = () => this.onPanEnd();
    private readonly boundTouchMove = (e: TouchEvent) => this.onTouchMove(e);
    private readonly boundTouchEnd = () => this.onPanEnd();

    constructor() {
        effect(() => {
            const open = this.visible();
            const src = this.imageSrc();
            if (!open || !src) {
                return;
            }
            untracked(() => {
                this.loadImage(src);
            });
        });
    }

    ngOnDestroy(): void {
        this.detachGlobalPan();
        this.cleanupImage();
    }

    onDialogVisibleChange(v: boolean): void {
        this.visibleChange.emit(v);
        if (!v) {
            this.detachGlobalPan();
            this.cleanupImage();
            this.resetState();
        }
    }

    private resetState(): void {
        this.rotationDeg = 0;
        this.panX = 0;
        this.panY = 0;
        this.zoomModel = 1;
        this.brightnessModel = 0;
        this.contrastModel = 100;
        this.image = null;
    }

    private cleanupImage(): void {
        this.image = null;
    }

    private loadImage(src: string): void {
        this.cleanupImage();
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            this.image = img;
            this.panX = 0;
            this.panY = 0;
            this.rotationDeg = 0;
            this.zoomModel = 1;
            this.redraw();
        };
        img.onerror = () => {
            this.image = null;
        };
        img.src = src;
    }

    rotate(delta: number): void {
        this.rotationDeg = (this.rotationDeg + delta) % 360;
        if (this.rotationDeg < 0) {
            this.rotationDeg += 360;
        }
        this.redraw();
    }

    redraw(): void {
        const canvas = this.viewportCanvas()?.nativeElement;
        const img = this.image;
        if (!canvas || !img || !img.complete || img.naturalWidth === 0) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        const S = VIEWPORT_SIZE;
        ctx.clearRect(0, 0, S, S);

        const rad = (this.rotationDeg * Math.PI) / 180;
        const br = 100 + this.brightnessModel;
        const ct = this.contrastModel;
        ctx.filter = `brightness(${br}%) contrast(${ct}%)`;

        const nw = img.naturalWidth;
        const nh = img.naturalHeight;

        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        const rotW = nw * cos + nh * sin;
        const rotH = nw * sin + nh * cos;

        const baseScale = Math.max(S / rotW, S / rotH);
        const scale = baseScale * this.zoomModel;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, S, S);
        ctx.clip();
        ctx.translate(S / 2 + this.panX, S / 2 + this.panY);
        ctx.rotate(rad);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -nw / 2, -nh / 2);
        ctx.restore();
        ctx.filter = 'none';
    }

    onPanStart(event: MouseEvent): void {
        if (event.button !== 0) {
            return;
        }
        this.dragging = true;
        this.lastClientX = event.clientX;
        this.lastClientY = event.clientY;
        document.addEventListener('mousemove', this.boundMove);
        document.addEventListener('mouseup', this.boundUp);
        event.preventDefault();
    }

    private onPanMove(event: MouseEvent): void {
        if (!this.dragging) {
            return;
        }
        const dx = event.clientX - this.lastClientX;
        const dy = event.clientY - this.lastClientY;
        this.lastClientX = event.clientX;
        this.lastClientY = event.clientY;
        this.panX += dx;
        this.panY += dy;
        this.redraw();
    }

    private onPanEnd(): void {
        this.dragging = false;
        document.removeEventListener('mousemove', this.boundMove);
        document.removeEventListener('mouseup', this.boundUp);
    }

    private detachGlobalPan(): void {
        document.removeEventListener('mousemove', this.boundMove);
        document.removeEventListener('mouseup', this.boundUp);
        document.removeEventListener('touchmove', this.boundTouchMove);
        document.removeEventListener('touchend', this.boundTouchEnd);
        document.removeEventListener('touchcancel', this.boundTouchEnd);
        this.dragging = false;
    }

    onTouchStart(event: TouchEvent): void {
        if (event.touches.length !== 1) {
            return;
        }
        const t = event.touches[0];
        this.dragging = true;
        this.lastClientX = t.clientX;
        this.lastClientY = t.clientY;
        document.addEventListener('touchmove', this.boundTouchMove, { passive: false });
        document.addEventListener('touchend', this.boundTouchEnd);
        document.addEventListener('touchcancel', this.boundTouchEnd);
        event.preventDefault();
    }

    private onTouchMove(event: TouchEvent): void {
        if (!this.dragging || event.touches.length !== 1) {
            return;
        }
        const t = event.touches[0];
        const dx = t.clientX - this.lastClientX;
        const dy = t.clientY - this.lastClientY;
        this.lastClientX = t.clientX;
        this.lastClientY = t.clientY;
        this.panX += dx;
        this.panY += dy;
        this.redraw();
        event.preventDefault();
    }

    cancel(): void {
        this.onDialogVisibleChange(false);
    }

    confirm(): void {
        const img = this.image;
        if (!img || !img.complete) {
            this.onDialogVisibleChange(false);
            return;
        }

        const w = this.outputWidth();
        const h = this.outputHeight();
        const out = document.createElement('canvas');
        out.width = w;
        out.height = h;
        const ctx = out.getContext('2d');
        if (!ctx) {
            this.onDialogVisibleChange(false);
            return;
        }

        const rad = (this.rotationDeg * Math.PI) / 180;
        const br = 100 + this.brightnessModel;
        const ct = this.contrastModel;
        ctx.filter = `brightness(${br}%) contrast(${ct}%)`;

        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        const rotW = nw * cos + nh * sin;
        const rotH = nw * sin + nh * cos;
        const baseScale = Math.max(w / rotW, h / rotH);
        const scale = baseScale * this.zoomModel;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        ctx.clip();
        ctx.translate(w / 2 + this.panX * (w / VIEWPORT_SIZE), h / 2 + this.panY * (h / VIEWPORT_SIZE));
        ctx.rotate(rad);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -nw / 2, -nh / 2);
        ctx.restore();
        ctx.filter = 'none';

        const fmt = this.outputFormat();
        const q = this.outputQuality();
        const dataUrl =
            fmt === 'image/jpeg' || fmt === 'image/webp' ? out.toDataURL(fmt, q) : out.toDataURL(fmt);
        this.confirmed.emit(dataUrl);
        this.onDialogVisibleChange(false);
    }
}
