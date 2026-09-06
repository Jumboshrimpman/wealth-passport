# Agent instructions — Wealth Passport

You are working in a two-person repo. Humans: **Sama** (Jumboshrimpman, branch `sama`) and **Jonathan** (`jonathanz.zhang00@gmail.com`, branch `jonathan`). Follow [CONTRIBUTING.md](CONTRIBUTING.md). These rules override convenience.

## HARD RULE — personal branch ownership

**Do not write on another person’s personal branch.**

This is mandatory. Do not “helpfully” update the other person’s branch so they stay in sync.

| Branch | Owner | Who may commit / push / open a PR from it |
| --- | --- | --- |
| `sama` | Sama (Jumboshrimpman) only | **Sama and Sama’s agents only** |
| `jonathan` | Jonathan only | **Jonathan and Jonathan’s agents only** |
| `main` | shared | Land only via PR + review (unless both humans agreed otherwise) |
| `feat/*` | short-lived | Anyone; PR into `main` |

**If you are helping Jonathan (including Jonathan’s Cursor / Cloud Agents):**

- **NEVER** checkout `sama` to do work.
- **NEVER** commit to `sama`.
- **NEVER** push to `sama`.
- **NEVER** open a pull request whose head branch is `sama`.
- Use `jonathan`, or a `feat/*` branch cut from `jonathan` or from `main`. PR into `main`.

**If you are helping Sama / Jumboshrimpman (including Sama’s agents):**

- **Do not** use `jonathan` for day-to-day work.
- **NEVER** commit, push, or open a PR from `jonathan`.
- Use `sama`, or a `feat/*` branch cut from `sama` or from `main`. PR into `main`.

**Shared integration** happens only via **PRs into `main`** (or short-lived `feat/*` branches that PR into `main`). To consume the other person’s work, merge `origin/main` into the human’s **own** personal branch. Do not push onto theirs.

**If you cannot tell who you are helping:** do **not** touch `sama` or `jonathan`. Cut `feat/*` from latest `main` and open a PR into `main`.

If you are about to run `git push origin sama` and the human is not Sama: **stop**.  
If you are about to run `git push origin jonathan` and the human is not Jonathan: **stop**.

## Non-negotiables

1. **Do not write on another person’s personal branch.** (See the hard rule above.)
2. **This GitHub repo is the only shared source of truth.** Each human has a separate Cursor / Grok. Chats are **not** shared. Do not assume the other person or their agent has seen your conversation. Persist decisions in the repo (docs, PR body, or issue).
3. **Never push directly to `main`** unless both owners have explicitly agreed for that change. Default: open a PR into `main`.
4. **Do not delete** the long-lived branches `sama` or `jonathan`.
5. **Do not edit files you were not asked to touch.** Prefer a small, reviewable diff.
6. Treat **your own PRs the same as human PRs**: open into `main`, wait for a human review, do not self-merge unless a human told you to.

## Branching

| Branch | Role |
| --- | --- |
| `main` | Shared integration branch. Land only via PR + review. |
| `sama` | Sama's long-lived personal branch. **Sama only.** |
| `jonathan` | Jonathan's long-lived personal branch. **Jonathan only.** |
| `feat/...` | Short-lived feature work, cut from the human’s **own** personal branch or from `main`. PR into `main`. |

Day-to-day:

- Work on the requesting human’s **own** personal branch **or** a short-lived `feat/...` branch off that personal branch / `main`.
- If the user is Sama / Jumboshrimpman: `sama` or `feat/...` from `sama` / `main`. Never `jonathan`.
- If the user is Jonathan: `jonathan` or `feat/...` from `jonathan` / `main`. Never `sama`.
- If you cannot tell who asked: `feat/...` from latest `main` only. Say so in the PR.

Before starting new work:

```text
git fetch origin
git checkout main && git pull origin main
```

Then branch from up-to-date `main` or from the requesting human’s **own** personal branch. Periodically merge or rebase `origin/main` into **that** personal branch so it does not drift. Never update the other person’s personal branch for them.

## Pull requests

- **Base branch: `main`.** Head branch must be the human’s own personal branch or a `feat/*` branch — never the other person’s personal branch.
- The other person reviews; merge when approved.
- Cloud Agent / Cursor Agent PRs are normal PRs. Do not expect auto-merge. Write a PR description a human can review without your chat history.
- Include: what changed, why, how to verify, and which files/areas you touched so the other person can avoid collisions.

## Collision avoidance

- **Do not edit the same files as in-flight work** if you can split the change.
- Prefer split ownership: **UI** vs **data/API** (or another split the owners already use).
- If you must touch a shared file, keep the change minimal and call it out in the PR.
- After `main` updates, refresh **only** the requesting human’s personal branch (`merge` or `rebase` `origin/main`) before the next task.

## What not to do

- **Do not write on another person’s personal branch.**
- Do not rewrite `main` history.
- Do not force-push `main`, `sama`, or `jonathan` unless the branch owner explicitly asked.
- Do not treat chat-only instructions as repo policy unless you also write them into this file or `CONTRIBUTING.md`.
- Do not assume the other collaborator's agent will see this session.

## When you open a PR

Use a title and body that stand alone. Mention the personal branch or `feat/...` source. Request review from the other human. The PR must target `main` and must **not** be opened from the other person’s personal branch.
