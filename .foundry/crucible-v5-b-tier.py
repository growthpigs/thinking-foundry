#!/usr/bin/env python3
"""
CRUCIBLE V5 — B-Tier Runner (4 Domain Notebooks)
B-01 Architecture | B-02 UX | B-03 Data/APIs | B-04 Operations
Protocol: Issue #32 (CRUCIBLE SOP v2)
"""

import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

REPO = "growthpigs/thinking-foundry"
RESULTS_DIR = Path(".foundry/crucible-v5-b-results")
AUDIO_DIR = Path(".foundry/crucible-v5-audio")

# ─── B-TIER NOTEBOOK CONFIGS ─────────────────────────────────────────────────

NOTEBOOKS = [
    {
        "name": "B-01 Architecture 2026-04-14",
        "question": "Is the 5-minister fan-out architecture buildable, reliable, and cost-effective?",
        "issues": [96, 31, 75, 97, 114, 118, 121, 107, 106, 105],
        "text_queries": [
            "Is the latency per-minister (Markets/News <5s, Knowledge <15s, Data <30s) achievable with the proposed service architecture?",
            "What breaks first in the 5-minister fan-out under production conditions — latency, cost, or reliability?",
            "Is the model routing decision (Haiku×2, Sonnet×3, Opus×1) sound, or does it create a quality-cost tradeoff the product can't afford?",
            "What is the single architectural assumption with the highest probability of being wrong by demo day?",
        ],
        "audio_debates": [
            "Debate whether the 5-minister parallel fan-out is the right architecture, or whether a sequential triage approach (run one minister first, decide which others to invoke) would be cheaper and faster without sacrificing the anti-oracle value proposition.",
            "Debate whether the Minimum Viable Briefing threshold (3 of 5 ministers, at least one quantitative) is the right safety gate, or whether it creates false confidence when the wrong 3 ministers respond.",
        ],
    },
    {
        "name": "B-02 UX 2026-04-14",
        "question": "Does the Convergence UX design solve the anti-oracle paradox without alienating executives?",
        "issues": [31, 110, 119, 122, 118, 107, 106, 104, 95, 84],
        "text_queries": [
            "Does the Chief of Staff escape hatch (#110) solve the anti-oracle paradox, or does it just reintroduce oracle behavior under a different label?",
            "Will suggestion pills (#119) successfully pull executives into multi-turn workflows, or will they feel like friction in a product that should give immediate value?",
            "What is the most likely UX failure mode that kills adoption in the first week of a pilot?",
            "Is the anti-oracle framing a competitive advantage or a sales blocker at the enterprise procurement level?",
        ],
        "audio_debates": [
            "Debate whether Convergence needs the Chief of Staff feature to be commercially viable, or whether the anti-oracle stance is so differentiated that adding a recommendation layer destroys the product's identity.",
            "Debate whether the 3-5 minute wait time can be made acceptable through UX design (progress animation, partial result streaming, suggestion pills while waiting), or whether it is a fundamental adoption killer that UX cannot fix.",
        ],
    },
    {
        "name": "B-03 Data-APIs 2026-04-14",
        "question": "Is the bench of sources reliable, affordable, and legally usable at production scale?",
        "issues": [31, 84, 97, 95, 121, 123, 124, 125, 106, 105],
        "text_queries": [
            "Which of the 15+ bench sources (Polymarket, Kalshi, FEC, GDELT, NewsAPI, FRED, Regulations.gov) has the highest probability of producing a misleading or stale signal that the Synthesis Gate won't catch?",
            "Is the Mentionlytics replacement for the Narrative Minister solved? What is the correct alternative given the API constraint?",
            "Does the SPIKE-3 quantitative test (#125) adequately gate the Haiku provenance hallucination risk, or does 1,000 cases underpower the study?",
            "What is the realistic monthly API cost for a 10-client production deployment (not POC pricing)?",
        ],
        "audio_debates": [
            "Debate whether the bench-of-sources model creates genuine cross-domain confluence signal or just aggregates correlated noise — specifically for political/regulatory intelligence where Polymarket, FEC, and news data all react to the same events.",
            "Debate whether Haiku 4.5 can reliably format structured FEC/SEC/Kalshi data with less than 0.01% provenance error, or whether the minister architecture requires a deterministic, non-LLM data layer for all structured sources.",
        ],
    },
    {
        "name": "B-04 Operations 2026-04-14",
        "question": "Can Convergence be run in production without the operational costs destroying the business model?",
        "issues": [31, 117, 106, 104, 121, 114, 84, 95, 118, 97],
        "text_queries": [
            "What is the minimum entity operations team required to run 10 clients at production quality — and what does that cost annually?",
            "Which of the 7 External Auditor failures (Q1-Q7) is still unresolved after the V4 Tension Resolution (#118)?",
            "What circuit breaker patterns are required for the 15+ external API sources — and which sources most need graceful degradation?",
            "Is there a defensible path to $5M ARR with the current manual entity resolution COGS model, or does automated entity resolution have to be solved first?",
        ],
        "audio_debates": [
            "Debate whether Convergence should launch with manual entity resolution as a known scaling bottleneck, or whether it is operationally irresponsible to build a product whose core value proposition requires a labor-intensive process with no clear automation path.",
            "Debate whether the observability and circuit-breaker requirements (minister health metrics, API failure alerts, data freshness SLAs) are production-blocking requirements or nice-to-haves that can ship post-MVP.",
        ],
    },
]


