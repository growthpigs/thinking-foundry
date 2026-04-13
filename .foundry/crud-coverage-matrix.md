# CRUD Coverage Matrix — Convergence DB Tables

**Phase:** 3b (ASSAY Gap-Fill)
**Date:** 2026-04-13
**Source:** #96 (MinisterService Blueprint), #61 (Session Persistence)
**Schema file:** `shared/schema.ts` (3 new tables to be appended)

---

## Table 1: `convergence_sessions`

The primary session record. One row per briefing initiation.

| Operation | Supported? | Route/Method | Justification | Edge Cases |
|-----------|-----------|--------------|---------------|------------|
| **CREATE** | ✅ Yes | `POST /api/v1/convergence/initiate` | User starts a new briefing session. Creates row with `status: "active"`, `decisionStatement` from user input. | Duplicate prevention: same user + same decision statement within 5 min = warn, not block. Empty decision statement = 400. |
| **READ** | ✅ Yes | `GET /api/v1/convergence/session/:id` | Load session with all minister responses for the session page. Also: `GET /api/v1/convergence/history` for paginated list. | Pagination: cursor-based (not offset) for history. Filter by `companyId` from JWT (NEVER from query params). |
| **UPDATE** | ✅ Yes (limited) | `POST .../session/:id/turn` (new turn increments turn state), `POST .../conclude` (sets `concludedAt` + `status: "concluded"`) | Weights update via turn endpoint. Status transitions: `active → concluded`. `concludedAt` set on conclude. | Weight validation: all ministers must sum to 100%. Individual weights 0-100. Concluded sessions reject new turns (409). |
| **DEACTIVATE** | ✅ Yes | Status → `"abandoned"` | User navigates away or starts new session without concluding. Auto-abandon after 24h inactivity via cron. | Don't delete — keep for analytics. `abandoned` sessions excluded from history by default (include via `?includeAbandoned=true`). |
| **DELETE** | ❌ No | — | Sessions are audit trail. Never hard-delete. Cascade from company deletion handles orphaned data. | `onDelete: "cascade"` on `companyId` FK handles company removal. No user-facing delete. |

### Status State Machine
```
active → concluded (via /conclude endpoint)
active → abandoned (via auto-abandon cron or explicit abandon)
concluded → (terminal)
abandoned → (terminal)
```

---

## Table 2: `convergence_minister_responses`

One row per minister per turn. A session with 3 turns and 5 ministers = 15 rows.

| Operation | Supported? | Route/Method | Justification | Edge Cases |
|-----------|-----------|--------------|---------------|------------|
| **CREATE** | ✅ Yes | Internal — created by `ministerService.runMinisterFanOut()` | Each minister fan-out creates one response row. Never user-facing. | `Promise.allSettled` means rejected ministers create rows with `wepAssessment: "SILENT"` and `briefContent` explaining the failure. `fetchDurationMs` captured for latency monitoring. |
| **READ** | ✅ Yes | Nested in `GET /api/v1/convergence/session/:id` response | Minister responses returned as array within session response. Also via Socket.IO `convergence:minister-ready` event for progressive rendering. | Order by `createdAt` ASC within each turn for consistent display. Filter by `turnNumber` for specific turn view. |
| **UPDATE** | ❌ No | — | Minister responses are immutable snapshots. A new turn creates NEW rows, never overwrites old ones. | This is a design decision, not a limitation. Historical responses needed for weight-change impact analysis. |
| **DEACTIVATE** | ❌ No | — | No concept of deactivating a minister response. All responses persist. | If a minister is toggled off (weight=0), it still responds but the synthesis gate ignores it. The response row still exists for provenance. |
| **DELETE** | ❌ No | — | Cascade from session deletion only. Never individual delete. | `onDelete: "cascade"` on `sessionId` FK. |

### Immutability Justification
Minister responses are the **provenance chain**. If we allowed updates, a user could claim "the AI said X" but the record would show Y. Design Principle 0 (Information > No Information) requires the full history.

---

## Table 3: `convergence_conclusions`

One row per concluded session. The Synthesis Gate output.

| Operation | Supported? | Route/Method | Justification | Edge Cases |
|-----------|-----------|--------------|---------------|------------|
| **CREATE** | ✅ Yes | Internal — created by `POST .../conclude` endpoint, which triggers Synthesis Gate | One conclusion per session (enforced by `unique()` on `sessionId`). Contains MINE output, synthesis narrative, tensions, Chief of Staff summary. | Synthesis Gate failure = no conclusion row. Session stays `active`. User can retry conclude. Chief of Staff summary is nullable (only populated if user requests it via `/chief-of-staff` endpoint). |
| **READ** | ✅ Yes | `GET /api/v1/convergence/session/:id/conclusion` | Separate endpoint because conclusion is heavy (synthesis narrative + tensions + CoS summary). Not included in session list/history by default. | 404 if session not concluded. Include `weightsAtConclusion` for audit trail (what weights were active when Chief concluded). |
| **UPDATE** | ✅ Yes (append-only) | `POST .../session/:id/chief-of-staff` | Chief of Staff meta-synthesis is optional and can be requested AFTER initial conclusion. Updates `chiefOfStaffSummary` field only. | Only field that can be updated. All other fields are immutable post-creation. Requesting CoS on an already-CoS'd conclusion replaces the summary (latest wins). |
| **DEACTIVATE** | ❌ No | — | Conclusions are terminal artifacts. No deactivation concept. | — |
| **DELETE** | ❌ No | — | Cascade from session deletion only. | `onDelete: "cascade"` on `sessionId` FK. `unique()` constraint prevents duplicate conclusions. |

---

## Cross-Table Relationship Summary

```
convergence_sessions (1)
  ├── convergence_minister_responses (many) — via sessionId FK, cascade delete
  └── convergence_conclusions (0 or 1) — via sessionId FK + unique constraint, cascade delete
```

## Multi-Tenant Isolation

| Table | Tenant Column | Enforcement |
|-------|--------------|-------------|
| `convergence_sessions` | `companyId` (FK → companies.id) | Direct column. All queries filter by companyId from JWT. |
| `convergence_minister_responses` | Via join to sessions | No direct companyId. Isolation enforced by joining to sessions table. All routes first verify session ownership. |
| `convergence_conclusions` | Via join to sessions | Same as minister_responses. Session ownership = conclusion ownership. |

**Authorization rule:** Before any read/write on minister_responses or conclusions, verify `session.companyId === jwt.companyId`. This is the ONLY authorization check needed (no RLS, handled in route middleware).

---

## Gaps Identified

| # | Gap | Severity | Resolution |
|---|-----|----------|-----------|
| 1 | No `updatedAt` column on sessions table | LOW | Weight changes don't update the session row — they create new turn rows. `updatedAt` would be misleading. Acceptable gap. |
| 2 | No soft-delete on any table | BY DESIGN | All tables use cascade from company deletion. No user-facing delete. Audit trail preserved. |
| 3 | No `turnCount` denormalization on sessions | LOW | Can be derived from `COUNT(minister_responses WHERE sessionId = X) / 5`. Add if query becomes hot path. |
| 4 | `weightsSnapshot` on sessions vs `weightsAtConclusion` on conclusions | BY DESIGN | `weightsSnapshot` captures initial weights. `weightsAtConclusion` captures final weights. Both needed for weight-change analysis. |
| 5 | No index on `convergence_minister_responses.minister` | MEDIUM | If we need "all Markets responses across sessions" queries, we'll need this index. Add in migration if needed. |
