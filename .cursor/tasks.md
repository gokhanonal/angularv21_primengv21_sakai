## Station Management grid: auto column sizing on first load, resizable columns, skeleton loading

### Source intent

> Make grid in station-management page, column auto resize when page load first. And column resize feature. Also, Skeleton component can be used as a placeholder during the loading process.

### Goal

Improve the Station Management list (`/station-management`, `station-management-list.ts`) so that:

1. On the **first successful paint after data is available**, column widths better reflect content (within technical limits of a scrollable PrimeNG table).
2. Users can **manually adjust column widths** (drag) where product rules allow.
3. While data is loading, the UI shows a **skeleton** that more clearly represents the table (still using PrimeNG `Skeleton`).

### Product decisions (defaults until stakeholders override)

| Topic | Default |
|--------|--------|
| **"Auto resize on first load"** | Run **once per successful data load** for the current grid configuration (visible columns + order + current language), using **current page rows** (e.g. first page after load) to compute widths, clamped to each column's **min** and a reasonable **max**. |
| **Resize mode (PrimeNG)** | **`fit`** — total table width in the scroll region stays constrained; neighbor column absorbs width change (avoids unbounded horizontal growth in scrollable layouts). |
| **Which columns are user-resizable** | **Scrollable data columns only** (the dynamic `@for (col of columns)` headers). **Not** the selection checkbox column, **not** frozen station code / name, **not** frozen actions — reduces risk with `pFrozenColumn` + resize. |
| **Persistence of manual widths** | **None in v1** (session-only; reset on full navigation refresh). Optional follow-up: `localStorage` keyed by user + column keys. |
| **Skeleton fidelity** | **Medium**: skeleton row(s) with **one bar per visible logical column** (frozen + scrollable + actions), approximate header height + 5–8 body rows, **same scroll height** as live table (`480px` area) so layout does not jump. |
| **Interaction with column picker** | When visible columns change, **re-run first-load auto-sizing** for the new set (or reset to min widths then auto-size — product should pick one; default: **re-run auto-size** when column set changes). |
| **Interaction with reorder** | Reorder **does not reset** widths by default; column width is tied to **column identity (field)**, not visual position. |
| **i18n** | Any new UI strings (e.g. resize affordance aria, empty loading copy) use **`I18nService` / `TranslatePipe`** for en/tr/fr/de. |

### Functional requirements

1. **FR-1 — First-load column width adjustment**
   After the initial JSON load completes and the table is shown, the system shall compute column widths for **scrollable data columns** so that typical cell/header content is **not unnecessarily clipped**, subject to min/max and scrollable-table constraints.

2. **FR-2 — Minimum widths respected**
   Auto-calculated widths shall **never go below** existing `min-width` values defined for each column (e.g. `scrollableColumns[].minWidth` and frozen column styles).

3. **FR-3 — User column resize**
   The table shall expose PrimeNG **column resize** for **scrollable data column headers** (`[resizableColumns]="true"`, `pResizableColumn` on applicable `<th>`), with **`columnResizeMode`** set per product default (`fit` unless changed).

4. **FR-4 — Resize discoverability and accessibility**
   Resize handles shall be usable with pointer; if PrimeNG exposes keyboard/ARIA patterns, they shall not be regressed. Any new custom controls shall have **translated** labels where required by WCAG patterns.

5. **FR-5 — Loading skeleton**
   While `loading()` is true, the page shall show **`p-skeleton`** placeholder(s) that **mimic the table grid** (caption/toolbar area + column-aligned skeleton "cells"), instead of only two undifferentiated blocks.

6. **FR-6 — No functional regression**
   Existing behaviors shall remain: multi-sort, per-column filters, global search, column picker, export (CSV/HTML/Excel), selection clearing on sort/filter, pagination, frozen columns, reorder of scrollable columns, error + retry path.

7. **FR-7 — Performance**
   Auto-sizing shall complete within acceptable time for **typical page sizes** (e.g. ≤10 rows per page default) without locking the UI; if measurement requires DOM reads, batch after render (e.g. `requestAnimationFrame` / `afterNextRender`) and avoid repeated work on unrelated events.

### Acceptance criteria

**A. First-load auto sizing**

- [x] On first visit to `/station-management` with a normal dataset, **scrollable data columns** show widths that **reduce obvious clipping** of typical values (addresses, names, codes) compared to fixed min-only layout, without breaking horizontal scroll.
- [x] **Min-width** rules from column definitions are **never violated**.
- [x] Auto-sizing runs **after data is loaded** and the table replaces the skeleton (not during skeleton-only state).
- [x] Changing **language** (header text length changes) updates layout appropriately on **next load or explicit refresh** (define: default = on **reload** of data or page refresh; document if live language switch must re-trigger).

**B. User resize**

- [x] User can **drag** the boundary between **adjacent scrollable data columns** to change width.
- [x] With default **`fit`** mode, resizing **does not** cause the table to grow without bound inside the scroll container (behavior matches PrimeNG `fit` semantics).
- [x] Frozen **selection**, **station code**, **station name**, and **actions** columns **do not** expose resize handles (per default product decision).
- [x] Resize **coexists** with **column reorder** (reorder still works; widths stay with column field).

**C. Skeleton**

- [x] While loading, skeleton layout **approximates** the final table: toolbar/caption strip + **grid of skeleton bars** aligned to **visible** columns (including frozen columns count).
- [x] Skeleton container height is **visually consistent** with the loaded table area (no large vertical jump when swapping skeleton → table).
- [x] On **load error**, current behavior is preserved (error message + retry; **no** misleading full-grid skeleton).

**D. Regression / integration**

- [x] **Export** still produces correct data; column widths in UI **do not** corrupt exported values.
- [x] **Column picker**: hiding/showing columns updates the grid and skeleton column count; **no** runtime errors.
- [x] **Clear filters** still clears global search when that control exists (per project Angular grid rule).
- [x] `ng build` succeeds; **manual** smoke on Chrome (and one secondary browser if the team routinely tests Safari).

### Edge cases and negative scenarios

| Scenario | Expected / note |
|----------|------------------|
| **Empty dataset (0 rows)** | Auto-size falls back to **header-based** width or **min-width**; no crash; table still usable. |
| **Very long single cell (e.g. address)** | Width respects **max clamp**; cell uses existing wrapping/ellipsis patterns if any; horizontal scroll still available. |
| **Company column with logo** | Auto-size must not assume text-only; **logo + text** may need a **minimum width floor** or skip measuring image intrinsic size if unreliable. |
| **Narrow viewport / mobile** | Scrollable table still scrolls horizontally; resize handles remain usable or degrade gracefully (no overlapping frozen columns). |
| **Frozen + scrollable boundary** | Resizing only **between scrollable** columns avoids known PrimeNG friction at frozen edges (default excludes frozen columns from resize). |
| **Pagination** | Auto-size based on **visible page** may mis-size for rows on other pages; default is acceptable; optional future: sample all rows (performance trade-off). |
| **Filter reduces visible rows to one short row** | Widths may shrink; acceptable unless product specifies "max of page or sample"; document choice. |
| **Reorder then resize** | Width follows **field**, not index; verify PrimeNG internal column order matches `scrollableColumns` mutation. |
| **Rapid language switch** | If no reload, headers may clip until re-auto-size; default acceptable or trigger re-measure on lang change (open question). |
| **Virtual scroll** | N/A unless enabled later; any future virtual scroll changes auto-size assumptions. |

### Out of scope

- Persisting column widths across sessions or devices (unless promoted from open questions).
- Auto-resizing **on every** sort, filter, or pagination change (unless explicitly requested later).
- Resizing **frozen** columns.
- Replacing `p-table` with another grid.
- Backend/API changes for column metadata or layout.
- Changing export **format** or column **order** rules beyond what exists today.

### Open questions (suggested defaults)

1. **Blocking — Definition of "auto resize on first load"**
   Is it **(a)** width from **first page only**, **(b)** sample across **all loaded rows** in memory, or **(c)** fit to **header text only**?
   *Default: (a) first visible page after load, with min/max clamps.*

2. **Blocking — Max width per column**
   What **max** (px/rem) per column type (text vs status tag vs logo)?
   *Default: global max e.g. `24rem` for text columns, tighter for tags/booleans.*

3. **Nice-to-know — Language change**
   Should i18n language switch **immediately re-run** auto-size without refetch?
   *Default: re-run on **next data reload** only.*

4. **Nice-to-know — Resize persistence**
   Should manual widths persist in **localStorage**?
   *Default: **no** for v1.*

5. **Nice-to-know — `expand` vs `fit`**
   Stakeholders may prefer **`expand`** for easier reading on wide monitors.
   *Default: **`fit`**; switch only if product accepts wider scroll width.*

6. **Nice-to-know — Skeleton row count**
   Fixed **6** skeleton rows vs match **rows-per-page** option?
   *Default: fixed **6** or **8** for stability; optional match `rows` if trivial.*

### Risks

| Risk | Mitigation |
|------|------------|
| **PrimeNG scrollable tables** use flex-like layouts; **true "table-layout: auto"** behavior may be limited. | Prototype auto-size early; fall back to **calculated width style** on `<th>/<td>` for scrollable section only. |
| **`resizableColumns` + `pFrozenColumn` + `pReorderableColumn`** combination may have **version-specific bugs**. | Verify on **PrimeNG 21** with frozen excluded from resize; add visual QA checklist; pin/workaround if upstream issue. |
| **Auto-size + dynamic `[columns]`** may desync if `scrollableColumns` is mutated in place. | Keep **single source of truth** for column defs; run measure after `scrollableColumns` is stable. |
| **Performance** if measuring many cells. | Limit to visible rows/columns; run once per load + column set change. |

### Validation

