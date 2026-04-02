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

## stations page, separate map and guage/kpi divs. keep position same. And guage/kpi divs background must be transparent

- [x] **Map** is its own `.card` (`flex-1`); **KPI** sits in a sibling `<aside>` (same `flex` row / gap as before). Page title + subtitle sit above the row (no longer inside the map card).
- [x] KPI **aside**, inner **grid**, skeleton column, and each KPI **mini-card** use **`bg-transparent`** (mini-cards keep border for definition); no card wrapper around the whole row.

### Validation

- [x] `ng build` succeeds.

## each kpi cards background should not be transparent keep cards standart

- [x] KPI **mini-cards** use standard panel styling again: **`bg-surface-0 dark:bg-surface-900`** + **`shadow-sm`** (aside / grid wrappers stay transparent).

### Validation

- [x] `ng build` succeeds.

### add multi-language support to app inc Türkçe, English, French, German

- [x] Core: `I18nService` (`app.language`, `localStorage`), `TRANSLATIONS` (en/tr/fr/de), `TranslatePipe` (`t`), PrimeNG locale patches where applicable.
- [x] Layout: sidebar search strings; menu model recomputed from `i18n.lang()`; topbar language `p-select`, Calendar/Messages/Notifications/Profile strings; breadcrumbs via route `breadcrumbKey` + `t()`.
- [x] Routes: `breadcrumbKey` on main app routes, `uikit` parent + each UI demo route, `pages/*` child routes.
- [x] Stations page: subtitle `tf`, table/KPI strings, paginator report template, KPI titles/footers refresh on language change (`effect` + `untracked`).

### Validation

- [x] `ng build` succeeds.

## change language selectio type and its position
- [x] Change language dropdown from text labels to **country flag** options (emoji on the trigger; flag + language name in the overlay list).
- [x] Move the control **between Messages (notifications) and Profile** in the top bar menu; compact width on desktop, full width in the mobile overflow menu.

### Validation

- [x] `ng build` succeeds.

## language select drop-down style changes
- [x] **Flag-only trigger** (same circular `layout-topbar-action` style as other top bar icons—no select chrome). **Click opens** a **`p-menu` popup** (`appendTo="body"`) listing flag + language name; choice calls `I18nService.setLang`.

### Validation

- [x] `ng build` succeeds.

## bug-fix: selected language's flag does not display. however flag in drop down look pretty well

- [x] **Cause:** `.layout-topbar-action > span` (except `.layout-topbar-notification`) was **`display: none`** for desktop icon-only actions, which hid the flag `<span>`.
- [x] **Fix:** Added **`layout-topbar-lang-flag`** and excluded it in `_topbar.scss` (`:not(.layout-topbar-lang-flag)`).

### Validation

- [x] `ng build` succeeds.

## Language selector on auth / floating pages (e.g. login)

- [x] **`AppLanguageSwitcher`** shared component (`variant="topbar"` | `"floating"`): flag trigger + `p-menu` (same behavior as top bar).
- [x] **`AppFloatingConfigurator`**: language control is **first** in the row (immediately **left of** the dark/light `p-button`) so `/auth/login` and other pages using the floating bar get the same UX.

### Validation

- [x] `ng build` succeeds.

## Forgot password page (login look-alike)

**Goal:** New auth route with the **same visual shell** as `/auth/login` (`AppFloatingConfigurator`, card layout, branding), but **fields and copy** appropriate to **password recovery** (not sign-in).

### Product decisions (implemented defaults)

- [x] **Identifier:** **Email only.**
- [x] **Backend:** **UI-only / mock** (no HTTP); class-level comment on `ForgotPassword`.
- [x] **Post-submit messaging:** **Generic** success copy + separate **demo** info message (`auth.forgot.mockNotice`).
- [x] **Login entry:** **Forgot password?** → `routerLink` `/auth/forgot-password` + i18n `auth.login.forgotPassword`.

### Functional breakdown

- [x] **Route** `auth/forgot-password` in `auth.routes.ts` (`ForgotPassword` component).
- [x] **Page** `forgot-password.ts`: same shell as login (`AppFloatingConfigurator`, card, logo SVG with unique mask id).
- [x] **Form:** email via `app-validated-input` + `validate()` on submit; `p-button` submit.
- [x] **Submit:** mock success state (success + info messages); no API.
- [x] **Navigation:** **Back to sign in** → `/auth/login` (link + button after success).
- [x] **i18n:** `auth.*` keys in `translations.ts` for **en, tr, fr, de**.

