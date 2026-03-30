# The Foundry — Complete System

**The Foundry is a structured thinking and building process for founders.** 14 phases organized into 3 segments: before, during, and after. Each phase is a cognitive mode switch with specific inputs, outputs, and Ratify gates.

---

## Structure at a Glance

```
PRE-FOUNDRY (Client intake, requirements, agreements)
    ↓
LAUNCH (Phase 0) — Load methodology, project, mode
    ↓
MINE (Phase 1) — Raw firehose of ideas
    ↓
SCOUT (Phase 2) — Parallel research & landscape mapping
    ↓
ASSAY (Phase 3) — Write FSDs, Admin docs, spec everything
    ↓
CRUCIBLE (Phase 4) — Adversarial stress-test the spec
    ↓
EXTERNAL-AUDITOR (Phase 4b) — Independent model review
    ↓
[AUTORESPONSE LOOP — PLANNED] — Validate design improvements
    ↓
PLAN (Phase 5) — Decompose spec into GitHub Issues
    ↓
HAMMER (Phase 6) — Build (code drops)
    ↓
TEMPER (Phase 7) — Harden, test, ship
    ↓
RALPH-LOOP (Phase 8) — Capture learnings, feed back
    ↓
POST-FOUNDRY — Bug tracking, maintenance, continuous improvement
```

**Ratify gates between every transition** — forced cognitive mode switch from builder to reviewer.

---

## File Guide

| File | Phase | Duration | Applies To |
|------|-------|----------|-----------|
| **pre-foundry.md** | Pre-work | Varies | New client projects (full intake) |
| **00-launch.md** | LAUNCH | 15 min | All modes |
| **01-mine.md** | MINE | 30-60 min | GREENFIELD only |
| **02-scout.md** | SCOUT | 1-4 hrs | GREENFIELD only |
| **03-assay.md** | ASSAY | 2-10 days | GREENFIELD, FEATURE, FIX, SPEC, REFACTOR, SECURE |
| **04-crucible.md** | CRUCIBLE | 1-3 days | GREENFIELD, FEATURE, SPEC, SECURE |
| **04b-external-auditor.md** | EXTERNAL-AUDITOR | 30-60 min | GREENFIELD, FEATURE, SPEC |
| **05-plan.md** | PLAN | 1-2 hrs | GREENFIELD, FEATURE, REFACTOR, SECURE |
| **06-hammer.md** | HAMMER | Sprint-based | All modes |
| **07-temper.md** | TEMPER | 1-4 hrs/PR | All modes |
| **08-ralph-loop.md** | RALPH-LOOP | 30-60 min | All modes (even HOTFIX = 5 min) |
| **post-foundry.md** | POST-FOUNDRY | Ongoing | Production maintenance |
| **ratify.md** | RATIFY (Gates) | 5-30 min | Between every phase transition |

---

## Key Concepts

### Ralph Loop (Phase 8)
The arrow that feeds Phase 8 back to Phase 1. After TEMPER ships code, Ralph Loop captures:
- **Knowledge Graduation:** Discoveries that appear 3+ times → error-patterns.md
- **Assumption Validation:** Which assumptions held, which broke, which need more testing
- **Buyer Persona Reality Check:** Did implementation feel right? Feed back user feedback
- **Methodology Feedback:** Did The Foundry work? What gates are too heavy? What's missing?

Without Ralph Loop, every epic starts from zero. With it, every epic is smarter than the last.

### Ratify Gates
Every phase transition passes through Ratify. Forced mode switch: stop building, start scrutinizing.
- **Hard Gate:** Confidence ≥ 8/10 to proceed. Below that = go back and fix.
- **Soft Gate:** Confidence ≥ 6/10 to proceed. Flag concerns, document unresolved items.

### Crucible (Phase 4)
Adversarial stress-test of specs via NotebookLM debate. The most distinctive phase — pre-code adversarial review (nobody else does this).

### External Auditor (Phase 4b)
Independent model review — **different AI, different perspective** — of FSDs, Admin docs, Assumption Table. Circuit breaker before committing to code.

---

## Modes

The Foundry adapts to different situations:

| Mode | Duration | Entry Point | When Used |
|------|----------|-------------|-----------|
| **GREENFIELD** | 2-4 weeks | PRE-FOUNDRY → LAUNCH | New product, new company |
| **FEATURE** | 3-5 days | LAUNCH → MINE | New feature on existing app |
| **FIX** | 1-2 days | LAUNCH (light ASSAY) | Bug fix or urgent change |
| **SPEC** | 1-2 weeks | LAUNCH → ASSAY | Complex spec without code |
| **REFACTOR** | 1 week | LAUNCH → ASSAY | Code reorg, architecture change |
| **SECURE** | 3-5 days | LAUNCH → CRUCIBLE | Security audit, compliance |
| **HOTFIX** | 30 min | Direct → TEMPER | Production emergency |

---

## IT Concierge Learnings (Integrated)

The Foundry was validated on IT Concierge (first full execution, Jan-Mar 2026). 5 improvements discovered:

1. **State Sync Architecture Spike Gate** — Before building complex state features, run an architecture spike
2. **Migration Verification Gate** (in TEMPER) — Verify SQL migrations are actually applied, not just committed
3. **Server Error Logging Standard** — Catch silent failures with consistent logging (browser API exemptions)
4. **Visual Review Gate** (in TEMPER) — Screenshot-based verification before merge
5. **Red-Team after every epic** — 3-agent adversarial sequence after completion

These are embedded in ASSAY, TEMPER, and RALPH-LOOP phases.

---

## AutoResearch Loop (PLANNED)

**Status:** Design pending

Separate from Ralph Loop. Purpose: Validate and improve design BEFORE coding starts.

**Proposed placement:** After EXTERNAL-AUDITOR (4b), before PLAN (5)

**Rationale:** Crucible + External Auditor stress-test the spec. AutoResearch validates those improvements hold through experimental iteration (Karpathy pattern — loop, keep winning changes, discard losers). Then move to PLAN with a bulletproof blueprint.

**Design TBD:** See github.com/growthpigs/thinking-foundry/issues (when created)

---

## Starting a Foundry Session

```bash
# Navigate to your project
cd /path/to/project

# Launch the Foundry
~/_PAI/operations/the-foundry/bin/launch.sh
# OR if launching locally
./bin/launch.sh

# Select your mode (GREENFIELD, FEATURE, FIX, etc.)
# Follow prompts to load project context
# System guides you through phases 0-8
```

---

## Key Principle

> "The Foundry separates thinking from building. Building and reviewing are different cognitive modes. You cannot do both simultaneously. Ratify gates force the switch."

Every epic starts at the right phase based on its complexity. Every phase has specific inputs and outputs. Every transition is gated by Ratify. This is how you avoid building the wrong thing really well.

---

## Questions?

- Full spec details: Read individual phase files
- Troubleshooting: See ratify.md for common gate failures
- Methodology improvements: Create an issue at github.com/growthpigs/the-foundry

---

**Last Updated:** 2026-03-30
**Status:** Complete 8-phase + 3-segment system (AutoResearch loop pending design)
