# AI-Driven Development Workflow Overview

## 1. Introduction

This document describes the AI-driven development workflow used in this repository. The workflow is designed to ensure systematic, testable, and maintainable feature development through strict version-aware, feature-by-feature implementation.

### Philosophy

**Feature-by-Feature Implementation:**
- Only one feature is implemented per iteration
- Each feature must pass all tests before being marked complete
- Features are developed sequentially, reducing complexity and improving code quality

**Rigorous Testing:**
- Every feature requires passing unit tests (`npm test`) and E2E tests (`npm run test:e2e`)
- Manual checks are performed when automated tests are insufficient
- No feature is marked complete until all tests pass

**Explicit Version Boundaries:**
- Versions are planned before implementation begins
- Features are explicitly associated with versions
- Version transitions are controlled and documented

**Persistent Memory Outside LLM Context:**
- All state is stored in JSON and Markdown files
- Progress is tracked explicitly, not inferred from code
- The workflow is resumable across sessions without context memory

### Goals

1. **Consistency**: Ensure all team members and AI agents follow the same process
2. **Quality**: Enforce testing requirements before features are considered complete
3. **Traceability**: Maintain clear records of what was implemented, when, and why
4. **Resumability**: Allow any developer or AI agent to pick up work from any point
5. **Boundaries**: Prevent cross-version feature implementation and maintain clear version states

---

## 2. Core Files and Their Purpose

The workflow relies on several core files that work together to create persistent memory:

### Claude.md
**Purpose**: Project overview and context documentation

**Contains**:
- Project description and goals
- Technology stack
- Current state summary
- Workflow requirements

**Role**: Provides human-readable context for understanding the project's purpose, constraints, and current status.

### features.json
**Purpose**: Feature registry and progress tracking

**Structure**:
```json
{
  "features": [
    {
      "id": "F001",
      "title": "Feature Title",
      "description": "Feature description",
      "tests": ["Unit test: ...", "E2E test: ...", "Manual: ..."],
      "implemented": false,
      "tests_passed": false
    }
  ]
}
```

**Role**: 
- Central registry of all features
- Tracks implementation and test status
- Provides test specifications for each feature
- Must never be modified except to mark features as implemented/tests_passed

**Rules**:
- Features cannot be modified (title, description, tests) during implementation
- Features cannot be reordered or removed
- Only `implemented` and `tests_passed` fields may be changed by coding agents

### versions.json
**Purpose**: Version state management and feature grouping

**Structure**:
```json
[
  {
    "label": "1.0.0",
    "name": "Initial Release",
    "status": "active",
    "notes": "Version notes",
    "features": ["F001", "F002", "F003"],
    "deferred_features": []
  }
]
```

**Role**:
- Defines version boundaries
- Associates features with versions
- Tracks version status (planned → active → implemented/released)
- Manages deferred features when versions transition

**Status Values**:
- `"planned"`: Version is planned but not yet active for implementation
- `"active"`: Version is currently being implemented
- `"implemented"`: Version features are complete
- `"released"`: Version is released to users

### progress.md
**Purpose**: Implementation history and development log

**Contains**:
- Dated entries for each feature implementation
- Test results and outcomes
- Implementation notes and decisions
- Version completion summaries

**Role**: Provides human-readable history of development progress, decisions, and outcomes.

### ai-workflow.mdc
**Purpose**: Strict workflow rules and constraints

**Location**: `.cursor/rules/ai-workflow.mdc`

**Role**: 
- Defines all workflow rules and constraints
- Specifies what different command types can and cannot do
- Enforces version awareness and feature boundaries
- Must be read at the start of every session

**Key Sections**:
- Always Read requirements
- Roles & Responsibilities (planning vs activation vs coding commands)
- Version Awareness & Target Selection
- Development Loop
- Prohibitions

### package.json
**Purpose**: Project metadata and version tracking

**Role**:
- Stores the current package version
- Only the `"version"` field should be modified, and only by activation/bump commands
- Used for version awareness but not for arbitrary changes

---

## 3. Version Model

The workflow uses a version-aware model where features are organized into versions with explicit states and transitions.

### Version States

**Planned** (`"planned"`):
- Version is documented in PRD and architecture docs
- Features may not yet exist in `features.json`
- Not active for implementation
- Created via `@plan-version` command

