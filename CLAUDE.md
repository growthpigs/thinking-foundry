# The Thinking Foundry — Project Context

**Project Type:** Software Product + Consulting Service
**Status:** Phase 0 (User Stories Definition)
**Started:** 2026-03-28
**Owner:** Roderic Andrews

---

## What This Is (Executive Summary)

The Thinking Foundry is a **voice-first SaaS product** that teaches people how to think clearly when using AI.

**The Problem We Solve:** AI gives you 70% quality answers. The final 30% requires context, constraints, and judgment specific to YOUR situation. Most people don't know how to bridge that gap.

**Our Solution:** A guided thinking session where we explore your problem together, document the entire process in GitHub, and you leave with clarity + a repeatable thinking framework.

**Revenue Model:**
- $500 Discovery Session (1-3 hours, voice + GitHub repo)
- $1,000+ Follow-up Sessions
- $5K-20K Longer Engagements (team training, implementation)

---

## The Product

### What You're Building

A **voice-first interface** (using Google Gemini Live API) that:
1. Listens to your problem statement
2. Guides you through a structured thinking process (Phase 0 → Phase 7)
3. Documents your entire thinking in a GitHub issue
4. Adapts based on your constraints, values, and timeline
5. Generates clear answers tied to YOUR specific situation (not generic advice)

### Why Voice-First

- **Interruption-enabled** — you can jump in, ask follow-ups, challenge ideas in real-time
- **Conversational** — thinking out loud is how humans think
- **Low friction** — no typing, no waiting for batch responses
- **Authentic** — captures the actual thinking process, not just final answers

### Technical Foundation

- **Frontend** — TypeScript + React + Vercel
- **Voice Engine** — Google Gemini Live API (real-time streaming, tool use, tone detection)
- **Thinking Space** — GitHub API (store sessions as issues, collaborate with client)
- **Backend** — Cloudflare Workers (Lambda for scalability)

---

## The Phases

Every thinking session follows The Foundry's battle-tested 8-phase pipeline:

| Phase | Name | Duration | What Happens |
|-------|------|----------|--------------|
| 0 | **User Stories** | 5-10 min | What do you want? What's success? What are real constraints? |
| 1 | **MINE** | 10-15 min | Deep listening. What's the actual problem? |
| 2 | **SCOUT** | 20-30 min | Explore possibility space. Sources, frameworks, contradictions. |
| 3 | **ASSAY** | 15-20 min | Signal from noise. What matters for THIS person? |
| 4 | **CRUCIBLE** | 15-20 min | Test ideas. What breaks? War-game scenarios. |
| 5 | **AUDITOR** | 10-15 min | Quality check. Logical gaps? Confidence ≥8? |
| 6 | **PLAN** | 10-15 min | Clear answers. Here's what you do, here's why. |
| 7 | **VERIFY** | 5 min | Document. Export session to shareable GitHub issue. |

**Total Duration:** 60-120 minutes per session

---

## Core Principles

### 1. Stoicism Is the Foundation
- Focus on what's in their control
- Accept what's not
- Seek virtue in thinking (not the answer, but good thinking)
- Use constraints as clarification, not limitation

### 2. Person-Specific Optimization (Not Modal)
- Modal answer = what works for most people
- Optimal answer = what works for THIS person given THEIR goals, constraints, philosophy, timeline
- Adapt every framework to fit them, never force them into frameworks

### 3. Keep the Possibility Space Wide
- Resist jumping to solutions
- Always ask "what else?"
- Bring in sources from everywhere (famous, obscure, adjacent industries)
- Hold complexity instead of reducing to simple

### 4. GitHub Is the Thinking Space
- Issues capture real-time deliberation
- Clients see the thinking process (not a polished answer)
- Repos are shareable, teachable, transparent
- Everyone can learn how you actually think

### 5. AI + Human Judgment
- AI has answers (based on training data patterns)
- Humans have judgment (based on values, constraints, experience)
- The Thinking Foundry shows how to synthesize them

---

## Target Market (ICP)

### Primary: C-Suite with Teams
- VP/Director managing 10+ people
- Company has funding or revenue
- Budget: $20K-50K for clarity
- Pain: "We have AI tools but our team doesn't think clearly"

### Secondary: Founders with Serious Budgets
- Pre-Series A or later (have money)
- Solo or small team, but well-funded
- Budget: $2K-20K to validate credibility
- Pain: "My project is 70% done but I don't know what's wrong"

### Not For
- People without budget (can't afford $500-1K per session)
- People looking for cheap generic advice
- People who want you to do the work (not thinking alongside)
- People who won't participate

---

## Business Model

### Revenue Streams

| Offering | Price | Duration | Who | DUs |
|----------|-------|----------|-----|-----|
| Discovery Session | $500 | 1-3 hrs | 1:1 | 1-2 |
| Follow-Up Session | $1,000+ | 1-3 hrs | 1:1 | 1-2 |
| Team Training | $5K-10K | 2-4 weeks | N:1 team | 5-8 |
| Retainer Advisory | $20K+/month | Ongoing | N:1 | Variable |

### Customer Acquisition

- Content (YouTube, Substack, blog) proving you teach thinking
- LinkedIn (3x/week posts about decision-making, AI, stoicism)
- Network (warm intros from founders, CIOs, executives)
- Case studies (GitHub repos showing thinking process)

---

## What Success Looks Like

### Year 1 Goals
- Launch MVP (voice interface + GitHub integration)
- Run 20+ discovery sessions (proof of concept)
- Achieve $5K/month ARR (discovery sessions)
- Create 10 case studies
- Build audience to 5K+ followers (LinkedIn/Twitter)

### Year 2 Goals
- Scale to $15K-20K/month
- Launch "team license" (team training)
- Build content curriculum (courses, workshops)
- Establish brand as "the thinking coach for AI era"

---

## Handover

**Last Session:** 2026-03-28
- Updated Constitution (#16) with refined content
- Updated Positioning (#21), Target Market (#10), Metallurgy (#9), Case Studies (#5)
- Created thinking-foundry repo
- Defined all 8 phases with Phase 0 as anchor

**Next Steps:**
1. Define Phase 0 (User Stories) in detail
2. Create FSD (Functional Specification Document) for voice interface
3. Research Gemini Live API integration
4. Define per-phase prompts for AI guide
5. Create MVP scope
6. Design GitHub issue template for thinking sessions

**Open Questions:**
- How to handle interruptions in voice conversations?
- How to capture thinking in GitHub issues from voice (transcription?)?
- How to charge for discovery sessions (Stripe integration)?
- How to measure "clarity achieved" (confidence score in Phase 5)?

---

**Philosophy:** The Thinking Foundry is not software. It's how I think, made repeatable and teachable.
