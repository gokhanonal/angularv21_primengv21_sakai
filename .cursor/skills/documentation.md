---
name: documentation
description: "Generate and maintain documentation for codebases — docstrings, README files, architecture guides, API references, and inline comments in Markdown format. USE FOR: document code, write README, add docstrings, generate API docs, explain architecture, document module, create guide, update docs, review documentation coverage. Applies proactively when writing new code, during refactors, and on explicit request."
license: MIT
metadata:
  author: gokhanonal@gmail.com
  version: "1.0.0"
---

# Documentation

## When to Apply

- **Proactively** when generating or modifying code: add/update docstrings and module-level docs.
- **During review/refactor**: flag undocumented public APIs and suggest additions.
- **On explicit request**: generate READMEs, architecture docs, API references, or guides.

## General Principles

1. **Audience-first** — write for the next developer, not for yourself.
2. **Why over what** — explain intent, trade-offs, and constraints; the code already shows *what*.
3. **Keep it close to the code** — prefer docstrings and co-located markdown over a separate wiki.
4. **Single source of truth** — never duplicate information; link instead.
5. **Evergreen** — avoid dates, version-specific language, or time-sensitive phrasing.

## Code Documentation

### Python

Use Google-style docstrings in Markdown:

```python
def fetch_issues(project_key: str, *, max_results: int = 50) -> list[Issue]:
    """Fetch Jira issues for a project.

    Args:
        project_key: The Jira project key (e.g. `"PROJ"`).
        max_results: Upper bound on returned issues.

    Returns:
        List of `Issue` objects sorted by creation date descending.

    Raises:
        JiraAuthError: If the API token is invalid or expired.
    """
```

### JavaScript / TypeScript

Use JSDoc with Markdown descriptions:

```typescript
/**
 * Fetch issues for a project.
 *
 * @param projectKey - Jira project key (e.g. `"PROJ"`)
 * @param options.maxResults - Upper bound on returned issues
 * @returns Issues sorted by creation date descending
 * @throws {AuthError} If the API token is invalid
 */
```

### Other Languages

Follow the language's dominant docstring convention. When unsure, prefer Markdown-compatible block comments.

### Rules

- Document every **public** function, class, and module.
- Skip trivial getters/setters and obvious one-liners.
- Include `Args`/`Returns`/`Raises` (or equivalent) when non-obvious.
- Add a brief module-level docstring to every file explaining its purpose.

## Project Documentation

### README Template

```markdown
# Project Name

One-line description of what this project does.

## Quick Start

\`\`\`bash
# install
pip install -r requirements.txt

# run
python main.py
\`\`\`

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Base URL for the API | — |

## Architecture

Brief description or link to `docs/architecture.md`.

## Contributing

How to set up a dev environment, run tests, and submit changes.
```

Adapt sections to the project. Remove what's irrelevant; add what's missing.

### Architecture Docs

Use this structure when documenting system design:

```markdown
# Architecture — [System Name]

## Overview
One paragraph summarizing the system's purpose and high-level design.

## Components
Describe each major component, its responsibility, and how it communicates.

## Data Flow
Describe the primary data paths through the system.

## Key Decisions
| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| Choice A | Why | What we gave up |
```

## API Reference Documentation

For REST or library APIs, document each endpoint/function with:

```markdown
### `GET /api/issues`

Retrieve issues for a project.

**Parameters**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `project` | query | string | yes | Project key |
| `limit` | query | integer | no | Max results (default 50) |

**Response** `200 OK`

\`\`\`json
{
  "issues": [{ "id": "PROJ-1", "summary": "..." }],
  "total": 142
}
\`\`\`

**Errors**

| Status | Description |
|--------|-------------|
| 401 | Invalid or missing auth token |
| 404 | Project not found |
```

## Documentation Review Checklist

When reviewing existing docs or code for documentation coverage:

- [ ] Every public module has a top-level docstring
- [ ] Every public function/class has a docstring with args/returns/raises
- [ ] README exists and has Quick Start + Configuration sections
- [ ] No stale or contradictory information
- [ ] Links are not broken
- [ ] Examples are runnable as-is