def run(cmd, check=True):
    result = subprocess.run(cmd, shell=True, check=check, capture_output=True, text=True)
    return result.stdout.strip(), result.returncode


def fetch_issue(number):
    out, code = run(f'gh issue view {number} --repo {REPO} --json title,body,number', check=False)
    if code != 0:
        return None, None
    data = json.loads(out)
    title = f"#{data['number']} — {data['title']}"
    content = f"# {title}\n\n{data.get('body', '')}"
    return title, content


def upload_source(content, title):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False, encoding="utf-8") as f:
        f.write(content)
        path = f.name
    safe_title = title.replace('"', '\\"')
    out, code = run(f'notebooklm source add "{path}" --title "{safe_title}"', check=False)
    os.unlink(path)
    return code == 0 or "added" in out.lower()


def create_notebook(name):
    out, _ = run(f'notebooklm create "{name}" --json', check=False)
    try:
        return json.loads(out).get("id")
    except Exception:
        pass
    # Fallback: find by title in list
    list_out, _ = run("notebooklm list --json", check=False)
    try:
        for nb in json.loads(list_out).get("notebooks", []):
            if nb["title"] == name:
                return nb["id"]
    except Exception:
        pass
    return None


def run_notebook(nb_config, results):
    name = nb_config["name"]
    print(f"\n{'█'*70}")
    print(f"NOTEBOOK: {name}")
    print(f"Question: {nb_config['question']}")
    print(f"{'█'*70}")

    # Create + activate
    print(f"\n→ Creating notebook...")
    nb_id = create_notebook(name)
    if not nb_id:
        # Parse from list after create
        run(f'notebooklm create "{name}"', check=False)
        time.sleep(2)
        list_out, _ = run("notebooklm list --json", check=False)
        for nb in json.loads(list_out).get("notebooks", []):
            if nb["title"] == name:
                nb_id = nb["id"]
                break

    if nb_id:
        run(f"notebooklm use {nb_id}", check=False)
        print(f"  ✓ ID: {nb_id}")
    else:
        print(f"  ✗ Could not get ID — continuing with active context")

    nb_results = {"name": name, "id": nb_id, "sources": [], "queries": {}, "audio": []}

    # Upload issues
    print(f"\n→ Uploading {len(nb_config['issues'])} issues...")
    for issue_num in nb_config["issues"]:
        title, content = fetch_issue(issue_num)
        if not content:
            print(f"  ✗ #{issue_num}: fetch failed")
            continue
        ok = upload_source(content, f"#{issue_num}: {title}")
        status = "✓" if ok else "⚠"
        print(f"  {status} #{issue_num} ({len(content):,} chars)")
        nb_results["sources"].append(f"#{issue_num}: {title}")
        time.sleep(1)

    # Wait for indexing
    print(f"\n→ Waiting for sources to index...")
    run("notebooklm source wait", check=False)
    time.sleep(3)

    # Text queries
    print(f"\n→ Running {len(nb_config['text_queries'])} text queries...")
    for i, query in enumerate(nb_config["text_queries"], 1):
        print(f"  Q{i}: {query[:70]}...")
        safe_q = query.replace('"', '\\"')
        answer, _ = run(f'notebooklm ask "{safe_q}"', check=False)
        nb_results["queries"][f"Q{i}"] = {"question": query, "answer": answer}
        print(f"  → {len(answer)} chars")
        time.sleep(2)

    # Audio debates
    print(f"\n→ Generating {len(nb_config['audio_debates'])} audio debates...")
    artifact_ids = []
    for i, prompt in enumerate(nb_config["audio_debates"], 1):
        print(f"  Debate {i}: {prompt[:80]}...")
        safe_p = prompt.replace('"', '\\"')
        out, _ = run(f'notebooklm generate audio "{safe_p}"', check=False)
        # Extract artifact ID from output
        art_id = None
        for token in out.split():
            if len(token) > 30 and "-" in token:
                art_id = token.strip(".,:()")
                break
        if art_id:
            artifact_ids.append(art_id)
        print(f"  → Triggered: {out[:60]}")
        time.sleep(3)

    # Wait for audio
    print(f"\n→ Waiting for audio generation ({len(artifact_ids)} debates)...")
    max_polls = 15
    for poll in range(max_polls):
        time.sleep(60)
        all_done = True
        for art_id in artifact_ids:
            poll_out, _ = run(f'notebooklm artifact poll "{art_id}"', check=False)
            status = "pending"
            for line in poll_out.splitlines():
                if "status=" in line:
                    status = line.split("status=")[1].strip().strip("'\"").split(",")[0]
                    break
            if status != "completed":
                all_done = False
        print(f"  Poll {poll+1}/{max_polls}: {'✓ done' if all_done else 'still generating...'}")
        if all_done:
            break

    # Download audio
    dl_out, _ = run(f'notebooklm download audio --all "{AUDIO_DIR}/"', check=False)
    print(f"  Downloaded: {dl_out[:100]}")
    nb_results["audio"] = artifact_ids

    results[name] = nb_results
    return nb_results