**Active** (`"active"`):
- Version is currently being implemented
- Features are defined in `features.json`
- Only features in the active version's `features` array may be implemented
- Exactly one version should be active at a time
- Created via `@activate-version` command

**Implemented** (`"implemented"`):
- All features for this version are complete and passing tests
- Version status changed from `"active"` to `"implemented"`
- Ready for release but not yet released

**Released** (`"released"`):
- Version has been released to users
- Final state of a version

### Version Transitions

1. **Planning → Active**: `@activate-version`
   - Checks previous version completion
   - Creates features in `features.json`
   - Updates version status to `"active"`
   - Updates `package.json` version

2. **Active → Implemented**: `@activate-version` (when activating next version)
   - Verifies all features are complete
   - Changes status from `"active"` to `"implemented"`
   - Stashes incomplete features as `deferred_features` if any exist

3. **Implemented → Released**: Manual or via `@activate-version`
   - Marks version as `"released"`

### Feature Association

Features are associated with versions through:
- The `features` array in `versions.json` containing feature IDs
- Features themselves reference their version in descriptions when created during activation

### Deferred Features

When a version is transitioned from `"active"` to `"implemented"` but has incomplete features:
- Incomplete features are moved to `deferred_features` array
- They remain in `features.json` unchanged
- They can be implemented later via `@work-deferred` command
- They do not block version transitions if explicitly deferred

---

## 4. Feature Lifecycle

Features progress through several stages:

### 1. Planning Stage
- Feature is designed and documented
- Added to `features.json` with `implemented: false`, `tests_passed: false`
- Test specifications are defined
- Associated with a version (either at version activation or via `@new-feature`)

### 2. Implementation Stage
- Feature is selected for implementation (via `@next-feature` or `@work-deferred`)
- Code is written to satisfy the feature description and tests
- Only this one feature is implemented in this iteration

### 3. Testing Stage
- Unit tests are run (`npm test`)
- E2E tests are run (`npm run test:e2e`)
- Manual checks are performed if specified
- All tests must pass

### 4. Completion Stage
- Feature is marked `implemented: true` and `tests_passed: true`
- Entry is added to `progress.md`
- Git commit is created: `feat: {id} {short description}`
- Version completion is re-checked

### 5. Deferral (Optional)
- Feature may be deferred if version transitions before completion
- Moved to `deferred_features` in `versions.json`
- Can be completed later via `@work-deferred`

---

## 5. Development Flow (Step-by-Step)

### Starting a New Version

1. **Plan the Version** (`@plan-version`):
   - Define version goals, constraints, and non-goals
   - Update PRD and architecture docs
   - Create version entry in `versions.json` with status `"planned"`

2. **Activate the Version** (`@activate-version`):
   - Verify previous version completion (or stash incomplete features)
   - Create features in `features.json`
   - Link features to version in `versions.json`
   - Set version status to `"active"`
   - Update `package.json` version

### Implementing Features

3. **Implement Next Feature** (`@next-feature`):
   - Identify next incomplete feature in active version
   - Implement the feature
   - Run all tests until passing
   - Mark feature complete in `features.json`
   - Update `progress.md`
   - Create git commit

4. **Repeat Until Version Complete**:
   - Continue with `@next-feature` until all features are complete
   - When complete, prompt for `@activate-version` to transition

### Handling Deferred Work

5. **Work on Deferred Features** (`@work-deferred`):
   - Select a version with deferred features
   - Implement deferred features one at a time
   - Same testing and completion requirements apply

### Version Completion

6. **Activate Next Version** (`@activate-version`):
   - Transition completed version to `"implemented"`
   - Activate next planned version
   - Or bump version if needed (`@bump-version`)

### Adding Features Ad-Hoc

7. **Add New Feature** (`@new-feature`):
   - Design and specify a feature interactively
   - Add to `features.json`
   - Implement via `@next-feature` when ready

---

## 6. Summary of All Commands

