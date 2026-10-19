# cmux-orc v0.1.0

The first public release. cmux-orc is a Claude Code plugin that runs a team of Claude Code sessions as tabs in [cmux](https://cmux.com) and shows which one needs you.

## Install

In Claude Code:

```
/plugin marketplace add yashMangal19/cmux-orc
/plugin install cmux-orc@cmux-orc
/cmux-orc:sessions-setup
```

Then restart running Claude sessions so they load the plugin's hooks.

Requires macOS, cmux 0.64 or later, Claude Code with plugin support, and `python3`.

## What's in it

- **Orcs.** `orc init <Name>-Orc` makes a cmux workspace an Orc: renamed, coloured and pinned. `orc spawn`, `orc close` and `orc resume` start, close and reopen child sessions as tabs. Children get the Orc's `claude` flags unless you give their own after `--`.
- **Stages.** `orc stage "<text>"` shows what a session is doing in its tab title and in the sidebar.
- **Status sidebar.** The `orc-status` cmux Custom Sidebar shows an Orc's children with status, time in state and stage. Outside an Orc it shows one row per Orc and every independent session. `orc pane` brings it back.
- **⚠ needs you.** A hook marks a tab with ⚠ while its session waits on a question or a permission prompt. The sidebar shows that row in red.
- **Jobs.** `orc job new / set / list` write and update Markdown job files in a team inbox or the top-level inbox. A hook shows each session its new jobs.
- **Skills.** `orc` (Orc and child rules), `sessions-manager` (routing between Orcs and independent sessions), `sessions-setup` (first-time setup).

## Known limits

- macOS and cmux only.
- cmux's "waiting" means a session finished a turn. Only ⚠ means it is blocked on you.
- Spawning into a folder Claude Code has not trusted stops the child at the trust prompt.
- Hooks load at session start, so restart running sessions after you install.

Full list and FAQ: [README](https://github.com/yashMangal19/cmux-orc#faq).
