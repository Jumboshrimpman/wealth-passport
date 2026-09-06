# Contributing to Wealth Passport

This document is the collaboration contract for humans working in this repo. Cursor / Cloud Agents should follow the same rules in [AGENTS.md](AGENTS.md).

## Source of truth

- **GitHub is the shared source of truth.** All durable work lives in this repository.
- Each person has their own Cursor / Grok. **Chats are not shared.** Do not assume the other person (or their agent) has seen anything that was only said in a local chat.
- If a decision needs to stick, write it down here (docs, PR description, or issue) — not only in a chat.

## People and long-lived branches

| Person | GitHub / identity | Personal branch |
| --- | --- | --- |
| Sama (Jumboshrimpman) | repo owner | `sama` |
| Jonathan | `jonathanz.zhang00@gmail.com` | `jonathan` |

`sama` and `jonathan` are **long-lived personal branches**. They are not feature branches and should not be deleted after a merge.

## Day-to-day workflow

1. **Pull latest `main` before starting new work.**
2. Work on **your personal branch** (`sama` or `jonathan`), **or** a short-lived `feat/...` branch cut from your personal branch or from `main`.
3. Open a **pull request into `main`**.
4. The other person reviews. **Merge when approved.**
5. Periodically **merge or rebase `main` into your personal branch** so it does not drift.

Suggested feature-branch names: `feat/short-description` (optionally prefixed with your name if that helps, e.g. `feat/sama-onboarding`).

## `main` is protected by agreement

- **Do not push straight to `main` without a PR** unless both people explicitly agree (for example a tiny docs-only hotfix you both already discussed).
- Default path: branch → PR → review → merge.

## Reviews

- Open PRs **into `main`**.
- The other person reviews. Ask for review in the PR, not only in chat.
- Merge when approved. Prefer squash or a clean history; either is fine if the PR is readable.
- If you disagree on an approach, resolve it on the PR (or an issue) so the decision is recorded.

## Cloud Agents / Cursor Agents

- Agents may open PRs. **Treat those like any other PR:** review the diff, request changes if needed, and merge only when a human is happy.
- Agents do not replace the two-person review habit. An agent-authored PR still needs a human look before it lands on `main`.
- Point agents at [AGENTS.md](AGENTS.md) and this file.

## Avoid stepping on each other

- **Do not edit the same files at the same time** if you can help it.
- Split ownership by area when possible (for example **UI** vs **data/API**).
- If you must touch a shared file, say so on the PR and keep the change small.
- After merging, update your personal branch from `main` before starting the next slice of work.

## Suggested loop

```text
git fetch origin
git checkout main && git pull origin main
git checkout sama          # or jonathan
git merge origin/main      # or rebase, if you prefer
# ... work, or: git checkout -b feat/my-change
git push -u origin HEAD
# open PR → main, wait for review, merge
git checkout sama          # or jonathan
git merge origin/main      # bring the merge back to your personal branch
```

## What to put in a PR

- What changed and why (a few sentences is enough).
- How to try it, if it is not obvious.
- Anything the other person should *not* touch until this lands.
