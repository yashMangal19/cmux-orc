# Launch posts

Repo link everywhere: https://github.com/yashMangal19/cmux-orc
Media lives in `assets/media/` (made by Video; see `video/STORYBOARD.md`). The social card is `assets/brand/og-card.png`.
Every claim here matches the README FAQ. If the README changes, change these too.

---

## X thread (6 posts)

**1/6**: attach `assets/media/cmux-orc-hero.gif`

> I run a lot of Claude Code sessions at the same time in cmux, and I kept losing track of which one was waiting on me.
>
> So I made cmux-orc: one Claude session runs a team of child sessions as tabs, and a sidebar shows which one needs you.
>
> MIT, macOS. 🧵

**2/6**: attach `assets/media/feature-orc-tabs.gif`

> An "Orc" is a normal Claude session whose name ends in -Orc.
>
> `orc init Shop-Orc` colours and pins its workspace.
> `orc spawn QA --brief "…"` opens a tab and starts a child with that brief. The Orc asks you before each spawn, because each child costs tokens.

**3/6**: attach `assets/media/feature-sidebar.gif`

> Children report progress with `orc stage "case 3/12"`. It shows in the tab title and in a right-sidebar panel, with status and time in state.
>
> Step out of the Orc and it collapses to one row: "⚠ 1 need you · 3 working".

**4/6**: attach `assets/media/feature-needs-you.gif`

> The part I wanted most: cmux's "waiting" only means a session finished its turn.
>
> A hook puts ⚠ on the tab when a session is actually stuck on a question or a permission prompt, and the sidebar row turns red. It clears when the session moves on.

**5/6**: attach `assets/media/feature-jobs.gif`

> Work between sessions is a job: a small Markdown file in an inbox (Task / Output / Log).
>
> A hook shows each session its new jobs on every prompt. Children only talk to their Orc. One "Sessions-Manager" session routes everything else.

**6/6**: attach `assets/brand/og-card.png`

> Install in Claude Code:
>
> /plugin marketplace add yashMangal19/cmux-orc
> /plugin install cmux-orc@cmux-orc
> /cmux-orc:sessions-setup
>
> Needs macOS + cmux 0.64+, python3. No network calls of its own.
> https://github.com/yashMangal19/cmux-orc

---

## LinkedIn

Attach: `assets/media/cmux-orc-promo.mp4` (poster `cmux-orc-promo-poster.png`). If video is not ready, use `cmux-orc-hero.gif`.

> I've been running several Claude Code sessions in parallel in cmux: one on tests, one on docs, one on a refactor. The hard part was never the work. It was knowing which session had stopped and was waiting for me.
>
> cmux-orc is a small open-source Claude Code plugin that does three things:
>
> • One session (an "Orc") starts, closes and reopens child sessions as tabs in its cmux workspace, and asks before each one.
> • A sidebar panel shows every session's status, how long it has been in that state, and the stage it reported ("case 41/88").
> • When a session is blocked on a question or a permission prompt, its tab gets a ⚠ and its row turns red. That is separate from "finished a turn", which cmux already shows.
>
> Work between sessions is plain Markdown job files in an inbox, so you can read and edit them yourself.
>
> It is MIT-licensed, standard-library Python plus one cmux sidebar script, and it runs on macOS with cmux 0.64 or later.
>
> https://github.com/yashMangal19/cmux-orc
>
> If you run many agent sessions, I'd like to hear how you keep track of them.

---

## Show HN

**Title:** Show HN: cmux-orc – Run Claude Code child sessions as cmux tabs, see which is blocked

**URL:** https://github.com/yashMangal19/cmux-orc

**First comment (post right after submitting):**

> Hi HN. I often have five to ten Claude Code sessions open in cmux (a macOS terminal built for agent sessions). cmux shows when a session has finished its turn, but I couldn't tell which ones were actually stuck on a permission prompt or a question, and which tab belonged to which piece of work.
>
> cmux-orc is a Claude Code plugin with three parts:
>
> - `orc`, a ~500-line stdlib Python CLI. A session whose name ends in `-Orc` can `spawn` children as tabs in its workspace (each with a brief), `close` them (it saves the session id and refuses if the child has uncommitted git changes or is waiting on you), and `resume` them later with `claude --resume`. State is one JSON registry under `~/.agentic/sessions`.
> - A hook. On `AskUserQuestion` and permission/elicitation notifications it prefixes the tab title with ⚠, and clears it on the next tool use, prompt or stop. It also shows each session the job files in its inbox.
> - A cmux Custom Sidebar script that lists sessions with status, time in state and a reported stage.
>
> One detail that may be interesting: the sidebar runs without file access, so the stage and the ⚠ flag reach it through tab titles. `orc stage "case 3/12"` renames the tab to `QA · case 3/12` and the sidebar splits that back apart. It's a hack, but it avoids a daemon.
>
> Limits, honestly:
> - macOS and cmux only (cmux is a macOS app). No Linux or Windows.
> - Each child is a full Claude session and costs what any session costs. The Orc's skill tells it to ask before every spawn, but that rule is followed by the model; the CLI does not enforce it.
> - One level of children, no nesting.
> - Spawning into a folder Claude Code hasn't trusted stops the child at the trust prompt.
> - Hooks load at session start, so running sessions need a restart after install.
>
> The code makes no network calls of its own. MIT. I'd like feedback on the job/inbox model in particular. Is a Markdown file per job too simple, or is that its value?

---

## r/ClaudeAI

**Title:** I made a plugin that runs Claude Code child sessions as cmux tabs and marks the ones blocked on you (open source)

**Flair:** Productivity / Tools (whichever the sub has)

**Attach:** `assets/media/cmux-orc-hero.gif` as the post image; link the repo in the body.

> If you run many Claude Code sessions in [cmux](https://cmux.com), this may help.
>
> **cmux-orc** lets one session (an "Orc") run a team:
>
> - `orc spawn QA --brief "Run the checkout smoke cases"` opens a tab and starts a child with that brief. The Orc asks you first.
> - Children report `orc stage "case 3/12"`, which shows in the tab title and in a sidebar panel with status and time.
> - When any session stops on a question or a permission prompt, its tab gets ⚠ and the sidebar row goes red. Plain "finished its turn" stays orange, so you can tell them apart.
> - `orc close` keeps the session id; `orc resume` brings the child back with its conversation.
> - Jobs between sessions are Markdown files in an inbox. A hook shows each session its new jobs.
>
> Install in Claude Code:
>
> ```
> /plugin marketplace add yashMangal19/cmux-orc
> /plugin install cmux-orc@cmux-orc
> /cmux-orc:sessions-setup
> ```
>
> Then restart running sessions so the hooks load.
>
> Requirements: macOS, cmux 0.64+, python3. Each child is a full session, so watch your usage.
>
> Repo + FAQ: https://github.com/yashMangal19/cmux-orc
>
> Happy to answer questions. Bug reports welcome.
