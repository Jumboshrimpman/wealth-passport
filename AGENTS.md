# Agent instructions — Wealth Passport

You are working in a two-person repo. Humans: **Sama** (Jumboshrimpman, branch `sama`) and **Jonathan** (`jonathanz.zhang00@gmail.com`, branch `jonathan`). Follow [CONTRIBUTING.md](CONTRIBUTING.md). These rules override convenience.

## Non-negotiables

1. **This GitHub repo is the only shared source of truth.** Each human has a separate Cursor / Grok. Chats are **not** shared. Do not assume the other person or their agent has seen your conversation. Persist decisions in the repo (docs, PR body, or issue).
2. **Never push directly to `main`** unless both owners have explicitly agreed for that change. Default: open a PR into `main`.
3. **Do not delete** the long-lived branches `sama` or `jonathan`.
4. **Do not edit files you were not asked to touch.** Prefer a small, reviewable diff.
5. Treat **your own PRs the same as human PRs**: open into `main`, wait for a human review, do not self-merge unless a human told you to.

## Branching

| Branch | Role |
| --- | --- |
| `main` | Shared integration branch. Land only via PR + review. |
| `sama` | Sama's long-lived personal branch. |
| `jonathan` | Jonathan's long-lived personal branch. |
| `feat/...` | Short-lived feature work, cut from a personal branch or from `main`. |

Day-to-day:

- Work on the requesting human's personal branch **or** a short-lived `feat/...` branch off that personal branch / `main`.
- If the user is Sama / Jumboshrimpman, prefer `sama` (or `feat/...` from `sama` / `main`).
- If the user is Jonathan, prefer `jonathan` (or `feat/...` from `jonathan` / `main`).
- If you cannot tell who asked, **ask before pushing**, or open a `feat/...` branch from latest `main` and say so in the PR.

Before starting new work:

```text
git fetch origin
git checkout main && git pull origin main
```

Then branch from up-to-date `main` or from the human's personal branch. Periodically merge or rebase `origin/main` into the personal branch so it does not drift.

## Pull requests

- **Base branch: `main`.**
- The other person reviews; merge when approved.
- Cloud Agent / Cursor Agent PRs are normal PRs. Do not expect auto-merge. Write a PR description a human can review without your chat history.
- Include: what changed, why, how to verify, and which files/areas you touched so the other person can avoid collisions.

## Collision avoidance

- **Do not edit the same files as in-flight work** if you can split the change.
- Prefer split ownership: **UI** vs **data/API** (or another split the owners already use).
- If you must touch a shared file, keep the change minimal and call it out in the PR.
- After `main` updates, refresh the personal branch (`merge` or `rebase` `origin/main`) before the next task.

## What not to do

- Do not rewrite `main` history.
- Do not force-push `main`, `sama`, or `jonathan` unless the branch owner explicitly asked.
- Do not treat chat-only instructions as repo policy unless you also write them into this file or `CONTRIBUTING.md`.
- Do not assume the other collaborator's agent will see this session.

## When you open a PR

Use a title and body that stand alone. Mention the personal branch or `feat/...` source. Request review from the other human.
