# Post-Foundry — Bug Tracking, Maintenance & Continuous Improvement

**Everything that happens AFTER Phase 8 (RALPH LOOP) ships code.** The app is live. Now bugs come in, clients give feedback, and features need adding.

---

## When Post-Foundry Activates

The moment TEMPER deploys to production and R8 confirms you're happy — Post-Foundry begins. The app is in the world. Real users are touching it. Things will break.

---

## The Post-Foundry Flow

```
INPUT (from the real world)
   ↓
┌─────────────────────────────────────────┐
│  TRIAGE — What is this?                 │
│                                         │
│  Bug report     → Label: bug            │
│  Production down → Label: hotfix, P0    │
│  Feature request → Label: new           │
│  Security issue  → Label: security      │
│  Tech debt      → Label: refactor       │
│  Client feedback → Capture, don't act   │
└─────────────────────────────────────────┘
   ↓
ROUTE TO FOUNDRY MODE
   ↓
┌─────────────────────────────────────────┐
│  bin/launch.sh --mode [detected]        │
│                                         │
│  bug        → FIX mode (HAMMER→TEMPER)  │
│  hotfix     → HOTFIX mode (fast)        │
│  new        → FEATURE mode (ASSAY→)     │
│  security   → SECURE mode (private)     │
│  refactor   → REFACTOR mode (careful)   │
│  feedback   → Add to MINE backlog       │
└─────────────────────────────────────────┘
   ↓
THE FOUNDRY (runs the appropriate mode)
   ↓
RALPH LOOP (capture learnings)
   ↓
Back to Post-Foundry monitoring
```

---

## The Issue Intake Protocol (60-Second Capture)

When a problem arrives — from a client, from testing, from Sentry, from Roderic saying "this is broken" — capture it in 60 seconds:

1. **Confirm** (10s) — "Got it — [problem summary in 2 sentences]"
2. **Quick scan** (15-20s) — Skim 2-3 files for accurate file paths
3. **Create GitHub issue** (15s) — `gh issue create` with:
   - Title: Clear, specific
   - Body: Root cause hypothesis, affected files, reproduction steps
   - Severity: P0 (production down) → P3 (nice to have)
   - Labels: **MUST match foundry.sh classifier** (see table below)

### Label → Foundry Mode Mapping (MUST use these exact labels)

| What It Is | Labels to Apply | Foundry Mode |
|-----------|----------------|-------------|
| Production down | `hotfix`, `production-down`, `P0` | HOTFIX |
| Security vulnerability | `security`, `vulnerability` | SECURE |
| Bug | `bug` | FIX |
| Regression (was working, now broken) | `bug`, `regression` | FIX |
| Performance issue | `refactor`, `performance` | REFACTOR |
| Tech debt cleanup | `refactor`, `tech-debt` | REFACTOR |
| Feature request | `enhancement` | FEATURE |
| Architecture question | `spec`, `architecture` | SPEC |
| New project idea | `new`, `greenfield` | GREENFIELD |

**If no labels match** → foundry.sh defaults to FEATURE mode.

**Common mistake:** Labelling a feature request as `new` routes it to GREENFIELD (full pipeline from scratch). Use `enhancement` for features on existing projects.

**Hard rule:** Do NOT fix the bug during intake. Capture it. The Foundry handles the fix.

### Severity Classification

| Level | Meaning | Foundry Mode | Response Time |
|-------|---------|-------------|---------------|
| **P0** | Production down, users blocked | HOTFIX | Immediately |
| **P1** | Major feature broken, workaround exists | FIX | Same day |
| **P2** | Minor bug, doesn't block usage | FIX | This sprint |
| **P3** | Cosmetic, nice-to-have | FIX | Backlog |

### Auto-Detection Signals

The AI should auto-detect problem reports without needing `/issue`:

| Signal | Confidence | Action |
|--------|-----------|--------|
| Screenshot + "broken" / "not working" | HIGH | Trigger intake |
| Error paste + "help" / "fix" | HIGH | Trigger intake |
| "This is dumb" / frustration language | MEDIUM | Ask: "Capture as issue?" |
| "When I click X, Y happens but Z should" | HIGH | Trigger intake |
| Sentry alert | HIGH | Auto-create issue |