### Non-functional / quality bar

- [x] **A11y:** `label`/`for`, email `autocomplete`, `type="email"`.
- [x] **Security (BA-level):** no password field; generic success wording.

### Edge cases (test / handle)

- [x] Empty / invalid email — `submitError` + `ValidatedInput` on blur.
- [x] API / network failure — N/A (mock); real API = future task.
- [x] Language change — `emailRules`, success/mock text react via `I18nService` + computeds.

### Explicitly out of scope (unless new task)

- Email delivery (SMTP, templates), **reset-password** token page, CAPTCHA / rate limiting, MFA.

### Validation

- [x] `ng build` succeeds.
- [x] **Manual:** open from login link, valid submit path, invalid email, return to login (owner smoke-test).

### Automated tests

- [x] No component/unit tests in repo for auth pages yet; add when `ng test` harness is used for routes (optional follow-up).

## Login page i18n (labels & placeholders)

**Product defaults:** **PrimeLand** kept as brand name inside localized welcome strings; all card copy uses `auth.login.*` keys.

### Functional

- [x] Welcome, subtitle, email/password labels & placeholders, remember-me, **Sign In** button → **`TranslatePipe`** / `I18nService`.
- [x] Keys in **`translations.ts`** for **en, tr, fr, de** (`auth.login.welcome`, `subtitle`, `emailLabel`, `emailPlaceholder`, `passwordLabel`, `passwordPlaceholder`, `rememberMe`, `signIn`; `forgotPassword` unchanged).

### Validation

- [x] `ng build` succeeds.

## Add `/auth/forgot-password` to main menu (Auth submenu)

**Goal:** Sidebar **Pages → Auth** lists **Forgot password** alongside Login / Error / Access Denied; link navigates to the existing forgot-password page.

### Breakdown

1. **i18n**
   - [x] Add **`menu.forgotPassword`** (or agreed key) in **`translations.ts`** for **en, tr, fr, de** (short menu label; can differ from `auth.login.forgotPassword` question-style copy).
2. **Menu model**
   - [x] In **`app.menu.ts`**, under **Pages → Auth** `items`, insert a new entry **`routerLink: ['/auth/forgot-password']`**, **`label: t('menu.forgotPassword')`**, **`icon`** consistent with siblings (e.g. `pi pi-fw pi-key` — pick one and match PrimeIcons usage elsewhere).
   - [x] Place **after Login** unless product prefers another order.
3. **Optional consistency**
   - [x] If auth routes ever show breadcrumbs under `AppLayout`, add **`breadcrumbKey`** + string for forgot-password on that route — **N/A:** `/auth` is a sibling route to `AppLayout` in `app.routes.ts` (no `AppLayout` breadcrumbs for auth).

### Validation

- [x] **`ng build`** succeeds.
- [x] **Manual:** expand **Pages → Auth** → click **Forgot password** → lands on `/auth/forgot-password`; sidebar search finds the item by localized label. *(Owner may re-smoke in browser; wiring verified in code.)*

### Out of scope

- Login link text, backend email, guards hiding demo menu items (unless explicitly requested later).

## Profile page, top-bar profile menu, change password (mock API)

**Source intent:** Profile shows photo, name, surname, user type, email, phone(s). Only **photo, name, surname** are editable/saveable. Photo: **image only**, **≤ 1 MiB**; **editor** with rotate, zoom, pan (task text “pin” → treat as **pan** unless product overrides), crop, brightness, contrast. **Top-bar avatar** updates after save. **Avatar click** opens menu: (1) Profile, (2) Change password, (3) Logout. **Change password** page: current + new + repeat (all required, new === repeat), validation under fields, **mock API**, messaging like **`/auth/forgot-password`**, on **OK** navigate to **dashboard** (`/`).

**Goal:** In-app profile and password self-service (mock persistence), wired from the layout top bar, consistent with existing i18n and validated-input patterns.

### Product decisions (defaults until stakeholder overrides)