- **Build:** `ng build` (project's standard production or CI build target).
- **Manual:** Load `/station-management` (success path, empty list, error path); toggle column visibility; reorder columns; resize scrollable columns; change page size; export; narrow browser width; switch language if applicable.

### Implementation breakdown

Suggested order: **(a) skeleton** (isolated UX), **(c) user resize** (PrimeNG wiring + boundaries with frozen/reorder), **(b) auto-sizing** (runs after stable column model; interacts with min widths and optional post-resize state). **(d)** after feature work.

- [x] **(a) Skeleton loading improvement (FR-5)** — Replace the two plain `p-skeleton` blocks with a medium-fidelity placeholder: caption/toolbar strip + skeleton “grid” with one bar per visible logical column (frozen + scrollable + actions), ~5–8 body rows, scroll area height aligned with the live table (~`480px`) to limit layout jump. Preserve error + retry: no full-table skeleton on load failure. Align skeleton column count with visible columns when derivable.

- [x] **(b) First-load column auto-sizing (FR-1, FR-2, FR-7)** — After initial data load and when the table (not skeleton) is shown, compute widths for **scrollable data columns** from the **current page** rows, clamped to per-column **min** and product **max**; never below `minWidth` from definitions. Batch DOM reads after render (`requestAnimationFrame` / `afterNextRender`). On **empty** dataset, fall back to header-based width or min. When the **column picker** changes the visible set, **re-run** auto-sizing for the new configuration. Document default for **language change** (re-run on next data reload unless product decides otherwise).

- [x] **(c) User-driven column resize (FR-3, FR-4)** — Enable PrimeNG column resize on **scrollable dynamic columns only**: `[resizableColumns]="true"`, `columnResizeMode="fit"`, `pResizableColumn` on applicable `<th>` in the scrollable section; **exclude** selection, frozen station code/name, and frozen actions. Ensure coexistence with **column reorder** (width follows **column field / identity**). Add or wire **translated** aria/labels if custom controls are introduced (`translations.ts` en/tr/fr/de).

- [x] **(d) Tests, build, and regression smoke (FR-6)** — Add or extend **unit tests** for any new sizing/helpers (where meaningful without over-mocking). Run **`ng build`**. Manually verify: export, filters, global search + clear-filter rule, pagination, frozen columns, multi-sort, column picker, resize + reorder, narrow viewport; no new linter issues in touched files.

## Bug-fix: Auto resize is not working well for columns whose header is longer than the data

### Summary (BA)

**Problem:** After first-load auto-sizing, some scrollable columns remain too narrow to show the **full header row** (header label + sort + filter affordances) when the **translated header text is longer** than the **cell text** sampled from the current page.

**Desired outcome:** For every auto-sized scrollable column, the computed width is sufficient that the header label and standard header controls are **not routinely clipped** (within the same min/max and scroll constraints as the original feature), especially when header-driven width exceeds cell-driven width.

**Assumptions:** Header row continues to include sort icon and column filter control; auto-size still uses canvas/DOM text measurement + fixed extras (not full header DOM measurement); max width clamp remains in force.

### Root cause hypothesis (behavior-level, not implementation)

1. **Under-estimated header chrome:** The fixed allowance for sort + filter + padding (`headerExtraPx`) may be **smaller than the real horizontal space** those controls consume in PrimeNG + theme, so when the **dominant width driver is the header string** (because cells are short), the total is still too tight.
2. **Typography mismatch:** Header uses a **semi-bold** face in measurement while actual rendering may include **letter-spacing, subpixel rounding, or theme font stack differences**, so measured header text width can be **slightly below** painted width.
3. **Dominance of the wrong branch (verify in QA):** The algorithm intends to take the **maximum** of header-based and cell-based estimates; if any column or code path **omits** the header term or uses a **stale/shorter** header string, long headers would lose. (Stakeholders treat this as a **hypothesis to confirm** during fix verification.)

### When it manifests

| Factor | Likelihood / note |
|--------|-------------------|
| **Column type** | Strongest on columns with **short cell values** (booleans, short codes, compact tags) but **long or verbose header labels**. |
| **i18n** | **Non-English** locales (tr/fr/de) or future strings where **header translation is longer** than English; same for any renamed headers. |
| **Data pattern** | First page rows with **uniformly short** text for that field (e.g. empty, "—", single digit) while header stays long. |
| **Layout** | Narrow viewports hit **max width clamp** sooner — header may still clip if max is below true header need (product: accept scroll vs raise max for text columns). |

### Functional requirements (bug scope)

- **BFR-1:** Auto-sized width for each scrollable data column shall be **at least** the width required to display the **full header cell content** as rendered in the app (label + sort + filter + consistent internal padding), **or** a documented safe minimum that matches measured/DOM reality after the fix.
- **BFR-2:** When **header-derived need** exceeds **cell-derived need**, the chosen width shall **not** default to a value that clips the header (subject to global max and horizontal scroll behavior).
- **BFR-3:** Existing rules remain: **respect `minWidth`**, **respect global max clamp**, **no regression** to cell readability for long cell text, **re-run** behavior when column set changes (per parent FR-1).
- **BFR-4:** **Empty first page / no cell text:** width shall still satisfy header + controls (aligns with parent edge case: header-based or min fallback).

### Non-functional (bug scope)

- **Performance:** Any additional measurement (e.g. header DOM probe) stays **bounded** (once per auto-size pass, same column count as today).
- **Accessibility:** No reduction in sort/filter **hit targets** or focus visibility; widths must not squeeze controls below usable size.
- **i18n:** Fix must **not** assume English string lengths; verify at least **one long-header locale** in QA.

### Edge cases and negative scenarios (bug-specific)

| Scenario | Expected after fix |
|----------|-------------------|
| Header very long, **hits max clamp** | Column width = max; **horizontal scroll** still available; header may use wrapping/ellipsis **only if** product already defines that for headers (otherwise prefer raising max for text columns — **open question**). |
| **Zoom** ≠ 100% | Widths remain acceptable or degrade **no worse than** comparable PrimeNG columns without auto-size. |
| **RTL** (if enabled later) | Header chrome order may change; ensure allowance still covers **icons + label** combined width. |
| **Column temporarily hidden then shown** | Re-auto-size path still applies **header-complete** width for newly visible columns. |
| **companyName / statusCategory floors** | Existing special floors must **not** shrink** header-needed width below** what BFR-1 requires. |

### Acceptance criteria (bug)

- [x] For a column where **header text (any supported locale) is clearly longer** than sampled cell text on the first page, the **header label is fully readable** without clipping (no systematic truncation of the title text in the header cell).
- [x] **Sort icon** and **column filter** control remain **visible and not overlapping** the header text in standard Chrome viewport at 100% zoom.
- [x] **Short-cell columns** (e.g. boolean, short codes) with **long headers** pass the same checks.
- [x] **Long cell text** columns still respect **max clamp** and scroll; no regression vs pre-fix behavior for address/name-style columns.
- [x] **Empty table (0 rows):** headers for visible scrollable columns still meet BFR-1 / header readability.
- [x] **Unit tests** for width helper updated or added so **header-longer-than-cells** cases expect width **≥** header-based floor (including revised chrome allowance if encoded as constants).

### Open questions (stakeholders / product)

1. **Blocking — Header overflow when above max width:** If header + chrome would exceed **per-column max**, should we **increase max** for text columns, **allow header wrap**, or **accept ellipsis**? *(Default for BA doc: preserve current max unless product extends it; document visual result.)*
2. **Blocking — Truth source for “wide enough”:** Is **canvas measurement + calibrated padding** acceptable, or is **post-render DOM measurement of the header cell** required as the definition of done?
3. **Nice-to-know — Language switch without reload:** Should auto-size **re-run** when only `TranslateService` language changes (parent backlog had this as nice-to-know)?

### Out of scope (this bug-fix)

- Changing **copy** of headers solely to shorten text (unless content team drives it).
- **Persisted** manual widths or new resize modes.
- **Frozen** column header clipping (unless the same root cause is proven shared — then note in PR).

### Handoff to engineering

- Validate whether **`Math.max(header, cells)`** is applied for **all** scrollable columns in production paths; then tune **`headerExtraPx`** and/or **measure header with DOM**, and add a **fixture case**: long header string + single-character cell samples.
- Reconcile **HEADER_FONT** with **computed styles** if systematic under-measurement remains.

### Validation (bug)

- Manual: `/station-management`, identify columns with **long i18n headers** and **short** first-page values; repeat for **en + one other locale**.
- Automated: extend `station-management-column-autosize.spec.ts` (or equivalent) with **header longer than all cell samples** expectations.

## Grid state persistence to localStorage (reusable)

### Source intent

> On `/station-management`, the grid state must be stored to localStorage with page and grid name. The features to be stored are: Visible Columns, Column widths, Column orders, Sort state. Must be a reusable pattern for all grids (existing and future).

### Goal

Create a **reusable grid state persistence service** under `src/app/core/` that saves and restores table preferences to `localStorage`, keyed by **page + grid name**. Integrate it first with the station-management grid, and design it so other grids (dashboard-stations, locations, crud, future grids) can adopt it with minimal wiring.

### What gets persisted

| State | Key in stored object | Type | Source in station-management |
|-------|---------------------|------|------------------------------|
| Visible columns | `visibleColumns` | `string[]` | `visibleDataColumnKeys` |
| Column order | `columnOrder` | `string[]` | `dataColumnOrder` |
| Column widths | `columnWidths` | `Record<string, string>` (field → CSS width) | DOM `<th>` style widths after user resize or auto-size |
| Sort state | `sortState` | `SortMeta[]` (PrimeNG `multiSortMeta`) | `Table.multiSortMeta` |

### Behavior

1. **Auto-save**: Whenever the user changes visible columns, reorders columns, resizes a column, or sorts — the current state is saved to `localStorage` immediately (debounced if needed for resize).
2. **Auto-restore**: When navigating to `/station-management` (or any wired grid), the service reads stored state and applies it **before** the table renders with data. If no stored state exists, use component defaults.
3. **Reset button**: A "Reset Grid" icon button (`pi pi-undo` or similar) is placed in the toolbar **before the download button** (right side, next to search). Clicking it clears the stored state for that grid and resets all persisted properties to their defaults. Translated tooltip in en/tr/fr/de.
4. **localStorage key pattern**: `grid.<pageName>.<gridName>` (e.g. `grid.station-management.main`).
5. **SSR safety**: Guard all `localStorage` access with `typeof localStorage !== 'undefined'` or `isPlatformBrowser` (matches existing patterns in i18n and layout services).

### Functional requirements

1. **FR-1 — Reusable grid state service**
   Create an injectable service (e.g. `GridStateService`) under `src/app/core/grid/` that provides: `save(key, state)`, `load(key): state | null`, `clear(key)`. The state interface covers all four properties above. The service is framework-agnostic (no PrimeNG dependency) — it stores/retrieves plain data.

2. **FR-2 — Station-management integration**
   Wire `GridStateService` into `StationManagementList`:
   - On `ngOnInit`, load stored state; if present, apply `visibleDataColumnKeys`, `dataColumnOrder`, and `multiSortMeta` before data load. Column widths are applied after first render (post auto-size, stored widths override auto-sized widths).
   - On each state-changing user action (column visibility change, reorder, resize, sort), save current state.

3. **FR-3 — Column width capture and restore**
   After user resize or auto-size, read column widths from the DOM (`<th>` style values) for scrollable columns and include them in the saved state. On restore, apply saved widths to the table DOM after render (same timing as auto-size).

4. **FR-4 — Sort state persistence**
   Bind `[(multiSortMeta)]` on the `p-table` to a component property. Save it on `(onSort)`. Restore from stored state on init.

5. **FR-5 — Reset grid button**
   Add a button in the right-side toolbar area (before the download button) with:
   - Icon: `pi pi-refresh` or `pi pi-undo` (use `pi pi-undo` to differentiate from the existing Refresh button which reloads data)
   - Style: `[text]="true"` `[rounded]="true"` (matches download button style)
   - Tooltip: translated "Reset Grid" / "Izgarayı Sıfırla" / "Réinitialiser la grille" / "Raster zurücksetzen"
   - Action: calls `GridStateService.clear(key)`, resets component properties to defaults, clears sort on table, triggers `rebuildScrollableColumns()` and auto-size.

6. **FR-6 — No regression**
   All existing behaviors remain: export, filters, global search, column picker, skeleton, auto-size on first load, error/retry path.

### Edge cases

| Scenario | Expected |
|----------|----------|
| **Stored state references a column key that no longer exists** (e.g. column removed in code update) | Ignore unknown keys; use defaults for missing columns. |
| **localStorage is unavailable** (private browsing, quota exceeded) | Graceful fallback — grid works with defaults, no errors thrown. |
| **Empty stored state** | Treat as no state; use defaults. |
| **User clears browser storage externally** | Grid loads with defaults on next visit — no crash. |
| **Sort on a column that is hidden in restored state** | Remove sort entries for hidden columns during restore. |
| **Stored widths don't match current column set** | Apply widths only for columns present in both stored and current visible sets; others use auto-size/min. |

### Out of scope

- Server-side persistence of grid state (user preferences API).
- Filter state persistence (only sort, columns, widths, and order).
- Persisting pagination (current page, rows per page).
- Integrating other grids beyond station-management in this task (service is reusable, but wiring other grids is a follow-up).

### Implementation breakdown

- [x] **(a) Create `GridStateService`** — New injectable service under `src/app/core/grid/`. Define `GridState` interface (`visibleColumns`, `columnOrder`, `columnWidths`, `sortState`). Implement `save(key, state)`, `load(key)`, `clear(key)` with `localStorage`. Add SSR guard. Key format: `grid.<pageName>.<gridName>`.

- [x] **(b) Integrate state restore into station-management-list** — On `ngOnInit`, call `GridStateService.load()`. If state exists: set `visibleDataColumnKeys`, `dataColumnOrder`, bind `multiSortMeta`. For column widths, apply after first render (post auto-size pass). If stored columns reference unknown keys, filter them out. If sort references hidden columns, filter those entries out.

- [x] **(c) Integrate state save into station-management-list** — Save state on: `onVisibleDataColumnsChange`, `onColReorder`, column resize (hook PrimeNG `(onColResize)` event), `(onSort)`. For column widths, read current DOM widths of scrollable `<th>` elements. Debounce saves if resize fires rapidly.

- [x] **(d) Add Reset Grid button** — Place a `p-button` (icon `pi pi-undo`, text+rounded style, translated tooltip) in the right-side toolbar div, before the download button. On click: `GridStateService.clear()`, reset `visibleDataColumnKeys` and `dataColumnOrder` to defaults, clear `multiSortMeta`, call `rebuildScrollableColumns()`, re-run auto-size. Add i18n keys for en/tr/fr/de.

- [x] **(e) Unit tests** — Test `GridStateService` (save/load/clear, SSR guard, corrupt data handling). Test restore logic (unknown columns filtered, sort entries for hidden columns removed). Test reset clears stored state and resets component properties.

- [x] **(f) Build verification and regression smoke** — `ng build` succeeds. Manual: persist columns + order + sort + widths → navigate away → come back → state restored. Reset button clears everything. Export still works. Column picker still works. No lint errors.

## Bug-fix: /station-management — global full-text search does not match Station Code

### Summary (BA)

**Problem:** The grid’s global search box calls `table.filterGlobal(value, 'contains')`, but rows are **not** filtered when the user types a **Station Code** value.

**Expected:** Typing text that appears in the frozen **Station Code** column (`stationInfoId`) narrows the table to matching rows, consistent with other always-visible columns (e.g. Station Name).

**Actual:** Station Code is never considered by global search because `stationInfoId` is omitted from `[globalFilterFields]`.

**Assumption:** PrimeNG `contains` matching on this field behaves like other string-backed columns (partial match, case sensitivity per PrimeNG defaults).

### Root cause

`globalFilterFieldsForTable` returns `['name', ...optional]` where `optional` only includes scrollable, column-picker-driven fields (`address`, `phone`, `cityName`, etc.). The frozen **Station Code** column uses field `stationInfoId`, which is **not** in the fixed or optional lists — so global search never targets it, even though the column is always visible.

### Functional requirements (bug scope)

- **BFR-1:** `stationInfoId` shall be included in the array returned by `globalFilterFieldsForTable` **unconditionally** (frozen, always visible — same rationale as `name`).
- **BFR-2:** No change to column picker logic, per-column filters, or other `globalFilterFields` entries beyond adding `stationInfoId` unless a regression is found.

### Acceptance criteria

- [x] On `/station-management`, entering a substring that matches a row’s **Station Code** in the global search box **shows only** rows whose `stationInfoId` matches per PrimeNG `contains` behavior.
- [x] Global search still works for **Station Name** and existing optional columns as today.
- [x] **Clear filter** / clear-search behavior (if applicable) remains unchanged per project grid rules.

### Implementation breakdown

- [x] **Add `stationInfoId` to global filter fields** — In `station-management-list` (or equivalent), extend `globalFilterFieldsForTable` so the returned array includes `'stationInfoId'` alongside `'name'` (e.g. fixed prefix: `['stationInfoId', 'name', ...optional]` or equivalent order acceptable to UX; document if order affects PrimeNG behavior).

### Edge cases and negative scenarios

| Scenario | Expected |
|----------|----------|
| **Partial code** | User types a prefix/substring; `contains` matches as for other string fields. |
| **Numeric codes as strings** | Values stored/displayed as strings still filter correctly; leading zeros / formatting match stored model. |
| **No match** | Table shows empty body (or PrimeNG empty state) — same as other global search misses. |
| **Special characters in code** | No crash; match behavior follows PrimeNG filter for that field type. |

### Out of scope (this bug-fix)

- Changing global search semantics (`contains` vs `startsWith`) for other columns.
- Backend or API changes.
- New columns, export, or column picker behavior beyond what is required to include `stationInfoId` in `globalFilterFields`.

### Validation

- Manual: `/station-management` — global search by full and partial Station Code; regression spot-check on name + one optional column.
- Optional: unit test on `globalFilterFieldsForTable` composition if the project tests such getters.


## For all cards, add window-maximize and window-minimize button and feature

### Summary

**Feature:** Add a **maximize / restore** toggle on Sakai-style card containers (`<div class="card">`) so users can expand a card to **full-viewport focus mode** (fixed overlay with backdrop) and return it to normal inline layout. This is **not** OS-style “minimize to taskbar” or accordion collapse — “minimize” in the UI means **exit maximize** (restore).

**Context:** Cards are plain theme divs (not PrimeNG `p-card`), with heterogeneous markup (structured `card-header` / `card-actions`, or simple title rows). Coverage target is **all** such cards app-wide, implemented via a **reusable Angular directive** to avoid per-component duplication.

**Assumptions:** PrimeNG icons `pi pi-window-maximize` and `pi pi-window-minimize` are used for the toggle; existing Sakai `_utils.scss` card styles remain the base; i18n follows `I18nService` / `TranslatePipe` for en/tr/fr/de where new strings are added.

### Product decisions (defaults until stakeholders override)

| Topic | Default |
|--------|--------|
| **“Maximize” behavior** | Card expands to fill the **full viewport** as a **fixed overlay** (`position: fixed`, inset 0 or safe-area-aware margins), **z-index above** sidebar and topbar, with a **semi-opaque backdrop** behind the card to dim the shell. |
| **“Minimize” / restore** | Same control **toggles** state: from maximized, user returns to **normal inline** card layout (not a separate “minimize to strip” metaphor). Icon switches: **maximize** when normal, **minimize** (or **restore**) when maximized — align tooltip/aria with “Expand” / “Restore” if copy differs from icon name. |
| **Button placement** | **Top-right** of the card chrome, **icon-only** `p-button` (e.g. `text` + `rounded`), using `pi-window-maximize` / `pi-window-minimize` per state. |
| **Which cards** | **All** production `<div class="card">` instances. Prefer **one reusable directive** (e.g. `appCardMaximize`) applied to each card root (or a single host registration pattern if the team chooses auto-apply via a wrapper — default: **explicit attribute on each card root** for clarity, or document `hostDirectives` if used). |
| **Animation** | **Optional** short CSS transition (opacity / scale / transform) for enter/exit; must not block interaction or exceed ~200–300ms unless product specifies otherwise. |
| **Scroll when maximized** | Card **body** (or maximized panel inner wrapper) uses **overflow auto** so tall tables, charts, and forms scroll inside the viewport without clipping. |
| **Keyboard** | **Escape** while maximized **restores** normal layout (and returns focus safely — e.g. to the toggle or card container). |
| **Stacking** | Only **one** maximized card at a time by default; opening maximize on another card **restores** the previous one first, or **blocks** second maximize — product default: **restore previous** when maximizing a new card (avoids z-index wars). |

### Functional requirements

1. **FR-1 — Reusable card maximize capability**  
   The system shall provide a **reusable Angular directive** (e.g. `CardMaximizeDirective` / selector `appCardMaximize`) attachable to any element that acts as a card root (typically `<div class="card">`), without requiring migration to `p-card`.

2. **FR-2 — Maximize behavior**  
   When the user activates maximize, the card shall occupy the **full viewport** in a **fixed overlay** with **backdrop**, **above** app chrome (sidebar, topbar), and shall remain **scrollable** if content overflows.

3. **FR-3 — Restore behavior**  
   When the user activates the control again (or equivalent restore action), the card shall return to its **original document position and size** in the page flow; no persisted “minimized to taskbar” state.

4. **FR-4 — Toggle control**  
   The directive shall render an **icon-only** toggle in the **top-right** of the card, with **visible states** for normal vs maximized (icons per product default), **accessible name** (aria-label / title) and **translated tooltips** where the app standard requires (en/tr/fr/de).

5. **FR-5 — Keyboard and focus**  
   While maximized, **Escape** shall restore the card; focus management shall not trap the user in an inaccessible state (no regression vs WCAG baseline for the shell).

### Non-functional requirements (BA level)

- **Performance:** Toggle shall not cause noticeable jank on typical dashboard pages; avoid forced synchronous layout where possible.
- **Accessibility:** Toggle must be keyboard-focusable and have a non-empty accessible name; maximized overlay should not break screen reader context more than other full-screen modals in the app (document any known limitation).
- **Compatibility:** Behavior must work on **narrow / mobile** viewports (full viewport still meaningful; touch targets meet existing button standards).
- **Regression:** No breakage to **PrimeNG overlays** (dialogs, menus, datepickers) that are opened **from inside** a card — z-index and stacking must be defined so overlays remain usable (see edge cases).

### Acceptance criteria

- [x] Every targeted **`<div class="card">`** exposes the **maximize/restore** control in the **top-right** (or documented exception list if any card is excluded by product).
- [x] **Maximize** fills the viewport as a **fixed overlay** with **backdrop** and **scrollable** inner content when needed.
- [x] **Restore** (toggle or equivalent) returns the card to **normal** inline layout.
- [x] **Escape** while maximized **restores** the card.
- [x] **No regression** on primary flows: station-management grid, dashboard widgets, locations/profile forms, dialogs/menus opened from card content (smoke checklist).
- [x] **`ng build`** succeeds; **i18n** keys added for tooltips/labels in **en/tr/fr/de** if user-visible strings are introduced.

### Implementation approach

- **Primary:** **`CardMaximizeDirective`** on the card root: injects or projects a **toggle button** into the **top-right** (e.g. absolutely positioned wrapper or prepend to `card-actions` when present — engineering to choose minimal DOM disruption).
- **State styling:** **CSS classes** on the card (or a wrapping host) for maximized mode: `position: fixed`, full viewport, high `z-index`, inner `overflow: auto`, backdrop element or `::backdrop` / sibling — match Sakai tokens where possible.
- **Events:** **HostListener** for `keydown.escape` when maximized; optional **click on backdrop** to restore (nice-to-know; default **off** unless product wants it — document in open questions).
- **Alternative considered:** **Wrapper component** `<app-card>...</app-card>` — heavier migration; **directive** is preferred for **existing markup**.

### Implementation breakdown

- [x] **(a)** Create **`CardMaximizeDirective`** with maximize/restore toggle logic, stacking rule (single maximized instance), and Escape handling.
- [x] **(b)** Add **global or scoped SCSS** for maximized state, backdrop, and optional transition; ensure **z-index** above layout shell and coordination with PrimeNG overlays.
- [x] **(c)** Apply directive to **`station-management-list`** card as **first integration** (pilot).
- [x] **(d)** Apply directive to **dashboard widgets** (stats, recent sales, revenue stream, bestselling, notifications, etc.).
- [x] **(e)** Apply directive to **remaining** pages: dashboard stations, locations, profile / change password, notifications, empty, documentation, and **UI kit demos** as required by “all cards” scope.
- [x] **(f)** Add **i18n** for tooltip / aria strings (**en/tr/fr/de**).
- [x] **(g)** **Unit tests** for directive (toggle state, Escape, stacking/default restore of previous card if implemented).
- [x] **(h)** **Build verification** and manual smoke (maximize/restore, scroll, dialog from card, mobile width).

### Edge cases and negative scenarios

| Scenario | Expected / note |
|----------|------------------|
| **Nested cards** | If a card contains inner `.card` blocks (unusual), **only the host** with the directive maximizes; inner cards do not double-overlay unless each has directive — **avoid nested maximize** or document exclusion. |
| **Multiple maximized cards** | Per product default: **only one** maximized at a time; second activation **restores** the first or directive **refuses** second maximize — pick one and test. |
| **Mobile / small viewport** | Full-screen overlay still usable; **scroll** works; toggle remains reachable (not hidden under fixed chrome). |
| **Card with no title/header** | Toggle still appears **top-right** of the card box (absolute positioning relative to card root). |
| **PrimeNG `Dialog` / `OverlayPanel` / `p-menu` from card** | Maximized card **z-index** must be **below** modal overlays **or** overlays portal to `body` and still appear **above** maximized card — **verify** stacking; no unreadable menus behind backdrop. |
| **Router navigation while maximized** | On route change, **restore** maximized state to avoid orphaned fixed elements (default). |
| **SSR / hydration** | Directive runs **browser-only**; no `document`/`window` access without platform guard if applicable. |

### Out of scope

- **Drag** or **user-resize** of the maximized panel edges.
- **Minimize to taskbar** / dock / tray or persistent “collapsed strip” outside the card.
- **Persisting** maximized state across reloads or sessions (`localStorage`).
- Replacing all cards with **`p-card`** or redesigning Sakai card markup globally beyond what the directive requires.

### Resolved questions

1. **Backdrop click** — **YES**: clicking the backdrop restores the card (in addition to toggle button + Escape).
2. **z-index contract** — Confirm with one **dialog opened from maximized card** scenario during implementation.
3. **UI kit / demo-only pages** — **YES**: all demo cards in UI kit are in scope.
4. **Animation** — **YES**: include a subtle CSS transition on expand/collapse.

### Validation

- **Build:** `ng build` (project standard).
- **Manual:** Maximize/restore on station-management + one dashboard widget + one form page; open **p-menu** / **dialog** from inside maximized card; **Escape**; narrow viewport; **two cards** with directive on same page (stacking rule).

## Bug-fix: Cards with `...` (ellipsis) menus render poorly — menu should anchor under the trigger

### Summary (BA)

**Problem:** After `appCardMaximize` was applied app-wide, dashboard widget cards that already expose a **top-right ellipsis** (`pi pi-ellipsis-v`) + `p-menu` no longer present a clean layout. The directive sets **`position: relative`** on the card host and injects a **maximize toggle** at **`position: absolute; top: 0.75rem; right: 0.75rem; z-index: 1`**, which **overlaps** the existing menu trigger. Users see a **visual collision**; the **popup menu may not appear correctly anchored** under the `...` button because the card’s new **stacking context** (`position: relative` on the host) can affect overlay positioning for menus that are not portaled to `body` (or when append-to behavior differs).

**Desired outcome:** The **ellipsis menu opens directly under** the `...` control (expected PrimeNG popup behavior), and the **maximize control does not cover or steal clicks** from card header actions. No regression to maximize/restore, Escape, or backdrop behavior.

**Assumptions:** Affected patterns include at least **bestsellingwidget**, **notificationswidget** (title row + `pButton` + `p-menu`), and **recentsaleswidget** (`card-header` / `card-actions`). Other cards with the same top-right action pattern are in scope for verification.

### Root cause (behavior-level)

1. **Spatial conflict:** The maximize toggle and the ellipsis button both target the **same corner** of the card; absolute positioning with **`right: 0.75rem`** places the toggle **on top of** or **beside** the menu trigger in a way that breaks the intended header layout.
2. **Stacking / containing block:** **`position: relative`** on the card establishes a **containing block** and stacking context for descendants; **`p-menu`** popup positioning relative to the trigger can be **offset or clipped** compared to pre-directive behavior, so the menu no longer appears **just under** the `...`.

### Functional requirements (bug scope)

- **BFR-1:** The **ellipsis** (or equivalent header action) control shall remain **fully visible, reachable, and clickable** without being covered by the maximize toggle.
- **BFR-2:** Activating the **menu** shall show the popup **anchored to the trigger** (under/near the `...` per PrimeNG defaults), not displaced by the card host’s layout or obscured behind the wrong layer.
- **BFR-3:** **Maximize** behavior (toggle, overlay, z-index vs dialogs, Escape, backdrop) shall **not regress** except where explicitly adjusted to satisfy BFR-1–BFR-2.

### Fix approach (engineering direction — ordered by practicality)

1. **Simplest practical fix (fast):** Increase horizontal offset of the maximize toggle so the **far-right** remains reserved for the menu — e.g. **`right: 3rem`** or **`right: 3.5rem`** (tune to theme button width + gap). Validate on **rounded text** buttons and **dense** headers.
2. **Better integration (preferred if simple CSS is insufficient):** When markup uses **`.card-header` / `.card-actions`** (or a detectable action cluster), **place the toggle to the left of** existing actions (or **inject the toggle into** the action row) so both controls share one **toolbar** row instead of two absolutes in one corner.
3. **Avoid** pushing the toggle **outside** the card padding as the default (fragile on small viewports); only consider if product accepts overflow.

### Non-functional (bug scope)

- **Accessibility:** Both controls keep distinct **focus targets** and **visible hit areas**; no accidental focus order traps.
- **Responsive:** At narrow widths, **no overlap** between maximize and `...` (or document acceptable wrap/stacking).

### Edge cases and negative scenarios

| Scenario | Expected |
|----------|----------|
| **Two+ header actions** (ellipsis + future icon) | Toggle leaves room for **all** actions in the corner or joins **card-actions** row. |
| **Card without** `...` | Toggle remains **top-right** with default **`right: 0.75rem`** if engineering implements **conditional offset** only when needed — or uniform offset if visually acceptable everywhere. |
| **`p-menu` with `appendTo="body"`** (if adopted) | Popup still aligns to trigger; verify **no** duplicate stacking issues with maximized overlay. |
| **Maximized card** | Menu from inside card still usable; **z-index** contract from parent feature remains satisfied. |

### Acceptance criteria

- [x] On **bestselling** and **notifications** widgets, the **`...`** is **not** covered by the maximize icon; both are usable.
- [x] Opening the menu positions the panel **under** (or immediately adjacent per theme to) the **`...`** trigger — **not** shifted to the wrong corner or clipped inside the card in a way that hides items.
- [x] **recentsaleswidget** (or any **`card-actions`** card) passes the same checks.
- [x] **Smoke:** Maximize/restore, **Escape**, backdrop click, and **one dialog/menu from maximized card** still behave per the card-maximize feature spec.
- [x] **`ng build`** succeeds; visual check at **~375px** width optional but recommended.

### Open questions

1. **Blocking — Uniform vs conditional offset:** Is a **global** `right: 3rem` (or similar) for **all** cards acceptable, or must **cards without** menus keep **`0.75rem`**? *(Product/UX: slight asymmetry on simple cards vs one rule for all.)*
2. **Nice-to-know — Portal target:** Should **`p-menu`** on these widgets use **`appendTo="body"`** (or project standard) to **decouple** popup positioning from the card’s containing block? *(Engineering trade-off vs markup churn.)*

### Out of scope (this bug-fix)

- Redesigning dashboard widget headers beyond **collision** and **menu anchor** fixes.
- Changing **menu model** items or business logic.
- New card-maximize features (keyboard shortcut, persistence).

### Handoff to engineering

- Inspect **`CardMaximizeDirective`** host styles (`position: relative`) and **`.card-maximize-toggle`** SCSS; prototype **`right` offset** and/or **DOM placement** next to **`.card-actions`**.
- Verify **`p-menu`** `popup` positioning on affected widgets (DevTools + maximized/normal states).
- Add or extend **unit/DOM tests** only if the project already tests directive layout; otherwise **manual QA checklist** above is the definition of done.

### Validation

- Manual: dashboard widgets listed above — open menu **before and after** maximize; narrow viewport spot-check.

## Card overlay controls: always top-right, `showWindowMaximize` + `showClose`

### Summary

**Problem:** The maximize/restore toggle is sometimes injected into `.card-actions` or otherwise participates in flex layout, which reserves space and ties placement to header patterns. Stakeholders want the control to behave like a **dialog chrome** control: **always** `position: absolute` at the **top-right** of the card host, **floating over** title and body (including when `.card-actions` is absent), with **no extra layout slot** reserved.

**Desired outcome:** `CardMaximizeDirective` exposes **`showWindowMaximize`** — when truthy, the maximize/minimize icon appears in that overlay corner; when falsy, no toggle is shown. A second flag **`showClose`** shows an **X** button in the same corner region. When both are true, **both** buttons appear **side by side** (outermost = product default, typically close rightmost to match dialogs). **Close** does not imply a single global behavior: the directive shall **emit an event** and let the parent hide/remove/navigate as needed.

**Assumptions:** Existing maximize behavior (fixed overlay, backdrop, Escape, single-instance stacking, router restore) stays unless this task explicitly changes it. ~31 card templates that use `appCardMaximize` will need binding updates for `showWindowMaximize` (default can be `true` for parity during migration, or `false` until opted in — **product choice**, see open questions).

### Functional requirements

1. **FR-1 — Placement (no `.card-actions` insertion)**  
   Maximize and close controls shall **not** be inserted as children of `.card-actions`. They shall be anchored to the **card host** with **`position: absolute`**, top-right, **`z-index`** above header/title content so they paint **over** the title bar and body. **No** additional width/height reserved in the document flow for these buttons (no flex gap solely for them).

2. **FR-2 — `showWindowMaximize`**  
   When **`showWindowMaximize` is true** (truthy), render the existing maximize/restore toggle. When **false**, do not render the toggle; maximize behavior is unavailable unless another API is added (out of scope).

3. **FR-3 — `showClose`**  
   When **`showClose` is true**, render an icon-only **close** control (e.g. `pi pi-times`) in the top-right overlay cluster. When **false**, do not render it.

4. **FR-4 — Both visible**  
   When both inputs are true, **both** controls are visible, **non-overlapping**, with consistent spacing (e.g. horizontal stack inset from the right edge). Order should match common dialog patterns unless UX specifies otherwise (**default: maximize to the left of close**, close flush right).

5. **FR-5 — Close semantics (default)**  
   Clicking **close** shall **`emit` a single event** (e.g. `close` / `closed` via `output()` or `@Output()`). The directive **does not** remove the host from the DOM or hide the card by default — **parent** decides (`*ngIf`, router, service, etc.). Document this in the directive’s public API.

6. **FR-6 — i18n**  
   New user-visible strings (close button `aria-label` / tooltip) shall use **`I18nService` / `TranslatePipe`** for **en/tr/fr/de**.

### Non-functional (BA level)

- **Accessibility:** Each overlay button is focusable, has a non-empty **accessible name**, and **tab order** remains predictable (typically close after maximize in DOM order if maximize is left of close).
- **Responsive:** On **narrow** cards/viewports, buttons remain usable (minimum touch target, optional overlap mitigation — see edge cases).
- **Regression:** Ellipsis/`p-menu` and other top-right header controls may **overlap** with overlay buttons; product accepts overlap risk **or** follow-up to offset header actions — call out in edge cases (differs from prior bug-fix that avoided collision via placement).

### What “close” means (product default)

| Approach | Recommendation |
|----------|----------------|
| **Emit only** | **Default:** `OutputEmitterRef` / `@Output() close` — parent handles dismissal. |
| **Directive removes host** | Rejected as default (surprising, breaks forms/tables inside card). |
| **CSS hide only** | Optional pattern for parent via `*ngIf` on wrapper; not required inside directive. |

### Acceptance criteria

- [x] With **`showWindowMaximize=true`** and **`showClose=false`**, toggle appears **top-right**, **absolute**, **over** title/content; **not** inside `.card-actions`; **no** extra header row height for the button alone.
- [x] With **`showWindowMaximize=false`**, **no** maximize control is rendered; card does not advertise maximize (unless documented exception).
- [x] With **`showClose=true`**, close (X) appears; **click** emits **one** close event; parent can observe and react.
- [x] With **both true**, both buttons visible, **side by side**, **no** mutual occlusion at typical dashboard card widths.
- [x] **Maximized** state: existing restore/Escape/backdrop rules still work; close button remains available and **directly emits close** without auto-restoring — parent decides.
- [x] Cards **with** and **without** `.card-header` / `.card-actions` behave **the same** regarding control placement.
- [x] **`ng build`** succeeds; **i18n** keys for close affordance in **en/tr/fr/de**.

### Implementation breakdown

- [x] **(a)** Change **`CardMaximizeDirective`**: render control(s) in a single **absolute** `.card-controls` wrapper on the host; never insert into `.card-actions`.
- [x] **(b)** Add inputs **`showWindowMaximize`** (default `false`), **`showClose`** (default `false`); conditionally create/destroy button nodes.
- [x] **(c)** Add close button markup + **`output() closed`**; wire **click** → emit; **stopPropagation**.
- [x] **(d)** Update **`_card-maximize.scss`**: `.card-controls` wrapper, `.card-close-btn` styles; removed old `.card-actions` override.
- [x] **(e)** Migrate **31** card templates: add `[showWindowMaximize]="true"` to maintain existing behavior.
- [x] **(f)** **`translations.ts`**: added **`card.close`** in en/tr/fr/de.
- [x] **(g)** **Unit tests**: inputs gate rendering; close emits; both buttons side-by-side; close while maximized emits without auto-restoring; disabling maximize while maximized auto-restores.

### Edge cases and negative scenarios

| Scenario | Expected / note |
|----------|------------------|
| **Both buttons + existing `...` menu** | May **overlap** top-right; UX accepts or parent sets **`showClose`** false / moves menu — document. |
| **Very narrow card** | Buttons shrink gap or allow slight overlap; must not break **focus** or **click** targets below minimum. |
| **Close while maximized** | Define: emit close only vs auto-restore then emit — **blocking** product choice. |
| **Only `showClose` true** | Close shows; no maximize toggle; card never maximizes via directive. |
| **Router navigation while maximized** | Unchanged: restore per existing spec. |
| **SSR** | Browser-only DOM creation unchanged; guards preserved. |

### i18n keys needed

- **`card.close`** — short label for tooltip/aria on the X button (en/tr/fr/de).  
- Reuse existing **`card.maximize`** / **`card.restore`** (or current keys) for maximize toggle; add only if missing.

### Resolved questions

1. **Default values:** Both **`showWindowMaximize`** and **`showClose`** default to **`false`** (explicit opt-in). All 31 existing card templates updated with `[showWindowMaximize]="true"`.
2. **Close when maximized:** **Directly emit close** without auto-restoring. Parent decides how to handle.
3. **Button order:** **Close is rightmost** (maximize left, close right — matches standard dialog patterns).

### Out of scope

- Replacing **`appCardMaximize`** with a **`p-card`** wrapper component.
- **Built-in** “hide card” animation or **localStorage** “dismissed cards”.
- Changing **backdrop click** or **Escape** behavior except where required by close/maximize interaction decisions above.
- **PrimeNG** `Dialog` parity (focus trap, role=dialog) — card remains a card, not a modal dialog component.

### Validation

- Manual: one **`.card-actions`** card, one **plain** card, **both flags** combinations, **narrow** width, **maximized** + menu/dialog from content; **`ng build`**.


## Card maximize: temporary close + hover/focus-visible controls

### Summary

**Problem:** Today, clicking the card **close** (X) only emits `closed`; the host stays visible unless the parent hides it. Overlay controls (maximize + close) are **always visible** when rendered, which adds visual noise.

**Desired outcome:** (1) The directive **hides the card host** on close using **in-memory** styling only (e.g. `display: none` on the host); a **full page reload** shows the card again. The **`closed` output still fires** so parents can log or react. (2) **Maximize** and **close** appear only when the user is effectively “on” the card: **pointer hover** on the card, and **keyboard/sighted users** can still reach controls via **`:focus-within`** on the card so the control cluster is not stuck invisible while focused.

**Assumptions:** No `localStorage` / `sessionStorage` for dismissed cards. Existing opt-in flags (`showWindowMaximize`, `showClose`) unchanged. **Product update vs prior “close while maximized” note:** if the user closes while **maximized**, the directive shall **restore first** (clear fixed overlay/backdrop/state), **then** hide the host — so the shell is not left in a maximized-card state with a hidden host.

### Functional requirements

1. **FR-1 — Built-in temporary hide on close**  
   On close button click, the directive shall set the **host element** to a non-visible state (e.g. `display: none` or equivalent that removes it from layout and accessibility tree appropriately). **No** persistence across reloads or navigation unless separately specified.

2. **FR-2 — `closed` output preserved**  
   The directive shall **still emit `closed`** after (or as part of) the same user action, in an order consistent with restore-then-hide when maximized (see edge cases).

3. **FR-3 — Restore-then-hide when maximized**  
   If the card is **maximized** when close is activated, the directive shall **exit maximize** (backdrop, fixed positioning, internal state, single-instance stacking) **before** applying host hide, so no orphaned overlay/backdrop remains.

4. **FR-4 — Hover + focus-within visibility**  
   The `.card-controls` cluster shall be **hidden by default** and **shown** when the **card host** matches **`:hover`** **or** **`:focus-within`** (SCSS on the card/host wrapper — not only `:hover`, so keyboard focus on a control keeps buttons visible).

5. **FR-5 — Touch / no-hover devices**  
   Document: **pure `:hover`** does not fire on many touch UIs; **`:focus-within`** helps when the user tabs into a control if focus can reach it — if controls are fully hidden with `opacity: 0` / `visibility` and not tab-reachable until visible, engineering must ensure **at least one** discoverable path (e.g. focus-within on card after first interaction, or visible-on-first-tap — see open questions).

### Non-functional (BA level)

- **Accessibility:** Hiding the host on close should not leave **focus** on a removed/hidden subtree; focus should move to a **safe** target (document body or next focusable — engineering detail). Controls when visible retain **labels/tooltips** per existing i18n.
- **Regression:** Maximize/restore, Escape, backdrop, and stacking rules remain except where **FR-3** explicitly orders restore before hide on close.

### Acceptance criteria

- [x] With **`showClose=true`**, clicking **close** hides the **entire card host** immediately in the current session; **reload** shows the card again with controls in default state.
- [x] **`closed` emits** on close; parent handlers still run if bound.
- [x] Close while **maximized**: user sees **restore** behavior first (no stray backdrop/fixed layer), then card disappears.
- [x] With **`showWindowMaximize` and/or `showClose`**, `.card-controls` is **not** visibly prominent until **hover** on the card **or** **focus-within** the card (keyboard user can tab to toggle/close and see them).
- [x] **`ng build`** succeeds; **`card-maximize.directive.spec.ts`** updated for hide-on-close, restore-then-hide, and visibility rules if testable without brittle DOM.

### Implementation breakdown

- [x] **(a) Directive (`card-maximize.directive.ts`)** — On close: if maximized, run existing **restore** path first; then apply **host hide** (`display: none`). Emit **`closed`**. Blur focus so it's not trapped on hidden content.
- [x] **(b) SCSS (`_card-maximize.scss`)** — Default: `.card-controls` hidden (`opacity: 0`, `pointer-events: none`). Show when host **`:hover`** or **`:focus-within`**, always show when card is maximized (`.card--maximized > .card-controls`), always show on touch devices (`@media (hover: none)`).
- [x] **(c) Tests (`card-maximize.directive.spec.ts`)** — Cover: close hides host (`display: none`); close when maximized restores then hides; `closed` still emitted.

### Edge cases and negative scenarios

| Scenario | Expected / note |
|----------|------------------|
| **Close while maximized** | **Restore first**, then hide host; emit `closed`. |
| **Touch / mobile — no hover** | Controls may stay hidden until **focus** enters card or user discovers **tap target**; **`:focus-within`** mitigates **keyboard**; **pointer-only hover** is insufficient on touch — document UX gap or follow-up (e.g. always show on small breakpoint — **open question**). |
| **Keyboard: controls hidden until hover** | **`:focus-within`** on card must reveal `.card-controls` so tabbing to maximize/close is possible; verify **tab order** and **visible focus ring**. |
| **Screen reader** | Hidden host should not retain **aria-hidden** mistakes; closing moves context — ensure **live region** not required unless product asks (out of scope unless specified). |
| **Multiple cards** | Hiding one card does not affect another; **single maximized** rule: closing maximized card clears global maximize state then hides. |
| **Parent `*ngIf` / route** | Directive hide is **CSS/DOM state on host**; parent can still remove component — **no conflict** if parent destroys host (cleanup in `ngOnDestroy` as today). |

### Open questions

1. **Nice-to-know — Touch default** Should **narrow viewports** or **coarse pointer** media queries **always show** controls to avoid undiscoverable chrome? *(Default in BA: document gap; engineering may propose `@media (hover: none)` fallback.)*

### Out of scope

- **Persisting** “dismissed” cards (`localStorage`, user preferences API).
- **Animate** dismiss or **undo** snackbar to reopen card.
- Changing **close** to mean **navigate away** or **remove from `*ngIf`** — parent may still do that in addition to directive hide if double-handling is avoided by product.
- **PrimeNG** dialog parity (focus trap, `role="dialog"`) for the card shell.

### Validation

- Manual: card with both flags — hover shows controls, tab into card shows controls, close hides, reload restores; **maximized + close** leaves no backdrop; **`ng build`**.

## Station detail — Station Pictures card (carousel, add/change/delete, NEW badge, profile-style upload)

### Source intent

> In station-management detail page's first tab (Station Info), add a card for display pictures of station. The card include PrimeNG Carousel to display all pictures. Add Change Picture and Delete Picture buttons just under each picture. Also add a button for Adding New Picture. After adding new picture, add NEW badge to this picture. Adding new picture will operate like we do for user profile.

### Summary

**Feature:** On **`/station-management` detail** (`station-management-detail.ts`), **tab 0 — Station Info**, add a new **“Station Pictures”** card that shows all station images in a **PrimeNG Carousel** (`p-carousel`), with **Change Picture** and **Delete Picture** actions under the **currently visible** slide, an **Add New Picture** control, and a **NEW** badge on pictures added in the **current browser session** only.

**Context:** `StationManagementRow` and `public/demo/stations.json` have **no** image fields today; data is demo/static JSON. Pictures shall be managed **in-memory** in the detail component (or a small local service), **not** written back to `stations.json` — analogous to how profile avatar editing uses client-side flow until save (here, **no persistence** to file/API is in scope unless product extends).

**Assumptions:** Card uses **`appCardMaximize [showWindowMaximize]="true"`** like other cards. i18n via **`I18nService` / `TranslatePipe`** under **`stationMgmt.*`**. Upload/edit flow reuses **profile pattern**: hidden `input type="file"` → **`image/*`**, **max 1MB** → **`URL.createObjectURL`** preview → **`AvatarEditorDialogComponent`** → JPEG **data URL** output.

### Product decisions (defaults until stakeholders override)

| Topic | Default |
|--------|--------|
| **Picture storage** | **In-memory only** for demo: array of `StationPicture` (`id`, `dataUrl`, `isNew`, `addedAt`). No changes to `stations.json` or `StationManagementRow` for persistence in this task. |
| **Add / replace flow** | Same as profile: file pick → validate → object URL → **`AvatarEditorDialogComponent`** → data URL. |
| **Editor aspect ratio** | **Reuse `AvatarEditorDialogComponent` as-is** for **MVP** (square **256×256** output acceptable for demo station photos). Follow-up if landscape station photos are required. |
| **Change Picture** | Replaces **that slide’s** `dataUrl`; **`isNew` stays false** (no NEW badge on replaced images). |
| **Delete Picture** | **Immediate removal** from the in-memory array — **no** confirmation dialog (demo simplicity). |
| **Card placement** | **Inside Station Info tab**, **after** the existing `<dl>` of station fields. |
| **Empty state** | **No pictures:** show placeholder copy + **Add New Picture** only (carousel may be hidden or show empty template). |
| **NEW badge** | **`p-tag`**, `severity="success"`, value **NEW** (translated key), **top-right** over image (`position: absolute`). **`isNew` is session-only**; full page reload clears all pictures / badges per in-memory model. |
| **Initial demo data** | **No** seed images in JSON — user adds via upload; **`stations.json` unchanged**. |
| **Carousel UX** | **`numVisible="1"`**, one photo at a time, **full width** within card; **nav arrows** + **indicator dots** (per PrimeNG defaults / `mediademo` patterns). |

### Functional requirements

1. **FR-1 — Station Pictures card on Station Info tab**  
   The first tab shall include a **card** titled (translated) for station pictures, placed **below** the existing station field `<dl>`, with **`appCardMaximize [showWindowMaximize]="true"`**.

2. **FR-2 — Carousel of pictures**  
   When **one or more** pictures exist, the card shall render **`p-carousel`** bound to the in-memory picture list, **`numVisible="1"`**, with navigation and indicators appropriate to PrimeNG 21 and existing `mediademo` usage.

3. **FR-3 — Per-slide actions**  
   **Under the visible picture** (same slide as carousel item template), show **Change Picture** and **Delete Picture** buttons that apply to **that** item’s `id` (not a global ambiguous target).

4. **FR-4 — Add New Picture**  
   Provide **Add New Picture** (translated) that triggers the same file pipeline as profile: hidden file input, **`accept="image/*"`**, **max 1MB**, reject invalid type/size with user-visible feedback (toast or inline — align with profile).

5. **FR-5 — Profile-style editor**  
   After valid file selection, open **`AvatarEditorDialogComponent`**; on confirm, append a new **`StationPicture`** with a stable **`id`**, **`dataUrl`** from dialog output, **`isNew: true`**, **`addedAt: Date.now()`** (or ISO string) for ordering.

6. **FR-6 — NEW badge**  
   Pictures with **`isNew === true`** shall show **`p-tag`** “NEW” (translated) **overlaid** on the image (e.g. top-right). **`Change Picture` shall set or preserve `isNew: false`** for that item. **`Delete`** removes the item regardless of `isNew`.

7. **FR-7 — Change Picture**  
   **Change** reuses the file + editor flow; on confirm, **replace** the selected item’s `dataUrl` (and optionally `addedAt` for “last modified” — default: **do not** set `isNew`).

8. **FR-8 — Delete Picture**  
   **Delete** removes the picture from the array **immediately** without confirmation (per default).

9. **FR-9 — Empty state**  
   When **zero** pictures, show **placeholder message** (translated) and **Add New Picture**; no misleading carousel chrome unless PrimeNG empty template is used consistently.

10. **FR-10 — Memory hygiene**  
    **`URL.revokeObjectURL`** shall be called for **preview** object URLs when no longer needed (match profile patterns) to avoid leaks.

11. **FR-11 — No regression**  
    Existing detail tabs, routing, and Station Info `<dl>` behavior remain unchanged aside from the new card.

### Non-functional requirements

- **Performance:** Carousel with **typical demo counts** (tens of images max) shall remain responsive; avoid storing **huge** unbounded base64 in memory without product limits (nice-to-know: cap count or size).
- **Accessibility:** Carousel **prev/next** controls and action buttons shall be **keyboard-operable** where PrimeNG provides; images need **`alt`** text or **decorative** treatment (empty `alt` + `aria-hidden` if purely decorative — **product**: station photos may warrant short `alt` from filename or generic “Station picture N”).
- **Security / privacy:** No upload to server in scope; **data URLs** stay client-side; do not log full data URLs.
- **Regression:** Import **`CarouselModule`** only where needed; **`ng build`** and existing station-management flows unaffected.
- **i18n:** All new labels, placeholders, errors, and **NEW** tag text in **en/tr/fr/de**.

### Acceptance criteria

- [x] Station Info tab shows a **Station Pictures** card **after** the definition list, with **card maximize** enabled per project standard.
- [x] With **≥1** picture, **`p-carousel`** shows **one** image at a time (**`numVisible=1`**), with **arrows** and **indicators** working.
- [x] **Change Picture** and **Delete Picture** appear **below the visible slide** and target **that** picture only.
- [x] **Add New Picture** opens file picker; invalid type or **>1MB** file is rejected with clear feedback.
- [x] Valid selection flows through **`AvatarEditorDialogComponent`** and, on confirm, **adds** a new carousel item with **NEW** badge visible.
- [x] **Change Picture** on an existing item updates the image and **does not** show NEW badge (unless product overrides).
- [x] **Delete Picture** removes the item **immediately** without confirm dialog.
- [x] **Empty state** shows placeholder + **Add New Picture** only.
- [x] **Full page reload** results in **no** station pictures from this feature (in-memory only); **no** requirement to persist to `stations.json`.
- [x] **`ng build`** succeeds; **i18n** present for **en/tr/fr/de** for all new strings.

### Implementation breakdown

- [x] **(a) Model** — Define **`StationPicture`** interface: `id` (string or number), `dataUrl` (string, JPEG data URL), `isNew` (boolean), `addedAt` (number timestamp for sort order). Keep **out of** `StationManagementRow` / JSON unless persistence is added later.

- [x] **(b) Component state** — In `station-management-detail` (or injectable store), add **`signal`/`writable` array** for pictures; init **empty**. Optional: sort by `addedAt` ascending/descending (document choice; default **oldest first** in carousel or **newest first** — product pick in open questions).

- [x] **(c) Template — card + carousel** — New `<div class="card" appCardMaximize ...>` with header; `<p-carousel [value]="pictures()" ...>` with **`numVisible="1"`**, `responsiveOptions` if needed; **`ng-template` #item** for slide: image + overlay **NEW** `p-tag` when `isNew`; row of **Change** / **Delete** under image.

- [x] **(d) File + editor pipeline** — Reuse profile patterns: hidden `<input type="file" accept="image/*">`, **`UserProfileService`-like validation** or shared helper if one exists; **`AvatarEditorDialogComponent`** via `DialogService` / same injection as profile; on add → push new `StationPicture`; on change → `update` by `id`.

- [x] **(e) Buttons** — **Add New Picture** triggers file input for **create** mode; **Change** triggers file input bound to **current item id** (separate input or single input + context signal).

- [x] **(f) Modules** — Import **`CarouselModule`**, **`TagModule`** (if not already), dialog/editor dependencies already used by profile.

- [x] **(g) i18n** — Add keys under **`stationMgmt.pictures.*`** (or agreed prefix) in **`translations.ts`** for **en/tr/fr/de**.

- [x] **(h) Tests / smoke** — Optional unit tests for pure helpers (id generation, `isNew` rules); **`ng build`**; manual: add → NEW badge → change → no NEW → delete → empty state.

### Edge cases and negative scenarios

| Scenario | Expected / note |
|----------|------------------|
| **User cancels `AvatarEditorDialogComponent`** | No change to list (add) or previous `dataUrl` preserved (change). |
| **Add then delete before save** | Item removed; no crash; NEW badge irrelevant. |
| **Delete last picture** | UI transitions to **empty state**; carousel hidden or empty template. |
| **Change picture on item that was `isNew`** | After confirm, **`isNew` false** — badge disappears (aligns with “only newly added” semantics). |
| **Very large file (>1MB)** | Reject per profile rule; no dialog open. |
| **Non-image file** | Reject; clear message. |
| **Many images** | Carousel still usable; consider **memory** (all data URLs) — acceptable for demo; document risk. |
| **Same file chosen twice** | Should still work (new `id` for add); change replaces blob URL content. |
| **Browser refresh** | All pictures **gone** (in-memory); **no** broken image URLs from JSON. |
| **`URL.createObjectURL` cleanup** | Revoke previews on dialog close/cancel to avoid leaks. |
| **Carousel index after delete** | PrimeNG should keep valid index; if last item deleted, index resets — verify no runtime error. |
| **Station row changes (navigation between stations)** | **Open question:** reset pictures per `stationId` or keep one global session list — default **reset array when `id` input changes** (per-station in-memory). |

### i18n keys needed (suggested)

- `stationMgmt.pictures.cardTitle` — Card heading (e.g. “Station pictures”).
- `stationMgmt.pictures.add` — Add New Picture button.
- `stationMgmt.pictures.change` — Change Picture button.
- `stationMgmt.pictures.delete` — Delete Picture button.
- `stationMgmt.pictures.newBadge` — Tag value “NEW” (if not hardcoded English).
- `stationMgmt.pictures.empty` — Empty state message.
- `stationMgmt.pictures.errorFileType` — Not an image.
- `stationMgmt.pictures.errorFileSize` — Exceeds 1MB (match profile messaging if shared key exists).
- Optional: `stationMgmt.pictures.alt` — Generic alt text pattern.

*Engineering may **dedupe** with profile keys if the app standardizes validation messages.*

### Out of scope

- Persisting station pictures to **`stations.json`**, backend API, or **cloud storage**.
- Extending **`StationManagementRow`** or **HTTP service** for real image URLs.
- **Landscape-specific** crop aspect in `AvatarEditorDialogComponent` (unless promoted from open questions).
- **Confirmation dialog** before delete (unless product changes default).
- **Drag-and-drop** upload, **bulk** import, or **image optimization** pipeline beyond the editor output.
- **Permissions / roles** for who may edit station pictures (single-user demo assumption).

### Resolved questions

1. **Per-station vs global in-memory list:** **Yes**, reset per `stationId`. Data is mock for now; will come from API afterwards.

2. **Carousel slide order:** **Newest first**.

3. **Max pictures:** **10** default, but **configurable** (e.g. component property / constant).

4. **`AvatarEditorDialogComponent` reuse:** Reuse the same dialog but **make it a reusable/configurable component** with input properties for: **output width/height** (currently hardcoded 256x256), **max file size**, **accepted file types**, and **dialog title**. The current profile usage becomes the first consumer with its existing defaults; station pictures become the second consumer with its own settings. See **prerequisite task** below.

5. **Caption / alt text:** Add an **editable input box under each picture** in the carousel for the user to set a caption. **Default caption:** `"<station name> <N>"` where `<N>` is a sequential number. Caption is stored in the `StationPicture` model (`caption: string`) and used as `alt` text on the `<img>`.

### Updated model

```typescript
interface StationPicture {
    id: string;
    dataUrl: string;
    caption: string;       // editable; default: "<station name> <N>"
    isNew: boolean;
    addedAt: number;       // Date.now() timestamp for sort order
}
```

### Prerequisite — Make `AvatarEditorDialogComponent` reusable

Before the station pictures feature, refactor `AvatarEditorDialogComponent` (currently `src/app/pages/profile/avatar-editor-dialog.component.ts`) to accept configurable inputs:

| New input | Type | Default (profile parity) | Description |
|-----------|------|--------------------------|-------------|
| `outputWidth` | `number` | `256` | Output canvas width in px |
| `outputHeight` | `number` | `256` | Output canvas height in px |
| `maxFileBytes` | `number` | `1048576` (1 MB) | Informational; actual validation stays in caller |
| `acceptTypes` | `string` | `'image/*'` | Informational; actual `<input accept>` is caller-side |
| `dialogTitle` | `string` | `'profile.editor.title'` (i18n key) | Dialog header text |
| `outputFormat` | `string` | `'image/jpeg'` | MIME type for `canvas.toDataURL()` |
| `outputQuality` | `number` | `0.92` | Quality param for `canvas.toDataURL()` |

**Current hardcoded values** (`VIEWPORT_SIZE = 320`, `OUTPUT_SIZE = 256`, `toDataURL('image/jpeg', 0.92)`) become either inputs with defaults or derived from inputs.

**Profile page** (`profile.ts`) continues to work **unchanged** (all defaults match current behavior). **Station pictures** can pass e.g. `[outputWidth]="512" [outputHeight]="512"` or other values as product decides.

**Move or keep in place:** Move component to `src/app/shared/` since it is now reusable; update import paths in profile page.

### Updated implementation breakdown

- [x] **(a) Prerequisite — Refactor `AvatarEditorDialogComponent`** — Add configurable inputs (`outputWidth`, `outputHeight`, `dialogTitle`, `outputFormat`, `outputQuality`). Replace hardcoded `OUTPUT_SIZE` with input-derived values. Move component to `src/app/shared/`. Verify profile page still works unchanged.

- [x] **(b) Model** — Define **`StationPicture`** interface: `id` (string), `dataUrl` (string), `caption` (string), `isNew` (boolean), `addedAt` (number). Place in a new file or alongside detail component.

- [x] **(c) Component state** — In `station-management-detail`, add `WritableSignal<StationPicture[]>` for pictures; init **empty**; reset on `stationId` change. Sort **newest first** by `addedAt`.

- [x] **(d) Template — card + carousel** — New card with `p-carousel [value]="pictures()" [numVisible]="1"`. Slide template: image with overlay `p-tag` NEW badge (when `isNew`), **caption input** below image, **Change Picture** and **Delete Picture** buttons below caption.

- [x] **(e) Add New Picture** — Hidden file input, validation (type, size), `AvatarEditorDialogComponent` with station-specific config. On confirm: push new `StationPicture` with `isNew: true`, default caption `"<station name> <N>"`. Enforce max **10** pictures (configurable); disable add button when at cap.

- [x] **(f) Change Picture** — Same file+editor flow; on confirm: replace `dataUrl`, set `isNew: false`. Preserve caption.

- [x] **(g) Delete Picture** — Remove immediately from array. No confirmation.

- [x] **(h) Modules** — Import `CarouselModule`, `TagModule`, `InputTextModule`, editor dialog.

- [x] **(i) i18n** — Add keys under `stationMgmt.pictures.*` in `translations.ts` for en/tr/fr/de. Include caption-related labels.

- [x] **(j) Tests / smoke** — `ng build`; manual: add -> NEW badge -> edit caption -> change picture -> delete -> empty state -> reload clears all.

### Updated i18n keys needed

- `stationMgmt.pictures.cardTitle` — Card heading.
- `stationMgmt.pictures.add` — Add New Picture button.
- `stationMgmt.pictures.change` — Change Picture button.
- `stationMgmt.pictures.delete` — Delete Picture button.
- `stationMgmt.pictures.newBadge` — "NEW" tag value.
- `stationMgmt.pictures.empty` — Empty state message.
- `stationMgmt.pictures.errorFileType` — Invalid file type.
- `stationMgmt.pictures.errorFileSize` — File too large.
- `stationMgmt.pictures.captionPlaceholder` — Caption input placeholder.
- `stationMgmt.pictures.maxReached` — Max pictures reached message.

### Validation

- **Build:** `ng build`.
- **Manual:** Station detail -> add image -> NEW badge -> edit caption -> navigate carousel -> change picture (no NEW) -> delete -> empty state; reload -> all gone; switch station -> empty; card maximize works; profile page still works after editor refactor.

### Risks

| Risk | Mitigation |
|------|------------|
| **Large base64 strings** in Angular change detection | Use immutable updates by `id`; avoid logging data URLs. |
| **Editor refactor breaks profile** | All new inputs have defaults matching current hardcoded values; profile template unchanged. |
| **Carousel + absolute NEW badge** | Test overlap with PrimeNG slide templates and responsive widths. |


## Dashboard widget: `ChargingUnitWidget`

### Summary (BA)

**Problem:** Operators need a **dashboard-at-a-glance** view of charging units alongside existing widgets, without a live API yet.

**Outcome:** A new standalone widget **`ChargingUnitWidget`** (`selector: app-charging-unit-widget`) that **matches the visual and interaction pattern** of **`RecentSalesWidget`** (Sakai card chrome, `p-table`, paginator, sort icons, text icon-only View button, `appCardMaximize` + `[showWindowMaximize]="true"`), fed by **static JSON** at `public/demo/charging_unit.json`, with **all new UI strings** in **en/tr/fr/de** via `TranslatePipe` / `I18nService`.

**Assumptions (defaults until stakeholders override):** JSON envelope `{ success, data: ChargingUnitRow[] }` is stable; `data` is the table source; rows are homogeneous; no real HTTP in v1 (service uses `fetch` or `HttpClient` to the public asset or `Promise.resolve` after static import — engineering choice, behavior identical to user).

### Product decisions (defaults until stakeholders override)

| Topic | Default |
|--------|--------|
| **Visual parity with `RecentSalesWidget`** | Same **card** structure: `card mb-8!`, `card-header` / `card-heading` / `card-title` + `card-description`, `card-actions` with **View More** link + `pi-angle-right`, `card-header-divider`, `p-table` with `responsiveLayout="scroll"`, same **button** classes on View action. |
| **Table columns (3 data + actions)** | **Photo** (placeholder icon), **Device code** (`deviceCode`), **Serial number** (`serialNumber`), **Actions** (Edit / Delete / Configuration icon buttons — all no-op, no routerLink). |
| **“Photo” with no URL in JSON** | **Placeholder cell**: fixed-size box (match ~50px thumb width pattern), **Prime icon** e.g. `pi pi-bolt` or `pi pi-image` on neutral background, **`alt`** from i18n (`dashboard.chargingUnits.photoAlt`). No network image fetch for v1. |
| **Brand logo later** | Optional follow-up: map `brandId` → static assets; **out of scope** unless confirmed. |
| **Dashboard placement** | **Add** widget **below** `<app-recent-sales-widget />` in the **left** `xl:col-span-6` column in `dashboard.ts` (do not remove existing widgets unless product says otherwise). |
| **View More link** | **No navigation** — `(click)="$event.preventDefault()"`. No `routerLink` in v1. |
| **Actions column** | **Edit** (`pi-pencil`), **Delete** (`pi-trash`), **Configuration** (`pi-cog`) — icon-only text+rounded buttons, all **no-op** (no routerLink, no handler logic). |
| **Pagination** | **`[paginator]="true"`**, **`[rows]="5"`** (match reference). |
| **Sortable columns** | **Match reference pattern:** `pSortableColumn` + `p-sortIcon` on **Device code** and **Serial number** (fields `deviceCode`, `serialNumber`). |
| **Dates / numbers in table** | **Not in default 4-column set**; if extra columns added, format `lastHeartBeat` / `createDate` with `DatePipe` + locale — nice-to-know. |
| **Data service** | New **`ChargingUnitService`** `@Injectable()`, loads from **`/demo/charging_unit.json`** (or equivalent public path), maps **`response.data`** to `ChargingUnit[]`; on `success !== true` or missing `data`, use **`[]`**. |
| **Card title / description** | **i18n keys** (not hardcoded English): see **i18n keys** section; default copy tone aligned with **`stationMgmt.tabs.chargingUnits`** / **`kpi.activeUnits.title`**. |

### Functional requirements

1. **FR-1 — Widget component**  
   Provide `ChargingUnitWidget` standalone component with the same **imports category** as reference: `CommonModule`, `TableModule`, `ButtonModule`, `RippleModule`, `CardMaximizeDirective`, plus **`TranslatePipe`** (or project-standard i18n pipe).

2. **FR-2 — Card chrome**  
   Root element: `<div class="card mb-8!" appCardMaximize [showWindowMaximize]="true">` with header, divider, and table as in reference.

3. **FR-3 — i18n**  
   All **visible** strings (title, description, View More, column headers, placeholder `alt`, optional empty state) use **translation keys** with **en, tr, fr, de** entries in `translations.ts`.

4. **FR-4 — Data load**  
   On init, load charging units via **`ChargingUnitService`**; store in a **`signal`**; bind `[value]` to table.

5. **FR-5 — Table behavior**
   Paginator **5** rows; **sort** on **Device code** and **Serial number**; **Actions** column: **Edit** (`pi-pencil`), **Delete** (`pi-trash`), **Configuration** (`pi-cog`) — icon-only text+rounded buttons, all no-op.

6. **FR-6 — Dashboard integration**  
   Import and render `<app-charging-unit-widget />` in `dashboard.ts` per placement default.

7. **FR-7 — Typing**  
   Define a **`ChargingUnit`** (or `ChargingUnitRow`) interface covering fields used in the template + service mapping from JSON.

### Non-functional requirements

- **Performance:** Static file, small array — load should not block UI beyond normal async; no unnecessary change detection churn.
- **Accessibility:** Table headers associated with cells; image placeholder has **meaningful `alt`**; icon buttons need **`aria-label`** (translated) if no visible text.
- **Security/privacy:** Do not log full JSON in production; treat IP-like fields as **display-only** (no extra exposure in errors).
- **Consistency:** Match **naming, file location** (`dashboard/components/`), and **documentation level** of `recentsaleswidget.ts`.
- **Build:** `ng build` succeeds.

### Acceptance criteria

- [x] Widget **visually matches** `RecentSalesWidget` card/table/button patterns (spacing, classes, maximize behavior).
- [x] Data appears from **`public/demo/charging_unit.json`** with **≥1** row in demo file.
- [x] **Paginator** shows **5** rows per page when data > 5 (extend demo JSON for QA if needed).
- [x] **Sort** works on **deviceCode** and **serialNumber** (or product-selected fields).
- [x] **All new strings** translated in **en, tr, fr, de**.
- [x] **Placeholder** used for photo column — **no** broken image URLs.
- [x] **View More** behavior matches **decision** (default: preventDefault only).
- [x] **`ng build`** passes.

### Implementation breakdown (checklist)

- [x] Add **`ChargingUnit`** interface + **`charging-unit.service.ts`** (load + unwrap `data`, error → `[]`).
- [x] Add **`chargingunitwidget.ts`** (or `charging-unit-widget.ts` per project kebab case in filename — match sibling `recentsaleswidget.ts` style).
- [x] Register **`providers: [ChargingUnitService]`** on widget (mirror `ProductService` on reference).
- [x] Wire **`dashboard.ts`**: import component + template placement.
- [x] Add **i18n keys** to `translations.ts` for **en, tr, fr, de**.
- [x] **Unit tests** — `ChargingUnitService` (unwrap `data`, `success: false` → `[]`, malformed JSON handling); widget component smoke test if project norms require.
- [ ] Manual smoke: dashboard load, sort, paginate, maximize card, switch language.

### Edge cases and negative scenarios

| Scenario | Expected |
|----------|----------|
| **`data` empty array** | Table shows **empty body**; optional **empty message** row (translated) — product default: **PrimeNG empty** only unless specified. |
| **`success: false` or malformed JSON** | **No throw** to user; table **`[]`**; optional `console.error` in dev only (follow project logging norms). |
| **Null fields** (`internalAddress`, `note`, etc.) | Display **em dash** or blank per column; **no** template errors. |
| **Very long serial / device code** | **Horizontal scroll** via `responsiveLayout="scroll"`; min-width styles similar to reference columns. |
| **Duplicate `deviceCode`** | Sort/paginate still work; no special merge. |
| **RTL / future** | i18n strings work; layout **not** required in v1 beyond existing app support. |

### Resolved questions

1. **Column set:** **Photo**, **Device code** (`deviceCode`), **Serial number** (`serialNumber`), **Actions** (Edit, Delete, Configuration icon buttons — no link/routerLink).
2. **Actions column:** Populate **Edit** (`pi-pencil`), **Delete** (`pi-trash`), **Configuration** (`pi-cog`) icon buttons. All are **no-op** (`$event.preventDefault()` or empty handler) — no navigation, no routerLink. Same text+rounded button style as reference View button.
3. **Photo strategy:** **Placeholder icon only** (e.g. `pi pi-bolt` or `pi pi-image`). No brand asset map.
4. **Nice-to-know — Demo data size:** Add more rows to JSON for **pagination QA** if needed.
5. **Nice-to-know — Date columns:** Not in widget; only on full management screen.

### i18n keys needed (suggested namespace `dashboard.chargingUnits.*`)

| Key | Purpose (EN example) |
|-----|----------------------|
| `dashboard.chargingUnits.title` | Card title (e.g. "Charging units") |
| `dashboard.chargingUnits.description` | Card subtitle (e.g. "Overview of charging units") |
| `dashboard.chargingUnits.viewMore` | View More link |
| `dashboard.chargingUnits.colPhoto` | Photo |
| `dashboard.chargingUnits.colDeviceCode` | Device code |
| `dashboard.chargingUnits.colSerial` | Serial number |
| `dashboard.chargingUnits.colStatus` | Status (if used) |
| `dashboard.chargingUnits.colBrandModel` | Brand / model (if used) |
| `dashboard.chargingUnits.photoAlt` | Alt for placeholder image |
| `dashboard.chargingUnits.editAria` | aria-label for Edit button |
| `dashboard.chargingUnits.deleteAria` | aria-label for Delete button |
| `dashboard.chargingUnits.configAria` | aria-label for Configuration button |
| `dashboard.chargingUnits.colActions` | Actions column header |
| `dashboard.chargingUnits.empty` | Optional empty state |

*Provide **tr, fr, de** equivalents; avoid embedding PII in strings.*

### Out of scope

- Real **REST API**, auth, or **WebSocket** live updates.
- **Functional** editing/deleting/configuration of units (buttons rendered but **no-op**), **bulk actions**, or **export** from the widget.
- **Persisted** user preferences for this table.
- **Replacing** or removing existing dashboard widgets without explicit product approval.
- **OCPP version** formatting, **roaming** flags, or full **20+ field** grid in the widget.

### Handoff

All blocking questions resolved. Engineering implements per **FR** and **resolved questions**. Columns: Photo, Device code, Serial number, Actions (Edit/Delete/Configuration no-op buttons). Photo: placeholder icon. View More: no navigation.

## CardMaximizeDirective: optional card border (`showBorder`, default true)

### Source intent

> Whether the border is on the card div is shown or not depends on a property. and default value is true

### Goal

Extend **`CardMaximizeDirective`** (`[appCardMaximize]` on `<div class="card">`) with a **boolean input** that controls whether the **host card** shows the standard `.card` border from global layout SCSS (`1px solid var(--surface-border)` in `src/assets/layout/_utils.scss`). **Default `true`** preserves today’s appearance on all **~31+** existing usages (no visual regression). When `false`, the border shall not be shown on that card instance.

### Product decisions (defaults)

| Topic | Default |
|--------|--------|
| **Input name** | **`showBorder`** — aligns with existing `showWindowMaximize` / `showClose` naming (`show*` + boolean). |
| **Default** | **`true`** — border visible; matches current global `.card` rule. |
| **Scope** | **Per host element** where the directive is applied. Cards **without** `appCardMaximize` keep current global styling unchanged (no new global API in v1). |
| **Maximized / restore** | Border visibility follows **`showBorder`** in **normal and maximized** states unless product explicitly requests a different rule (recommended: **same** in all states for predictability). |
| **Other chrome** | **No change** to maximize/close button behavior, backdrop, hover/focus control visibility, Escape handling, or `closed` output — border is **purely presentational**. |

### Functional requirements

1. **FR-1 — New input**  
   The directive shall expose a signal-based input **`showBorder`** with default **`true`**.

2. **FR-2 — Border off**  
   When **`showBorder` is `false`**, the host shall **not** display the standard card border (equivalent visual outcome: no `1px solid var(--surface-border)` on the card edge for that instance).

3. **FR-3 — Border on**  
   When **`showBorder` is `true`** (default), the host shall match **current** `.card` border appearance (no regression vs pre-change).

4. **FR-4 — Reactivity**  
   If **`showBorder` changes at runtime** (e.g. bound to a component signal), border visibility shall **update** without a full page reload.

5. **FR-5 — SSR / prerender**  
   Border on/off shall be **consistent** for server-rendered markup where the directive runs (no flash of wrong border solely due to client-only application of the rule — implementation should use **`Renderer2` + class** or equivalent pattern that applies in both environments).

6. **FR-6 — Cleanup**  
   On destroy, the directive shall **not** leave stale classes or inline border styles that affect a replaced host (normal Angular teardown expectations).

### Non-functional requirements

- **NFR-1 — Theming** — Solution shall work with **light/dark** and CSS variable updates (prefer **class + SCSS** over hard-coded color in TS).
- **NFR-2 — Performance** — Negligible cost: one class toggle or equivalent per host; no layout thrash on unrelated cards.
- **NFR-3 — Consistency** — Match existing directive patterns (`input()`, `effect()` for syncing related UI where appropriate).

### Technical approach (BA-level, for engineering)

- **Recommended:** Add a utility class on the host (e.g. **`card--no-border`**) defined in layout SCSS with `border: none` (or `border-color: transparent` if box model edge cases appear — engineering validates). **Avoid** duplicating full `.card` rules on the host.
- **Alternative:** Inline `border` via `Renderer2` — acceptable if class approach conflicts with specificity; document trade-off (specificity vs theming).
- **Do not** remove or weaken the global `.card` rule in `_utils.scss` unless product wants **all** cards borderless by default (out of scope for this task).

### Relationship to maximize / close / backdrop

| Area | Expected impact |
|------|------------------|
| **Maximize / restore** | **None** on logic; only ensure **z-index / fixed positioning** (`card--maximized`) still read correctly with or without border. |
| **Backdrop** | **None**. |
| **Control buttons** | **None**. |
| **Hover / `card-controls` visibility** | **None** (controls are independent of card border). |

### Edge cases and negative scenarios

| Scenario | Expected behavior |
|----------|-------------------|
| **`showBorder` false + maximized** | Card remains **borderless** (default product rule) unless stakeholder overrides. |
| **Theme / `--surface-border` change** | With **class-based** `border: none`, border stays off; with `true`, border **tracks** theme variables via global `.card`. |
| **Nested `.card` elements** | Only the **element with the directive** gets the modifier; inner `.card` children unaffected unless they have their own `appCardMaximize`. |
| **`showBorder` toggled while maximized** | Border state **updates**; layout shift should be **minimal** (1px). |
| **Card without directive** | Still uses global `.card` border — **no** new property available unless future work adds a second mechanism. |
| **PrimeNG / third-party inner components** | Inner widgets may have **their own** borders — this FR applies only to the **host** `div.card`. |

### Acceptance criteria

- [x] **`showBorder` defaults to `true`**: existing templates **without** the new attribute look **identical** to before (border present).
- [x] **`[showBorder]="false"`** (or signal false): host card shows **no** outer border matching the current `.card` border.
- [x] **Runtime toggle**: changing bound value updates border visibility **without** navigation.
- [x] **Maximized state**: maximize, backdrop, Escape restore, and controls still work; no visual glitch that blocks reading content (spot-check one screen with `showWindowMaximize`).
- [x] **`ng build`** succeeds; quick **visual smoke** on at least one dashboard card with and without border.
- [x] **SSR/prerender** (if used): no inconsistent border for the same template in initial HTML vs hydration (engineering confirms).

### Implementation breakdown (engineering checklist)

1. Add **`showBorder = input(true)`** to `card-maximize.directive.ts`.
2. Subscribe to changes (e.g. **`effect()`** or extend existing effect) to **`addClass` / `removeClass`** on the host for the no-border modifier when `showBorder()` is false/true.
3. Add SCSS rule (e.g. in `_utils.scss` next to `.card` or a small partial) for **`.card.card--no-border`** (or `.card--no-border` with sufficient specificity) so it overrides `.card { border: ... }`.
4. Manually verify **one** consumer with `[showBorder]="false"`; leave **existing** usages unchanged (default true).
5. Optional: one-line note in directive or internal wiki — **attribute name + default**.

### Out of scope

- Global “all cards borderless” or changing the **default** `.card` style for non-directive cards.
- **Per-theme** different `showBorder` defaults.
- **Box-shadow** removal or padding changes (unless product explicitly ties “borderless” to “flat card” — clarify before implementing).
- **Border-radius** or **margin** changes tied to this flag.

### Open questions

1. **Nice-to-know:** Should **borderless** cards also drop **box-shadow** for a fully flat panel? (Current FR is **border only**.)
2. **Nice-to-know:** Any **design token** name preferred by UX (e.g. “elevated” vs “flat”) for documentation only?

### Handoff

Requirements are **ready for implementation**. Engineering owns **specificity** choice (class location) and **SSR** verification. Product default: **`showBorder`** follows the same value in **normal and maximized** states; escalate if marketing wants a bordered maximized overlay only.

## when width of grid is small (for eg. in mobile view etc.) make frozenColumns to standart columns

### Summary

**Problem:** On narrow viewports, Station Management’s `p-table` uses **four frozen columns** (three left: selection, station code, name; one right: actions). Their combined minimum footprint (~26rem left + ~13rem right before scrollable data) can **exceed viewport width**, hiding scrollable data columns or making horizontal navigation unusable.

**Outcome:** Below an agreed **viewport / container width threshold**, **disable PrimeNG frozen behavior** so **all columns participate in the same horizontal scroll** as normal (non-frozen) columns. Above the threshold, preserve current desktop behavior (frozen prefix + suffix).

**Key assumptions (validate with product):**
- Column **order and count** in the template stay the same; only `pFrozenColumn` (and related frozen styling) toggles.
- **Autosize / DOM index math** in `station-management-column-autosize.ts` uses `STATION_MGMT_FROZEN_LEFT_TH_COUNT` as the **offset to the first “scrollable data” `<th>`** (after checkbox + code + name). That offset stays **3** as long as those three leading columns remain; **renaming or documenting** is recommended to avoid confusing “frozen count” with “prefix column count.”
- **Grid state** persists widths keyed by **data column field**; mapping uses the same prefix offset, so **no cross-mode index corruption** is expected if column structure is unchanged.

### Resolved questions

1. **Breakpoint:** **768px viewport width** — use `matchMedia('(min-width: 768px)')` for clean reactivity. Aligns with common tablet breakpoint.
2. **Scope:** **All four** frozen columns (selection, station code, name, actions) become standard below the breakpoint.
3. **Mobile UX:** Accept horizontal scroll for selection and actions on small screens — separate mobile pattern is out of scope.
4. **SSR / first paint:** Default to frozen (desktop-first); client toggles after hydration if narrow.
5. **Zoom:** Ignore for this task.

### Functional requirements

- **FR-1 — Thresholded behavior:** When **observed width ≥ breakpoint** (defined in FR-1a), **left** selection, station code, name and **right** actions behave as today (**`pFrozenColumn`** applied). When **width < breakpoint**, **none** of those cells use frozen column behavior; horizontal scroll includes them with the rest of the row.
- **FR-1a — Measurement source:** Document whether width is **`window.innerWidth`**, **`matchMedia`**, **`ResizeObserver` on table host**, or **layout service** — must be **consistent** and **testable**.
- **FR-2 — No duplicate rows / columns:** Toggling frozen shall **not** duplicate `<tr>`/`<td>` content (prefer **single template** with conditional directive application per engineering pattern).
- **FR-3 — Scrollable table:** Existing **`[scrollable]="true"`** and **`scrollHeight`** remain; user can scroll **all** columns horizontally in compact mode.
- **FR-4 — Feature parity:** Sorting, filtering, selection, row actions, column chooser, global search, and **Clear filter clears search** (per project rule) remain **unchanged** in behavior.
- **FR-5 — Autosize compatibility:** First-load / refresh **column width estimation** and **`readScrollableHeaderDomWidthsPx` / `applyScrollableColumnWidthsToTable`** continue to target the correct **data** columns. If prefix column count ever diverges from **3**, **single source of truth** for that offset must update (constant or dynamic).
- **FR-6 — Grid state persistence:** **Sort**, **visible columns**, **column order**, and **stored data-column widths** (field-keyed) remain valid across **breakpoint transitions** (desktop ↔ mobile) without applying widths to the wrong field. If a transition causes **layout thrash**, **re-run autosize** or **re-apply stored widths** after render (engineering detail).
- **FR-7 — Live resize / orientation:** User resizing the window or rotating device shall **update** frozen vs non-frozen within a **reasonable** delay (no stuck state until full reload).

### Non-functional requirements

- **NFR-1 — Performance:** Breakpoint evaluation must avoid **excessive** layout reads (prefer `ResizeObserver` / throttled `matchMedia` as appropriate).
- **NFR-2 — Accessibility:** In compact mode, **keyboard / screen reader** users can still reach **actions** and **selection** via **horizontal scroll** or **focus order** (verify with PrimeNG scroll container).
- **NFR-3 — Consistency:** Breakpoint aligns with **other responsive grids** in the product if any exist.

### Edge cases and negative scenarios

| Scenario | Expected behavior |
|----------|-------------------|
| Width hovers around breakpoint | **Hysteresis** optional to avoid flicker; otherwise **stable** rule at exact boundary (product picks). |
| Desktop → mobile while grid state saves | **No** wrong column widths; **sort/visibility** preserved. |
| Mobile → desktop | Frozen columns **restore**; **no** permanent loss of state. |
| Empty / loading / error rows | **Same** rules; no freeze on narrow viewports. |
| User zoom / large font | If layout breaks, consider **container-based** breakpoint vs viewport-only. |
| `STATION_MGMT_FROZEN_LEFT_TH_COUNT` | If renamed, **update** spec/tests; value stays **3** unless template prefix columns change. |

### Acceptance criteria

- [x] Below agreed breakpoint: **no** `pFrozenColumn` behavior on selection, station code, name, or actions; **single** horizontal scroll area for the row.
- [x] At or above breakpoint: **current** frozen left + right behavior **restored** (visual / UX parity with pre-change desktop).
- [x] **Autosize** still applies widths to **correct** data columns after load and after language/data refresh on **both** sides of breakpoint.
- [x] **Grid state** (sort, columns, widths) **survives** resize across breakpoint without misaligned columns.
- [x] **No regression** on sort, filter, selection, actions, column visibility dialog, CSV/export if present.
- [x] **`ng test` / `ng build`** green; **manual** check: narrow phone width + wide desktop + rotate.

### Out of scope (unless product expands)

- **Different column sets** on mobile (hiding code/name columns).
- **Sticky** non-PrimeNG CSS replacement for subset of columns.
- **Redesign** of row actions into a **single overflow menu** on mobile.
- Changing **`scrollHeight`** or **pagination** solely for this task.

### Handoff

**Product** must confirm **breakpoint** and **measurement source** (viewport vs container). **Engineering** implements conditional `pFrozenColumn` (e.g. `@if` duplicate headers/cells, host directive, or supported PrimeNG/API pattern), wires **resize/orientation**, validates **autosize** + **grid state** on toggle, and **documents** whether `STATION_MGMT_FROZEN_LEFT_TH_COUNT` is **semantic “left prefix `<th>` count”** vs literal frozen count for future maintainers.

### Implementation notes (for backlog — not BA code)

- Target: `station-management-list.ts` (`pFrozenColumn` on `<th>` / `<td>`), coordinated with `station-management-column-autosize.ts` and tests in `station-management-column-autosize.spec.ts`.

## Refactor `ChargingUnitWidget`: table → card layout (per record)

### Source intent (verbatim summary)

Refactor `chargingunitwidget.ts` from **table** to **card** view (one card per record). Stakeholder mentioned **`public/demo/charging_unit_connectors.json`** as data source. **Title:** `<brandName> - <model> - <deviceCode>` with **`hoStatus`** adjacent to the title. **Body fields:** Access Type (`accessType`), Roaming (`sendRoaming`), Is Free (`isFreePoint`), Serial # (`serialNumber`), Investor (`investor`), Creation Date (`createDate`), Last Connection (`lastHeartBeat`), Unit IP (`externalAddress` — task text: “Ünite IP Adresi”). **Photo:** from `charging_unit_photos.json` where `data[].id` matches `charging_unit.json` `modelId`; photo **right** of text, **same row** as unit info.

---

### 1. Summary (BA)

**Problem:** The dashboard widget currently uses **`p-table`** with a narrow column set and a **placeholder** photo; operators need a **scannable card** per unit with richer fields and a **real brand/model image** when available.

**Proposed outcome:** Replace the table with a **vertical list of cards** (or PrimeNG `p-card`-style blocks). Each card shows a **title line** (brand — model — device code + **hoStatus**), a **label/value block** for the eight listed attributes, and a **photo** on the **right** in the **same horizontal row** as the info block (responsive: stack on narrow viewports unless product forbids).

**Key assumptions (validate with product):**

- **One card = one charging unit** row from **`charging_unit.json`** (same grain as today’s table). Field names in the task all exist on **`ChargingUnit`** / raw unit JSON.
- **`charging_unit_photos.json`** continues to be loaded and joined by **`modelId` ↔ photo `id`**; mapped field **`photoUrl`** on each unit (already implemented in `ChargingUnitService.getChargingUnits()`).
- **`charging_unit_connectors.json`** is **not** the primary source for the listed unit-level fields (those fields are not on connector rows). Optional use: **enrichment** or alternate grain (see open questions).

---

### 2. Resolved questions

| # | Question | Answer |
|---|-----------|--------|
| Q1 | Card grain | **Per unit** from `charging_unit.json` (not per connector). |
| Q2 | `charging_unit_connectors.json` | **Not required** for v1; future enrichment only. |
| Q3 | `hoStatus` display | **`p-tag`** (PrimeNG Tag component), same title row. |
| Q4 | Date formatting | **`DatePipe`** with **time** (e.g. `medium` format including hours:minutes). |
| Q5 | Booleans (`sendRoaming`, `isFreePoint`) | Display as **icons** (e.g. `pi-check` / `pi-times` with color). |
| Q6 | Actions (Edit/Delete/Config) | **Keep** — retain no-op icon buttons on each card. |

---

### 3. Functional requirements

- **FR-C1 — Layout:** Remove **`p-table`** as the primary presentation; render **N** cards for **N** records in the loaded list (grain per Q1).
- **FR-C2 — Title row:** Visible title = **`brandName` + " - " + `model` + " - " + `deviceCode`** (trim segments if product allows empty strings). **`hoStatus`** shown **next to** the title (same row; implementation: flex with wrap).
- **FR-C3 — Field block:** For each unit, show labeled rows (or grid) for: **Access Type** ← `accessType`; **Roaming** ← `sendRoaming`; **Is Free** ← `isFreePoint`; **Serial #** ← `serialNumber`; **Investor** ← `investor`; **Creation Date** ← `createDate`; **Last Connection** ← `lastHeartBeat`; **Unit IP** ← `externalAddress` (task label “Ünite IP Adresi” → i18n, not hardcoded TR-only).
- **FR-C4 — Photo:** If **`photoUrl`** is non-null and non-empty, show **`<img>`** (or PrimeNG `Image`) with **meaningful `alt`** (e.g. brand + model + device code from i18n pattern). If missing, show **same placeholder treatment** as prior spec (icon in bordered box) — aligns with earlier widget BA.
- **FR-C5 — Row layout:** On **desktop**, **text/details left**, **photo right**, **one row** (flex/grid). On **small widths**, **stack** order: title+status → fields → photo (or photo below) — **unless** product mandates horizontal scroll instead.
- **FR-C6 — Data load:** Continue using **`ChargingUnitService.getChargingUnits()`** (loads **`charging_unit.json`** + **`charging_unit_photos.json`**). If product requires **connectors** in scope, extend service to fetch **`charging_unit_connectors.json`** and define merge rules (e.g. `stationChargePointID` === `chargePointId`).
- **FR-C7 — i18n:** All **new** visible labels (field names, Yes/No, optional section titles) use **`dashboard.chargingUnits.*`** (or agreed prefix) with **en, tr, fr, de** in `translations.ts`.
- **FR-C8 — Empty / error:** **Empty list:** show translated empty state (reuse or extend `dashboard.chargingUnits.empty`). **Fetch failure:** service already returns **`[]`** — widget must not throw; optional subtle empty state (same as today).
- **FR-C9 — Card chrome:** Preserve **dashboard card** wrapper: **`appCardMaximize`**, **`[showWindowMaximize]="true"`**, header area / “Add New” pattern **unless** product removes it; match sibling widgets’ spacing/classes.

---

### 4. Non-functional requirements (BA level)

- **Performance:** Static JSON; avoid re-fetch on every change detection; images lazy-load if supported.
- **Accessibility:** Labels associated with values (definition list or grid with headers); icon-only actions keep **`aria-label`**; images have **`alt`**.
- **Security/privacy:** **IP and serial** are display-only; do not log full payloads in production UI.
- **Consistency:** Match **PrimeNG / Sakai** card styling used elsewhere on dashboard.

---

### 5. Data source clarification

| File | Role in this task |
|------|-------------------|
| **`public/demo/charging_unit.json`** | **Primary** list of units; supplies **all** task-listed fields except photo URL. |
| **`public/demo/charging_unit_photos.json`** | **Photo lookup** by **`id` = unit `modelId`**; exposed as **`photoUrl`** on each unit (existing service). |
| **`public/demo/charging_unit_connectors.json`** | **Connector-level** rows; join key **`stationChargePointID`** matches unit **`chargePointId`** in sample data. **Does not** contain `brandName`, `deviceCode`, `externalAddress`, etc. Use only if product wants **connector cards** or **enriched** unit cards (e.g. first connector’s `statusName` / `tariffName`). |

**Inference:** The phrase “use again … connectors.json as data source” is likely **imprecise** for the described **unit-level** fields; engineering should implement **unit list + photos** unless Q1 answers **per-connector**.

---

### 6. Card layout specification (wire-level)

```
+------------------------------------------------------------------+
|  [Title: Brand - Model - DeviceCode]  [hoStatus badge/text]     |
|  +---------------------------+  +---------------------------+   |
|  | Access Type:    …         |  |                         |   |
|  | Roaming:        …         |  |      Photo (img or       |   |
|  | Is Free:        …         |  |      placeholder)        |   |
|  | Serial #:       …         |  |      ~same height as     |   |
|  | Investor:       …         |  |      field block         |   |
|  | Creation Date:  …         |  |                         |   |
|  | Last Connection: …        |  |                         |   |
|  | Unit IP:        …         |  +---------------------------+   |
|  +---------------------------+                                   |
|  [Optional: Edit | Delete | Config icon row]                    |
+------------------------------------------------------------------+
```

- **Null `externalAddress` / other nulls:** show **em dash** or “—” (i18n-safe) per project convention.
- **Long title:** allow wrap; do not truncate without product rule.

---

### 7. Pagination, sorting, filtering

| Topic | Table (current) | Card refactor (proposed defaults) |
|-------|-----------------|-----------------------------------|
| **Pagination** | `p-table` 5 rows | **`p-paginator`** on a computed slice, or **PrimeNG DataView**, or **“Load more”** — **default: keep ~5 items per page** for parity unless product wants infinite scroll. |
| **Sort** | `deviceCode`, `serialNumber` | **Optional** v1: sort dropdown or **default sort** by `deviceCode`; **nice-to-know** if sort is required day one. |
| **Filter** | None | **Out of scope** unless requested. |

---

### 8. Edge cases and negative scenarios

| Scenario | Expected |
|----------|----------|
| **`photoUrl` null** | Placeholder icon; no broken image. |
| **Image URL 404 / load error** | **`(error)`** handler falls back to placeholder (recommended). |
| **Very long `accessType` / investor** | Wrap; card min-width / scroll within dashboard column. |
| **Many units (e.g. 50+)** | Paginator or virtual scroll; avoid DOM blowup. |
| **`success: false` / network error** | Empty list; no uncaught errors. |
| **RTL** | Layout mirrors where app already supports RTL. |

---

### 9. Acceptance criteria (testable)

- [x] Widget renders **cards** instead of **`p-table`** for the unit list (grain per Q1).
- [x] Each card shows **title** `brandName - model - deviceCode` and **hoStatus** on the **same title row** (allow wrap).
- [x] All **eight** labeled fields display correct bindings; **nulls** do not break template.
- [x] **Photo** uses **`photoUrl`** when present; **placeholder** when absent; **positioned right** of details on wide layout **same row**.
- [x] **i18n:** new field labels (+ Yes/No if used) in **en, tr, fr, de**.
- [x] **`ng build`** and **widget/service tests** green; manual: dashboard load, maximize card, language switch, narrow viewport stack behavior.

---

### 10. Implementation breakdown (for engineering)

- [x] Refactor **`chargingunitwidget.ts` template:** remove `TableModule` if unused; add layout (flex/grid or `p-card`). Use `DatePipe` with time for dates, icons for booleans, `p-tag` for `hoStatus`.
- [x] Implement **pagination** for card list (if keeping 5-per-page parity).
- [x] Wire **`<img>`** to `unit.photoUrl` + error fallback; keep **placeholder** path.
- [x] Add **i18n keys** in `translations.ts` for field labels and **Unit IP** (TR equivalent for “Ünite IP Adresi” in `tr` bundle).
- [x] Optional **`ChargingUnitService`** + **`charging_unit_connectors.json`** enrichment — **skipped** (Q2: not required for v1).
- [x] Update **`chargingunitwidget.spec.ts`** (and service tests if service changes).
- [x] Remove stray template typos if any (e.g. `--` after translated strings) **if still present** — housekeeping.

---

### 11. Out of scope (unless product expands)

- **Live API**, real **Edit/Delete/Config** behavior.
- **Full connector grid** (tariff, kW, Type) on each card without Q2/Q1 approval.
- **Persisted** user preferences for sort/filter on this widget.

---

### 12. Handoff

All questions resolved. **Per unit** cards from `charging_unit.json`. `hoStatus` as `p-tag`. Dates via `DatePipe` with time. Booleans as icons. Edit/Delete/Config buttons kept. Connectors not needed for v1.

## Add System to Dark and Light Theme mode (follow OS `prefers-color-scheme`)

### Source intent

> Add System to Dark and Light Theme mode which will operate dark or light time according to System preference.

### Summary

**Problem:** Theme is a boolean (light/dark) with a single toggle; users who want the app to **track the OS/browser** light/dark preference cannot do so without manual toggling.

**Proposed outcome:** Introduce a **third persisted mode** `'system'` that sets **effective** appearance from `window.matchMedia('(prefers-color-scheme: dark)')`, updates when the OS preference changes while the app is open, and exposes a **dropdown** with three explicit options (light / dark / system), **PrimeIcons** on the trigger (`pi-sun` / `pi-moon` / `pi-desktop`), full i18n, and **cross-tab sync** via the `storage` event.

**Key assumptions (locked):**

- **A1:** “System” means **CSS media query** `prefers-color-scheme` (not time-of-day scheduling).
- **A2:** PrimeNG continues to use **`app-dark` on `<html>`** for dark styling; effective dark = class present; effective light = class absent.
- **A3:** Existing installs with `branding.theme` only `'light' | 'dark'` continue to work; **new users / missing `theme`** default to **`system`** (not light).

---

### How the three-way mode works

| Stored mode (`themeMode` or equivalent) | Effective appearance | Who drives `app-dark` |
|----------------------------------------|----------------------|------------------------|
| `'light'` | Always light | Never add `app-dark` (or remove on apply). |
| `'dark'` | Always dark | Always add `app-dark`. |
| `'system'` | Matches OS | Add/remove `app-dark` from **`matchMedia('(prefers-color-scheme: dark)')`** `.matches`; re-apply when media query **changes** (`change` event). |

**Separation of concerns (recommended model):**

- **User choice:** `'light' | 'dark' | 'system'` (persisted).
- **Effective dark flag:** derived boolean used only for DOM/PrimeNG (`isEffectiveDark` or internal apply method), **not** the same as “user picked dark” when mode is system.

---

### Product decisions (resolved)

| Topic | Decision |
|--------|----------|
| **Topbar control** | **Dropdown** with three explicit items: **Light**, **Dark**, **System** (not a single-button cycle). |
| **Floating configurator** | **Same dropdown UX** and same `themeMode` as topbar. |
| **Initial default for new users** | **`system`** when there is no prior persisted `theme` (or first visit before `branding` is written). |
| **Cycle order (reference only)** | If any future control cycles, order is **light → dark → system → light**; **current UX is dropdown only**. |
| **Trigger icons** | **`pi-sun`** (light), **`pi-moon`** (dark), **`pi-desktop`** (system) — icon reflects **selected mode**, not effective sun/moon when mode is system. |
| **Cross-tab sync** | **Yes:** `window` **`storage`** listener; when `localStorage` `branding` (or the key used for theme) changes in **another** tab, update in-app state and DOM (**note:** `storage` does not fire in the tab that wrote the value). |
| **SSR / non-browser** | If `matchMedia` unavailable, **fallback** to **light** effective appearance (documented). |
| **View Transitions** | Keep `handleDarkModeTransition` for **effective** theme changes (including system-driven flips). |

---

### Functional requirements

1. **FR-1 — Three persisted theme modes**  
   User can select **light**, **dark**, or **system**; choice is reflected in UI and persisted.

2. **FR-2 — System mode tracks OS**  
   When mode is **system**, effective theme follows `(prefers-color-scheme: dark)` and updates **without reload** when OS preference changes.

3. **FR-3 — DOM / PrimeNG alignment**  
   Effective dark/light continues to drive **`app-dark`** on `document.documentElement` consistent with `darkModeSelector: '.app-dark'`.

4. **FR-4 — Topbar and configurator**  
   Both entry points implement the same mode model (no divergent booleans-only toggles).

5. **FR-5 — Iconography**  
   Dropdown trigger shows **`pi-sun`** when mode is light, **`pi-moon`** when dark, **`pi-desktop`** when system (always **selected mode**, never effective-only sun/moon while in system).

6. **FR-6 — Accessibility**  
   Dropdown trigger has **translated** label/tooltip/aria (e.g. “Theme” / “Appearance”); each menu item uses **translated** **Light**, **Dark**, **System** labels; keyboard operable per PrimeNG overlay/menu patterns.

7. **FR-7 — Persistence**  
   `localStorage` `branding.theme` stores **`'light' | 'dark' | 'system'`**; read on startup restores mode; **`matchMedia` listener** when mode is **system**.

8. **FR-8 — Defaults and migration**  
   Legacy values `'light'` and `'dark'` load unchanged. **Missing** or **invalid** `theme` defaults to **`system`**. After user save, persisted `theme` is always **`'light' | 'dark' | 'system'`**.

9. **FR-9 — Cross-tab sync**  
   Register a **`storage`** listener (same origin); on relevant key change from **another** tab, parse `theme`, update `LayoutService` state, re-apply DOM and attach/detach `matchMedia` listener as needed **without** causing redundant writes that fight the originating tab.

---

### Non-functional requirements

- **NFR-1 — Performance:** `matchMedia` listener registered **at most one** active subscription when `themeMode === 'system'`; avoid duplicate listeners on navigation if service is singleton.
- **NFR-2 — No theme flash:** On cold start, apply stored mode + effective class **as early as practical** (existing branding load path) to minimize wrong-theme flash before system resolves.
- **NFR-3 — Memory / lifecycle:** When user switches from **system** to fixed light/dark, **remove** `matchMedia` `change` listener (or no-op handler) to avoid leaks (`DestroyRef` / `ngOnDestroy` as appropriate).
- **NFR-4 — Storage listener:** Single `storage` listener for the app lifetime (or service lifetime); handler must be **idempotent** and avoid infinite write loops when updating from remote tab events.

---

### Impact on types and services

| Area | Change |
|------|--------|
| **`BrandingSettings.theme`** | Extend to **`'light' \| 'dark' \| 'system'`** (source of truth for persisted user choice). |
| **`LayoutConfig`** | Replace or supplement `darkTheme: boolean` with **`themeMode: 'light' \| 'dark' \| 'system'`** *or* keep `darkTheme` as **effective** boolean **plus** `themeMode` for user choice — **recommend:** `themeMode` for choice + **`effectiveDark` computed** (or single `themeMode` + computed `isEffectiveDark`) to avoid dual sources of truth. |
| **`LayoutService`** | Load/save `themeMode` (default **`system`**); compute **effective** dark; **`setThemeMode(mode)`** (or equivalent) called by dropdown; **`applyThemeToDocument()`** on init, mode change, `matchMedia` `change`, and **`storage`** events from other tabs; **`matchMedia` + `storage`** listener lifecycle centralized here. |
| **`app.config.ts`** | No change required if selector stays `.app-dark` (verify). |
| **Topbar / Floating configurator** | **PrimeNG dropdown or tiered menu** with three options; trigger icon **`pi-sun` / `pi-moon` / `pi-desktop`**; bind selection to **`LayoutService.themeMode`**. |

---

### Theme control UX (chosen)

- **Control:** **Dropdown** (e.g. `p-select`, `p-tieredMenu`, or `p-overlay` + menu — match existing PrimeNG patterns in topbar/configurator).
- **Items:** Three explicit options — **Light**, **Dark**, **System** (all i18n).
- **Trigger:** Icon per **FR-5** (`pi-sun` / `pi-moon` / `pi-desktop`); optional chevron per layout consistency.
- **Reference cycle order** (not used in UI): light → dark → system → light — documented only for consistency if a shortcut is added later.

---

### System mode listener lifecycle

1. **On app init:** After reading `branding`, set `themeMode`; if `'system'`, read `matchMedia`, set effective class, **`addEventListener('change', handler)`**.
2. **On user switch to system:** Attach listener (if not attached), compute from `matchMedia`, apply class.
3. **On user switch to light/dark:** Update stored mode, apply class **directly**, **remove** listener or guard handler so system events are ignored.
4. **On service destroy (if applicable):** Remove `matchMedia` listener (defensive; often singleton lives app lifetime).

5. **Cross-tab (`storage`):** On `storage` event for the **branding** key (or theme slice), if `newValue` differs from current parsed state, **update `themeMode`** and call the same apply path as local user selection (including registering/removing `matchMedia` listener). **Do not** re-`setItem` identical JSON in the receiving tab if that would churn; merge state only when parsed `theme` actually changed.

Use **`matchMedia(...).addEventListener('change', ...)`** (or `addListener` for very old browsers if project still targets them — unlikely for Angular 21).

---

### Persistence and migration

- **Read path:** `theme: 'light' | 'dark'` → unchanged behavior for those users.
- **Missing `theme` / first visit:** Default to **`system`** before first persist (product: new users see system-following behavior).
- **New explicit value:** `'system'` when user selects System from dropdown.
- **Invalid JSON / unknown `theme` string:** Fallback to **`system`** (aligned with new-user default).
- Avoid breaking existing `branding` shape beyond extending `theme` union; **cross-tab** updates rely on full key write (typical `branding` JSON) — implementation should parse safely on `storage`.

---

### Edge cases and negative scenarios

| Scenario | Expected |
|----------|----------|
| **OS switches dark↔light while app open, mode = system** | UI updates within one event turn; View Transition if enabled. |
| **User on system, then OS has no “dark” (always light)** | Effective stays light; no error. |
| **`matchMedia` undefined (SSR, tests, old embed)** | Fixed fallback; no throw; tests may inject mock. |
| **localStorage quota / private mode** | Same as today: catch write failures; in-memory still works session. |
| **Two tabs same origin** | **Required:** other tab(s) update theme via **`storage`** when `localStorage` branding changes; originating tab relies on in-app state (no `storage` event locally). |
| **Icon in system mode while OS is dark** | Trigger stays **`pi-desktop`** (selected mode), not `pi-moon`. |
| **Floating configurator + topbar** | Both reflect same `themeMode` (single service state). |
| **PrimeNG dynamic theme** | Verify no regression when class toggles from media listener. |

---

### i18n

Add keys in **`translations.ts`** (en, tr, fr, de) for:

- **Dropdown / trigger:** e.g. `topbar.theme` or `layout.theme` — short label for aria/tooltip (“Theme”, “Appearance”).
- **Menu items:** **`theme.light`**, **`theme.dark`**, **`theme.system`** (or nested under same namespace) — strings for **Light**, **Dark**, **System**.
- **Optional helper** for system row: short subtitle “Follow device settings” / “Uses system appearance” if UX uses subtitles in menu items.

Reuse existing topbar translation patterns and key naming conventions in `translations.ts`.

---

### Acceptance criteria (testable)

- [ ] User can set theme to **light**, **dark**, and **system** from **topbar** via **dropdown** with three labeled options (i18n).
- [ ] **New profile / missing `theme`:** app behaves as **`system`** (effective follows OS) until user changes and persists.
- [ ] Choice persists across **full page reload**; invalid/missing `theme` after parse errors defaults to **`system`**.
- [ ] With **system** selected, toggling OS appearance (or DevTools emulation) updates app **without** manual toggle.
- [ ] With **light** or **dark** selected, changing OS appearance **does not** change app theme.
- [ ] **`app-dark`** on `<html>` matches **effective** dark state in all modes.
- [ ] **Floating configurator** uses the same **dropdown** model and stays in sync with topbar and `localStorage`.
- [ ] **Cross-tab:** change theme in tab A → tab B updates **without** reload (manual smoke with two windows).
- [ ] Legacy `branding` with only `light`/`dark` still loads correctly.
- [ ] No duplicate **`matchMedia`** listeners after repeated mode switches (manual or unit test).
- [ ] Trigger icons: **`pi-sun`**, **`pi-moon`**, **`pi-desktop`** per selected mode (**system** shows desktop even when OS is dark).
- [ ] `ng build` green; **manual** smoke: dropdown selections, reload, system + OS toggle, two-tab sync.

---

### Implementation breakdown (for engineering)

- [ ] Extend **`BrandingSettings.theme`** union to **`'light' | 'dark' | 'system'`**; **`LayoutService`**: default **`system`** when absent/invalid; persist on user change.
- [ ] Refactor **`LayoutConfig`**: `themeMode` + computed **`isEffectiveDark`** (or equivalent); map/remove legacy `darkTheme` boolean carefully.
- [ ] **`matchMedia('(prefers-color-scheme: dark)')`**: listener only while `themeMode === 'system'`; **`applyThemeToDocument()`** on effective change + View Transitions hook.
- [ ] **`window.addEventListener('storage', ...)`**: sync `themeMode` from other tabs when branding key updates; avoid write loops.
- [ ] **`app.topbar.ts`**: replace boolean toggle with **dropdown** + **`pi-sun` / `pi-moon` / `pi-desktop`** + i18n keys for trigger + three items.
- [ ] **`app.floatingconfigurator.ts`**: same dropdown + same service API.
- [ ] **`translations.ts`**: en/tr/fr/de for theme trigger + **light**, **dark**, **system** labels (and optional system subtitle).
- [ ] **Unit tests** (Angular): persistence defaults (**`system`**), parse of legacy values, listener registration/cleanup where feasible.
- [ ] **Manual:** DevTools `prefers-color-scheme` emulation; **two tabs** theme sync.

---

### Open questions — **all resolved** (stakeholder decisions)

| # | Topic | Resolution |
|---|--------|------------|
| 1 | Default for new users | **`system`** |
| 2 | Cycle order | **Accepted** as reference order (light → dark → system → light); **UI is dropdown**, not a cycle button |
| 3 | Icon in system mode | **`pi-desktop`** always for system (not effective sun/moon) |
| 4 | Cross-tab sync | **Yes** — `storage` event listener |
| 5 | UX control | **Dropdown** with three explicit options in **topbar** and **floating configurator** |

---

### Out of scope (unless product expands)

- **Scheduled** light/dark by **time of day** (separate from `prefers-color-scheme`).
- Per-user server-side theme preference (still localStorage-only unless backend added).
- Changing PrimeNG preset or `darkModeSelector` strategy beyond `.app-dark`.
- WCAG contrast audit of both themes (unless requested).

---

### Handoff — **ready for implementation**

All open questions are **resolved**. Implement:

- Persisted **`theme`**: `'light' | 'dark' | 'system'` with **default `system`** for new/missing/invalid.
- **`LayoutService`**: `setThemeMode`, effective dark, **`matchMedia`** lifecycle, **`storage`** cross-tab sync, **`applyThemeToDocument`** + existing transitions.
- **Topbar + floating configurator**: **dropdown** (three i18n options), trigger icons **`pi-sun` / `pi-moon` / `pi-desktop`**.
- **i18n** in en/tr/fr/de for dropdown labels.
- Verify **acceptance criteria** (including **two-tab** `storage` sync and DevTools OS theme emulation).