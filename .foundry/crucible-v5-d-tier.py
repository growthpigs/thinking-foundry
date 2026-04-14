#!/usr/bin/env python3
"""
CRUCIBLE V5 — D-Tier Runner (Final Synthesis)
D-01 Convergence Final Synthesis 2026-04-14
Question: Given all A-tier and B-tier findings, what is the definitive go/no-go verdict,
and what are the binding design decisions that must enter the FSD before the PLAN phase?

Protocol: Issue #32 (CRUCIBLE SOP v2)
Run AFTER B-tier is complete and findings are extracted.
"""

import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

REPO = "growthpigs/thinking-foundry"
NOTEBOOK_NAME = "D-01 Convergence Final Synthesis 2026-04-14"
RESULTS_FILE = Path(".foundry/crucible-v5-d-results.md")
AUDIO_DIR = Path(".foundry/crucible-v5-audio")

# D-tier pulls from: A-tier findings issue, B-tier results file,
# External auditor, plus core FSD and architectural decisions
D_TIER_ISSUES = [
    (127, "A-Tier Findings: Go Signal with 4 Design Constraints (HOSTILE WITNESS SUMMARY)"),
    (31,  "Convergence FSD: The core product vision"),
    (106, "External Auditor: 5 FAIL, 2 CONCERN (HOSTILE WITNESS — Gemini 2.5 Pro)"),
    (118, "V4 Tension Resolution: 4 binding architectural decisions"),
    (117, "Domain 4: Production & Commercial Viability (missing assumptions)"),
    (114, "MVB Threshold: What if ministers fail?"),
    (110, "Chief of Staff: AI Preliminary Synthesis with Heavy Caveats"),
    (107, "Ferrari Doctrine: Core design philosophy"),
    (96,  "MinisterService Implementation Blueprint"),
    (121, "API Cost Model Napkin Calc"),
]

# D-tier text queries: cross-domain synthesis
D_TEXT_QUERIES = [
    "Across all domains — architecture, UX, data, and operations — what is the single most important decision that must be made before the PLAN phase begins?",
    "What are the three binding design decisions from this full CRUCIBLE cycle that, if ignored, would cause the product to fail within 6 months of launch?",
    "The External Auditor gave 5 FAILs. After all B-tier debates, which of those 5 failures is still unresolved, and what is the specific action required to resolve it?",
    "What is the go/no-go verdict on Convergence, with the specific conditions attached?",
]

