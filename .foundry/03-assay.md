# Phase 3: ASSAY — Spec the Metal

**Metaphor:** Assaying determines the composition and quality of the ore. What exactly do we have? How pure is it?

**Duration:** 2-10 days (the most important phase)
**Mode applicability:** GREENFIELD, FEATURE, FIX (light), SPEC, REFACTOR, SECURE

---

## What Happens

This is where thinking happens. The 18 Admin Documents are written. FSDs are crafted. User stories get failure definitions. Architecture decisions are recorded with WHY. The spec becomes so precise that coding is mechanical.

> "We spent 10 days making the documentation and FSDs for LifeModo. The reason, above and beyond making the specs top-notch, is that it took 10 days to actually find our real purpose, our raison d'etre. Pushing back coding because it's become more of a commodity is the industry standard. And I push it further than anyone else." — Roderic Andrews

### Inputs
- Research synthesis from SCOUT
- Buyer personas (refined)
- Technical feasibility assessment

### Process

#### Step 1: The 18 Admin Documents (Article 14)

Every project creates 18 living documents in a GitHub Admin milestone:

**Phase A: Client Interview (Days 1-3)**
1. Agreement (SOW + MOU combined)
2. Client Requirements (CR-NNN)
3. User Stories (US-NNN) with failure definitions
4. User Journeys (UJ-NNN)
5. Glossary & Terminology

**Phase B: Architecture (Week 1-2)**
6. Tech Stack & Integration Map
7. Architecture Decision Log (ADRs with WHY)
8. Product Features (F-NNN)
9. Capabilities (Plugins, Skills, Patterns — JTBD)
10. Dependency & Risk Map

**Phase C: Validation (Week 2-3)**
11. Competitive Landscape
12. KPI & Success Metrics
13. Onboarding Checklist
14. Prompt Library
15. Client Prerequisites
16. Full Cost Breakdown
17. Test Strategy
18. Work Ledger (DU tracking)

#### Step 2: FSDs + Test Stubs (VSDD Pattern)

After Admin docs are substantially complete, write FSDs per feature/component — **and write test stubs simultaneously.**

This is the VSDD (Verified Spec-Driven Development) pattern: specs and tests are written together, not sequentially. The test stubs define what "done" looks like in executable form. They don't need to pass yet — they're the contract.

- One FSD per logical component
- Each FSD includes test stubs (acceptance criteria as code)
- Independent Observer Score ≥ 8/10
- "Could a competent developer who's never seen this project implement from this FSD alone?"
- If no → the FSD isn't done

##### CRUD Coverage Matrix (Mandatory per FSD)

**Every FSD MUST include a CRUD Coverage Matrix for every entity it specifies.** This forces explicit decisions about which operations exist — and which are intentionally excluded.

**Born from:** IT Concierge FSD Gap Report (March 2026). 6 of 13 P0 blocking gaps were missing CRUD operations (no edit button, no deactivate flow, no delete). The FSDs were "complete" but never explicitly addressed the full lifecycle. The hard engineering was built; the everyday buttons were not.

**Format (mandatory in every FSD):**

```markdown
### CRUD Coverage Matrix

| Entity | Create | Read | Update | Deactivate | Delete | Notes |
|--------|--------|------|--------|------------|--------|-------|
| Client | ✅ Form + validation | ✅ List + detail | ✅ Edit form (all fields except ID) | ✅ Soft-delete with active ticket guard | ❌ N/A — deactivate only | SIRET validated on create AND edit |
| Site | ✅ Nested under client | ✅ List + detail | ✅ Edit form | ✅ Blocked if active tickets | ❌ N/A | Emergency contact required |
| Contact | ✅ Linked to site | ✅ Inline on site detail | ✅ Edit inline | ✅ Soft-delete (is_active) | ❌ N/A | Phone/email must be clickable (tel:/mailto:) |
| Audit Log | ✅ System-generated | ✅ Admin read-only | ❌ Immutable | ❌ N/A — compliance | ❌ N/A — compliance | Intentionally no U/D — audit trail integrity |
```

**Rules:**
- ✅ = Specified with implementation detail (form type, validation, guards)
- ⚠️ = Partially specified — detail required before R3 (e.g., "edit mode mentioned but editable fields not listed")
- ❌ = Intentionally excluded with justification
- Empty cell = **SPEC GAP — must be resolved before R3 gate**
- Every ❌ must have a "Notes" justification (e.g., "compliance", "system-generated only")
- Every ⚠️ must be resolved to ✅ or ❌ before R3 gate passes
- Phone numbers and email addresses on any entity MUST be specified as clickable (`tel:`, `mailto:`)

**What this catches:** Missing edit flows, missing deactivation with guard conditions, missing soft-delete columns, unclickable contact info — the entire class of "the hard engineering is done but the everyday buttons are missing" gaps.

