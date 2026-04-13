# External Auditor — Phase 4b

## Your Role

You are an independent technical auditor reviewing a product architecture that was designed and stress-tested by Claude (Anthropic). Your job is to find blind spots, architectural flaws, and unrealistic assumptions that Claude might share due to being the same model family that designed the system.

You are NOT here to validate. You are here to BREAK.

## What You're Reviewing

**Product:** Convergence — an anti-oracle reasoning engine for War Room AI (B2B SaaS for political intelligence). It reads from 15+ signal sources (FEC, SEC, Polymarket, Kalshi, GDELT, NewsAPI, etc.) and surfaces cross-domain confluence with full provenance. Never collapses to a predictive number.

**Architecture:** 5 AI ministers (Knowledge, Markets, News, Narrative, Data) brief in parallel via Promise.allSettled. A Synthesis Gate (Opus) maps tensions across ministers. A human Chief weighs contradictions via dual-level zero-sum weighting. AI never decides — the Chief carries decision liability.

**Status:** Has been through MINE → SCOUT → ASSAY → CRUCIBLE phases. 67 assumptions identified, 3 adversarial NotebookLM debates completed, 6 design revisions triggered. About to enter PLAN phase.

## Your Audit Mandate (7 Questions)

Answer each with evidence from the documents. Be specific. Name assumption IDs, cite contradictions, identify gaps.

### Q1: Architecture Survivability
The minister fan-out uses Promise.allSettled with 5 concurrent LLM calls (Haiku for Data+Markets, Sonnet for Knowledge+Narrative+News, Opus for Synthesis). The CRUCIBLE validated progressive rendering (<20s first card) as the latency mitigation.

**What happens when 2 of 5 ministers fail simultaneously?** Does the Synthesis Gate degrade gracefully or produce garbage? Is there a minimum-minister threshold below which the system should refuse to synthesize? The documents don't specify this.

### Q2: Entity Resolution as Architecture, Not Spike
SPIKE-1 (#36) is labeled as a "Day 0 gate" but treated as a pre-build spike. Entity resolution across FEC/SEC/Polymarket/Kalshi/GDELT has no automated API.

**Is hand-curated entity resolution a viable long-term architecture, or is it a prototype hack masquerading as a design decision?** What happens when the product scales beyond 1 demo entity to 100 tracked entities? What's the maintenance cost per entity per month?

### Q3: The Anti-Oracle Paradox
Design Principle 0 says "Information > No Information" — never collapse to a predictive number. But the product's value proposition is helping executives make better decisions faster.

**If the product explicitly refuses to recommend, what prevents the executive from just using Perplexity/ChatGPT which WILL give them an answer?** The CRUCIBLE found that the anti-oracle stance works IF decision framework scaffolding is added (DR-3). But isn't "if regulatory risk > market opportunity, Regulators win" just a recommendation with extra steps?

### Q4: Single-Turn Collapse
CRUCIBLE DR-1 accepts single-turn as the default path. But the entire minister architecture (5 parallel LLM calls, synthesis gate, tension mapping) was designed for multi-turn depth.

**What's the cost-benefit of running 5 ministers + Opus synthesis for a single-turn session?** If the median session is 1 turn, is this architecture over-engineered? Could a simpler 2-minister + Flash synthesis achieve 80% of the value at 20% of the cost?

### Q5: Stealth Build Feasibility
The stealth worktree (A-013, 35% → 30% post-CRUCIBLE) requires branching a TypeScript monolith, adding 3 database tables, and running on separate infrastructure — all without the parent company (Think Big) noticing.

**Is this operationally realistic?** What about shared database migrations, shared CI/CD pipelines, shared monitoring? The CRUCIBLE identified this as the top demo-day failure mode but proposed no concrete mitigation beyond "complete #57."

### Q6: Model Routing Assumptions
Haiku for Data+Markets (structured formatting), Sonnet for Knowledge+Narrative+News (reasoning), Opus for Synthesis Gate only.

**What evidence exists that Haiku 4.5 can format SEC Form 4 transaction codes without hallucinating provenance?** A-011 is at 48% → 55% post-CRUCIBLE, described as "modest improvement." The CRUCIBLE said "provenance hallucination under context pressure remains a documented unknown." Isn't this still a ship-blocking risk?

### Q7: What's Missing?
Review the full assumption table and CRUCIBLE findings. What assumptions are MISSING entirely? What failure modes haven't been considered? What would a production SRE or a venture capital technical due diligence reviewer flag that this process hasn't?

Specifically consider:
- Monitoring and alerting architecture
- Cost modeling at scale (not just POC)
- Rate limiting and circuit breaker patterns
- Data freshness guarantees and staleness detection
- User trust calibration (how do you know the product is working?)
- Competitive response (what if Perplexity ships a similar feature?)

## Output Format

For each question:
1. **Verdict:** PASS / CONCERN / FAIL
2. **Evidence:** Specific references to assumption IDs, document sections
3. **Severity:** LOW / MEDIUM / HIGH / CRITICAL
4. **Recommendation:** What should change before build starts

End with an overall readiness assessment: Is this architecture ready for the PLAN phase, or does it need another iteration?
