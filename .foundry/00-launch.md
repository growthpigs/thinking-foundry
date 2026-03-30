# Phase 0: LAUNCH — Start a Foundry Session

**Metaphor:** Before you enter the foundry, you suit up. Load the methodology, load the project, pick your mode.

---

## How To Start

Open a terminal in your project directory and run:

```bash
~/_PAI/projects/system/the-foundry/bin/launch.sh
```

That's it. The script:
1. Detects which project you're in (from git remote)
2. Finds your Activity Log and Work Ledger issue numbers
3. Asks you to pick a mode (GREENFIELD, FEATURE, FIX, etc.)
4. Generates the exact prompt to paste into a fresh CC session

### With Options

```bash
# Feature work with a specific epic
~/_PAI/projects/system/the-foundry/bin/launch.sh --mode FEATURE --epic "E1: Platform Foundation"

# Bug fix on a specific issue
~/_PAI/projects/system/the-foundry/bin/launch.sh --mode FIX --issue 123

# New project from scratch
~/_PAI/projects/system/the-foundry/bin/launch.sh --mode GREENFIELD

# Architecture spec only (no code)
~/_PAI/projects/system/the-foundry/bin/launch.sh --mode SPEC
```

### The Workflow

```
Warp Tab 1 (your project dir):
  $ cd ~/_PAI/projects/personal/lifemodo
  $ ~/_PAI/projects/system/the-foundry/bin/launch.sh --mode FEATURE
  → Generates prompt
  → Copy it to clipboard

Warp Tab 2 (fresh CC session):
  → Paste the prompt
  → The Foundry is running
```

---

## What Launch Detects Automatically

| What | How |
|------|-----|
| Project name | From `git remote` URL |
| Project path | From `git rev-parse --show-toplevel` |
| GitHub repo | From remote (e.g., `growthpigs/lifemodo`) |
| Activity Log issue # | Searches Admin milestone for "Activity Log" |
| Work Ledger issue # | Searches Admin milestone for "Work Ledger" |
| CLAUDE.md exists? | Checks project root |
| HANDOVER.md exists? | Checks project root |
| Admin doc count | Counts issues in Admin milestone |
| Starting phase | Based on mode + how many admin docs exist |

## Modes → Starting Phases

| Mode | Starting Phase | When |
|------|---------------|------|
| GREENFIELD | Phase 1 (MINE) | New project, nothing exists |
| FEATURE | Phase 3 (ASSAY) or 5 (PLAN) | New feature, project exists |
| FIX | Phase 6 (HAMMER) | Bug fix |
| HOTFIX | Phase 6 (HAMMER) | Production emergency |
| SPEC | Phase 3 (ASSAY) | Architecture only, no code |
| REFACTOR | Phase 3 (ASSAY) | Behaviour-preserving changes |
| SECURE | Phase 3 (ASSAY) | Security vulnerability |