def write_results(all_results):
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    lines = [
        "# CRUCIBLE V5 — B-Tier Results",
        "",
        "**Date:** 2026-04-14",
        "**Protocol:** Issue #32 | Upstream: A-tier complete (16 sources, 4/4 queries, 4/4 audio)",
        "",
        "---",
        "",
    ]

    for nb_name, nb_data in all_results.items():
        lines += [f"## {nb_name}", ""]
        lines += [f"**Notebook ID:** {nb_data.get('id', 'unknown')}", ""]
        lines += ["**Sources:** " + str(len(nb_data.get("sources", []))), ""]

        for key, val in nb_data.get("queries", {}).items():
            lines += [
                f"### {key}: {val['question']}",
                "",
                val["answer"],
                "",
                "---",
                "",
            ]

    # Finding extraction template at bottom
    lines += [
        "## Finding Extraction Template",
        "",
        "```",
        "NOTEBOOK: [name]",
        "DEBATE: [title]",
        "FINDING: [1-2 sentence summary]",
        "CONFIDENCE IMPACT: [Which assumptions moved?]",
        "DESIGN IMPLICATION: [What should change?]",
        "```",
        "",
        "## Next Steps",
        "1. Review B-tier audio debates",
        "2. Extract findings using template above",
        "3. Run D-tier synthesis notebook",
        "4. Post-CRUCIBLE: FSD consolidation pass on #31",
    ]

    out_file = RESULTS_DIR / "b-tier-all-results.md"
    out_file.write_text("\n".join(lines))
    print(f"\n✓ Results written to {out_file}")
    return out_file


def main():
    os.chdir(Path(__file__).parent.parent)
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    print("\n" + "█"*70)
    print("CRUCIBLE V5 — B-TIER RUNNER (4 DOMAIN NOTEBOOKS)")
    print("Architecture | UX | Data/APIs | Operations")
    print("█"*70)

    all_results = {}
    for i, nb_config in enumerate(NOTEBOOKS, 1):
        print(f"\n[{i}/4] Starting notebook: {nb_config['name']}")
        nb_results = run_notebook(nb_config, all_results)
        print(f"✓ {nb_config['name']} complete — {len(nb_results['queries'])} queries, {len(nb_results['audio'])} audio")
        time.sleep(5)  # Brief pause between notebooks

    results_file = write_results(all_results)

    print("\n" + "█"*70)
    print("CRUCIBLE V5 B-TIER COMPLETE")
    for name in all_results:
        nb = all_results[name]
        print(f"  {name}: {len(nb['queries'])}/4 queries, {len(nb['audio'])} audio")
    print(f"Results: {results_file}")
    print("█"*70)


if __name__ == "__main__":
    main()
