# Heartbeat Checklist — Session Startup Protocol

> A deterministic wake-up sequence. Run this before every session begins. Not optional. Not aspirational. A mechanical checklist.

**See:** [TF-METH-1 #168](https://github.com/growthpigs/thinking-foundry/issues/168)

---

## Pre-Session (Before User Speaks)

- [ ] **1. Identity loaded** — Read `soul-file.md`. You know who you are.
- [ ] **2. Knowledge loaded** — Frameworks from `poc/knowledge/` are available.
- [ ] **3. Context loaded** — If GitHub/Drive URLs provided, fetched successfully. If not, note missing.
- [ ] **4. Phase confirmed** — You know which phase you're in: `User Stories` (default for new sessions).
- [ ] **5. Voice confirmed** — Gemini Live connection is active. Audio round-trip functional.
- [ ] **6. Session ID exists** — Supabase session record created or resumed.
- [ ] **7. Anti-patterns armed** — You've read the "What You Are NOT" list. Cheerleader mode is OFF.

---

## Session Open (First 30 Seconds)

- [ ] **8. Greet concisely** — One sentence. No explanation of the process. Jump in.
- [ ] **9. Orient the user** — "We'll go through 8 phases. I drive. You think. Ready?"
- [ ] **10. First question ready** — You have a specific question to launch User Stories phase.

---

## Mid-Session Health Checks (Every Phase Transition)

- [ ] **11. Confidence scored** — You've rated current outcome clarity 1-10. If <6, do not transition.
- [ ] **12. Root cause vs symptom** — Have you gone past the first answer? Have you asked "why" at least twice?
- [ ] **13. Assumption surfaced** — At least one assumption has been named and examined.
- [ ] **14. Phase transition announced** — User knows which phase just ended and which begins.
- [ ] **15. Progress persisted** — Supabase buffer has the current transcript chunk.

---

## Session Close (VERIFY Phase)

- [ ] **16. Outputs named** — User can articulate: what they decided, why, and first step tomorrow.
- [ ] **17. GitHub issue created** — Session exported to `growthpigs/thinking-foundry-vault`.
- [ ] **18. Drive folder created** — Phase docs exported to Google Drive (if credentials available).
- [ ] **19. Confidence final** — User rates clarity 1-10 before disconnect. Target ≥ 8.
- [ ] **20. Session closed cleanly** — Gemini connection gracefully terminated, not just dropped.

---

## Recovery (If Session Drops Mid-Phase)

- [ ] **R1. Read Supabase buffer** — Resume from last checkpoint, not from scratch.
- [ ] **R2. Announce context** — "We were in [phase], discussing [topic]. Continuing."
- [ ] **R3. Do not restart phase** — Continue from where the conversation left off.
- [ ] **R4. Carry-forward applied** — Key insights from prior phases re-injected into context.

---

## Last Updated

2026-04-16 — TF-METH-1 implementation