---

## The Maintenance Sprint

Every 2 weeks (or as needed), run a maintenance sprint:

1. **Review open issues** — sort by severity, age, and domain
2. **Pick the top 5-10** — highest impact, lowest effort first
3. **Run each through The Foundry** in FIX mode
4. **RALPH LOOP** after each — capture learnings
5. **Update error-patterns.md** — graduate recurring issues

---

## Client Feedback Loop

Not all input is bugs. Clients say things like:
- "I wish it could..."
- "The morning brief doesn't quite..."
- "My assistant used to..."

These are NOT bugs. They're feature signals. Capture them:

1. **Log in the Activity Log** — verbatim quote + context
2. **Add to MINE backlog** — tagged as `feedback` + `[client name]`
3. **Don't act immediately** — let feedback accumulate
4. **Monthly review** — Do 3+ clients say the same thing? → Promote to FEATURE mode
5. **Buyer Persona update** — Does this feedback change our understanding of the persona?

---

## Rollback Protocol (When TEMPER Deploy Breaks Production)

When a deploy breaks production — and it will, eventually — follow this protocol:

### Immediate (< 5 minutes)
1. **Revert the deploy** — `git revert HEAD` + push, or rollback in hosting dashboard
2. **Verify production is back** — hit the health endpoint, load the app
3. **Create P0 issue** — `gh issue create --label "hotfix,production-down,P0"`

### Investigate (< 30 minutes)
4. **Compare staging vs production** — is staging also broken? Or just production?
5. **Check what changed** — `git log -5`, env vars, external API changes
6. **Capture the incident** — in the issue body: what broke, what was reverted, root cause hypothesis

### Fix (via HOTFIX mode)
7. **Run the Foundry in HOTFIX mode** — `bin/launch.sh --mode HOTFIX --issue [P0_ISSUE]`
8. **HAMMER → TEMPER (fast)** — fix, test, ship
9. **RALPH LOOP** — what caused this? How do we prevent it?

### The Rule
> Revert FIRST, investigate SECOND. A broken production costs money every minute. A reverted deploy costs nothing.

---

## Monitoring & Alerts

Post-Foundry requires continuous monitoring:

| What | Tool | Alert Threshold |
|------|------|----------------|
| Errors | Sentry | Any unhandled exception → auto-issue |
| Performance | PostHog / analytics | Page load > 3s → investigate |
| Uptime | Health check endpoint | Down > 2 min → P0 HOTFIX |
| API costs | Billing dashboard | > 120% of budget → alert |
| Coverage | SonarCloud | Drop below baseline → warning |

### Billing Pre-Flight (Article 24 of Constitution)

Before each maintenance sprint, verify external API quotas:
- LLM APIs: credits remaining?
- Hosting: within limits?
- Database: connection count OK?

If any service is quota-exhausted, fix billing BEFORE debugging "mysterious failures."

---

## Post-Foundry Is NOT Re-Architecture

Post-Foundry handles:
- Bugs (FIX/HOTFIX)
- Small improvements (FEATURE)
- Tech debt (REFACTOR)
- Security patches (SECURE)

Post-Foundry does NOT handle:
- Major new features (run Pre-Foundry → GREENFIELD)
- Architecture changes (run SPEC mode)
- New client onboarding (run Pre-Foundry)

If the feedback signals a fundamental rethink — go back to Pre-Foundry. Don't try to iterate your way out of a wrong architecture.

---

## The Full Lifecycle

```
PRE-FOUNDRY ──→ THE FOUNDRY ──→ POST-FOUNDRY
 (intake)        (build)          (maintain)
                    ↑                  │
                    └──────────────────┘
                    Feature requests and
                    major bugs cycle back
                    through The Foundry
```

The app lives in Post-Foundry most of its life. The Foundry is where it's born and where it's healed. Pre-Foundry is where the idea starts.
