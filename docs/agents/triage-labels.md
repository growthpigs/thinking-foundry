# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those
roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the
corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

## Creating the labels

This file is a **mapping**; it does not create anything. `/triage` will fail on
a label that doesn't exist yet, which is a known upstream bug
([mattpocock/skills#616](https://github.com/mattpocock/skills/issues/616)).

Idempotent — safe to re-run, creates only what is missing:

```bash
while IFS='|' read -r n d; do
  gh label create "$n" -R growthpigs/thinking-foundry -d "$d" 2>/dev/null && echo "created $n" || echo "exists  $n"
done <<'LABELS'
needs-triage|Maintainer needs to evaluate this issue
needs-info|Waiting on reporter for more information
ready-for-agent|Fully specified, ready for an AFK agent
ready-for-human|Requires human implementation
wontfix|Will not be actioned
LABELS
```
