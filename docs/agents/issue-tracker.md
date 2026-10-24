# Issue tracker: GitHub

Issues and specs live in GitHub Issues for `reiganarmstrong/check-split-mono`. Use the `gh` CLI from this checkout, or pass `--repo reiganarmstrong/check-split-mono` explicitly.

## Conventions

- Create an issue: `gh issue create --title "..." --body-file <file>`. Store multiline bodies in a UTF-8 file with actual newlines.
- Read an issue: `gh issue view <number> --comments`; use `--json number,title,body,labels,comments,state` for structured output.
- List issues: `gh issue list --state open --json number,title,body,labels,comments`, with appropriate `--label` and `--state` filters.
- Comment: `gh issue comment <number> --body-file <file>`.
- Apply or remove labels: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`. Use the mapping in `triage-labels.md`; reuse existing labels and create mapped labels if missing.
- Close: `gh issue close <number>`. If a closing explanation is needed, post it first with `gh issue comment --body-file <file>`.

When a skill says "publish to the issue tracker", create a GitHub issue. When it says "fetch the relevant ticket", read the issue and its comments.

## Pull requests as a triage surface

**PRs as a request surface: no.**

GitHub shares issue and pull-request numbers. Resolve the object type before applying an issue-specific workflow.

## Wayfinding operations

For wayfinding work, use a map issue labeled `wayfinder:map` and child issues labeled `wayfinder:<type>`, where type is `research`, `prototype`, `grilling`, or `task`.

- Link children with GitHub sub-issues. If unavailable, maintain a task list on the map and a `Part of #<map>` reference in each child.
- Record blockers with native issue dependencies using the blocker's numeric database ID. If unavailable, use a `Blocked by: #<number>` line and inspect referenced issues for open blockers.
- Select the first open child in map order with no assignee or open blockers.
- Claim with `gh issue edit <number> --add-assignee @me`.
- Resolve by posting the answer, closing the child, and adding a short summary with the child link to the map's decisions.
