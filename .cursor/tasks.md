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