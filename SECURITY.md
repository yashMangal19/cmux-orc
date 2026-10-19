# Security policy

## Supported versions

Only the latest release gets security fixes.

| Version | Supported |
|---|---|
| 0.1.x | yes |

## Report a vulnerability

Do not open a public issue. Use GitHub's private reporting: **Security → Report a vulnerability** on [the repository](https://github.com/yashMangal19/cmux-orc/security/advisories/new).

Include what you found, the steps to reproduce it, and what an attacker could do with it. You will get an answer within 7 days. When a fix is ready, we publish it with an advisory, and we credit you unless you ask us not to.

## What cmux-orc does on your machine

To help you judge the risk:

- `orc` and the hook make no network calls. They run local `cmux` and `git` commands.
- They read and write files under `~/.agentic/sessions` (or `$CLAUDE_ORC_HOME`), and read cmux's `~/.cmuxterm/claude-hook-sessions.json` and Claude Code transcripts to find session names.
- `orc setup` creates two symlinks: `~/.local/bin/orc` and `~/.config/cmux/sidebars/orc-status.js`.
- `orc spawn` starts `claude` in a new cmux tab with the brief as its first prompt and, unless you pass your own flags after `--`, the Orc's own `claude` flags, including its permission mode. A child started from an Orc in a permissive mode gets that mode too.
- Job files are plain text that other sessions read as part of their prompt context. Treat a job from an unknown source like any other untrusted input to an agent.

Issues in Claude Code or cmux themselves go to their own maintainers.