**Edge case:** If an entity has no applicable CRUD operations (e.g., a read-only reference table populated externally), question whether it belongs in this FSD or should be documented as an external dependency in the Dependency & Risk Map.

```
// Example test stub written during ASSAY (not HAMMER)
describe('Ticket status transitions', () => {
  it('should allow NEW → ASSIGNED when technician is available', () => {
    // Stub — implementation comes in HAMMER phase
    expect(true).toBe(false); // Deliberately failing until implemented
  });

  it('should BLOCK ASSIGNED → COMPLETED without work order photos', () => {
    // Failure definition from User Story US-017
    expect(true).toBe(false);
  });
});
```

**Why test stubs in ASSAY, not HAMMER?** Because writing the test forces you to think about edge cases, failure modes, and acceptance criteria WITH PRECISION. Prose specs hide ambiguity. Code specs expose it.

#### Step 3: Assumption Table (Mandatory)

Before thrashing, produce an **Assumption Table** — every assumption the specs rely on, with confidence and blast radius:

```
| # | Assumption | Confidence | What Breaks If Wrong |
|---|-----------|------------|---------------------|
| 1 | Supabase RLS with SET LOCAL works through PgBouncer | 50% | Every table has broken isolation. Business-ending. |
| 2 | EUR 50K clients will use Slack daily | 75% | Console-first architecture is wrong for persona |
| 3 | Gmail snippet (~200 chars) is enough signal | 65% | False negative rate balloons |
```

**Rules:**
- Any assumption below **70% confidence** → triggers a **technical spike** during ASSAY (30-60 min to verify with real tools, not prose)
- Any assumption below **50% confidence** → becomes a CRUCIBLE topic (Phase 4) with mandatory adversarial debate
- The Assumption Table is a living document — update it as confidence changes
- Assumptions at 90%+ after a spike can be removed from the table

**What is a technical spike?** Spin up the real tool. Test the actual API. Run the query. The DTU (Digital Twin Universe) exists for this — verify assumptions against real services, not documentation.

#### Step 4: Buyer Persona Pressure Test (Structured Walkthrough)

**Every FSD must be read through the eyes of each Buyer Persona — not with abstract questions, but by scripting their actual workday.**

This is a trace-level walkthrough, not an opinion-level review. The difference matters: opinion-level asks "How does Lino experience this?" Trace-level scripts Lino's Monday morning and verifies every action has a User Story, an FSD section, and a CRUD operation.

**Born from:** IT Concierge FSD Gap Report (March 2026). The original abstract questions ("How does Lino experience this?") passed R3 with UX/Intent ≥ 7/10. Then the code-level audit found 49 gaps — 13 of them P0 blocking. The abstract questions missed what the structured walkthrough found.

##### The Structured Walkthrough Protocol

**Step 4a: Script the workday** (1 per primary persona, max 3 personas)

For each primary persona, script a complete workday in chronological order. Each line is one action the persona takes:

```markdown
### Persona Walkthrough: Lino Lazo (Owner/Dispatcher)

| Time | Action | US Reference | FSD/FR Reference | CRUD Op | Status |
|------|--------|-------------|------------------|---------|--------|
| 07:00 | Open dashboard, check KPIs | US-025 | FSD-010 FR-001 | Read | ✅ Specified |
| 07:00 | Click KPI "Open: 5" to filter to those tickets | US-025 | FSD-010 FR-001 | Read (filtered) | ❌ NOT SPECIFIED |
| 07:15 | Client calls to change billing address | US-003 | FSD-005 FR-003 | Update (Client) | ⚠️ "Edit mode" mentioned but fields not listed |
| 07:30 | Create new ticket for emergency call | US-008 | FSD-007 FR-001 | Create (Ticket) | ✅ Specified |
| 07:35 | Assign ticket to wrong technician, need to reassign | US-009 | FSD-007 FR-003 | Update (Ticket) | ❌ Only title/description editable |
| 08:00 | Add materials used on completed job | US-017 | — | Create (Ticket Materials) | ❌ NO FSD EXISTS |
| ... | ... | ... | ... | ... | ... |
```

**Step 4b: Score the walkthrough**

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ Specified | FSD covers this action completely | None |
| ⚠️ Ambiguous | FSD mentions it but lacks detail | Clarify in FSD before R3 |
| ❌ NOT SPECIFIED | No FSD section covers this action | Write missing FSD section or add User Story |
| ❌ NO FSD EXISTS | Entire feature domain has no FSD | Flag as spec gap — may need new FSD |

**Step 4c: Produce Proof Report**

The walkthrough produces a **Proof Report** — a structured gap list that becomes an input to the Crucible (Phase 4) and a checklist for the code-level Compliance Check (Phase 7).

