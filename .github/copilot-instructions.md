
# Copilot Instructions (ThirdScreen)

You are working in the ThirdScreen repo.

## Skill-aware workflow (MANDATORY)

This repo contains "skills" that define quality standards and implementation checklists:

- Skills live under `.github/copilot/skills/<skill-name>/skill.md`.

**For EVERY code change request (except purely informational questions), you MUST:**

1. **Before making any changes**, identify the smallest set of relevant skills that directly affect the files you're working on.
2. **Pick one random additional skill** from the heuristics list and check if it applies to your changes.
3. **Open and read** the corresponding `skill.md` files as the source-of-truth checklist.
4. **Apply the skill guidance** to validate and improve the codebase changes you make.
5. **State which skills you applied** in your response to the user.

This is NOT optional - skills ensure code quality and consistency across the entire application.

### How to choose skills

- If the user explicitly names a skill (e.g., "apply accessibility best practices"), load that exact skill.
- If the user does not name a skill, **automatically scan** the skill heuristics below and identify which skills are relevant based on:
  - The files you're modifying
  - The type of change being made
  - The systems/patterns involved
- Pick the **smallest set** that directly affects the request, PLUS **one random skill** to validate against.
- If the skill choice is ambiguous, ask up to 2 clarifying questions before making large changes.

### Skill selection heuristics (use as hints)

- Accessibility/UI semantics/ARIA/keyboard → `accessibility-best-practices`
- Install/update/uninstall/versioning/release channels → `app-distribution-awareness`
- Build pipelines/GitHub Actions/release automation → `ci-cd-awareness`
- Boundaries/layers/ports-adapters → `clean-architecture`
- Focus/keyboard/window behavior → `desktop-ux-principles`
- Frontend↔Tauri command contracts → `ipc-contracts`
- Multi-display behavior → `multi-monitor-ux`
- Window creation/lifecycle/state → `multi-window-management`
- Windows registry/startup/context menu/protocols → `os-integration-windows`
- Performance profiling/budgets/render costs → `performance-optimization`
- Extensibility/registries/plugin boundaries → `plugin-ready-design`
- React idioms/hooks/effects/18 patterns → `react-18-best-practices`
- Rust correctness/error handling/safety → `rust-safety-principles`
- Split responsibilities/modules → `separation-of-concerns`
- SOLID refactors/APIs → `solid-principles`
- Persisted state/migrations/compat → `state-persistence`
- Tauri v2 config/plugins/security → `tauri-v2-architecture`
- Testing strategy/mocks/fixtures → `testability-design`
- TS strictness/types/tsconfig → `typescript-strict-mode`
- Widget APIs/contracts/metadata → `widget-contract-design`
- Zustand store structure/selectors → `zustand-state-architecture`

### When no skill applies

Only skip skill application if the request is:
- Purely informational (no code changes)
- Simple questions about the codebase
- Reading/understanding existing code without modifications

## Guardrails

- Prefer minimal, surgical changes.
- Don't invent new UX beyond what's requested.
- Validate with the closest build/test command when feasible.

