# Phase 7: TEMPER — Harden & Ship

**Metaphor:** Tempering is the final heat treatment that gives steel its strength and resilience. Without it, the blade is brittle.

**Duration:** 1-4 hours per PR
**Mode applicability:** ALL modes

---

## What Happens

The code from HAMMER is hardened through testing, reviewed through compliance check, validated visually through CIC, and shipped to production. This is where draft PRs become merged code and deployed product.

### Inputs
- Draft PRs from HAMMER
- Anti-regression baseline
- Test suite
- CIC Validation Prompt template

### Process

#### Step 1: Compliance Check (Post-Code Red Team)

The second of the Two Red Teams (Article 7):
- CRUCIBLE (Phase 4) asked: "What if we're wrong?" — BEFORE code
- COMPLIANCE CHECK asks: "Did we build what was debated?" — AFTER code

Compare the implementation against:
- The FSD — did we implement what was specified?
- The Crucible findings — did we address what was found?
- The acceptance criteria — does it pass?
- The failure definitions — did we avoid what we said we'd avoid?

##### Persona-Level Code Tracing (Mandatory for UI-touching PRs)

**Born from:** IT Concierge FSD Gap Report (March 2026). Point-by-point FSD compliance said "yes, we built what was specified." But Lino couldn't edit a client, track materials, or export an invoice. The FSD compliance check validates specs vs code. Persona tracing validates that the user can actually run their business.

**Protocol:** For each primary persona (max 3), trace their critical daily path through actual code:

```
Persona: Lino Lazo (Owner/Dispatcher)
Action: Edit client billing address
Path: /clients/[id] page → ClientDetailPage component → [MISSING: no edit button]
      → ClientForm accepts client prop for edit mode → [MISSING: nothing triggers edit mode]
      → updateClient() server action → [EXISTS but unreachable from UI]
Verdict: ❌ GAP — server action exists, UI trigger missing
```

For each action, trace: **UI Component → Event Handler → Server Action → Database Operation**. A broken link anywhere in that chain = a gap.

**Input:** Use the Proof Report from ASSAY (`.foundry/proof-report.md`) as the checklist. If ASSAY was run with the Structured Walkthrough, the Proof Report already lists every action to verify. If no Proof Report exists (FIX mode, older projects), trace the persona's top 10 daily tasks.

**Output:** FSD Gap Report — prioritized P0/P1/P2/P3, with exact file paths, US references, FR references.

```markdown
## FSD Gap Report — [Project Name]

### Summary
| Priority | Count | Impact |
|----------|-------|--------|
| P0 — Blocking | X | Cannot run business |
| P1 — High Value | Y | Daily ops impacted |
| P2 — Important | Z | Feature completeness |

### Gaps
- **GAP-01**: [Action] — [Component path] → [Server action] → [DB] — [What's missing] (US-NNN, FSD-NNN FR-NNN)
- ...
```

**Artifact location:** `.foundry/gap-report.md` — referenced in progress.txt as `[GAP-REPORT] report=.foundry/gap-report.md`

##### Mode Applicability for Persona Tracing

| Mode | Runs Persona Tracing? | Scope |
|------|----------------------|-------|
| GREENFIELD | ✅ Full (all personas, all features) | All FSDs |
| FEATURE | ✅ Scoped (affected personas, affected features) | Feature FSDs only |
| FIX | ⏭ Skip (unless fix touches CRUD lifecycle) | — |
| HOTFIX | ⏭ Skip | — |
| SPEC | ⏭ Skip (no code to trace) | — |
| REFACTOR | ⏭ Skip (behavior-preserving) | — |
| SECURE | ✅ Security-relevant paths only | Auth/RLS paths |

#### Step 2: E2E Testing

Every feature PR must include E2E test assertions:
- Maps to the Critical Path (the project's single most important flow)
- Bug fixes add regression E2E tests for the specific failure
- Refactors verify existing E2E tests still pass

#### Step 3: Anti-Regression Comparison

Compare current state against the baseline captured before HAMMER:
- Test count: must not decrease
- Test results: no new failures
- TypeScript errors: must not increase
- API shapes: must not change unexpectedly (REFACTOR mode)

Any regression → BLOCK. Fix before proceeding.

#### Step 4: CI Pipeline (5 Gates)

Every PR must pass all 5 CI gates:
1. **Type Safety** — `tsc --noEmit`
2. **Build** — Production build succeeds
3. **Unit Tests + Coverage** — Tests pass, coverage reported to SonarCloud
4. **Security Scan** — White-label check, secrets scan, multi-tenant isolation
5. **E2E Health** — Blood test / Playwright against staging

**The "All Green" Rule:** If a CI check exists, it must pass. No "it's fine, we know about it."

#### Step 5: CIC Validation (Visual Verification)

For PRs that touch UI:
1. CC generates a CIC Validation Prompt (Article 27)
2. Human pastes prompt into Claude in Chrome
3. CIC executes visual checks, produces a Validation Report
4. Human copies report back to CC
5. CC reads report, decides: merge / create issues / abort

#### Step 6: Merge & Deploy

Once all gates pass:
1. Merge PR to main
2. Deploy to staging (auto)
3. Verify staging
4. Deploy to production (manual for most projects)
5. Blood test against production
6. Update Demo Readiness milestone

#### Step 7: Knowledge Graduation

After merge:
1. Archive progress.txt to `.foundry/archive/`
2. Graduate recurring findings to error-patterns.md (3+ occurrences)
3. Update Activity Log with final summary
4. Update Work Ledger with DUs
5. Update features/*.md if impacted

### Outputs
- Merged code on main
- Deployed to staging/production
- CIC Validation Report
- Updated Activity Log
- Updated Work Ledger
- Graduated knowledge (error-patterns.md)
- Demo Readiness milestone updated

---

## ⚖️ R7: Ship Gate

See [ratify.md](ratify.md#r7-ship-gate-after-temper)

**Key question:** "Prove it's done. Show me evidence."

**Must pass:**
- [ ] `git diff` shows exactly what changed
- [ ] All tests pass (exit code 0)
- [ ] Linter clean, type check clean, build succeeds
- [ ] CI pipeline all green (5 gates)
- [ ] CIC Validation Report: SAFE TO MERGE (if UI changes)
- [ ] Anti-regression: no regressions
- [ ] Compliance Check: implementation matches FSD
- [ ] Persona-Level Code Tracing completed (GREENFIELD/FEATURE/SECURE; FIX if CRUD lifecycle touched) — FSD Gap Report produced (`.foundry/gap-report.md`)
- [ ] All P0 gaps from FSD Gap Report addressed OR tracked as known debt with GitHub issue numbers
- [ ] Production deploy verified (if applicable)
- [ ] Activity Log updated
- [ ] Work Ledger updated
- [ ] ICE Report produced
- [ ] Confidence ≥ 9/10 (highest bar — this is shipping)
