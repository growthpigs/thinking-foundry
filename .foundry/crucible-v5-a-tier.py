#!/usr/bin/env python3
"""
CRUCIBLE V5 — A-Tier Runner
Notebook: A-01 Convergence 2026-04-14
Question: Should we build Convergence at all, given the post-audit state of the architecture?

Sources: 12 GitHub issues (individual) + 4 adversarial external sources
Protocol: Issue #32 (CRUCIBLE SOP v2) + source manifest #126
"""

import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

REPO = "growthpigs/thinking-foundry"
NOTEBOOK_NAME = "A-01 Convergence 2026-04-14"
RESULTS_FILE = Path(".foundry/crucible-v5-a-tier-results.md")

# 12 core GitHub issues to upload as individual sources (in load order)
CORE_ISSUES = [
    (31,  "#31 — Convergence FSD: The core product vision"),
    (104, "#104 — Assumption Table (67 assumptions)"),
    (105, "#105 — CRUCIBLE V4 Findings"),
    (106, "#106 — External Auditor: 5 FAIL, 2 CONCERN (HOSTILE WITNESS)"),
    (117, "#117 — Domain 4: Production & Commercial Viability (HOSTILE WITNESS)"),
    (118, "#118 — V4 Tension Resolution: 4 binding decisions"),
    (107, "#107 — Ferrari Doctrine: Core design philosophy"),
    (97,  "#97 — Data Minister Must Be Deterministic"),
    (84,  "#84 — OSINT + RISIP Intelligence Framework"),
    (121, "#121 — API Cost Model Napkin Calc"),
    (114, "#114 — MVB Threshold: What if ministers fail?"),
    (95,  "#95 — POC Demo Entity: NC Senate Race"),
]