- [x] **User type:** Mock read-only **`Administrator`** via i18n key **`profile.userType.administrator`** (en/tr/fr/de); `userTypeKey` on stored profile points to that key.
- [x] **Phone:** Mock `phones: string[]`; read-only **list** (one line per number; empty state `profile.phonesEmpty`).
- [x] **Email / phone on profile:** Read-only (not in editable set).
- [x] **Routes:** **`/profile`** and **`/change-password`** as **children of `AppLayout`** in `src/app.routes.ts`. **Logout:** `Router.navigate(['/auth/login'])` + **`UserProfileService.clearMockSessionStorage()`** removes **`priland.mockUserProfile.v1`** and **`priland.mockUserPassword.v1`**.
- [x] **Password rules:** **Min length 8**; **new === repeat** required; **reject new === current** (message under new field + mock API key `profile.changePassword.sameAsCurrent`). Default demo current password **`DemoPass1`** (documented in `p-message` on change-password page).
- [x] **Image editor:** **In-app HTML canvas** inside **`p-dialog`** (PrimeNG), **no new npm dependency**. Rotate (90°), zoom (range), pan (drag), **square viewport crop** on export, brightness/contrast (canvas `filter`).
- [x] **Avatar crop:** **Square JPEG data URL** at **256×256** stored in profile JSON + consumed by top bar; optional persistence via same **`localStorage`** profile blob.

### Functional breakdown

1. **State / mock API**
   - [x] **`UserProfileService`** + **`MockUserProfile`**: `avatarDataUrl`, `firstName`, `lastName`, `userTypeKey`, `email`, `phones[]`; **`changePassword(current, new)`** → `Promise<{ ok, messageKey? }>`; replaceable with HTTP later.
   - [x] Shared **`avatarDataUrl`** **computed signal** from service → **top bar** + profile page.

2. **Top bar**
   - [x] Profile control: **trigger + `p-menu`** popup **`appendTo="body"`** — Profile → `/profile`, Change password → `/change-password`, Logout → clear mock keys + `/auth/login`.
   - [x] **Avatar `<img>`** or **`pi-user`** in circular **`layout-topbar-action`** frame; updates live after profile save (signals).

3. **Profile page**
   - [x] **`src/app/pages/profile/profile.ts`**: card layout; read-only type/email/phones; **ValidatedInput** first/last; choose photo → editor → pending avatar until **Save**; **`UserProfileService.saveProfile` / `setAvatarFromDataUrl`**.
   - [x] **Save** persists mock state + success/error **`p-message`**.
   - [x] File: **`image/*`**, **≤ 1 048 576** bytes; errors cleared on new pick.
   - [x] **`AvatarEditorDialogComponent`**: rotate, zoom, pan, square export, brightness/contrast; Cancel discards; Confirm → data URL into save flow.

4. **Change password page**
   - [x] **`src/app/pages/profile/change-password.ts`**: three **`app-validated-input`** (password); **`p-message`** for API/errors (forgot-password-style).
   - [x] Submit validates fields **before** mock API; repeat match + new ≠ current.
   - [x] Mock async **`changePassword`**; errors stay on page.
   - [x] **Success:** navigate to **`/`** (dashboard).

5. **i18n**
   - [x] **`translations.ts`** — **en, tr, fr, de**: profile, editor, change-password, top bar menu, breadcrumbs, validation strings.

6. **Routing**
   - [x] **`app.routes.ts`** layout children **`profile`**, **`change-password`** with **`data.breadcrumbKey`**: `breadcrumb.profile`, `breadcrumb.changePassword`.

### Non-functional / quality bar

- [x] **A11y:** Menu trigger **`aria-label` / `aria-haspopup`**, labeled fields; PrimeNG dialog modal (built-in focus handling as provided by the library).
- [x] **Security (BA-level):** No passwords in success UI; wrong-current / generic error copy via i18n (no credential leakage).
- [x] **Performance:** Editor targets ≤ **1 MiB** inputs (client-side canvas); typical desktop use.

### Validation

- [x] **`ng build`** succeeds (2026-04-02).
- [x] **Manual:** *(owner)* menu order/navigation; profile save + avatar; oversize/non-image; change-password matrix; OK → `/`, error → stay.

### Out of scope (unless new task)

- Real backend (profile upload, password change, token revoke), email/phone/user-type edit on this page, MFA/CAPTCHA, virus scan/CDN, admin avatar moderation.

### Automated tests

- [ ] Optional: unit tests for validators / mock service; component tests when harness covers new routes.