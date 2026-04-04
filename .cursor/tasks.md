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

- [ ] On first visit to `/station-management` with a normal dataset, **scrollable data columns** show widths that **reduce obvious clipping** of typical values (addresses, names, codes) compared to fixed min-only layout, without breaking horizontal scroll.
- [ ] **Min-width** rules from column definitions are **never violated**.
- [ ] Auto-sizing runs **after data is loaded** and the table replaces the skeleton (not during skeleton-only state).
- [ ] Changing **language** (header text length changes) updates layout appropriately on **next load or explicit refresh** (define: default = on **reload** of data or page refresh; document if live language switch must re-trigger).

**B. User resize**

- [ ] User can **drag** the boundary between **adjacent scrollable data columns** to change width.
- [ ] With default **`fit`** mode, resizing **does not** cause the table to grow without bound inside the scroll container (behavior matches PrimeNG `fit` semantics).
- [ ] Frozen **selection**, **station code**, **station name**, and **actions** columns **do not** expose resize handles (per default product decision).
- [ ] Resize **coexists** with **column reorder** (reorder still works; widths stay with column field).

**C. Skeleton**

- [ ] While loading, skeleton layout **approximates** the final table: toolbar/caption strip + **grid of skeleton bars** aligned to **visible** columns (including frozen columns count).
- [ ] Skeleton container height is **visually consistent** with the loaded table area (no large vertical jump when swapping skeleton → table).
- [ ] On **load error**, current behavior is preserved (error message + retry; **no** misleading full-grid skeleton).

**D. Regression / integration**

- [ ] **Export** still produces correct data; column widths in UI **do not** corrupt exported values.
- [ ] **Column picker**: hiding/showing columns updates the grid and skeleton column count; **no** runtime errors.
- [ ] **Clear filters** still clears global search when that control exists (per project Angular grid rule).
- [ ] `ng build` succeeds; **manual** smoke on Chrome (and one secondary browser if the team routinely tests Safari).

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