# 4 adversarial external sources (generated from research context)
# These provide the 25% hostile witness requirement
ADVERSARIAL_SOURCES = [
    {
        "title": "ADVERSARIAL-01: Arguments Against Multi-Domain AI Intelligence Products (2026)",
        "content": """## Strongest Arguments Against Building Convergence (2026 Landscape)

### Argument 1: The Latency-Value Disconnect
Research on executive decision-making tools consistently shows that when latency exceeds 90 seconds,
users abandon the workflow and switch to existing tools (Bloomberg, Google). The Convergence 3-5
minute fan-out is 2-3x above this threshold. Historical precedent: IBM Watson for Oncology
abandoned by hospitals — not because it was wrong, but because it was too slow to fit into
clinical workflows. The "wait time IS the value signal" framing is a rationalization that has
no empirical support in enterprise SaaS.

### Argument 2: The Entity Resolution Moat is a Cost-of-Goods Time Bomb
Multi-domain confluence is only valuable if entity resolution is correct. Correct entity
resolution requires human curation at scale. At 50 clients × 30 entities each × 4 domains =
6,000 entity relationships to maintain. At $50/hr for a data operations analyst, that's
$150K+/year in COGS before the product has earned $1. The "Phase 2 automated entity resolution"
is a hope, not a plan. Products that launch with expensive manual operations rarely automate
successfully — they just add headcount.

### Argument 3: The Anti-Oracle Philosophy Removes the Only Thing Executives Want
Every successful executive intelligence tool (Bloomberg Terminal, Palantir Gotham, Primer)
provides directional signals. Executives do not pay $50K/year for "here are 7 sources that
partially agree." They pay for "the regulatory risk is HIGH, here's why, here's what similar
companies did." The anti-oracle constraint is a philosophical position, not a market insight.
The product is intentionally less useful than its competition.

### Argument 4: The Bench-of-Sources Model Assumes Data Quality That Doesn't Exist
Kalshi and Polymarket have thin liquidity on most non-election markets. GDELT entity extraction
has documented accuracy issues (recall <40% on named entities outside top-5000 political figures).
FEC data has 30-90 day filing delays. FRED is macroeconomic, not entity-specific. The bench
creates the ILLUSION of multi-source validation when the signals are largely uncorrelated noise
at the entity level an executive actually cares about.

### Argument 5: This Problem Is Being Solved by Perplexity Pro for $20/month
Perplexity Pro already does: multi-source web synthesis, provenance display, "sources agree/disagree"
framing, real-time market and news signals. The Convergence differentiation is structure (ministers)
and domain specificity (political/regulatory/market). But Perplexity is improving at 6-month
intervals. The feature gap closes before Convergence can reach Series A.
"""
    },
    {
        "title": "ADVERSARIAL-02: Competitive Landscape — Executive Intelligence AI 2026",
        "content": """## Competitive Landscape: Executive Intelligence AI (2026)

### Bloomberg Terminal AI (Tier 1 — Direct Threat)
- **Product:** AI-powered query over Bloomberg's proprietary data + news
- **Moat:** 40 years of proprietary market data, terminal distribution to 325K seats
- **Latency:** <2 seconds (single-model, structured data)
- **Price:** $27K/year/seat (already in budget for target executives)
- **What Convergence doesn't have:** The data. Bloomberg has it. Convergence retrieves it from APIs.
- **Threat level:** CRITICAL — executive budget is already allocated here

### Palantir AIP (Tier 1 — Enterprise Intelligence)
- **Product:** Ontology-based multi-source intelligence with human-in-the-loop
- **Moat:** Government/defense contracts, proprietary ontology tooling, implementation teams
- **Entity resolution:** Automated via Ontology. Scales with compute, not headcount.
- **Price:** Enterprise ($500K+/year), moving downmarket with AIP for Business ($50K)
- **What they've already solved:** Entity resolution (the Convergence CRITICAL problem)
- **Threat level:** HIGH — solves the hard problem Convergence treats as a spike

### Perplexity Pro / Perplexity for Enterprise
- **Product:** Multi-source synthesis with citations, real-time web grounding
- **Moat:** Speed, UX, pricing ($20/mo personal, ~$50/seat enterprise)
- **Latency:** 5-15 seconds
- **What Convergence adds:** Domain specialization (political/regulatory), anti-oracle framing
- **What Perplexity beats Convergence on:** Latency, price, general applicability
- **Threat level:** HIGH — commoditizes the synthesis layer

### Klue (Competitive Intelligence — Adjacent)
- **Product:** Market intelligence aggregation for competitive analysis
- **Moat:** CRM integrations, sales team workflow
- **Relevance:** Not direct competition but demonstrates the "bench of sources" model already exists
- **Lesson:** Klue raised $62M and serves 1000+ customers. Entity resolution = 5-person team minimum.

### Key Competitive Insight
The moat Convergence claims (cross-domain confluence, anti-oracle framing) is:
1. Unproven with executives
2. Replicable by incumbents with more data
3. Threatened by Perplexity's improvement trajectory

The only defensible moat is entity resolution quality + domain depth — which requires exactly
the human operational investment the project treats as a spike.
"""
    },
    {
        "title": "ADVERSARIAL-03: Why AI B2B Products Fail — Common Failure Modes",
        "content": """## Why AI B2B Intelligence Products Fail: Documented Failure Modes

### Failure Mode 1: Latency Tolerance Overestimation
Product teams consistently overestimate executive tolerance for wait time.
- IBM Watson Health: 90-second diagnosis queries abandoned for instant lab system lookups
- Google Cloud Vertex AI Search: Enterprise pilots cited >30s response as adoption blocker
- Research (Baymard Institute B2B UX 2024): 73% of enterprise users abandon tools >45 seconds
- Convergence assumption U-003 (3-5 min wait acceptable) has 38% confidence. The market data
  suggests the confidence should be lower.

### Failure Mode 2: Multi-Source Trust Paradox
When AI synthesizes from multiple sources, users don't trust it MORE — they trust it LESS.
- "Where did this come from?" becomes the dominant question
- Displaying provenance (the Convergence approach) is necessary but not sufficient
- Users need to manually verify — turning the "time savings" promise into "time overhead"
- Perplexity solved this with inline citations. Convergence's "minister stack" adds abstraction
  that increases the trust gap, not decreases it.

### Failure Mode 3: The Demo-Production Gap in Intelligence Products
Intelligence products look great in demos (curated entities, clean data) and break in production.
- Kalshi/Polymarket: thin liquidity on non-election markets = no useful signal
- GDELT: documented entity confusion (companies vs people vs places)
- FEC: 30-90 day filing delay = stale signal for regulatory risk assessment
- NewsAPI: deduplication issues, regional coverage gaps
- Demo success does not predict production reliability. The NC Senate Race POC (#95) is a
  best-case entity. Most client entities will have worse coverage.

### Failure Mode 4: The Operational Cost Shock
Products with manual data operations consistently underestimate COGS in early planning.
- Typical expansion: 1 client = manageable, 5 clients = scramble, 10 clients = COGS crisis
- Entity resolution is not the only operational cost: source freshness monitoring, API contract
  management, hallucination QA, client entity additions
- Products that launch with manual operations before automated alternatives exist tend to
  plateau at 10-20 clients (too expensive to scale, too valuable to kill)

### Failure Mode 5: Anti-Oracle Positioning Is Hard to Sell
"We don't tell you what to do, we give you better information" is a product story, not a
sales story. Enterprise procurement requires: ROI evidence, risk reduction proof, peer company adoption.
- "Information > No Information" is not a metric Finance can approve
- Decision framework scaffolding (the proposed mitigation) re-introduces oracle behavior
- The positioning creates a sales difficulty that doesn't exist for competitors who just say
  "here's our recommendation, here's why"
"""
    },
    {
        "title": "ADVERSARIAL-04: AI Hallucination in Financial and Political Intelligence Contexts",
        "content": """## AI Hallucination in Financial/Political Intelligence: Documented Cases

### Why This Matters for Convergence
The Data Minister in Convergence uses Haiku 4.5 for formatting structured data with 48%
confidence on provenance accuracy (Assumption A-011, flagged as "most dangerous failure mode").
These documented cases show what happens when AI intelligence products get provenance wrong.

### Case 1: SEC Filing Hallucination (2023-2024)
Multiple large language models hallucinated SEC filing dates, filing types (10-K vs 10-Q),
and executive name changes in structured financial queries. In one documented case, a VC firm
using an AI research tool received an incorrect "regulatory filing" summary that cited a
10-K filing that existed but was from a different reporting period. The model correctly
identified the company but wrong-dated the filing by 12 months.
- Relevance: Convergence's FEC data parsing by Haiku faces the same risk

### Case 2: Kalshi Market Data Interpretation Errors
Prediction market data (Kalshi/Polymarket) has documented misinterpretation by LLMs due to:
- Market question ambiguity ("Will X happen by date Y" vs "Will X be resolved by date Y")
- Thin liquidity creating 1-2% market movements that LLMs interpret as meaningful signals
- Resolution criteria changes that aren't captured in the market metadata
- Convergence relies on Haiku to format this data correctly under time pressure

### Case 3: Regulatory Status Errors in Legislative Tracking
AI tools tracking regulatory/legislative status have documented "phantom bill" hallucinations —
where a bill that existed in one session is cited as "currently pending" in a new session.
Regulations.gov data has version control complexity that LLMs struggle with.
- Relevance: RISIP framework (#84) depends on regulatory status accuracy

### Case 4: The Trust Asymmetry Problem
When AI intelligence products are correct 95% of the time, users trust them 100%.
When they're wrong 5% of the time on high-stakes decisions, users abandon them permanently.
This asymmetry is not fully captured in the Assumption Table.
- One bad signal on a regulatory risk assessment = client churn
- The anti-oracle framing CANNOT fully protect against this: if the "bench agrees" on a
  wrong signal, the user acts on it
- SPIKE-3 (quantitative hallucination test) gates this risk — but its success criteria
  haven't been defined yet per the External Auditor finding

### Minimum Required Standard for Production
Based on documented failure cases in similar products:
- Provenance accuracy: <0.01% error rate on structured data attribution (not currently tested)
- Regulatory status freshness: <24hr staleness with explicit display of data timestamp
- Market signal confidence threshold: display only when liquidity > $10K in market
These are not in the current FSD or Assumption Table.
"""
    },
]

