# 2-minute demo script

For a live demo or a screen recording. Video uses the same beats (`video/STORYBOARD.md`). Every command here is real; run them in this order.

## Before you start (not on camera)

- Plugin installed, `/cmux-orc:sessions-setup` done, and Claude sessions restarted.
- **A clean cmux window.** The Sessions overview lists every workspace cmux knows about, so close or move every other workspace first. No real projects, no other sessions, no notifications on screen.
- A throwaway project that Claude Code already trusts: `~/shop` with a `git init` and one commit. (An untrusted folder stops each child at the trust prompt.)
- Two brief files in `~/shop/briefs/`:
  - `qa.md`: "Read README.md. Report `orc stage` after each of 3 steps: read, list 3 test ideas, write them to notes/qa.md. Then message Shop-Orc that you are done."
  - `api.md`: "Run `orc stage \"migrations\"`. Then ask the user with AskUserQuestion: Postgres or SQLite for the migrations? Report the answer to Shop-Orc." (The question is what makes the ⚠ show up, the same way in every take.)
- Start the Orc session in a fresh cmux workspace: `cd ~/shop && claude`.
- Right sidebar showing the panel (`orc pane`).

Afterwards, remove the demo Orc from `~/.agentic/sessions/registry.json` (the `"Shop-Orc"` entry under `orcs`) and delete `~/.agentic/sessions/orcs/Shop-Orc/`.

## Script

| Time | Do | Say |
|---|---|---|
| 0:00 | Show the empty workspace and the sidebar. | "I run a lot of Claude Code sessions in cmux. The problem is knowing which one needs me. cmux-orc makes one session the lead of a team." |
| 0:10 | In Claude: `/rename Shop-Orc`, then `! orc init Shop-Orc`. Point at the left panel. | "An Orc is a session whose name ends in -Orc. `orc init` colours its workspace and pins it to the top." |
| 0:25 | Type to the Orc: "Start two children: QA with the brief briefs/qa.md, and API with briefs/api.md." It asks first; answer yes. | "The plugin's skill has the Orc ask before every child, because each one is a full Claude session." |
| 0:40 | Two tabs appear: `Shop-QA`, `Shop-API`. Point at the sidebar rows. | "Each child is a tab to the right of the Orc. The sidebar lists them: status, time in that state, and the stage they report." |
| 0:55 | QA's row updates as it runs `orc stage`. | "Children report progress with `orc stage`. It shows in the tab title and here." |
| 1:05 | API stops on its question: ⚠ on its tab, red row: "⚠ needs you · migrations". | "This is the part I built it for. 'Finished a turn' stays orange. A session stuck on a question or a permission gets ⚠ and goes red." |
| 1:15 | Click the red row → it jumps to `Shop-API`. Pick an answer. The ⚠ clears. | "Click it, answer it, and the mark goes away." |
| 1:25 | In the Orc: `! orc job new --to Shop-QA --title "Smoke cases" --task "List 3 smoke cases"`, then `! cat` the path it printed. Switch to QA and type "anything new?". QA reads the job, runs `orc job set J-001 taken` and starts on it. | "Work between sessions is a job: a Markdown file in the Orc's team inbox. A hook puts each session's new jobs into its next prompt, so QA picks this one up by itself." |
| 1:40 | Switch to another (empty) workspace: the sidebar shows **Sessions** with one row for `Shop-Orc`. | "Outside the Orc, the whole team is one row." |
| 1:48 | Back in the Orc: `! orc close QA`, then `! orc resume QA`. | "Close keeps the session id. Resume brings the child back with its conversation." |
| 1:58 | Show the install lines from the README. | "It's MIT, on GitHub as cmux-orc. Three commands in Claude Code to install it." |

## If something goes wrong

- `orc close` refuses with "uncommitted changes": QA wrote `notes/qa.md`. Say "it won't close a child with uncommitted work". That is the feature. Commit, or skip the close beat.
- No ⚠ on API: the hooks are not loaded in that session. Restart Claude sessions after installing the plugin.
- Sidebar shows Files/Find/Vault: `! orc pane`.
