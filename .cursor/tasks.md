# TASK LIST

## Notifications Feature Breakdown

1. Data contract
- [x]Define notification model and unread rules.

2. State/service
- [x]Create a centralized notifications state (list, unread count, latest five).

3. Header integration
- [x]Add inbox badge logic:
  - [x]1..9 => numeric badge
  - [x]>9 => red dot only
- [x]Add dropdown preview (latest 5 + Show All button).

4. Notifications page
- [x]Add route and page UI for full list.
- [x]Include filtering/sorting if needed (optional).

5. Detail modal
- [x]Add reusable modal component for notification details.
- [x]Open from both dropdown item click and list item click.

6. State transitions
- [x]Mark as read on open/click (final behavior decision required).
- [x]Keep header badge, dropdown, and page synchronized.

7. Validation
- [x]Verify badge edge cases: 0, 1..9, 10+.
- [x]Verify dropdown item cap (5) and Show All navigation.

## Adding validation feature to inputbox

### Requirements
- Validation feature exposed as component props (inputs) on an input box component.
- Support built-in validation types: email, URL, numeric, float, alphanumeric, text, percentage, number constraints (e.g. min/max).
- Support custom regex patterns.
- A prop for a custom error message when validation fails.
- On validation error: display the message below the input in danger color and apply a danger border to the component.

### Open questions
- [x] New standalone component vs. directive on existing PrimeNG input? → **Standalone wrapper component** (content projection; works with all PrimeNG input types)
- [x] Validation trigger: on blur, on change, on submit, or all? → **On blur initially; then on change after first error** (clears error as soon as user fixes it)
- [x] Support multiple validators on a single input? Show all errors or first only? → **Yes, multiple validators supported; show first failing error only** (evaluated in declaration order)
- [x] Angular Reactive Forms integration or purely standalone? → **Purely standalone with template-driven forms (ngModel)**; no ReactiveFormsModule needed (project doesn't use it)

### Breakdown

1. Design & contract
   - [x] Decide: new component vs. directive on existing PrimeNG input → resolved above
   - [x] Define component inputs (props): validationType, regex, min, max, errorMessage, etc. → `validated-input.contract.ts` created
   - [x] Define validation trigger strategy (blur / change / submit) → resolved above

2. Core validation logic
   - [x] Implement built-in validators: email, url, numeric, alphanumeric, text, percentage, float → `validators.ts` created
   - [x] Implement numeric constraint validators: min, max → already in `validators.ts` (evaluateRule)
   - [x] Implement custom regex validator → added to `validators.ts` (evaluateRule)

3. UI feedback
   - [x] Show error message below input in danger color → `validated-input.component.ts` created
   - [x] Apply danger border class to input on validation error → already in `validated-input.component.ts` (ng-dirty ng-invalid)
   - [x] Clear error state when input becomes valid → already in `validated-input.component.ts` (re-validate on input after first error)

4. Integration & usage
   - [x] Wire into at least one existing form as a demo/proof → `formlayoutdemo.ts` (Name, Email, Age fields)
   - [ ] Ensure compatibility with Angular forms (reactive or template-driven)

5. Testing & edge cases
   - [ ] Verify each validation type with valid and invalid inputs
   - [ ] Verify multiple validators on a single input
   - [ ] Verify error message display and border styling