# D-tier audio debates: final synthesis
D_AUDIO_DEBATES = [
    "Debate whether the Convergence CRUCIBLE V5 process has resolved enough of the critical architectural failures to justify moving into the PLAN phase, or whether another design iteration is required. One side argues the 4 A-tier constraints plus B-tier findings give a buildable path. The other argues entity resolution and latency remain existential threats that cannot be planned around.",
    "Debate what the first 90 days of building Convergence looks like — specifically whether to start with SPIKE-3 (Haiku provenance test) and SPIKE-5 (FEC API verification) before any feature work, or whether to build the minister fan-out skeleton first and validate data quality in parallel.",
    "Debate whether the Chief of Staff escape hatch (the anti-oracle compromise) makes Convergence more commercially viable or dilutes its core value proposition to the point where it loses its category creation advantage.",
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


def main():
    os.chdir(Path(__file__).parent.parent)
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    print("\n" + "█"*70)
    print("CRUCIBLE V5 — D-TIER FINAL SYNTHESIS")
    print(f"Notebook: {NOTEBOOK_NAME}")
    print("Upstream: A-tier complete (#127) + B-tier complete")
    print("█"*70)

    # Create notebook
    print("\n[STEP 1/5] Creating synthesis notebook...")
    out, _ = run(f'notebooklm create "{NOTEBOOK_NAME}" --json', check=False)
    nb_id = None
    try:
        nb_id = json.loads(out).get("id")
    except Exception:
        pass

    if not nb_id:
        run(f'notebooklm create "{NOTEBOOK_NAME}"', check=False)
        time.sleep(2)
        list_out, _ = run("notebooklm list --json", check=False)
        for nb in json.loads(list_out).get("notebooks", []):
            if nb["title"] == NOTEBOOK_NAME:
                nb_id = nb["id"]
                break

    print(f"  ✓ ID: {nb_id}")
    run(f"notebooklm use {nb_id}", check=False)
    time.sleep(2)

    # Upload B-tier results as a source (if exists)
    b_results = Path(".foundry/crucible-v5-b-results/b-tier-all-results.md")
    if b_results.exists():
        print(f"\n[STEP 2a] Uploading B-tier results ({b_results.stat().st_size:,} bytes)...")
        content = b_results.read_text()
        upload_source(content, "B-Tier Results: Architecture + UX + Data + Operations Findings")
        print("  ✓ B-tier results uploaded")

    # Upload core D-tier issues
    print(f"\n[STEP 2b] Uploading {len(D_TIER_ISSUES)} core issues...")
    for issue_num, desc in D_TIER_ISSUES:
        title, content = fetch_issue(issue_num)
        if not content:
            print(f"  ✗ #{issue_num}: failed")
            continue
        ok = upload_source(content, f"#{issue_num}: {title}")
        print(f"  {'✓' if ok else '⚠'} #{issue_num} ({len(content):,} chars)")
        time.sleep(1)

    # Wait for indexing
    print("\n[STEP 3] Waiting for sources to index...")
    run("notebooklm source wait", check=False)
    time.sleep(3)

    # Text queries
    print(f"\n[STEP 4] Running {len(D_TEXT_QUERIES)} synthesis queries...")
    query_results = {}
    for i, query in enumerate(D_TEXT_QUERIES, 1):
        print(f"\n  Q{i}: {query[:80]}...")
        safe_q = query.replace('"', '\\"')
        answer, _ = run(f'notebooklm ask "{safe_q}"', check=False)
        query_results[f"Q{i}"] = {"question": query, "answer": answer}
        print(f"  → {len(answer)} chars")
        time.sleep(2)

    # Audio debates
    print(f"\n[STEP 5] Generating {len(D_AUDIO_DEBATES)} synthesis debates...")
    artifact_ids = []
    for i, prompt in enumerate(D_AUDIO_DEBATES, 1):
        print(f"  Debate {i}: {prompt[:80]}...")
        safe_p = prompt.replace('"', '\\"')
        out, _ = run(f'notebooklm generate audio "{safe_p}"', check=False)
        art_id = None
        for token in out.split():
            if len(token) > 30 and "-" in token:
                art_id = token.strip(".,:()")
                break
        if art_id:
            artifact_ids.append(art_id)
        print(f"  → {out[:60]}")
        time.sleep(3)

    # Wait for audio
    print(f"\n→ Waiting for {len(artifact_ids)} synthesis debates...")
    for poll in range(15):
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
        print(f"  Poll {poll+1}/15: {'✓ done' if all_done else 'still generating...'}")
        if all_done:
            break

    dl_out, _ = run(f'notebooklm download audio --all "{AUDIO_DIR}/"', check=False)
    print(f"  ✓ Downloaded: {dl_out[:100]}")

    # Write results
    lines = [
        "# CRUCIBLE V5 — D-Tier Final Synthesis Results",
        "",
        f"**Notebook:** {NOTEBOOK_NAME}",
        f"**ID:** {nb_id}",
        "**Date:** 2026-04-14",
        "**Upstream:** A-tier (#127) + B-tier (4 notebooks) complete",
        "",
        "---",
        "",
        "## Synthesis Text Queries",
        "",
    ]

    for key, val in query_results.items():
        lines += [
            f"### {key}: {val['question']}",
            "",
            val["answer"],
            "",
            "---",
            "",
        ]

    lines += [
        "## Audio Debates",
        "",
    ]
    for i, prompt in enumerate(D_AUDIO_DEBATES, 1):
        lines += [f"### Debate {i}", "", f"**Prompt:** {prompt}", "", ""]

    lines += [
        "---",
        "",
        "## Post-CRUCIBLE Actions",
        "",
        "1. Extract Q4 verdict (go/no-go with conditions)",
        "2. Extract Q2 three binding decisions",
        "3. Update #31 FSD with all binding decisions",
        "4. Update assumption table confidences",
        "5. Create PLAN phase Master Index issue",
        "6. Hand to Scrum Master pipe (foundry-pipe-02)",
    ]

    RESULTS_FILE.write_text("\n".join(lines))
    print(f"\n✓ Results: {RESULTS_FILE}")

    print("\n" + "█"*70)
    print("CRUCIBLE V5 D-TIER COMPLETE")
    print(f"Notebook ID: {nb_id}")
    print(f"Results: {RESULTS_FILE}")
    print("█"*70)


if __name__ == "__main__":
    main()
