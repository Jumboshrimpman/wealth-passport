# Contributing to Wealth Passport

This document is the collaboration contract for humans working in this repo. Cursor / Cloud Agents should follow the same rules in [AGENTS.md](AGENTS.md).

## Personal branch ownership (hard rule)

**Do not write on another person’s personal branch.**

This is a hard rule, not a suggestion:

- Branch `sama` is **ONLY for Sama** (repo owner, GitHub `Jumboshrimpman`). Jonathan — and Jonathan’s Cursor / Cloud Agents — must **never** commit to `sama`, push to `sama`, or open a pull request **from** `sama`.
- Branch `jonathan` is **ONLY for Jonathan** (`jonathanz.zhang00@gmail.com`). Sama — and Sama’s Cursor / Cloud Agents — must **not** use `jonathan` for day-to-day work (no commits, pushes, or PRs from `jonathan`).
- **Shared integration happens via PRs into `main`** (or short-lived `feat/*` branches that PR into `main`). That is how work moves between people.
- If you are about to type `git checkout sama` / `git push origin sama` and you are not Sama: **stop**.
- If you are about to type `git checkout jonathan` / `git push origin jonathan` and you are not Jonathan: **stop**.
- To pick up the other person’s work, pull/merge `main`. Do not push onto their personal branch.

## Source of truth

- **GitHub is the shared source of truth.** All durable work lives in this repository.
- Each person has their own Cursor / Grok. **Chats are not shared.** Do not assume the other person (or their agent) has seen anything that was only said in a local chat.
- If a decision needs to stick, write it down here (docs, PR description, or issue) — not only in a chat.

## People and long-lived branches

| Person | GitHub / identity | Personal branch | Who may write on it |
| --- | --- | --- | --- |
| Sama (Jumboshrimpman) | repo owner | `sama` | **Sama only** |
| Jonathan | `jonathanz.zhang00@gmail.com` | `jonathan` | **Jonathan only** |

`sama` and `jonathan` are **long-lived personal branches**. They are not feature branches and should not be deleted after a merge. They are not a place for the other person (or the other person’s agent) to land work.

## Day-to-day workflow

1. **Pull latest `main` before starting new work.**
2. Work on **your own personal branch only** (`sama` if you are Sama, `jonathan` if you are Jonathan), **or** a short-lived `feat/...` branch cut from your personal branch or from `main`.
3. Open a **pull request into `main`**. Never open a PR from the other person’s personal branch.
4. The other person reviews. **Merge when approved.**
5. Periodically **merge or rebase `main` into your own personal branch** so it does not drift. Do not merge into the other person’s personal branch.

Suggested feature-branch names: `feat/short-description` (optionally prefixed with your name if that helps, e.g. `feat/sama-onboarding`).

## `main` is protected by agreement

- **Do not push straight to `main` without a PR** unless both people explicitly agree (for example a tiny docs-only hotfix you both already discussed).
- Default path: your branch or `feat/*` → PR into `main` → review → merge.

## Reviews

- Open PRs **into `main`**.
- The other person reviews. Ask for review in the PR, not only in chat.
- Merge when approved. Prefer squash or a clean history; either is fine if the PR is readable.
- If you disagree on an approach, resolve it on the PR (or an issue) so the decision is recorded.

## Cloud Agents / Cursor Agents

- Agents may open PRs. **Treat those like any other PR:** review the diff, request changes if needed, and merge only when a human is happy.
- Agents do not replace the two-person review habit. An agent-authored PR still needs a human look before it lands on `main`.
- Point agents at [AGENTS.md](AGENTS.md) and this file.
- **Jonathan’s agents must never touch `sama`. Sama’s agents must never do day-to-day work on `jonathan`.** If an agent is unsure who it is helping, it must use a `feat/*` branch from `main` and PR into `main` — not a personal branch.

## Avoid stepping on each other

- **Do not edit the same files at the same time** if you can help it.
- Split ownership by area when possible (for example **UI** vs **data/API**).
- If you must touch a shared file, say so on the PR and keep the change small.
- After merging, update **your own** personal branch from `main` before starting the next slice of work.

## Suggested loop

Sama:

```text
git fetch origin
git checkout main && git pull origin main
git checkout sama
git merge origin/main      # or rebase, if you prefer
# ... work, or: git checkout -b feat/my-change
git push -u origin HEAD
# open PR → main, wait for review, merge
git checkout sama
git merge origin/main      # bring the merge back to sama only
```

Jonathan: same loop, but substitute `jonathan` for `sama`. **Do not checkout, commit, or push the other person’s branch.**

## What to put in a PR

- What changed and why (a few sentences is enough).
- How to try it, if it is not obvious.
- Anything the other person should *not* touch until this lands.
