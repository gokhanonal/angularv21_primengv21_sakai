import { Component } from '@angular/core';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { ValidatedInputComponent } from '@/app/shared/validated-input/validated-input.component';
import { ValidationRule } from '@/app/shared/validated-input/validated-input.contract';
import { CardMaximizeDirective } from '@/app/shared/directives/card.directive';

@Component({
    selector: 'app-formlayout-demo',
    standalone: true,
    imports: [InputTextModule, FluidModule, ButtonModule, SelectModule, FormsModule, TextareaModule, ValidatedInputComponent, CardMaximizeDirective],
    template: `<p-fluid>
        <div class="flex flex-col md:flex-row gap-8">
            <div class="md:w-1/2">
                <div class="card flex flex-col gap-4" appCardMaximize [showWindowMaximize]="true">

                    <div class="card-header">
                        <div class="card-heading">
                            <h3 class="card-title">Vertical Form Layout</h3>
                            <p class="card-description">Sample form layout</p>
                        </div>
                        <div class="card-actions">
                            <a href="#" class="card-action-link" (click)="$event.preventDefault()">
                                View More
                                <i class="pi pi-angle-right"></i>
                            </a>
                            <button type="button" class="card-action-icon" aria-label="Delete target">
                                <i class="pi pi-trash text-red-500"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-header-divider"></div>
                    <div class="flex flex-col gap-2">
                        <label for="name1">Name</label>
                        <app-validated-input [rules]="nameRules">
                            <input pInputText id="name1" type="text" />
                        </app-validated-input>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="email1">Email</label>
                        <app-validated-input [rules]="emailRules">
                            <input pInputText id="email1" type="text" />
                        </app-validated-input>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="age1">Age</label>
                        <app-validated-input [rules]="ageRules">
                            <input pInputText id="age1" type="text" />
                        </app-validated-input>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="url1">URL</label>
                        <app-validated-input [rules]="urlRules">
                            <input pInputText id="url1" type="text" />
                        </app-validated-input>
                    </div>
                </div>

                <div class="card flex flex-col gap-4" appCardMaximize [showWindowMaximize]="true">
                    <div class="font-semibold text-xl">Vertical Grid</div>
                    <div class="flex flex-wrap gap-6">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="name2">Name</label>
                            <input pInputText id="name2" type="text" />
                        </div>
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="email2">Email</label>
                            <input pInputText id="email2" type="text" />
                        </div>
                    </div>
                </div>
            </div>
            <div class="md:w-1/2">
                <div class="card flex flex-col gap-4" appCardMaximize [showWindowMaximize]="true">
                    <h3 class="card-title">Horizontal Form Layout</h3>
                    <div class="grid grid-cols-12 gap-4 grid-cols-12 gap-2">
                        <label for="name3" class="flex items-center col-span-12 mb-2 md:col-span-2 md:mb-0">Name</label>
                        <div class="col-span-12 md:col-span-10">
                            <input pInputText id="name3" type="text" />
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4 grid-cols-12 gap-2">
                        <label for="email3" class="flex items-center col-span-12 mb-2 md:col-span-2 md:mb-0">Email</label>
                        <div class="col-span-12 md:col-span-10">
                            <input pInputText id="email3" type="text" />
                        </div>
                    </div>
                </div>

                <div class="card flex flex-col gap-4" appCardMaximize [showWindowMaximize]="true">
                    <div class="font-semibold text-xl">Inline</div>
                    <div class="flex flex-wrap items-start gap-6">
                        <div class="field">
                            <label for="firstname1" class="sr-only">Firstname</label>
                            <input pInputText id="firstname1" type="text" placeholder="Firstname" />
                        </div>
                        <div class="field">
                            <label for="lastname1" class="sr-only">Lastname</label>
                            <input pInputText id="lastname1" type="text" placeholder="Lastname" />
                        </div>
                        <p-button label="Submit" [fluid]="false"></p-button>
                    </div>
                </div>
                <div class="card flex flex-col gap-4" appCardMaximize [showWindowMaximize]="true">
                    <div class="font-semibold text-xl">Help Text</div>
                    <div class="flex flex-wrap gap-2">
                        <label for="username">Username</label>
                        <input pInputText id="username" type="text" />
                        <small>Enter your username to reset your password.</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex mt-8">
            <div class="card flex flex-col gap-6 w-full" appCardMaximize [showWindowMaximize]="true">
                <div class="font-semibold text-xl">Advanced</div>
                <div class="flex flex-col md:flex-row gap-6">
                    <div class="flex flex-wrap gap-2 w-full">
                        <label for="firstname2">Firstname</label>
                        <input pInputText id="firstname2" type="text" />
                    </div>
                    <div class="flex flex-wrap gap-2 w-full">
                        <label for="lastname2">Lastname</label>
                        <input pInputText id="lastname2" type="text" />
                    </div>
                </div>

                <div class="flex flex-wrap">
                    <label for="address">Address</label>
                    <textarea pTextarea id="address" rows="4"></textarea>
                </div>

                <div class="flex flex-col md:flex-row gap-6">
                    <div class="flex flex-wrap gap-2 w-full">
                        <label for="state">State</label>
                        <p-select id="state" [(ngModel)]="dropdownItem" [options]="dropdownItems" optionLabel="name" placeholder="Select One" class="w-full"></p-select>
                    </div>
                    <div class="flex flex-wrap gap-2 w-full">
                        <label for="zip">Zip</label>
                        <input pInputText id="zip" type="text" />
                    </div>
                </div>
            </div>
        </div>

        
    </p-fluid>`
})
export class FormLayoutDemo {
    nameRules: ValidationRule[] = [
        { type: 'required', message: 'Name is required' },
        { type: 'text', minLength: 2, message: 'Name must be at least 2 characters (letters only)' }
    ];

    emailRules: ValidationRule[] = [
        { type: 'required', message: 'Email is required' },
        { type: 'email', message: 'Please enter a valid email address' }
    ];

    ageRules: ValidationRule[] = [
        { type: 'required', message: 'Age is required' },
        { type: 'numeric', message: 'Age must be a whole number' },
        { min: 1, max: 120, message: 'Age must be between 1 and 120' }
    ];

    urlRules: ValidationRule[] = [
        { type: 'required', message: 'Website is required' },
        { type: 'url', message: 'Please enter a valid URL (e.g. https://example.com)' }
    ];

    

    dropdownItems = [
        { name: 'Option 1', code: 'Option 1' },
        { name: 'Option 2', code: 'Option 2' },
        { name: 'Option 3', code: 'Option 3' }
    ];

    dropdownItem = null;
}