| Command | Purpose | What It Modifies |
|---------|---------|------------------|
| `@plan-version` | Plan a new version: PRD, architecture, `versions.json` | `versions.json`, PRD docs, architecture docs, `Claude.md` |
| `@activate-version` | Transition planned → active, create features, update package version | `versions.json`, `features.json`, `package.json` |
| `@next-feature` | Implement the next unimplemented feature for the active version | Code files, `features.json` (mark complete), `progress.md`, git commits |
| `@new-feature` | Interactively design and add a single new feature to `features.json` | `features.json` (append only) |
| `@new-version` | Legacy embedded version creation workflow (use `@plan-version` + `@activate-version` instead) | `versions.json`, `features.json`, PRD, architecture docs |
| `@work-deferred` | Implement a deferred/backlog feature from a version | Code files, `features.json` (mark complete), `progress.md`, git commits |
| `@bump-version` | Safely update `package.json` version and optionally align with `versions.json` | `package.json`, optionally `versions.json` |

### Command Permissions

**Planning Commands** (`@plan-version`):
- ✅ Create/update `versions.json` with `status="planned"`
- ✅ Update PRD and architecture docs
- ❌ Modify `features.json`
- ❌ Modify `package.json`
- ❌ Touch code files

**Activation Commands** (`@activate-version`):
- ✅ Change version statuses in `versions.json`
- ✅ Attach features to versions
- ✅ Populate `deferred_features`
- ✅ Update `package.json` version
- ❌ Mark features as implemented
- ❌ Modify code files
- ❌ Run tests

**Coding Commands** (`@next-feature`, `@work-deferred`):
- ✅ Implement code for one feature
- ✅ Run tests
- ✅ Mark feature as implemented/tests_passed
- ✅ Update `progress.md`
- ✅ Create git commits
- ❌ Modify `versions.json`
- ❌ Modify `package.json` version
- ❌ Add/remove/reorder features in `features.json`
- ❌ Modify feature definitions (title, description, tests)

---

## 7. Design Principles & Enforcement Rules

### Core Principles

1. **Feature-by-Feature**: Only one feature is implemented per iteration
2. **Test-First Completion**: Features are only marked complete when all tests pass
3. **Version Boundaries**: Features from non-active versions cannot be implemented
4. **Persistent State**: All state is in files, not inferred from code
5. **Strict Permissions**: Different command types have different modification rights

### Strict Constraints

**No Silent Feature Creation or Modification**:
- Features must be explicitly created via `@new-feature` or `@activate-version`
- Feature definitions (title, description, tests) cannot be modified during implementation
- Only `implemented` and `tests_passed` fields can be changed

**No Cross-Version Implementation**:
- Only features in the active version's `features` array can be implemented
- Features in `deferred_features` require explicit `@work-deferred` command
- Planned versions cannot have their features implemented

**No Skipping Tests**:
- All unit tests must pass (`npm test`)
- All E2E tests must pass (`npm run test:e2e`)
- Manual checks must be performed if specified
- Features cannot be marked `tests_passed: true` if tests fail

**Only Specific Commands Modify Version States**:
- Only `@activate-version` can change version statuses
- Only `@activate-version` or `@bump-version` can modify `package.json` version
- Coding commands cannot modify `versions.json`

**Implementation Always One Feature at a Time**:
- Never implement multiple features in a single iteration
- Each feature gets its own commit
- Each feature is tested independently

**All Actions Logged to progress.md**:
- Every completed feature gets a dated entry
- Test results are documented
- Implementation notes are preserved

**Git Commits Only When Features Pass Tests**:
- Commits follow format: `feat: {id} {short description}`
- Deferred features: `feat: [deferred] {id} {short description}`
- Commits are only created after tests pass

---

## 8. Example Workflows

### New Version Flow

1. **Plan Version 2.0.0**:
   ```
   @plan-version
   → Answer questions about goals, constraints, non-goals
   → Updates versions.json with status="planned"
   → Updates PRD and architecture docs
   ```

2. **Activate Version 2.0.0**:
   ```
   @activate-version
   → Checks version 1.0.0 completion
   → Creates features F021-F035 in features.json
   → Updates versions.json: 1.0.0 → "implemented", 2.0.0 → "active"
   → Updates package.json version to "2.0.0"
   ```

3. **Implement Features**:
   ```
   @next-feature → Implements F021 → Tests pass → Commit
   @next-feature → Implements F022 → Tests pass → Commit
   ... (repeat until all features complete)
   ```

4. **Version Complete**:
   ```
   @next-feature detects all features complete
   → Prompts: "Run @activate-version to transition?"
   ```

