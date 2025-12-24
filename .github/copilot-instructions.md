
# Copilot Instructions (ThirdScreen)

You are working in the ThirdScreen repo.

## Skill-aware workflow (required)

This repo contains “skills” that define quality standards and implementation checklists:

- Skills live under `.github/copilot/skills/<skill-name>/skill.md`.

Whenever the user prompt implies applying one or more skills (explicitly or implicitly), you MUST:

1. Identify the most relevant skill(s) based on the user request.
2. Open and follow the corresponding `skill.md` as the source-of-truth checklist.
3. Apply the skill guidance to the codebase changes you make (not just advice).

### How to choose skills

- If the user explicitly names a skill (e.g., “apply accessibility best practices”), load that exact skill.
- If the user does not name a skill, infer likely skills from the prompt.
- If multiple skills could plausibly apply, pick the smallest set that directly affects the request.
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

If the request is purely informational or a tiny change, proceed normally.

## Guardrails

- Prefer minimal, surgical changes.
- Don’t invent new UX beyond what’s requested.
- Validate with the closest build/test command when feasible.

