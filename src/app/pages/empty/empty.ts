import { Component } from '@angular/core';
import { CardMaximizeDirective } from '@/app/shared/directives/card.directive';

@Component({
    selector: 'app-empty',
    standalone: true,
    imports: [CardMaximizeDirective],
    template: ` <div class="card" appCardMaximize [showWindowMaximize]="true">
        <div class="font-semibold text-xl mb-4">Empty Page</div>
        <p>Use this page to start from scratch and place your custom content.</p>
    </div>`
})
export class Empty {}
