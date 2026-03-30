# Phase 8: RALPH LOOP — Capture & Feed Back

**Metaphor:** The blacksmith inspects the finished blade, notes what worked, sharpens the tools, and prepares for the next piece.

**Duration:** 30-60 minutes per epic completion
**Mode applicability:** ALL modes (even HOTFIX gets a 5-minute version)

---

## What Happens

After TEMPER ships code and R8 confirms you're happy, the Ralph Loop captures everything learned and feeds it back. Without this, every epic starts from zero. With it, every epic is smarter than the last.

This is the arrow from TEMPER back to MINE in the pipeline diagram.

## Process

### 1. Knowledge Graduation

Review progress.txt from this epic:
- Any discovery that appeared 3+ times → **graduates to error-patterns.md** (permanent defensive knowledge)
- Any discovery that's project-specific → stays in progress.txt archive
- Any discovery that improves The Foundry methodology → create an issue in `growthpigs/the-foundry`

### 2. Assumption Table Reconciliation

Go back to the Assumption Table from ASSAY:
- Which assumptions were **validated** by real code? → Update confidence to 95%+
- Which assumptions were **invalidated**? → Document what actually happened, update FSDs
- Which assumptions are **still untested**? → Carry forward to next epic

This is how the Assumption Table evolves from theory to evidence.

### 3. Buyer Persona Reality Check

If the epic touched user-facing features:
- Did the implementation FEEL right when tested?
- Did the UX/Intent confidence score from R8 match reality?
- Any user feedback (even informal) → feed back into Buyer Persona doc

### 4. Methodology Feedback

What worked and what didn't about The Foundry itself during this epic:
- Did the Ratify gates catch real issues?
- Was any gate unnecessary or too heavy?
- Did the External Auditor find something the Crucible missed?
- Were the prompts in ratify.md useful or did you skip them?

Capture this as a SITREP for The Foundry repo.

### 5. Session Wrap

Mandatory paperwork:
- [ ] Activity Log updated with final summary
- [ ] Work Ledger updated with DUs
- [ ] HANDOVER.md updated for next session
- [ ] progress.txt archived to `.foundry/archive/`
- [ ] Commits pushed, branches cleaned

### Outputs
- Updated error-patterns.md (graduated knowledge)
- Updated Assumption Table (theory → evidence)
- SITREP for The Foundry (methodology feedback)
- Clean git state
- Activity Log + Work Ledger current

---

## Why This Phase Exists

Without the Ralph Loop, every epic is an isolated event. With it, each epic feeds the next:

```
Epic 1: "SET LOCAL works but needs session-mode PgBouncer, not transaction-mode"
  → error-patterns.md: "Always verify PgBouncer pool mode before using SET LOCAL"
  → Assumption Table: PgBouncer confidence 50% → 95% (validated)
  → Next epic starts KNOWING this, not guessing

Epic 2: "Gemini classifies French emails at 87% accuracy, not the 70% we feared"
  → Assumption Table: Gemini French confidence 70% → 87% (measured)
  → FSD updated with real numbers instead of guesses
  → Next epic's estimates are based on data, not hope
```

This is how the system gets smarter over time. Not through AI memory (which is unreliable across sessions), but through documented, version-controlled, graduated knowledge.
