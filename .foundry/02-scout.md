# Phase 2: SCOUT — Research & Prospect

**Metaphor:** Scouting the terrain before committing resources. Where is the richest vein?

**Duration:** 1-4 hours (parallel agents recommended)
**Mode applicability:** GREENFIELD only

---

## What Happens

Structured research. Parallel agents gather competitive intel, design frameworks, technical feasibility, and domain expertise. The goal is to understand the landscape before making decisions.

### Inputs
- Raw idea dump from MINE
- Problem statement
- Buyer personas (rough)

### Process

1. **Parallel research agents** — Deploy 3-5 agents simultaneously:
   - **Competitive analysis** — Who else is doing this? What do they charge? What do they get wrong?
   - **Design research** — UI patterns (Mobbin), interaction models, accessibility requirements
   - **Technical feasibility** — APIs available? Cost per call? Rate limits? Proven stacks?
   - **Domain expertise** — Academic papers, industry reports, expert opinions
   - **User research** — Reddit, forums, reviews of competitor products

2. **Video transcript ingestion** — If research sources include YouTube content, extract transcripts via `yt-dlp` and feed into the knowledge base.

3. **IDEO Design Sprint** — Run the 5-stage synthesis:
   - Empathize → Define → Ideate → Prototype → Test
   - DVF Assessment (Desirability, Viability, Feasibility)

4. **Art direction** (if visual product) — Mood board, brand direction, visual language

5. **Synthesis** — Combine all research into a coherent brief:
   - What we learned
   - What surprised us
   - What's proven vs. speculative
   - Where the opportunity is
   - What the risks are

### Outputs
- Research synthesis document
- Competitive landscape summary
- Technical feasibility assessment
- Design direction / mood board (if applicable)
- Gamma presentation (for stakeholder communication)
- List of sources for NotebookLM (Phase 4)

### Deployment Pipeline Setup (Mandatory for GREENFIELD)

Before you spec a single feature, verify the deployment pipeline exists:

- [ ] Hosting account created (Vercel, Render, Netlify, etc.)
- [ ] Repo connected to hosting (push triggers build)
- [ ] Preview deploys work (test branch → verify URL loads)
- [ ] Environment variables configured
- [ ] Database accessible from deploy
- [ ] Domain configured (if applicable)
- [ ] Build succeeds (`npm run build` — zero errors)

**Why in SCOUT, not ASSAY?** Because deployment constraints shape architecture. IT Concierge rejected Puppeteer because of Vercel's bundle limit — a deployment constraint discovered during SCOUT that changed the FSD. If you wait until HAMMER to discover your hosting can't run your stack, you rewrite the specs.

### What Makes a Good Scout

The Scout phase is done when you can answer:
1. "Why hasn't someone already built this?" (and the answer isn't "they have")
2. "What's the unfair advantage?" (technology, insight, positioning)
3. "What will kill this?" (the honest answer, not the hopeful one)

---

## ⚖️ R2: Vision Gate

See [ratify.md](ratify.md#r2-vision-gate-after-scout)

**Key question:** "Do we truly understand the problem space?"

**Must pass:**
- [ ] Research covers ≥ 3 competitors
- [ ] Technical feasibility confirmed (APIs exist, costs viable)
- [ ] **Deployment pipeline verified** (GREENFIELD only — hosting, preview deploys, env vars)
- [ ] At least 1 surprising insight discovered
- [ ] Blind spots explicitly named
- [ ] Assumption inversion exercise completed
- [ ] Confidence ≥ 8/10