```markdown
## Proof Report — [Project Name]

### Coverage Summary
| Persona | Actions Scripted | ✅ Covered | ⚠️ Ambiguous | ❌ Missing |
|---------|-----------------|-----------|-------------|-----------|
| Lino (Dispatcher) | 25 | 18 | 3 | 4 |
| Marc (Technician) | 15 | 12 | 1 | 2 |

### Gaps Found (to resolve before R3)
1. **[GAP-ID]**: [Action] — [What's missing] — [Which FSD to update]
2. ...

### CRUD Gaps Found (cross-ref with CRUD Coverage Matrix)
1. **[Entity]**: [Operation] not specified — [Impact on persona's workflow]
2. ...
```

**Artifact location:** The Proof Report is saved to `.foundry/proof-report.md` in the project repo and referenced in progress.txt as `[PROOF] report=.foundry/proof-report.md`.

##### Mode Applicability

| Mode | Runs Walkthrough? | Scope |
|------|-------------------|-------|
| GREENFIELD | ✅ Full (all primary personas) | All FSDs |
| FEATURE | ✅ Scoped (personas affected by this feature only) | Feature FSDs only |
| FIX | ⏭ Skip | Bug fix — no new specs |
| HOTFIX | ⏭ Skip | Emergency — skips ASSAY entirely |
| SPEC | ✅ Full | Architecture exploration |
| REFACTOR | ⏭ Skip | Behavior-preserving — no spec changes |
| SECURE | ✅ Security persona only | Security-relevant FSDs |

##### Scaling Rule

- Max 3 personas per walkthrough (pick the 2-3 who use the system most)
- Max 30 actions per persona (focus on the top daily tasks, not edge cases)
- Estimated cost: 1-2 DUs per persona (spec-level, no code reading)

##### Original Abstract Questions (Still Valuable — Run After Walkthrough)

After the structured walkthrough, also ask the original abstract questions — they catch emotional/experience gaps that trace-level walks miss:

- "How does **[Persona Name]** experience this feature?"
- "Does this feel like [the promise] or like [generic software]?"
- "What would **[Persona Name]** complain about?"
- "Would **[Persona Name]** even use this, or is it for us?"

The Buyer Persona document must be a mandatory input to every Crucible session (Phase 4) as one of the minimum 3 sources.

#### Step 5: Thrash

The spec is not done on the first pass. Thrash it:
- Challenge every assumption (reference the Assumption Table)
- Find contradictions between documents
- Ask "what if the opposite were true?"
- Find gaps: what did we NOT specify?
- Run failure scenarios: what happens when things go wrong?
- **Run the abstract Buyer Persona questions from Step 4** (if not yet done — this is the emotional/experience pass, not a repeat of the trace walkthrough)

### Outputs
- 18 Admin Documents (GitHub Issues — gold standard)
- FSDs per component
- **Assumption Table** (with confidence scores and spike results)
- **Proof Report** (`.foundry/proof-report.md`) — structured persona walkthrough gaps
- **CRUD Coverage Matrices** (embedded in each FSD)
- Activity Log entries (thinking captured)
- Work Ledger entries (DUs logged)
- Sources list for Crucible (Phase 4)

### The Key Insight

The Assay phase is where you discover what you're actually building. LifeModo spent 10 days here and found its raison d'etre on day 9. IT Concierge spent 3 days and caught 16 real architectural issues that would have been weeks of debugging if found in code.

The cost of thinking is ALWAYS less than the cost of fixing.

---

## ⚖️ R3: Spec Gate

See [ratify.md](ratify.md#r3-spec-gate-after-assay)

**Key question:** "Are the specs perfect? Could a stranger implement from this?"

**Must pass (dual confidence scores):**
- [ ] All 18 Admin Documents substantially complete
- [ ] At least Agreement, Client Requirements, User Stories, User Journeys, Tech Stack, ADR Log, and Features are FINISHED
- [ ] Every user story has acceptance criteria AND failure definitions
- [ ] Independent Observer Score ≥ 8/10 on each FSD
- [ ] Zero contradictions between Admin docs
- [ ] Glossary has every term defined
- [ ] **Assumption Table produced** — all assumptions below 70% have been spiked
- [ ] **Structured Persona Walkthrough completed** for each primary persona (max 3) — Proof Report produced (`.foundry/proof-report.md`)
- [ ] **CRUD Coverage Matrix** in every FSD — all entities have explicit coverage, all exclusions justified
- [ ] **Zero empty CRUD cells** (every operation is ✅, ⚠️, or ❌ with justification)
- [ ] **Correctness confidence ≥ 8/10**
- [ ] **UX/Intent confidence ≥ 7/10** (through Buyer Persona lens — both walkthrough AND abstract questions)
- [ ] **Work Ledger budget check** — are we on track?
