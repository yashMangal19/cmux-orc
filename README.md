# cmux-orc

Run many Claude Code sessions in [cmux](https://cmux.com) without losing track of them.

- **Orcs.** An *Orc* (orchestrator) is one Claude session that runs a team. Its workspace is one coloured, pinned tile in cmux's left panel, and its children are tabs to the right of the Orc's tab. The Orc can start, close and reopen children.
- **Status sidebar.** A right-sidebar panel shows what every session is doing. Inside an Orc you see each child: status, how long it has been in that state, and its stage ("case 41/88"). Everywhere else you see one row per Orc ("4 working · ⚠ 1 need you") and every independent session.
- **⚠ needs you.** When a session stops on a question or a permission prompt, its tab gets a ⚠ and the sidebar shows it in red.
- **Jobs between sessions.** A job is a small Markdown file in an inbox. A hook shows each session its new jobs. A child works only through its Orc. Work between Orcs and independent sessions goes through one *Sessions-Manager* session.

## Requirements

- macOS with [cmux](https://cmux.com) 0.64 or later (Custom Sidebars beta on, which is the default)
- Claude Code with plugin support
- `python3` (standard library only)

## Install

In Claude Code:

```
/plugin marketplace add yashMangal19/cmux-orc
/plugin install cmux-orc@cmux-orc
/cmux-orc:sessions-setup
```

`sessions-setup` links the `orc` command into `~/.local/bin`, installs the sidebar into `~/.config/cmux/sidebars/`, and opens it in the right sidebar. Restart running Claude sessions so they load the plugin's hooks.

## Use

Make a session an Orc. Its name must end in `-Orc`:

```
/rename Shop-Orc
orc init Shop-Orc            # colours and pins the workspace; --adopt takes over tabs already in it
```

The Orc starts children. It asks you before each one, because every child is a full Claude session:

```
orc spawn QA --cwd ~/shop --brief "Run the checkout smoke cases"
orc list                     # children, status, stage
orc close QA                 # refuses on uncommitted changes or while QA waits on you
orc resume QA                # reopens the same conversation
```

Children report progress, which shows in their tab title and in the sidebar:

```
orc stage "case 3/12"
```

Jobs:

```
orc job new --to Shop-QA --title "Smoke cases" --task "Run the 12 checkout cases"
orc job set S-001 taken
orc job set S-001 done "12/12 pass"
orc job list
```

A job for an Orc's child goes into that Orc's team inbox. Any other job goes into the top-level inbox (`~/.agentic/sessions/inbox`), which the session named `Sessions-Manager` runs. The plugin's `orc` and `sessions-manager` skills give each role its rules.

If you switch the right sidebar to Files, Find or Vault, run `orc pane` to bring the status panel back.

## How it works

| Piece | Where |
|---|---|
| `orc` CLI | `bin/orc`. State lives in `$CLAUDE_ORC_HOME/registry.json` (default `~/.agentic/sessions`) |
| Hook | `hooks/orc-hook.py`: inbox notices on SessionStart / UserPromptSubmit; ⚠ on AskUserQuestion and permission Notification, cleared on PostToolUse / UserPromptSubmit / Stop |
| Sidebar | `cmux/sidebars/orc-status.js`: reads cmux's live workspace and agent data. Stage and ⚠ reach it through tab titles, because the sidebar cannot read files |
| Skills | `skills/orc`, `skills/sessions-manager` |

## Known limits

- cmux's "waiting" status means *finished a turn*. Only the ⚠ marker means a session is blocked on you.
- Spawning into a folder Claude Code has not trusted yet stops the child at the trust prompt.
- Hooks load when a session starts, so restart running sessions after installing.

## License

MIT
