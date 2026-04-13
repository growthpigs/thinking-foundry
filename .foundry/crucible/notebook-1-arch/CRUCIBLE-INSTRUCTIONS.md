# CRUCIBLE — Notebook 1: Minister Architecture & Fan-Out

**Domain:** Can 5 ministers actually brief in parallel within SLA, with correct service targets, without breaking War Room?
**Avg Assumption Confidence:** 50%
**Risk Level:** TECHNICAL — the build fails or succeeds on these answers

---

## Sources to Upload (Min 3 Required — We Have 5)

1. `source-1-blueprint.md` — The MinisterService Implementation Blueprint (#96)
2. `source-2-fsd.md` — The full FSD (architectural claims)
3. `source-3-llm-epistemics.md` — External ground truth: LLM epistemics report (contextual extrapolation vs agency)
4. `arch-issues-bundle.md` — (to be created) Architecture-related GitHub issues
5. `source-4-arch-assumptions.md` — (to be created) 15 architecture assumptions with confidence scores

---

## Phase 1: Chat Queries (Run 5-7 Before Audio)

### Query 1 (Anchoring)
"Describe the Convergence minister architecture. How do the 5 ministers brief in parallel? What's the fan-out pattern and how does it handle failures?"

### Query 2 (Service Target Verification)
"The blueprint specifies geminiFileSearchService for Knowledge and enhancedPerplexityChatService for chat hook. The LLM epistemics source argues that models are 'contextual extrapolators, not agents.' Does the Knowledge Minister's use of Gemini File Search create a genuine semantic search capability, or is it just keyword matching dressed up as intelligence?"

### Query 3 (Haiku Provenance Risk)
"Assumption A-011 rates at 48% the claim that Haiku 4.5 will produce zero hallucinated provenance chains from structured data. The LLM epistemics source explains how LLM output is determined by 'transaction codes' and 'temporal priors.' If the Data Minister uses Haiku to format SEC Form 4 data, what prevents Haiku from inventing a transaction code that doesn't exist in the source data?"

### Query 4 (Latency SLA)
"The blueprint specifies Markets/News <5s, Knowledge <15s, Data <30s cached, full fan-out 3-5 min. Promise.allSettled handles parallelism. But assumption A-004 (45%) says these SLAs have never been measured. What happens when Regulations.gov responds in 45 seconds and Data Minister has a hard 30s timeout?"

### Query 5 (Stealth Worktree)
"Assumption A-013 (35%) says the stealth worktree can consume War Room services without changes to the main repo. Issue #57 is entirely unanswered questions. What are the specific technical risks of branching a TypeScript monolith and adding 3 new database tables to a running production system's schema?"

### Query 6 (Model Routing Cost)
"The architecture routes Haiku for Data+Markets, Sonnet for Knowledge+Narrative+News, and Opus for Synthesis Gate only. The LLM epistemics source argues that LLM 'decisions are merely token predictions.' Does Haiku have sufficient reasoning capability to correctly format SEC Form 4 transaction codes without hallucinating provenance, or should Data Minister also use Sonnet?"

### Query 7 (Synthesis Gate Integrity)
"The Synthesis Gate uses Opus 4.6 to map tensions across 5 minister briefs. Assumption A-010 rates at 52% the claim that Opus can handle the full payload within context window and <30s SLA. The LLM epistemics source warns about the 'Attribution Problem' — mistaking database queries for original judgments. How do we ensure the Synthesis Gate produces genuine tension mapping rather than plausible-sounding mashups?"

---

## Phase 2: Audio Debate Generation

"Generate an audio discussion about whether the Convergence minister architecture will work as designed. The sources include an implementation blueprint, a product specification, and an LLM epistemics analysis of how language models process structured data. Focus on: (1) whether Haiku 4.5 can format SEC/FEC data without hallucinating provenance, (2) whether the 3-5 minute fan-out SLA is achievable, (3) whether the stealth worktree can safely branch from a production TypeScript monolith, (4) whether Opus 4.6 can produce genuine tension mapping or just plausible mashups, and (5) whether the model routing (Haiku/Sonnet/Opus) correctly matches task complexity. Let the evidence drive the discussion."

---

## Phase 3: Transcribe + Extract Findings

Focus on:
- Haiku provenance hallucination risk — is this confirmed or mitigated?
- SLA achievability — does external evidence support or challenge?
- Stealth worktree — are there real technical blockers?
- Synthesis Gate — is tension mapping distinguishable from summarization?

## Success Criteria

- [ ] All 7 chat queries return substantive responses
- [ ] Audio debate covers all 5 focus areas
- [ ] A-004 (fan-out SLA), A-011 (Haiku provenance), A-013 (stealth worktree) get clear verdicts
- [ ] Any assumption dropping below 25% triggers architecture revision
- [ ] LLM epistemics challenges that haven't been addressed are captured as issues