5. **Transition**:
   ```
   @activate-version
   → Sets 2.0.0 status to "implemented"
   → Activates next planned version (if any)
   ```

### Deferred Work Flow

1. **Activate Version with Incomplete Previous**:
   ```
   @activate-version for 2.0.0
   → Detects 1.0.0 has incomplete F015, F016
   → Asks: "Stash as deferred?"
   → User confirms
   → Moves F015, F016 to deferred_features
   ```

2. **Work on Deferred**:
   ```
   @work-deferred
   → Selects version 1.0.0
   → Shows deferred features: F015, F016
   → User selects "first-unfinished"
   → Implements F015 → Tests pass → Commit
   ```

3. **Complete All Deferred**:
   ```
   @work-deferred (repeat for F016)
   → All deferred features complete
   ```

### Maintenance Flow (Adding Ad-Hoc Features)

1. **Add New Feature**:
   ```
   @new-feature
   → Interactive Q&A to design feature
   → Adds F036 to features.json
   ```

2. **Implement**:
   ```
   @next-feature
   → Detects F036 as next incomplete
   → Implements F036 → Tests pass → Commit
   ```

---

## 9. FAQ

### When should I plan vs activate a version?

**Plan** (`@plan-version`) when:
- You want to document a future version without implementing it yet
- You need to discuss goals and constraints before committing to implementation
- You want to maintain a roadmap of planned work

**Activate** (`@activate-version`) when:
- A planned version is ready for implementation
- Previous version is complete (or you want to defer incomplete features)
- You want to start implementing features for a new version

### Why can't features be modified once created?

Feature definitions (title, description, tests) are considered contracts. Changing them would:
- Break traceability with progress.md entries
- Make it unclear what was actually implemented
- Allow scope creep during implementation

If a feature needs significant changes, create a new feature instead.

### Why is versions.json authoritative?

`versions.json` is the single source of truth for:
- Which version is active
- Which features belong to which version
- Which features are deferred
- Version status transitions

Coding agents read `versions.json` to determine what they can implement. This prevents:
- Implementing features from wrong versions
- Accidentally working on deferred features
- Losing track of version boundaries

### Why can only activation/bump commands modify package.json version?

Version bumps are intentional, high-level decisions that should:
- Align with version transitions
- Be explicit and documented
- Not happen accidentally during feature implementation

Separating version management from feature implementation maintains clear boundaries and prevents version drift.

### What happens if I implement a feature that's not in the active version?

This should not happen if following the workflow correctly. The `@next-feature` command:
- Only selects features from the active version's `features` array
- Will not proceed if there's no active version
- Will prompt to activate a version if needed

If this occurs, it indicates a workflow violation that should be corrected.

### Can I work on multiple features in parallel?

No. The workflow enforces one feature per iteration because:
- It reduces complexity
- Ensures each feature is fully tested before moving on
- Makes commits atomic and reviewable
- Prevents feature interdependencies from causing issues

### How do I resume work after a break?

1. Read core files:
   - `Claude.md` - project context
   - `features.json` - feature registry
   - `progress.md` - what's been done
   - `versions.json` - version states

2. Identify:
   - Active version (if any)
   - Next incomplete feature
   - Current state of the project

3. Continue with `@next-feature` or appropriate command

The workflow is designed to be fully resumable without requiring context memory.

---

## 10. Final Notes

### Commit Discipline

- One commit per feature
- Commit message format: `feat: {id} {short description}`
- Commits only when tests pass
- Working, mergeable state at all times

### Test Quality

- Unit tests for logic and components
- E2E tests for user flows
- Manual checks for edge cases and UX
- All tests must pass before feature completion

### Resumability

The entire workflow is designed around resumability:
- All state in files, not memory
- Explicit progress tracking
- Clear version and feature boundaries
- Any developer or AI agent can pick up from any point

### Reproducibility Across Sessions

- Workflow rules are in `ai-workflow.mdc`
- State is in JSON/Markdown files
- No reliance on conversation context
- Clear commands for each action

### Getting Started

For new contributors or AI agents:

1. Read this document
2. Read `ai-workflow.mdc` for strict rules
3. Read `Claude.md` for project context
4. Read `features.json` and `versions.json` for current state
5. Read `progress.md` for recent history
6. Use appropriate commands based on what needs to be done

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-27  
**Maintainer**: AI Workflow Documentation Assistant
