# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues on
[`growthpigs/thinking-foundry`](https://github.com/growthpigs/thinking-foundry). Use the `gh` CLI for all operations; it
infers the repo from `git remote -v` when run inside a clone.

## 🚨 House rules — these beat the generic conventions below

From `~/.claude/CLAUDE.md`. They apply to every repo, not just this one, and a
skill following the stock GitHub conventions without them will break them.

1. **The issue body IS the state. Rewrite it top-to-bottom on every update.**
   Never track state in comments — they pile up into an unreadable log while the
   body goes stale. Comments are for discussion and evidence only. Rewrite with
   `gh issue edit <n> --body-file -` fed from a heredoc.

2. **Issue #1 is the Master Index.** Read it before starting non-trivial work:
   `gh issue view 1 -R growthpigs/thinking-foundry`. It is the table of contents for the repo.

3. **Search before filing.** `gh issue list --search "<terms>" --state all`
   before any `gh issue create`. Also check recently-merged work — parallel
   sessions land changes continuously.

4. **GitHub is the source of truth.** Specs, decisions and handoffs live in
   issues, not local `.md` files. Local docs mirror only; when they disagree
   with GitHub, update the issue first.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body-file -` with a
  heredoc for the body. Search first (rule 3).
- **Read an issue**: `gh issue view <number> --comments`, fetching labels too.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`
  with appropriate `--label` and `--state` filters.
- **Update an issue**: `gh issue edit <number> --body-file -` — rewrite the
  whole body (rule 1). Do **not** use `gh issue comment` to record state.
- **Comment on an issue**: `gh issue comment <number> --body "..."` — for
  discussion and evidence only.
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` /
  `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external
PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using
the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>`.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`
  then keep only `authorAssociation` of `CONTRIBUTOR`,
  `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label` /
  `--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be
either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue (after searching — rule 3).

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`, and read its labels.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as
tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes /
  Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api`
  on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to
  a task list in the map body and put `Part of #<map>` at the top of the child
  body. Labels: `wayfinder:<type>` (`research` / `prototype` / `grilling` /
  `task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**. Add an edge with
  `gh api --method POST repos/growthpigs/thinking-foundry/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`,
  where `<blocker-db-id>` is the blocker's numeric **database id**
  (`gh api repos/growthpigs/thinking-foundry/issues/<n> --jq .id`, _not_ the `#number` or
  `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open
  blockers only, the live gate). Where dependencies aren't available, fall back
  to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is
  unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`,
  scoped to the map's sub-issues / task list), drop any with an open blocker
  (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the
  `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then
  `gh issue close <n>`, then append a context pointer to the map's
  Decisions-so-far — by rewriting the map body, not by adding a comment (rule 1).
