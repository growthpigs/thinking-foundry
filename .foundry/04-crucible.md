# Phase 4: CRUCIBLE — Adversarial Stress-Test

**Metaphor:** The crucible melts metal to separate impurities. What survives is pure.

**Duration:** 1-3 days (per domain group)
**Mode applicability:** GREENFIELD, FEATURE, SPEC, SECURE

---

## What Happens

The specs from ASSAY are stress-tested through adversarial NotebookLM debates. The project is broken into logical domain groups, each tested independently, then combined for a final integration debate.

This is the Foundry's most distinctive phase. Nobody else in the industry does dual-phase adversarial review (pre-code AND post-code). The Crucible is pre-code. The Compliance Check in TEMPER is post-code.

### Inputs
- All 18 Admin Documents from ASSAY
- FSDs per component
- Research sources from SCOUT
- External documentation (API docs, framework guides, competitor analysis)

### Process

#### Step 1: Group the Project into Domains

Break the project into 3-7 logical groups. Each group gets its own Crucible session.

**Example (IT Concierge):**
| Group | Topics | Sources |
|-------|--------|---------|
| Security | RLS, auth, role escalation | FSD-Auth + Supabase RLS docs + OWASP |
| Offline | PWA, sync, conflict resolution | FSD-Offline + PWA docs + competitor analysis |
| Business Logic | Ticket workflow, status transitions, billing | FSD-Tickets + FSD-Billing + domain expert interviews |
| Integration | Calendar, notifications, WhatsApp | FSD-Integration + Google Calendar API docs + Clawdbot architecture |

**Do NOT test everything at once.** IT Concierge ran a single-pass Crucible and found 16 issues. Grouped Crucibles would have found more, with better depth per domain.

#### Step 2: Per-Group Crucible Session

For each domain group:

1. **Create a NotebookLM notebook** (one per group, never batch)
2. **Load sources** (minimum 3, maximum 8):
   - Architecture anchor document (the FSD or ADR for this domain)
   - Subject-specific document (the detailed spec)
   - **Buyer Persona document** (MANDATORY — how does this domain feel to the target user?)
   - 2-7 external sources (official API docs, competitor analysis, academic papers, Stack Overflow deep dives)
   - **Assumption Table entries** for this domain (any assumption below 70% that hasn't been spiked)
3. **Run the debate** — Two-host adversarial format:
   - "Argue FOR and AGAINST this architecture decision"
   - "What are we missing? What will break?"
   - "Where will this fail at scale?"
   - "What's the security exploit path?"
   - **"How does [Buyer Persona] EXPERIENCE this? Does it feel like [the promise] or like generic software?"**
4. **Audio IS the Crucible** — The two-host debate is required. Chat alone doesn't count. The audio format forces the AI to argue with itself, producing insights that direct prompting misses.
5. **Self-processing** — After audio, extract findings via 5 queries:
   - What were the top 3 concerns raised?
   - What was the strongest counterargument?
   - What was NOT discussed that should have been?
   - What would a skeptic say about this design?
   - Rate confidence 1-10 in this architecture surviving production.

### ⚠️ CRUCIBLE EXECUTION IS PROGRAMMATIC, NOT CLAIMED (March 2026 — Non-Negotiable)

**The Problem:** An AI agent can read the steps above and CLAIM it ran a Crucible without actually invoking NotebookLM. NotebookLM is an isolated Google workspace — it has no read access to your local machine, GitHub, or Claude Code's terminal. Files must be explicitly uploaded.

**The Rule:** The Crucible is NOT complete until NotebookLM has been programmatically invoked and a notebook ID is recorded. An AI agent saying "I ran the Crucible" without a notebook ID is lying.

**The Tool:** `teng-lin/notebooklm-py` — a Python API wrapper for NotebookLM. Installed globally. Auth via `~/.notebooklm/storage_state.json` (Playwright browser state).

**The Canonical Pattern (proven March 17, 2026):**

```python
import asyncio
from notebooklm import NotebookLMClient, AudioFormat

async def run_crucible(domain_name, source_files, questions, audio_instructions):
    async with await NotebookLMClient.from_storage() as client:
        # Step 1: Create notebook (one per domain group)
        notebook = await client.notebooks.create(f"Crucible: {domain_name}")
        notebook_id = notebook.id

        # Step 2: Upload sources AS SEPARATE FILES (NO concatenation — see ban below)
        for filepath, title in source_files:
            with open(filepath) as f:
                await client.sources.add_text(
                    notebook_id=notebook_id,
                    title=title,
                    content=f.read(),
                    wait=True
                )

        # Step 3: Ask adversarial questions via chat
        # Capture results — chat findings are MODALITY 1 of the report
        chat_results = []
        for question in questions:
            result = await client.chat.ask(
                notebook_id=notebook_id,
                question=question
            )
            chat_results.append((question, result.answer))
            print(f"Q: {question[:80]}...")
            print(f"A: {result.answer}\n")

        # Step 4: Generate Audio Overview — DEBATE format (NON-NEGOTIABLE)
        # Rule 3: "Audio IS the Crucible. Chat alone doesn't count."
        # The two-host debate format produces insights that chat misses
        # because it forces the AI to argue AGAINST its own positions.
        print("Generating Audio Overview (DEBATE format)...")
        audio_status = await client.artifacts.generate_audio(
            notebook_id=notebook_id,
            audio_format=AudioFormat.DEBATE,
            instructions=audio_instructions
        )
        # Wait for audio generation to complete (can take 10-20 minutes)
        final_status = await client.artifacts.wait_for_completion(
            notebook_id=notebook_id,
            task_id=audio_status.task_id,
            timeout=1200.0  # 20 minutes max
        )

        # CRITICAL: Check audio actually succeeded — a failed task ID
        # still passes the gate if we don't verify status here
        if final_status.status not in ("completed", "complete"):
            raise RuntimeError(
                f"Audio generation FAILED for {domain_name}: "
                f"status={final_status.status}, error={final_status.error}"
            )
        print(f"Audio generation: {final_status.status} ✅")

        # Step 5: Download the audio
        audio_path = f".foundry/crucible-audio-{domain_name.lower().replace(' ', '-')}.wav"
        try:
            downloaded = await client.artifacts.download_audio(
                notebook_id=notebook_id,
                output_path=audio_path
            )
            print(f"Audio saved to: {downloaded}")
        except Exception as e:
            print(f"Audio download failed (check NotebookLM UI): {e}")
            audio_path = None

        # Step 6: TRANSCRIBE the audio (NON-NEGOTIABLE)
        # Chat and audio are DIFFERENT MODALITIES that produce DIFFERENT insights.
        # Both transcripts must be captured separately and fed back into specs.
        transcript_path = None
        if audio_path:
            transcript_path = audio_path.replace('.wav', '-transcript.md')
            # Use whisper, yt-dlp, or any transcription tool
            import subprocess
            try:
                # Option A: Use whisper if available
                subprocess.run(
                    ["whisper", audio_path, "--output_format", "txt",
                     "--output_dir", ".foundry/"],
                    capture_output=True, timeout=300
                )
                transcript_path = audio_path.replace('.wav', '.txt')
                print(f"Audio transcribed to: {transcript_path}")
            except (FileNotFoundError, subprocess.TimeoutExpired):
                # Option B: Upload audio to NotebookLM as a source for self-transcription
                # NotebookLM can process its own audio output
                print("Whisper not available — transcribe manually or via NotebookLM UI")
                transcript_path = None

        # Step 7: Compile BOTH modalities into the Crucible Report
        # These are TWO SEPARATE sections in the report — never merged
        report_path = f".foundry/crucible-report-{domain_name.lower().replace(' ', '-')}.md"
        with open(report_path, 'w') as report:
            report.write(f"# Crucible Report: {domain_name}\n\n")
            report.write(f"**Notebook ID:** {notebook_id}\n")
            report.write(f"**Audio Task ID:** {audio_status.task_id}\n\n")
            report.write("## MODALITY 1: Chat Findings (targeted Q&A)\n\n")
            report.write("_Chat produces specific, cited answers to direct questions._\n\n")
            for q, a in chat_results:
                report.write(f"### Q: {q}\n\n{a}\n\n---\n\n")
            report.write("## MODALITY 2: Audio Debate Findings (sustained adversarial)\n\n")
            report.write("_Audio produces emergent insights from sustained argument._\n")
            report.write("_The AI takes opposing positions it would never take in chat._\n\n")
            if transcript_path and os.path.exists(transcript_path):
                with open(transcript_path) as t:
                    report.write(t.read())
            else:
                report.write("**[TRANSCRIPT PENDING — transcribe from audio file]**\n")
            report.write("\n\n## Key: Why Both Modalities Matter\n\n")
            report.write("Chat answers what you ASK. Audio surfaces what you DIDN'T ask.\n")
            report.write("A Crucible with only chat is an interview. A Crucible with only audio is unfocused.\n")
            report.write("Together they form a complete adversarial review.\n")
        print(f"Crucible report saved to: {report_path}")

        # Step 8: Return ALL artifacts
        return notebook_id, audio_status.task_id, report_path

# Example: run and capture ALL THREE artifacts
notebook_id, audio_task_id, report_path = asyncio.run(run_crucible(
    domain_name="Security & Auth",
    source_files=[
        ("docs/02-specs/FSD-247-concurrency.md", "FSD-247 Concurrency"),
        ("docs/04-technical/TECH-STACK.md", "Tech Stack"),
        # EXTERNAL GROUND TRUTH (mandatory — see requirement below)
        ("EXTERNAL-supabase-rls-docs.md", "EXTERNAL: Supabase RLS Official Docs"),
    ],
    questions=[
        "Cross-reference FSD-247 against the official Supabase RLS docs. Where does our implementation violate best practices?",
        "Does the queued_behind debounce solve the race condition or create a new deadlock?",
    ],
    audio_instructions="Debate the pros and cons of server-wins conflict resolution. "
                       "Focus on what happens when a field technician's offline work is silently discarded."
))
print(f"CRUCIBLE ARTIFACTS: notebook={notebook_id}, audio_task={audio_task_id}, report={report_path}")
```

**The Verification Artifacts (THREE required per domain):**
Every Crucible session MUST produce:
1. **Notebook ID** — proves NotebookLM was invoked with separate sources
2. **Audio task ID (status=COMPLETED)** — proves the DEBATE audio was generated and succeeded
3. **Crucible Report** (`.foundry/crucible-report-{domain}.md`) — contains BOTH modalities as separate sections

All three are:
- Appended to `progress.txt` as: `[CRUCIBLE] notebook_id={id} audio_task={id} report={path} domain={name}`
- Posted as a GitHub issue comment on the parent issue
- Checked by the R4 gate (missing any = gate FAILS)

### Why Two Modalities (Non-Negotiable)

Chat and audio are DIFFERENT modalities that produce DIFFERENT information:

| Modality | What It Produces | Why It's Unique |
|----------|-----------------|-----------------|
| **Chat (Modality 1)** | Specific, cited answers to direct questions | You control the questions — targeted, precise, referenceable |
| **Audio DEBATE (Modality 2)** | Emergent insights from sustained argument | The AI takes opposing positions it would NEVER take in chat. Surfaces what you didn't ask. |

**A Crucible with only chat is an interview.** You get answers to your questions but miss what you didn't think to ask.
**A Crucible with only audio is unfocused.** You get debate but can't drill into specifics.
**Together they form a complete adversarial review.** Chat answers what you ASK. Audio surfaces what you DIDN'T ask.

The Crucible Report captures both as separate sections. They are never merged, never summarized into one — they're different lenses on the same architecture and both feed back into the FSDs.

**What Does NOT Count as a Crucible:**
- An AI agent reviewing specs in-context and calling it a "Crucible" — that's a red-team, not a Crucible
- Chat-only interaction with NotebookLM (Rule 3: Audio IS the Crucible for full debates)
- Claiming "I created a notebook" without the notebook ID artifact
- Any review that doesn't use NotebookLM as a SEPARATE system with uploaded sources
- **CONCATENATING ALL SOURCES INTO ONE FILE** — see rule below

### ⛔ THE CONCATENATION BAN (March 2026 — Incident-Driven)

**Incident:** Two separate CC sessions (IT Concierge, LifeModo) concatenated all source files into a single `CRUCIBLE_SOURCES_COMBINED.md` and uploaded it as one source to NotebookLM. This completely destroys the Crucible.

**Why concatenation kills the Crucible:** NotebookLM's entire architecture relies on mapping relationships BETWEEN distinct source documents. When everything is in one file, there are no semantic boundaries. The debate becomes a biased echo chamber because there is no external "ground truth" to challenge internal assumptions. A single-source Crucible is like a prosecutor, defense attorney, and witness all being the same person.

**The Rule:** You are STRICTLY FORBIDDEN from:
1. Combining multiple files into one before upload
2. Creating a "combined" or "compiled" or "merged" source document
3. Using `cat file1.md file2.md > combined.md` or any equivalent
4. Passing concatenated content as a single `add_text()` call

**Each source file = one `add_text()` call.** The loop in the canonical pattern exists for this reason:
```python
# CORRECT: Each file is a separate source
for filepath, title in source_files:
    await client.sources.add_text(notebook_id=notebook_id, title=title, content=f.read())

# WRONG: Concatenating everything into one source
combined = "\n".join(open(f).read() for f, _ in source_files)
await client.sources.add_text(notebook_id=notebook_id, title="All Sources", content=combined)  # ⛔ BANNED
```

### 🌍 EXTERNAL GROUND TRUTH REQUIREMENT (March 2026 — Non-Negotiable)

**The Problem:** A Crucible that only debates YOUR specs against YOUR specs is an echo chamber. Your FSD says "we use RLS for security." Your data model implements RLS. NotebookLM cross-references them and says "looks consistent." But neither document asked whether your RLS IMPLEMENTATION actually follows Supabase best practices. The specs agree with each other — that doesn't mean they're correct.

**The Rule:** Every domain group MUST include at least ONE external ground truth source — official documentation for the technology being debated. This source acts as an unbiased referee.

| Domain | External Ground Truth (examples) |
|--------|----------------------------------|
| Database/RLS/Security | Official Supabase RLS docs, OWASP guidelines |
| Offline/Sync | Official PowerSync conflict resolution docs |
| State machines | Academic state machine completeness theory, framework docs |
| Auth/JWT | Official auth provider docs (Supabase Auth, Auth0, etc.) |
| Storage | Official Supabase Storage policy docs |
| API design | REST/GraphQL best practices, framework docs |
| Concurrency | Postgres isolation level docs, OCC pattern references |

**How to fetch external docs programmatically:**
```python
# Option 1: Use WebFetch MCP tool (returns clean text, not raw HTML)
# Option 2: Use agent-browser to snapshot docs pages
# Option 3: Fetch MDX/markdown source from vendor GitHub repos (cleanest)
# Option 4: Use Exa search to find and extract relevant doc sections
#
# ⛔ Do NOT use raw `curl` on doc pages — it returns HTML with nav bars,
# JS bundles, and cookie consent dialogs. NotebookLM will be polluted
# with thousands of tokens of site chrome instead of actual documentation.
#
# Example using vendor GitHub (cleanest):
import subprocess
result = subprocess.run(
    ["curl", "-s", "https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/content/guides/auth/row-level-security.mdx"],
    capture_output=True, text=True
)
await client.sources.add_text(
    notebook_id=notebook_id,
    title="EXTERNAL: Supabase RLS Official Docs (from GitHub MDX source)",
    content=result.stdout,
    wait=True
)
```

**Minimum source composition per domain notebook:**
- 1-2 internal specs (FSD, data model, ADR)
- 1 external ground truth (official docs for the technology)
- 1 buyer persona document (how does this feel to the user?)
- Optional: competitor analysis, academic papers, Stack Overflow deep dives
- **Minimum 3 sources, maximum 8, ALL SEPARATE**

#### Step 3: Synthesis Crucible

After all domain groups are tested individually:

1. Create a **final synthesis notebook**
2. Load: All domain group findings + the full system architecture
3. Run an integration debate: "Now that we've tested each domain, what breaks when they interact?"
4. This catches cross-domain issues (e.g., the security model interacts with the offline sync in ways neither domain-specific Crucible predicted)

#### Step 4: Disposition Findings

Every Crucible finding gets dispositioned:

| Disposition | Meaning | Action |
|-------------|---------|--------|
| **Fix now** | Real issue, blocks coding | Create GitHub issue, fix in ASSAY docs |
| **Fix later** | Real issue, doesn't block | Create GitHub issue in Demo Readiness milestone |
| **Won't fix** | Acceptable risk | Document WHY in ADR Log |
| **False positive** | Not actually an issue | Note in Crucible findings for learning |

### Outputs
- **Crucible Reports per domain** (`.foundry/crucible-report-{domain}.md`) — TWO modalities per report:
  - Section 1: Chat findings (cited Q&A from targeted questions)
  - Section 2: Audio debate transcript (emergent insights from sustained argument)
- **Audio files per domain** (`.foundry/crucible-audio-{domain}.wav`) — for archival and re-listening
- **Audio transcripts per domain** (`.foundry/crucible-audio-{domain}-transcript.md`) — searchable text
- Crucible findings per domain group (GitHub issues labeled `crucible`)
- Synthesis findings (cross-domain issues)
- Updated FSDs (incorporating Crucible fixes from BOTH modalities)
- Updated ADR Log (new decisions from Crucible debates)
- Confidence score per domain

#### Step 5: Persona Validation (Consumer/Experience Products)

**Optional but recommended** for products where "how it feels" is the product (LifeModo, consumer apps). Skip for infrastructure, internal tools, APIs.

After Crucible debates are complete and findings dispositioned:

1. **Mock the key user touchpoints** — not code, not UI. Print the formats:
   - The Morning Brief as it would appear in Slack
   - The dashboard view with sample data
   - The notification that arrives at 8am
   - The onboarding message on Day 0
2. **Show to 1-3 people who match the Buyer Persona** — not developers, not friends. People who ARE the target user.
3. **Ask one question:** "Would you pay [price] for this arriving every [cadence]?"
4. **Record reactions** — what surprises them, what confuses them, what they wish it did instead.
5. **Feed reactions back into FSDs** — update before PLAN.

**Why here, not in ASSAY?** Because the Crucible has already stress-tested the architecture. You know the spec is CORRECT. Now you're testing whether the spec is DESIRABLE. These are different questions with different judges — architects judge correctness, users judge desirability.

**Why before PLAN?** Because if the user says "I wouldn't pay for this," you need to redesign before creating 50 GitHub issues against the wrong spec.

---

### The 8 Crucible Rules (Updated March 2026 — Incident-Hardened)

1. **Programmatic execution only** — `teng-lin/notebooklm-py` API. No manual claims. Notebook ID is proof.
2. **NO source concatenation** — Each file = one `add_text()` call. Combining files destroys cross-referencing.
3. **Minimum 3 SEPARATE sources per notebook** — Architecture anchor + subject doc + EXTERNAL ground truth
4. **External ground truth mandatory** — At least 1 official vendor doc per domain. Your specs debating your specs is an echo chamber.
5. **One notebook per topic** — Never batch topics into one notebook
6. **BOTH modalities required** — Chat (Modality 1: targeted Q&A) AND Audio DEBATE (Modality 2: sustained adversarial). They produce different information. Both are captured as separate sections in the Crucible Report.
7. **Audio must be generated AND transcribed** — `generate_audio(AudioFormat.DEBATE)` + transcription. Audio task must have `status=COMPLETED`.
8. **Cross-reference specs against external docs** — The best findings come from comparing YOUR implementation against OFFICIAL documentation, not from internal-only review

---

## ⚖️ R4: Adversarial Gate

See [ratify.md](ratify.md#r4-adversarial-gate-after-crucible)

**Key question:** "Did the stress-test find what matters?"

**Must pass:**
- [ ] Every domain group tested independently
- [ ] **NotebookLM notebook ID recorded for EACH domain group** (no ID = no Crucible)
- [ ] **Audio Overview (DEBATE format) generated AND transcribed for EACH domain group** (no audio task ID = half a Crucible)
- [ ] **Crucible Report exists per domain** with BOTH modalities as separate sections (chat findings + audio transcript)
- [ ] **NO concatenated sources** — each file uploaded as a SEPARATE source (verify source count ≥ 3 per notebook)
- [ ] **External ground truth loaded** — at least 1 official external doc per domain (not just your own specs debating themselves)
- [ ] **Buyer Persona loaded as mandatory source** in every domain group notebook
- [ ] Synthesis Crucible run (cross-domain integration)
- [ ] All findings dispositioned (fix now / fix later / won't fix)
- [ ] "Fix now" items resolved in ASSAY docs
- [ ] Updated FSDs reflect Crucible learnings
- [ ] Fresh eyes CTO review on Crucible output
- [ ] Confidence ≥ 8/10
- [ ] All notebook IDs posted as GitHub issue comments (audit trail)
