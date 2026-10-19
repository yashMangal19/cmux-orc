# cmux-orc

**Run a team of Claude Code sessions in [cmux](https://cmux.com). See which one needs you.**

![An Orc and its children as tabs in cmux, with the status sidebar on the right](assets/media/hero.gif)

```
/plugin marketplace add yashMangal19/cmux-orc
/plugin install cmux-orc@cmux-orc
/cmux-orc:sessions-setup
```

Then restart your running Claude sessions so they load the plugin's hooks.

## What you get

### Orcs: one session runs a team

An *Orc* (orchestrator) is a Claude session that starts, closes and reopens child sessions. Its cmux workspace becomes one coloured, pinned tile in the left panel. Its children are tabs to the right of the Orc's tab. Each child gets a brief and reports back to the Orc only.

![An Orc spawning two children into new tabs](assets/media/orcs.gif)

### Status sidebar: what every session is doing

A right-sidebar panel lists sessions with a status dot, how long each has been in that state, and the stage it last reported (`case 41/88`). Inside an Orc you see its children. Everywhere else you see one row per Orc (`⚠ 1 need you · 4 working`) and then every independent session. Click a row to jump to that tab.

![The status sidebar inside an Orc and in the Sessions overview](assets/media/sidebar.gif)

### ⚠ needs you: blocked sessions stand out

When a session stops on a question (`AskUserQuestion`) or a permission prompt, a hook puts ⚠ in front of its tab title, and the sidebar shows the row in red. The mark goes away when the session continues.

![A child stops on a permission prompt; its tab and sidebar row turn red](assets/media/needs-you.gif)

### Jobs: small Markdown files in an inbox

A job is a Markdown file with a header (`id`, `status`, `from`, `to`) and Task / Inputs / Output / Log sections. A hook shows each session its new or changed jobs when it starts and on every prompt. A child works only through its Orc. Work between Orcs and independent sessions goes through one session named `Sessions-Manager`.

![A job created by the Orc appears in the child's next prompt](assets/media/jobs.gif)

## Quick start

1. Install (above) and restart your Claude sessions.
2. In a cmux workspace, make the session an Orc. Its name must end in `-Orc`:

   ```
   /rename Shop-Orc
   ```

   Then ask it to run `orc init Shop-Orc` (or type `! orc init Shop-Orc`). This renames, colours and pins the workspace. Add `--adopt` to register tabs already in the workspace as children.
3. Tell the Orc what you want done, in plain words. With the plugin's `orc` skill it asks before it starts each child, then runs commands like these:

   ```
   orc spawn QA --cwd ~/shop --brief "Run the checkout smoke cases"
   orc list                     # Orcs, children, status, stage
   orc close QA                 # refuses on uncommitted changes or while QA waits on you
   orc resume QA                # reopens the same conversation in a new tab
   ```

   `--brief` takes a file path or text. Flags after `--` go to `claude` for that child, for example `orc spawn QA -- --model sonnet`. With no `--`, a child gets the Orc's own `claude` flags.
4. Children report progress, which shows in their tab title and in the sidebar:

   ```
   orc stage "case 3/12"
   ```
5. Hand out work as jobs:

   ```
   orc job new --to Shop-QA --title "Smoke cases" --task "Run the 12 checkout cases"
   orc job set J-001 taken
   orc job set J-001 done "12/12 pass"
   orc job list                 # open jobs in every inbox; --all includes done ones
   ```

   A job for an Orc's child goes into that Orc's team inbox (IDs `J-001`, …). Any other job goes into the top-level inbox (IDs `S-001`, …), which `Sessions-Manager` runs.

If you switch the right sidebar to Files, Find or Vault, run `orc pane` to bring the status panel back.

## Commands

| Command | Does |
|---|---|
| `orc init <Name>-Orc [--colour C] [--adopt]` | Make the current cmux workspace an Orc: rename, colour, pin. |
| `orc spawn <Role> [--cwd DIR] [--brief FILE\|TEXT] [-- claude flags]` | Open a tab named `<Project>-<Role>` and start Claude there with the brief. |
| `orc stage <text>` | Record what this session is doing now (≤ 80 chars) and show it in the tab title. Works in an Orc tab or a child tab. |
| `orc close <Role> [--force]` | Save the child's session id, then close its tab. `--force` skips the safety checks; it is meant for you, not the Orc. |
| `orc resume <Role>` | Reopen a closed child with its conversation. |
| `orc list [--json]` | Orcs, children, status, stage. |
| `orc pane` | Show the status panel in cmux's right sidebar. |
| `orc setup [--quiet]` | Link `orc` into `~/.local/bin` and the sidebar into `~/.config/cmux/sidebars/`, then show the panel. |
| `orc job new --to <Session> --title <text> [--task TEXT] [--from NAME]` | Write a job file into the right inbox. |
| `orc job set <ID> <open\|taken\|blocked\|done> [note]` | Set a job's status and append a Log line. |
| `orc job list [--all]` | Open jobs in every inbox. |

## How it works

```
 cmux workspace "Shop-Orc"  (pinned, coloured)
 ┌──────────┬───────────────────┬──────────────────┐   ┌─ right sidebar ─────┐
 │ Shop-Orc │ QA · case 3/12    │ ⚠ Docs · drafting │   │ ● QA     case 3/12  │
 └──────────┴───────────────────┴──────────────────┘   │ ● Docs   ⚠ needs you│
        │  orc spawn / close / resume                   └─────────────────────┘
        ▼                                                  reads tab titles
 ~/.agentic/sessions/registry.json   orcs/Shop-Orc/inbox/*.md   inbox/*.md
```

| Piece | Where | What it does |
|---|---|---|
| `orc` CLI | `bin/orc` | Drives cmux through its CLI (`new-surface`, `rename-tab`, `workspace-action`, …) and keeps the registry. |
| Hook | `hooks/orc-hook.py` | Inbox notices on SessionStart and UserPromptSubmit. ⚠ on `AskUserQuestion` and on permission or elicitation notifications; cleared on PostToolUse, UserPromptSubmit and Stop. |
| Sidebar | `cmux/sidebars/orc-status.js` | A cmux Custom Sidebar. Reads cmux's live workspace and agent data. Stage and ⚠ reach it through tab titles, because a sidebar cannot read files. |
| Skills | `skills/orc`, `skills/sessions-manager`, `skills/sessions-setup` | The rules for each role, and the first-time setup command. |

Children talk to their Orc with Claude Code's `SendMessage`. The spawn prompt tells each child its name, its Orc, and to report its stage.

## Requirements

- macOS with [cmux](https://cmux.com) 0.64 or later, with Custom Sidebars on (the default)
- Claude Code with plugin support
- `python3` (standard library only)
- `git`, if you want `orc close` to check for uncommitted changes

## FAQ

**What does a child session cost?**
Each child is a full Claude Code session with its own context, so it uses tokens like any session you start yourself. That is why the `orc` skill tells the Orc to ask you before every `orc spawn`. Close children when their work is checked; `orc resume` brings one back if you need it again.

**Does it need cmux?**
Yes. Tabs, workspace colours, pinning, the ⚠ mark and the sidebar all go through cmux. `orc init`, `spawn`, `stage`, `close`, `resume` and `pane` stop with `not running inside a cmux terminal` outside it. The job commands and `orc list` only read and write files.

**What is "waiting" versus ⚠?**
"waiting" (orange) is cmux's status for a session that finished its turn and is idle until you type. ⚠ (red) means the session stopped in the middle of its work on a question or a permission prompt, and nothing happens until you answer. Only ⚠ means a session is blocked on you.

**Does it work on Linux or Windows?**
No. cmux is a macOS app, and cmux-orc needs it. The CLI also uses `fcntl` file locks, which Windows does not have.

**Can I use it without Orcs?**
Yes. With the plugin installed, every session in cmux gets the ⚠ mark, and the sidebar's Sessions overview lists independent sessions with their status. You can name one session `Sessions-Manager` and pass jobs between independent sessions. `orc stage` works only in an Orc tab or a child tab.

**Where does state live?**
In `~/.agentic/sessions` (set `CLAUDE_ORC_HOME` to move it): `registry.json` for Orcs and children, `inbox/` for top-level jobs, `orcs/<Name>/inbox/` for each team, `state/` for the hook's per-session notes. cmux-orc also reads cmux's `~/.cmuxterm/claude-hook-sessions.json` to map tabs to Claude sessions; it never writes it.

**Can I get a closed child back?**
Yes. `orc close` saves the child's Claude session id before it closes the tab, and `orc resume <Role>` opens a new tab with `claude --resume <id>`. `orc close` refuses while the child's folder has uncommitted git changes or while the child waits on you.

**Can a child use different Claude flags from the Orc?**
Yes. Anything after `--` goes to that child's `claude` command: `orc spawn Review -- --model opus`. With no `--`, the child gets the Orc's own flags, for example `--permission-mode` or `--model` and their values. Flags that belong to the Orc's own session are left out: `--name`, `--resume`, `--continue`, `--session-id`, `--worktree`, `--from-pr`, `--teleport`, `--cloud` and `--remote-control`.

**Why is my stage in the tab title?**
A cmux sidebar has no file access; it can read workspace and tab data only. `orc stage "case 3/12"` renames the tab to `QA · case 3/12`, and the sidebar splits the title back into name and stage. If you rename the tab by hand, the sidebar loses the stage until the next `orc stage`.

**Does anything leave my machine?**
No. `orc` and the hook make no network calls. They run local `cmux` and `git` commands and read and write files under `~/.agentic/sessions`. (Children are Claude sessions, so they talk to Claude as usual.)

**The status panel disappeared.**
cmux 0.64 has no button for Custom sidebars in the right sidebar's mode bar. Run `orc pane`.

**How do I uninstall?**
In Claude Code, `/plugin uninstall cmux-orc@cmux-orc`. Then remove the links that setup made, and the state if you no longer want it:

```
rm ~/.local/bin/orc ~/.config/cmux/sidebars/orc-status.js
rm -rf ~/.agentic/sessions      # registry, inboxes and jobs
```

Workspace colours and pins are cmux settings; change them in cmux.

## Known limits

- cmux's "waiting" status means *finished a turn*. Only the ⚠ marker means a session is blocked on you.
- Spawning into a folder Claude Code has not trusted yet stops the child at the trust prompt until someone answers it.
- Hooks load when a session starts, so restart running sessions after you install.
- `orc list` shows "needs you" from cmux's last hook event and from whether the session's last message ends in `?`. The sidebar's ⚠ is the more exact signal.
- Job IDs are unique inside one inbox, not across all of them. `orc job set` uses the caller's own inbox first and refuses an ID that is still ambiguous.
- One level only. Children are tabs in the Orc's workspace; there is no nesting of Orcs inside Orcs.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security reports: [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
