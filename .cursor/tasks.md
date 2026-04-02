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
   - [x] Ensure compatibility with Angular forms (reactive or template-driven) → works via native DOM (inputEl.value + focusout/input events); no forms API dependency

5. Testing & edge cases
   - [x] Verify each validation type with valid and invalid inputs → 38/38 tests passed (required, email, url, numeric, float, alphanumeric, text, percentage, min, max, minLength, maxLength, regex)
   - [x] Verify multiple validators on a single input → 9/9 tests passed (first-error-only, order-sensitive, empty rules, single rule)
   - [x] Verify error message display and border styling → confirmed: error `<small>` styled with `var(--p-red-500)`, border via PrimeNG `ng-dirty ng-invalid` classes (matches messagesdemo.ts / inputdemo.ts pattern)

## add a button on a new column on the right of the grid and fix to right in order to get details of locations. 
- [x] location_id and location_code must be added to data. and location_code will be displayed on the left of the grid as a new column
- [x] Detail button must open a new page (/locations/{location_id}) to show all details of location. This page look like formlayout page with one card

## duplicate "locations" page as "stations" use public/demo/locations.json data to get locations and populate them on the grid

- [x] List on grid: `dashboardMapItemDataSummaries.name`, `dashboardMapItemDataSummaries.status` (`/stations`, `StationsService` → `/demo/locations.json`).
- [x] Map: markers at `latitude` / `longitude` with `L.icon` from `iconUrl`; table search syncs visible markers.

### Validation

- [x] `ng build` succeeds.

## change grid properties

- [x] Skeleton placeholder while JSON loads; `p-table` uses `[lazy]="true"` with `(onLazyLoad)` slicing in-memory rows + `totalRecords`.
- [x] Multi-column sort: `sortMode="multiple"` with `pSortableColumn` / `p-sortIcon`; sort applied in `onLazyLoad` via `multiSortMeta` (Shift+click for secondary sort, per PrimeNG).
- [x] Column filters: `p-columnFilter` (text, menu) on **Name** and **Status**.
- [x] **Clear filters** outline button (filter-slash icon) top-left of grid caption; resets status toggles to all on, `table.clear()`, reloads lazy state.
- [x] Status **toggle buttons** (OR): one `p-togglebutton` per distinct `status` from JSON; only rows whose `status` is toggled **on** are shown; map markers stay in sync with the filtered set.

### Validation

- [x] `ng build` succeeds.

## change station status filters positions

- [x] Status toggles moved into the map card: same wrapper as the map, absolutely positioned top-right, right-aligned, no section title.

### Validation

- [x] `ng build` succeeds.

## Station detail page

- [x] Station detail route `/stations/:locationId` (`StationDetail`); card layout lists `location_id`, `location_code`, `name`, `latitude`, `longitude`, `isAC`, `status` (data from `/demo/locations.json` via `StationsService`, with normalization for missing ids/codes).
- [x] Stations grid: frozen **Detail** column → `[routerLink]="['/stations', row.location_id]"`.

### Validation

- [x] `ng build` succeeds.

## Stations map row: KPI column

- [x] Top card uses a **two-column row** on large screens: **map** (`flex-1`) + **KPI panel** (`aside`, fixed max width); stacks on small viewports. Table card remains **full width** below (unchanged).
- [x] Six small KPI cards with **header / content / footer**; titles exactly as specified (Turkish). Content: **PrimeIcons** illustration + **`current / total`** (values derived from loaded JSON + current filters where noted).
- [x] Loading: skeleton map + six KPI skeletons in the same row layout.

### Validation

- [x] `ng build` succeeds.

## In stations page, make KPI cards render in two columns

- [x] KPI panel uses **`grid-cols-2`** (loading skeletons + loaded cards); aside widened to **`~30–32rem`** on large screens so two columns fit.

### Validation

- [x] `ng build` succeeds.

## stations page, separate map and guage/kpi divs. And guage/kpi divs background must be transparent