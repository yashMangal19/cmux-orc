# Changelog

All notable changes to this project are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-10-19

First public release.

### Added

- `orc` CLI: `init`, `spawn`, `stage`, `close`, `resume`, `list`, `pane`, `setup`, and `job new / set / list`.
- `orc spawn` gives a child the Orc's own `claude` flags with their values (`--model opus`, `--permission-mode …`), minus the flags that belong to the Orc's own session. Flags after `--` replace them.
- `orc init --inbox DIR --prefix P` adopts an existing team inbox folder and sets the team's job-ID prefix.
- `orc job set` uses the caller's own team inbox when the same job ID is in several inboxes, and refuses an ID that is still ambiguous. `orc job new` says when a job goes to the top-level inbox because the target is not a child yet.
- `orc list` says how to start when there are no Orcs yet. Outside cmux, or with no `cmux` binary, the cmux commands stop with a short message.
- Orcs: a cmux workspace whose session name ends in `-Orc` runs child sessions as tabs. The workspace is renamed, coloured and pinned.
- `orc close` saves the child's session id and refuses while the child's folder has uncommitted changes or while the child waits on you. `orc resume` reopens it with its conversation.
- `orc-status` cmux Custom Sidebar: the children of the current Orc with status, time in state and stage; elsewhere, one row per Orc and every independent session.
- Hook: shows each session its new or changed jobs on SessionStart and UserPromptSubmit; marks a tab with ⚠ on `AskUserQuestion` and on permission or elicitation notifications, and clears it on PostToolUse, UserPromptSubmit and Stop.
- Jobs: Markdown files in a team inbox per Orc (`J-` IDs) or the top-level inbox run by `Sessions-Manager` (`S-` IDs).
- Skills: `orc`, `sessions-manager`, `sessions-setup`.
- Packaged as the `cmux-orc` Claude Code plugin with its own marketplace.

[Unreleased]: https://github.com/yashMangal19/cmux-orc/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yashMangal19/cmux-orc/releases/tag/v0.1.0