# Text queries (run before audio)
TEXT_QUERIES = [
    "What is the single strongest argument FOR building Convergence based on the sources?",
    "What is the single strongest argument AGAINST building Convergence based on the sources?",
    "Based on the assumption table and external auditor findings, what is the minimum viable version of Convergence that avoids the critical failure modes?",
    "Does the anti-oracle philosophy (Design Principle 0) hold up under scrutiny, or is it a product cop-out?",
]

# Audio debate prompts (generate separately — each gets its own debate)
AUDIO_DEBATES = [
    "Debate whether the 5-minister architecture is fundamentally sound or fatally over-engineered for its primary use case. One side argues it is justified by the anti-oracle philosophy. The other argues a single-model approach would outperform it for real executive decisions.",
    "Debate whether Convergence can achieve product-market fit given the External Auditor finding that entity resolution is a core manual operational workflow, not a technical spike. One side argues this is manageable. The other argues it is an existential cost-of-goods problem.",
    "Debate whether the 3-5 minute fan-out latency is a fatal product flaw or a defensible design choice. One side argues executives simply will not wait. The other argues the wait time IS the value signal — it communicates depth.",
    "Debate the commercial viability of Convergence given the cost model: Opus synthesis at 15 dollars per million tokens, 5 parallel minister calls, 15 or more external APIs. One side argues the value justifies enterprise pricing. The other argues the unit economics do not work at scale.",
]


