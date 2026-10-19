# cmux-orc promo: storyboard

Captions only. No voiceover. Silent by default; if music is wanted later, a CC0 track with its source noted here.
Master: 1920×1080, 30 fps, H.264, about 80 s. Captions are burned in at 56 px or larger, with a dark band behind them, so they read on a phone.

## How it is made

**Rendered (every shot).** An HTML/CSS replica of a cmux window: a left workspace panel, a tab bar, a terminal pane and the right sidebar. It is driven by a timeline script and recorded frame by frame in headless Chromium (Playwright) → PNG frames → ffmpeg. The sidebar replica copies `cmux/sidebars/orc-status.js` exactly: the same row layout, status colours (working #0A84FF, idle #34C759, waiting #FF9F0A, needs you #FF453A), the "⚠ needs you · <stage>" line, the time column, and the Orc rollup text ("⚠ 1 need you · 3 working").
Why rendered: the result is deterministic and reproducible, and no other workspace, real session or notification from the user's machine can leak into a frame. Every shot can be re-cut when the brand or copy changes.

No real footage: every frame is rendered from the replica, whose sidebar is drawn from the sidebar's own logic.

All names in frames are fictional: `Shop-Orc`, `Shop-QA`, `Shop-Docs`, `Shop-API`, the path `~/shop`.

## Shots

| # | Time | Shot | Caption |
|---|---|---|---|
| 1 | 0:00–0:05 | Logo and wordmark fade in on a dark field. | **cmux-orc**: run many Claude Code sessions in cmux without losing track. |
| 2 | 0:05–0:12 | Problem: eight look-alike terminal tabs, spinners turning, the cursor hunting between them. | Eight Claude sessions. Which one needs you? |
| 3 | 0:12–0:22 | The terminal types `orc init Shop-Orc`. In the left panel the workspace tile is renamed, turns Purple and moves up to the pinned area. | One session becomes an **Orc**. Its workspace becomes one coloured, pinned tile. |
| 4 | 0:22–0:34 | `orc spawn QA --cwd ~/shop --brief "Run the checkout smoke cases"`. A small "Start Shop-QA? yes" confirmation, then the tab `Shop-QA` slides in to the right. Docs and API follow quickly. | The Orc starts children as tabs, and asks you before each one. |
| 5 | 0:34–0:44 | Close-up of the right sidebar (Orc view): a title row with the Orc's colour dot; child rows with blue "working" dots and timers ticking. A child runs `orc stage "case 3/12"`, and the tab title becomes `QA · case 3/12`. The sidebar line updates 3/12 → 7/12 → 12/12. | Each child reports its stage. The sidebar shows it live. |
| 6 | 0:44–0:54 | Shop-API stops on a permission prompt. Its tab gets "⚠", and its sidebar dot and line turn red: "⚠ needs you · migrations". A click on the row jumps to that tab, you answer, and the ⚠ clears. | Blocked on a question or a permission? ⚠ on the tab, red in the sidebar. |
| 7 | 0:54–1:04 | Orc pane: `orc job new --to Shop-QA --title "Smoke cases"` → prints `J-001 …/inbox/Shop-QA--J-001-smoke-cases.md`. A Markdown card (id/status/Task/Output/Log) floats over. In the QA tab, an `[orc inbox] Jobs for you` notice appears. Later: `orc job set J-001 done "12/12 pass"`, and the card's status flips to done. | Jobs are small Markdown files in an inbox. A hook shows each session its new ones. |
| 8 | 1:04–1:12 | Switch to another workspace. The sidebar becomes **Sessions**: ORCS: `Shop-Orc  ⚠ 1 need you · 2 working`; SESSIONS: two independent sessions. | Step out, and every Orc is one row. Every other session is listed under it. |
| 9 | 1:12–1:20 | End card: the three install lines, `github.com/yashMangal19/cmux-orc`, "MIT · macOS · cmux 0.64+". | Install it in Claude Code with `/plugin install cmux-orc@cmux-orc` |

## Hero GIF (≤ 8 s loop, ≤ 5 MB, 800 px wide)
The cropped tab bar and sidebar, about 6 s: tabs spawn → stages tick → ⚠ appears on one tab and the row turns red → it clears → loop. No caption band; the motion carries it.

## Feature clips (each 6–7 s, mp4 + GIF at 800 px, one short caption)
1. `orc-tabs`: `orc init` + spawn, the tile is coloured and pinned, and tabs appear (shots 3–4).
2. `sidebar`: stage updates and timers in the Orc view, then the Sessions overview (shots 5 and 8).
3. `needs-you`: ⚠ on, red row, jump, cleared (shot 6).
4. `jobs`: job new → inbox notice → done (shot 7).

## Outputs (assets/media/)
`cmux-orc-promo.mp4`, `cmux-orc-promo-poster.png`, `cmux-orc-hero.gif` (+ `.mp4`), `feature-{orc-tabs,sidebar,needs-you,jobs}.{gif,mp4}`.
`video/build.sh` also copies the promo, the poster and the four feature GIFs into `docs/media/` for the site.
Every shot is **rendered**. None is real footage.

## Rebuild
```
video/build.sh          # render all scenes (headless Chrome via Playwright), then encode
video/build.sh encode   # re-encode only, from video/raw/*.mp4
node video/render.mjs master --stills 12,45.5   # spot-check frames → video/raw/stills/
```
Sources: `video/scenes/app.html` (the cmux replica + styles), `scenes.js` (renderer; the sidebar logic is a port of `cmux/sidebars/orc-status.js`), `configs.js` (the timeline for each output). Raw renders go in `video/raw/` (git-ignored).
Needs Node, ffmpeg and Playwright (`npm i -g playwright`). It uses the installed Google Chrome by default; set `PW_CHANNEL=chromium` to use Playwright's own build instead.

## Shot changes made during production
- Shot 6: you answer the permission prompt with the key `1` (shown as a key chip), not with a click, because that is how Claude Code takes the answer.
- Shot 8: the Orc row shows its counts exactly as the sidebar computes them, e.g. `⚠ 1 need you · 1 working · 2 waiting · 1 idle`.

## Claims checked against the code
- init renames, colours and pins (`bin/orc` cmd_init). Spawn asks first (skills/orc Orc rules). Stage renames the tab to "Role · text" (cmd_stage, sidebar splitTitle).
- ⚠ comes from AskUserQuestion / permission and elicitation Notifications, and clears on PostToolUse / UserPromptSubmit / Stop (hooks/orc-hook.py).
- A team job ID uses the Orc's prefix, default `J` (`inbox_for`). The README uses `J-001` for Shop-QA.
