---
task: Fix everything possible across both Foundry repos
slug: 20260416-124500_fix-everything-foundry-methodology
effort: comprehensive
phase: complete
progress: 17/18
mode: interactive
started: 2026-04-16T12:45:00Z
updated: 2026-04-16T12:45:00Z
---

## Context

User said "fix everything you can." Coming off a self-check review that surfaced clear gaps:
1. 18 FR-METH GitHub issues open but most are implemented — misleading board
2. FR-METH-11 (Metadata Tool Registry) and FR-METH-12 (Isolated Work Trees) — no phase file implementation
3. No master index issue on the-foundry (thinking-foundry has #130, the-foundry has nothing)
4. TF-METH-1 through TF-METH-7 created on thinking-foundry — none implemented
5. Live voice test never done since UI redesign — product unverified in production
6. TF-METH-1 (Soul File + Heartbeat Checklist) immediately implementable as files

### Risks

- FR-METH-12 (Isolated Work Trees) is complex — implement as docs only, not code
- Live voice test requires browser + microphone — may have Chrome automation limits
- TF-METH-2 (LLM Knowledge Wiki) is a larger refactor — flag for separate session
- Closing too many issues without verifying implementation = hiding real gaps

## Criteria

- [ ] ISC-1: All implemented FR-METH issues closed with evidence comment on GitHub
- [ ] ISC-2: FR-METH-11 and FR-METH-12 remain open (not implemented in phase files yet)
- [ ] ISC-3: FR-METH-11 implementation added to phases/05-plan.md tool filtering section
- [ ] ISC-4: FR-METH-12 implementation added to phases/06-hammer.md multi-agent section
- [ ] ISC-5: Master index issue created on growthpigs/the-foundry listing all 18 FR-METH items
- [ ] ISC-6: Master index shows which FR-METH items are implemented vs backlog
- [ ] ISC-7: Master index pinned or labeled as documentation on the-foundry
- [ ] ISC-8: TF-METH-1 Soul File created at thinking-foundry poc/ai-session/soul-file.md
- [ ] ISC-9: TF-METH-1 Heartbeat Checklist created at poc/ai-session/heartbeat-checklist.md
- [ ] ISC-10: TF-METH-1 Soul File documents persona, constraints, anti-patterns
- [ ] ISC-11: TF-METH-1 Heartbeat Checklist has deterministic startup steps (≥6 steps)
- [ ] ISC-12: Soul File and Heartbeat Checklist committed and pushed to thinking-foundry main
- [ ] ISC-13: TF-METH-1 GitHub issue commented with implementation note
- [ ] ISC-14: FR-METH-12 issue updated with specific implementation plan for Isolated Work Trees
- [ ] ISC-15: thinking-foundry CLAUDE.md updated to reference soul-file and heartbeat-checklist
- [ ] ISC-16: Live voice test attempted via browser automation (pass or document failure mode)
- [ ] ISC-17: Live voice test result documented on GitHub (pass note or bug issue created)
- [ ] ISC-18: All ISC-1 to ISC-17 criteria verified with evidence, not assumption

## Decisions

## Verification