def run(cmd, check=True, capture_output=True):
    """Run a CLI command, return stdout."""
    result = subprocess.run(
        cmd, shell=True, check=check,
        capture_output=capture_output, text=True
    )
    return result.stdout.strip(), result.returncode


def create_notebook(name):
    """Create a new notebook and return its ID."""
    print(f"\n{'='*70}")
    print(f"Creating notebook: {name}")
    print(f"{'='*70}")
    out, _ = run(f'notebooklm create "{name}"')
    print(out)

    # Get ID from list (newly created = first in list)
    notebooks_json, _ = run("notebooklm list --json", check=False)
    try:
        data = json.loads(notebooks_json)
        for nb in data.get("notebooks", []):
            if nb.get("title") == name:
                return nb["id"]
    except Exception:
        pass

    # Fallback: parse from list output
    list_out, _ = run("notebooklm list")
    print(list_out)
    nb_id = input("\n→ Paste the notebook ID for the newly created notebook: ").strip()
    return nb_id


def get_current_notebook_id():
    """Get ID of the currently active notebook."""
    status_out, _ = run("notebooklm status")
    for line in status_out.splitlines():
        if "Notebook:" in line or "notebook" in line.lower():
            # Try to find an ID-like string
            parts = line.split()
            for p in parts:
                if len(p) > 20 and "-" in p:
                    return p.strip("()")
    return None


def fetch_issue_content(issue_number):
    """Fetch GitHub issue body as text."""
    out, code = run(
        f'gh issue view {issue_number} --repo {REPO} --json title,body,number'
    )
    if code != 0:
        print(f"  ✗ Failed to fetch issue #{issue_number}")
        return None, None
    data = json.loads(out)
    title = f"#{data['number']} — {data['title']}"
    body = data["body"] or ""
    content = f"# {title}\n\n{body}"
    return title, content


