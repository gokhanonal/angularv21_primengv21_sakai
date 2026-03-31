import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        Backoffive V0.5
        <a href="https://www.ovolt.com.tr" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline"><img src="/assets/branding/logo/ovolt.png" alt="Company Logo" class="w-10 h-10"></a>
    </div>`
})
export class AppFooter {}
