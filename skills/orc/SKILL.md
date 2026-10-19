---
name: orc
description: Rules and commands for an Orc (a Claude Code session that runs child sessions as cmux tabs) and for its children. Use when this session's name ends in -Orc, when the session was started as a child of an Orc, or when the user asks to start, close, resume or check on child sessions.
---

# Orc

An Orc is one cmux workspace: the Orc's tab first, its children as tabs to the right. The `orc` CLI does every step; state lives in `~/.agentic/sessions/registry.json` (override with `CLAUDE_ORC_HOME`).

## Commands

| Who | Command | Does |
|---|---|---|
| Orc | `orc init <Name>-Orc [--adopt]` | Makes this workspace an Orc: renames, colours, pins it. `--adopt` registers tabs already in it as children. |
| Orc | `orc spawn <Role> --cwd <dir> --brief <file or text> [-- <claude flags>]` | Opens a tab named `<Project>-<Role>`, starts Claude there with the brief. Children inherit the Orc's claude flags unless given after `--`. |
| Orc | `orc close <Role>` | Saves the session id, then closes the tab. Refuses on uncommitted changes in the child's cwd or when the child is waiting on the user. |
| Orc | `orc resume <Role>` | Reopens a closed child with its conversation. |
| Both | `orc stage "<text>"` | Records what this session is doing now and shows it in the tab title (≤ 80 chars). |
| Both | `orc list` | Orcs, children, status, stage. |

## Orc rules

- Ask the user before every `orc spawn`. Each child is a full Claude session and costs tokens.
- Close a child yourself once you have checked its output against what you asked for. Never pass `--force`; that flag is the user's.
- Spawn into folders the user already trusts in Claude Code. A new folder stops the child at the trust prompt until someone answers it.
- Work for a session outside your team goes to `Sessions-Manager` (SendMessage), never straight to that session.

## Child rules

- Talk only to your Orc (SendMessage to its name). Never ask another session for work directly.
- Run `orc stage "<text>"` at each milestone: started, every meaningful step ("case 41/88"), blocked (with the reason), done.
- When finished, tell your Orc what you delivered and where, then stop. Your Orc closes the tab.