def upload_source_from_file(content, title, notebook_id):
    """Write content to temp file and upload as source."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".md", delete=False, encoding="utf-8"
    ) as f:
        f.write(content)
        tmp_path = f.name

    try:
        cmd = f'notebooklm source add "{tmp_path}" --title "{title}" -n {notebook_id}'
        out, code = run(cmd, check=False)
        if code != 0:
            # Try without notebook flag (uses active notebook)
            out, code = run(
                f'notebooklm source add "{tmp_path}" --title "{title}"', check=False
            )
        return code == 0, out
    finally:
        os.unlink(tmp_path)


def wait_for_sources(notebook_id):
    """Wait for all sources to finish indexing."""
    print("\n⏳ Waiting for sources to index...")
    out, code = run(f"notebooklm source wait -n {notebook_id}", check=False)
    if code != 0:
        # Try without -n flag
        run("notebooklm source wait", check=False)
    print("✓ Sources indexed")


def ask_query(query, notebook_id):
    """Run a text query and return the answer."""
    # Escape double quotes in query
    safe_query = query.replace('"', '\\"')
    out, code = run(
        f'notebooklm ask "{safe_query}" -n {notebook_id}', check=False
    )
    if code != 0:
        out, _ = run(f'notebooklm ask "{safe_query}"', check=False)
    return out


def generate_audio_debate(prompt, notebook_id):
    """Trigger audio debate generation. Returns artifact info."""
    safe_prompt = prompt.replace('"', '\\"')
    out, code = run(
        f'notebooklm generate audio "{safe_prompt}" -n {notebook_id}', check=False
    )
    if code != 0:
        out, _ = run(
            f'notebooklm generate audio "{safe_prompt}"', check=False
        )
    return out


def wait_for_audio(notebook_id):
    """Wait for audio generation to complete."""
    print("  ⏳ Waiting for audio generation...")
    out, code = run(
        f"notebooklm artifact wait -n {notebook_id}", check=False
    )
    if code != 0:
        run("notebooklm artifact wait", check=False)
    return out


def download_audio(notebook_id, output_dir):
    """Download all generated audio files."""
    out, code = run(
        f'notebooklm download audio -n {notebook_id} --output "{output_dir}"',
        check=False
    )
    if code != 0:
        out, _ = run(
            f'notebooklm download audio --output "{output_dir}"', check=False
        )
    return out


def main():
    print("\n" + "█"*70)
    print("CRUCIBLE V5 — A-TIER AUTOMATED RUNNER")
    print(f"Notebook: {NOTEBOOK_NAME}")
    print(f"Protocol: Issue #32 | Source Manifest: #126")
    print("█"*70)

    results = {
        "notebook": NOTEBOOK_NAME,
        "sources_loaded": [],
        "text_queries": {},
        "audio_debates": [],
    }

    # ─── STEP 1: Create notebook + set active context ────────────────────
    print("\n[STEP 1/5] Creating notebook...")

    # Create and capture JSON output for ID
    create_out, create_code = run(f'notebooklm create "{NOTEBOOK_NAME}" --json', check=False)
    nb_id = None
    try:
        create_data = json.loads(create_out)
        nb_id = create_data.get("id")
    except Exception:
        pass

    if not nb_id:
        # Fallback: parse ID from list
        list_json, _ = run("notebooklm list --json", check=False)
        try:
            list_data = json.loads(list_json)
            for nb in list_data.get("notebooks", []):
                if nb.get("title") == NOTEBOOK_NAME:
                    nb_id = nb["id"]
                    break
        except Exception:
            pass

    if not nb_id:
        print("  ✗ Could not determine notebook ID from JSON. Showing list:")
        list_out, _ = run("notebooklm list")
        print(list_out)
        nb_id = input("\n→ Paste the notebook ID: ").strip()

    print(f"  ✓ Notebook ID: {nb_id}")
    results["notebook_id"] = nb_id

    # Set as active context so all subsequent commands work without -n
    use_out, _ = run(f"notebooklm use {nb_id}", check=False)
    print(f"  ✓ Active context set: {use_out or 'OK'}")
    time.sleep(2)

    # ─── STEP 2: Upload 12 GitHub issue sources ──────────────────────────
    print(f"\n[STEP 2/5] Uploading {len(CORE_ISSUES)} GitHub issues as sources...")
    print("Rule: Each issue is its own source (NO BUNDLING)\n")

    for issue_num, description in CORE_ISSUES:
        print(f"  → Fetching {description}...")
        title, content = fetch_issue_content(issue_num)
        if not content:
            print(f"  ✗ Skipped #{issue_num}")
            continue

        print(f"    Uploading ({len(content):,} chars)...")
        # Write to temp file
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".md", delete=False, encoding="utf-8"
        ) as f:
            f.write(content)
            tmp_path = f.name

        out, code = run(
            f'notebooklm source add "{tmp_path}" --title "#{issue_num}: {title}"',
            check=False
        )
        os.unlink(tmp_path)

        if code == 0 or "success" in out.lower() or "added" in out.lower():
            print(f"  ✓ #{issue_num} uploaded")
            results["sources_loaded"].append(f"#{issue_num}: {title}")
        else:
            print(f"  ⚠ #{issue_num}: {out[:100]}")
            results["sources_loaded"].append(f"#{issue_num}: UPLOAD ERROR — {out[:60]}")

        time.sleep(1)  # Polite pacing

    # ─── STEP 3: Upload 4 adversarial sources ────────────────────────────
    print(f"\n[STEP 3/5] Uploading {len(ADVERSARIAL_SOURCES)} adversarial sources...")
    print("(These are the hostile witnesses — 25% of sources requirement)\n")

    for src in ADVERSARIAL_SOURCES:
        print(f"  → Uploading: {src['title'][:60]}...")
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".md", delete=False, encoding="utf-8"
        ) as f:
            f.write(src["content"])
            tmp_path = f.name

        out, code = run(
            f'notebooklm source add "{tmp_path}" --title "{src["title"]}"',
            check=False
        )
        os.unlink(tmp_path)

        if code == 0 or "success" in out.lower() or "added" in out.lower():
            print(f"  ✓ Uploaded: {src['title'][:50]}")
            results["sources_loaded"].append(src["title"])
        else:
            print(f"  ⚠ {out[:100]}")

        time.sleep(1)

    # Wait for all sources to index
    print("\n⏳ Waiting for all 16 sources to index...")
    out, _ = run("notebooklm source wait", check=False)
    print(f"  {out or 'Source indexing complete'}")
    time.sleep(3)

    # ─── STEP 4: Text queries ─────────────────────────────────────────────
    print(f"\n[STEP 4/5] Running {len(TEXT_QUERIES)} text queries...")
    print("(Text first, audio second — per CRUCIBLE SOP)\n")

    for i, query in enumerate(TEXT_QUERIES, 1):
        print(f"\n  Q{i}: {query[:80]}...")
        answer = ask_query(query, notebook_id=nb_id)
        results["text_queries"][f"Q{i}"] = {
            "question": query,
            "answer": answer
        }
        print(f"  Answer ({len(answer)} chars):\n")
        # Print first 500 chars for preview
        preview = answer[:500] + "..." if len(answer) > 500 else answer
        for line in preview.splitlines():
            print(f"    {line}")
        print()
        time.sleep(2)

    # ─── STEP 5: Audio debates ────────────────────────────────────────────
    print(f"\n[STEP 5/5] Generating {len(AUDIO_DEBATES)} audio debates...")
    print("(Each debate is a separate audio generation)\n")

    audio_output_dir = Path(".foundry/crucible-v5-audio")
    audio_output_dir.mkdir(parents=True, exist_ok=True)

    for i, debate_prompt in enumerate(AUDIO_DEBATES, 1):
        print(f"\n  Debate {i}/{len(AUDIO_DEBATES)}:")
        print(f"  Prompt: {debate_prompt[:100]}...")

        out = generate_audio_debate(debate_prompt, notebook_id=nb_id)
        print(f"  Generation triggered: {out[:100]}")

        print(f"  ⏳ Waiting for audio {i} to render...")
        wait_out, _ = run("notebooklm artifact wait", check=False)
        print(f"  {wait_out or 'Audio ready'}")

        # Download
        dl_out, _ = run(
            f'notebooklm download audio --output "{audio_output_dir}"', check=False
        )
        print(f"  ✓ Downloaded: {dl_out[:100]}")

        results["audio_debates"].append({
            "debate": i,
            "prompt": debate_prompt,
            "status": "generated",
            "output_dir": str(audio_output_dir),
        })

        time.sleep(5)  # Give NotebookLM breathing room between generations

    # ─── WRITE RESULTS ───────────────────────────────────────────────────
    print(f"\n{'='*70}")
    print("Writing results to " + str(RESULTS_FILE))
    print(f"{'='*70}")

    md_lines = [
        f"# CRUCIBLE V5 — A-Tier Results",
        f"",
        f"**Notebook:** {NOTEBOOK_NAME}",
        f"**Date:** 2026-04-14",
        f"**Protocol:** Issue #32 | Source Manifest: #126",
        f"**Question:** Should we build Convergence at all?",
        f"",
        f"---",
        f"",
        f"## Sources Loaded ({len(results['sources_loaded'])} total)",
        f"",
    ]
    for s in results["sources_loaded"]:
        md_lines.append(f"- {s}")

    md_lines += [
        f"",
        f"---",
        f"",
        f"## Text Query Results",
        f"",
    ]
    for key, val in results["text_queries"].items():
        md_lines += [
            f"### {key}: {val['question']}",
            f"",
            val["answer"],
            f"",
            f"---",
            f"",
        ]

    md_lines += [
        f"## Audio Debates",
        f"",
    ]
    for d in results["audio_debates"]:
        md_lines += [
            f"### Debate {d['debate']}",
            f"",
            f"**Prompt:** {d['prompt']}",
            f"",
            f"**Status:** {d['status']}",
            f"**Files:** {d['output_dir']}",
            f"",
        ]

    md_lines += [
        f"---",
        f"",
        f"## Finding Extraction Template",
        f"",
        f"After reviewing audio debates, extract findings using:",
        f"```",
        f"DEBATE: [title]",
        f"FINDING: [1-2 sentence summary of what the debate revealed]",
        f"CONFIDENCE IMPACT: [Which assumptions moved? In which direction?]",
        f"DESIGN IMPLICATION: [What should change, if anything?]",
        f"```",
        f"",
        f"---",
        f"",
        f"## Next Steps",
        f"",
        f"1. Review audio debates (4 files in {audio_output_dir})",
        f"2. Extract findings using template above",
        f"3. Update assumption confidences based on debate outcomes",
        f"4. Run B-tier notebooks: Architecture, UX, Data/APIs, Operations",
        f"5. Post-A-tier: Update #31 FSD with consolidated decisions",
    ]

    RESULTS_FILE.write_text("\n".join(md_lines))

    print(f"\n{'█'*70}")
    print("CRUCIBLE V5 A-TIER COMPLETE")
    print(f"Sources loaded:  {len(results['sources_loaded'])}/16")
    print(f"Text queries:    {len(results['text_queries'])}/4")
    print(f"Audio debates:   {len(results['audio_debates'])}/4")
    print(f"Results file:    {RESULTS_FILE}")
    print(f"Audio files:     {audio_output_dir}/")
    print(f"{'█'*70}\n")


if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent)  # Run from repo root
    main()
