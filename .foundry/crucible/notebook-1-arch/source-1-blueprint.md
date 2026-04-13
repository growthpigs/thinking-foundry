# Convergence — MinisterService Implementation Blueprint

**Status:** Architecture locked. Awaiting final pre-conditions before build.
**Worktree:** `feature/convergence` on alpha-war-room — **NOT YET CREATED** (will be created at build start)
**Deploy target:** Separate Railway instance (stealth — not Think Big's servers)
**Milestone:** B — Build (Phase 1 POC)

This issue is the authoritative build reference for the MinisterService layer. Read alongside #31 (FSD) and #49 (Master Index).

---

## Pre-Conditions (Gate Before Build Starts)

| # | Gate | Status | Blocks |
|---|------|--------|--------|
| 1 | POC Demo entity confirmed (active Polymarket/Kalshi contracts) | ⏳ Spike #95 | Markets minister |
| 2 | Polygon.io pricing tier verified | ⏳ Cost check | Markets minister |
| 3 | #88 (Fast-Track Conclude) vs #94 (Chief of Staff) — Phase 1 scope decision | ✅ Both ship Phase 1 (confirmed 2026-04-13) | Synthesis gate |

---

## What Is NOT Being Built Here

- **4 existing files require changes** (see Ratification Addendum comment):
  - `shared/schema.ts` — append 3 new tables
  - `server/services/newsApiService.ts` — add `searchByQuery()` method
  - `server/routes.ts` — register convergenceRoutes
  - `server/services/enhancedPerplexityChatService.ts` — add Convergence chat hook
- All other existing files remain untouched
- Hidden behind a feature flag — only visible on the stealth Railway instance

---

## Architecture: Three New Files

```
server/
├── routes/
│   └── convergenceRoutes.ts     ← HTTP endpoints for Convergence sessions
├── services/
│   ├── ministerService.ts       ← Minister orchestration + parallel fan-out
│   └── convergenceStorage.ts   ← DB read/write for the 3 new tables
shared/
└── schema.ts                    ← +3 new tables appended at end
```

---

## 1. Database Schema (append to `shared/schema.ts`)

### `convergence_sessions`
```typescript
export const convergenceSessions = pgTable("convergence_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  decisionStatement: text("decision_statement").notNull(),
  decisionType: varchar("decision_type", { length: 10 }),       // 'A' | 'B' — set by MINE phase
  evidenceStandard: varchar("evidence_standard", { length: 20 }), // 'high' | 'moderate'
  status: varchar("status", { length: 20 }).notNull().default("active"),
  weightsSnapshot: jsonb("weights_snapshot"), // {ministers:{knowledge:0.2,...}, perMinister:{...}}
  createdAt: timestamp("created_at").defaultNow().notNull(),
  concludedAt: timestamp("concluded_at"),
}, (table) => [
  index("idx_convergence_sessions_company").on(table.companyId),
  index("idx_convergence_sessions_status").on(table.status),
]);
```

### `convergence_minister_responses`
```typescript
export const convergenceMinisterResponses = pgTable("convergence_minister_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => convergenceSessions.id, { onDelete: "cascade" }),
  minister: varchar("minister", { length: 20 }).notNull(), // knowledge|markets|news|narrative|data
  turnNumber: integer("turn_number").notNull().default(1),
  briefContent: text("brief_content").notNull(),
  wepAssessment: varchar("wep_assessment", { length: 20 }), // HIGHLY_LIKELY|LIKELY|ROUGHLY_EVEN|THIN|SILENT
  sourcesUsed: jsonb("sources_used"),   // [{name, type, count}]
  sourceCount: integer("source_count").notNull().default(0),
  fetchDurationMs: integer("fetch_duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_conv_minister_session").on(table.sessionId),
  index("idx_conv_minister_turn").on(table.sessionId, table.turnNumber),
]);
```

### `convergence_conclusions`
```typescript
export const convergenceConclusions = pgTable("convergence_conclusions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => convergenceSessions.id, { onDelete: "cascade" }).unique(),
  mineOutput: text("mine_output").notNull(),          // MINE phase decision extraction
  decisionType: varchar("decision_type", { length: 10 }).notNull(), // A | B
  synthesisNarrative: text("synthesis_narrative").notNull(), // Chief-facing decision brief
  tensionsIdentified: jsonb("tensions_identified"),   // [{ministerA, ministerB, description}]
  chiefOfStaffSummary: text("chief_of_staff_summary"), // #94 — meta-synthesis with caveats
  weightsAtConclusion: jsonb("weights_at_conclusion"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_convergence_conclusions_session").on(table.sessionId),
]);
```

---

## 2. MinisterService (`server/services/ministerService.ts`)

### Minister Registry

```typescript
export const MINISTERS = ['knowledge', 'markets', 'news', 'narrative', 'data'] as const;
export type MinisterName = typeof MINISTERS[number];

// Signal hardness determines WEP ceiling (#90)
const MINISTER_HARDNESS: Record<MinisterName, 'hard' | 'ambient' | 'internal'> = {
  knowledge: 'internal',
  markets: 'hard',
  news: 'ambient',
  narrative: 'ambient',
  data: 'hard',
};
```

### Parallel Fan-Out (core architecture)

```typescript
async function runMinisterFanOut(ctx: MinisterContext): Promise<MinisterResult[]> {
  const results = await Promise.allSettled([
    runKnowledgeMinister(ctx),   // wraps geminiFileSearchService (NOT knowledgeBaseService — that's ingestion-only)
    runMarketsMinister(ctx),     // NEW — Polymarket + Kalshi + Polygon.io
    runNewsMinister(ctx),        // wraps newsApiService.ts (exists) + GDELT
    runNarrativeMinister(ctx),   // wraps mentionlyticsApiService (exists)
    runDataMinister(ctx),        // NEW — FEC + SEC EDGAR + FRED + openFDA
  ]);

  // SILENT is not an error — no signal IS the answer
  return results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : silentMinister(MINISTERS[i])
  );
}
```

### WEP Ceiling Enforcement

```typescript
// Ambient Intelligence caps at LIKELY — never HIGHLY_LIKELY (#90)
function capWEPByHardness(wep: WEPAssessment, minister: MinisterName): WEPAssessment {
  if (MINISTER_HARDNESS[minister] === 'ambient' && wep === 'HIGHLY_LIKELY') return 'LIKELY';
  return wep;
}
```

---

## 3. Convergence Routes (`server/routes/convergenceRoutes.ts`)

```
POST   /api/v1/convergence/initiate                      ← Start new briefing session
GET    /api/v1/convergence/session/:sessionId            ← Get session + minister responses
POST   /api/v1/convergence/session/:sessionId/turn       ← New question → new minister round
POST   /api/v1/convergence/session/:sessionId/conclude   ← Trigger MINE → synthesis gate
GET    /api/v1/convergence/session/:sessionId/conclusion ← Get final decision brief
GET    /api/v1/convergence/history                       ← Paginated session history
POST   /api/v1/convergence/session/:sessionId/chief-of-staff ← Chief of Staff meta-synthesis (#94)
```

Auth: Same JWT middleware as existing routes. `companyId` from JWT only — never from request body.

---

## 4. Socket.IO Events (zero changes to `websocket.ts`)

Uses existing `emitToCompany(companyId, event, payload)` helper:

```
convergence:minister-responding  → { minister, status: 'fetching' }
convergence:minister-ready       → { minister, brief, wep, sourceCount }
convergence:synthesis-running    → { sessionId }
convergence:concluded            → { sessionId, decisionBrief }
```

---

## 5. Chat Pipeline Hook

New step inserted in `enhancedPerplexityChatService.ts` (the actual routing god object — chatPipeline.ts is dead code):

```typescript
{
  name: 'convergence-eligible',
  guard: (ctx) => isConvergenceEligible(ctx.userMessage),
  handler: async (ctx) => ({
    handled: true,
    response: buildConvergenceConfirmCard(ctx.userMessage), // inline confirm button only
  })
}
// Decision-statement heuristics: "Should we...", "Is X a good idea", "What do you think about..."
```

Convergence is NOT auto-run on every message. Inline confirm only (gating decision from #31 FSD).

---

## 6. Build Sequence

| Step | Task | Blocks |
|------|------|--------|
| 1 | Append 3 tables to schema.ts → run Drizzle migration | Everything |
| 2 | `convergenceStorage.ts` — CRUD wrappers for 3 tables | Steps 3-5 |
| 3 | `ministerService.ts` — fan-out shell (all ministers return mock) | Step 4 |
| 4 | Wire Knowledge + News + Narrative (existing services) | Step 5 |
| 5 | `convergenceRoutes.ts` — POST /initiate + GET /session | Step 6 |
| 6 | Socket.IO events via emitToCompany() | Step 7 |
| 7 | Markets minister — Polymarket + Kalshi + Polygon.io (gate: #95) | Step 8 |
| 8 | Data minister — FEC + SEC EDGAR + FRED connectors | Step 9 |
| 9 | MINE phase — decision extraction + Type A/B classification | Step 10 |
| 10 | Synthesis gate — MINE → CRUCIBLE phases with weights applied | Step 11 |
| 11 | Chief of Staff endpoint (#94) | Step 12 |
| 12 | Frontend: Convergence page + Minister cards + Weighting Mixer | Ship |

---

## Codebase Integration Map (from audit — alpha-war-room#874)

| Existing File | Role in Convergence |
|---------------|---------------------|
| `shared/schema.ts` | Append 3 new tables at end |
| `server/services/geminiFileSearchService.ts` | Knowledge Minister (⚠️ NOT knowledgeBaseService — that's ingestion-only) |
| `server/services/newsApiService.ts` | News Minister (NewsAPI + GDELT) |
| `server/services/mentionlyticsApiService.ts` (inferred) | Narrative Minister (social) |
| `server/websocket.ts` | Use existing `emitToCompany()` — no changes |
| `server/services/enhancedPerplexityChatService.ts` | Add convergence-eligible step (⚠️ NOT chatPipeline.ts — that's dead code) |
| `server/services/aggregatedIntelligence.ts` | The God Component this replaces (NOT touched in Phase 1) |

---

## References

| Issue | What |
|-------|------|
| [#31](https://github.com/growthpigs/thinking-foundry/issues/31) | Master FSD |
| [#49](https://github.com/growthpigs/thinking-foundry/issues/49) | Master Index |
| [#71](https://github.com/growthpigs/thinking-foundry/issues/71) | Dual-Level Weighting Architecture |
| [#84](https://github.com/growthpigs/thinking-foundry/issues/84) | OSINT Framework — Data Minister signals |
| [#90](https://github.com/growthpigs/thinking-foundry/issues/90) | WEP Language System |
| [#94](https://github.com/growthpigs/thinking-foundry/issues/94) | Chief of Staff |
| [#95](https://github.com/growthpigs/thinking-foundry/issues/95) | POC Demo Entity spike |
| alpha-war-room#874 | War Room codebase audit findings |
