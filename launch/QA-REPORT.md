# QA report

## Pass 1: docs and launch kit (2026-10-19)

Scope: README.md, CONTRIBUTING.md, CHANGELOG.md, SECURITY.md, CODE_OF_CONDUCT.md, launch/*.md, .github/*. Checked against bin/orc, hooks/orc-hook.py, hooks/hooks.json, cmux/sidebars/orc-status.js, skills/*, .claude-plugin/* at e85e0a2.

### What I ran

- `py_compile` on bin/orc and the hook, and `node --check` on the sidebar: pass. Both Python files parse as Python 3.9, and `orc job list` runs on Apple's CLT `/usr/bin/python3` (3.9.6).
- `--help` for every subcommand, including `job new/set/list`.
- The CONTRIBUTING test block, word for word, in a scratch `CLAUDE_ORC_HOME`: pass (S-001 created, taken, listed).
- The CONTRIBUTING hook test: pass. It prints the `[orc inbox]` notice.
- The README job example with two Orcs registered: `job new` gives J-001 in each team inbox. A bare `job set J-001` refuses as ambiguous, and from the child's surface it resolves to its own inbox. This matches README "Known limits".
- `orc_launch_args` with `--permission-mode X --model opus -n N --resume id --effort=high -w`: it keeps `--permission-mode X --model opus --effort=high` and drops the rest. This matches the README FAQ and CHANGELOG "Fixed".
- `init/spawn/stage/close/resume` outside cmux: each stops with `not running inside a cmux terminal`. I did not run `pane` or `setup` against the real cmux.
- Links: every relative path and every external URL tested with curl.
- Privacy grep (employer, work project, work email, /Users/ paths): clean. The only email is yash28mangal@gmail.com in CODE_OF_CONDUCT.md:63, which is intended.
- X posts: 253 / 257 / 219 / 245 / 233 / 218 weighted chars, all ≤ 280. The HN title is 85 chars.

### Findings

| # | Sev | Where | Claim | What the code / world does | Suggested fix |
|---|---|---|---|---|---|
| 1 | High | launch/posts.md:81 | HN title | 85 chars; HN allows 80. | `Show HN: cmux-orc – Run Claude Code sessions as cmux tabs, see which is blocked` (79). |
| 2 | High (pending Video) | README.md:5,21,27,33,39; posts.md:11,19,26,32,38,59; CHECKLIST.md:28 | Media in `assets/media/` | `assets/media/` is empty: no hero GIF, no 4 feature GIFs, no promo mp4, no poster. The README shows 5 broken images. | Video delivers these files. Recheck in pass 2. Do not merge to main before then. |
| 3 | Medium | README.md:129 | "`orc init`, `spawn`, `stage`, `close`, `resume` and `pane` stop with `not running inside a cmux terminal` outside it" | `cmd_pane` (bin/orc:313) never calls `here()`. Outside cmux it runs `cmux right-sidebar set …` directly. That either acts on the running cmux app or fails. With no cmux on PATH it raises a Python traceback (`FileNotFoundError`), because `cmux()` does not catch it. | Docs: drop `pane` from that list, or code: call `here()` in `cmd_pane`, and catch `FileNotFoundError` in `cmux()` with `die("cmux not found")`. Product-code change: Launch-Orc's call. |
| 4 | Medium | CONTRIBUTING.md:33 | "Every `orc` command and the hook then read and write only there" (in `CLAUDE_ORC_HOME`) | `orc setup` always writes `~/.local/bin/orc` and `~/.config/cmux/sidebars/orc-status.js`. `init/stage/spawn/...` rename and colour live cmux tabs. Both still read `~/.cmuxterm/claude-hook-sessions.json` and transcripts. | "…keep their state only there. `orc setup` still links into `~/.local/bin` and `~/.config/cmux`, and the cmux commands act on the real cmux." |
| 5 | Medium | .github/ISSUE_TEMPLATE/config.yml:4; CHECKLIST.md:21 | "Questions and ideas" link to /discussions | Today it is 404 (`has_discussions: false`). | No change. The CHECKLIST T-0 step turns it on. Make that step a hard gate before the issue template goes public. |
| 6 | Medium | SECURITY.md:13; config.yml:7; CHECKLIST.md:23 | Private vulnerability reporting | The GitHub API reports `{"enabled": false}`. The link only redirects to login. | Same: the CHECKLIST step must happen before launch. |
| 7 | Low | CHANGELOG.md:27-28; release-notes link | compare/v0.1.0…HEAD, releases/tag/v0.1.0 | 404 until the tag and release exist. | No change. These resolve after the CHECKLIST release step. |
| 8 | Low | launch/demo-script.md:29 | "Switch to QA and type any prompt: the `[orc inbox]` notice appears" | The hook returns the notice as UserPromptSubmit `additionalContext`. That is model context and may not show on screen. The viewer sees only how Claude reacts. | Do a dry run of this step before recording. If the notice is not visible, change the beat to "QA picks up the job" and show Claude's reply, or `cat` the job file. |
| 9 | Low | posts.md:24 (X 2/6), :65 (LinkedIn), :120 (Reddit) | "The Orc asks you before each spawn" | A skill rule (skills/orc/SKILL.md) that the model follows; the CLI does not enforce it. The HN comment (posts.md:99) already says this honestly. | Soften: "The Orc's skill has it ask you before each spawn". Optional. |
| 10 | Low | bin/orc docstring vs README.md:83,85,90 (CONTRIBUTING.md:69 says they must match) | README and `orc --help` agree | `--help` shows `orc init <Name>` (README `<Name>-Orc`), `orc stage … (child)` (README: works in an Orc or a child tab), and `orc setup` without `[--quiet]`. | Update the docstring in bin/orc (product code: Launch-Orc's call), or relax the CONTRIBUTING rule. |
| 11 | Low | CHANGELOG.md:22-25 | "### Fixed" in the first public release | Nothing public was ever broken, so a Fixed section in 0.1.0 reads oddly. | Fold both items into "Added" as behaviour (`job set` prefers the caller's inbox; inherited flags keep their values), or drop them. |
| 12 | Low | README.md:55 (`orc list`) | "Orcs, children, status, stage" | With no Orcs registered it prints nothing at all. | Optional: print `no Orcs yet; run orc init <Name>-Orc` (product code). |
| 13 | Info | README.md:141, SECURITY.md:22, posts.md:91 | Default state dir `~/.agentic/sessions` | Correct per code. I only flag the name `.agentic` so Launch-Orc can confirm it is not tied to any work tooling naming. | None if fine. |

### Verified true (no action)

README: install lines (marketplace `cmux-orc`, plugin `cmux-orc`, skill `/cmux-orc:sessions-setup`); the Orc name must end in `-Orc`; `init` renames, colours and pins, with `--adopt`; spawn tab name `<Project>-<Role>`, `--brief` as a file or text, `--` flags, inherited flags and the OWN_FLAGS list; stage ≤ 80 chars, in the tab title; close refuses on dirty git or "needs you", and saves the session id; resume uses `claude --resume`; job ID prefixes J/S and inbox routing; hook events (SessionStart/UserPromptSubmit notices, ⚠ on AskUserQuestion and permission/elicitation, cleared on PostToolUse/UserPromptSubmit/Stop); sidebar rollup text `⚠ N need you · N working`, waiting in orange, blocked in red, click-to-jump; state layout and the read-only use of `~/.cmuxterm`; no network calls; fcntl; uninstall paths; every Known limit. SECURITY "what it does" list. The CHANGELOG Added items. The release notes. Every claim in the posts except #9. The demo-script commands, and the cleanup of `registry.json` and `orcs/Shop-Orc/`.

## Pass 2: site, media, re-check (2026-10-19)

Scope: docs/ served locally (`python3 -m http.server -d docs`), assets/media and docs/media (b236472), the pass-1 fixes (8ea951f, 14cdaae). Headless Chrome via Playwright. Lighthouse is not installed, so I ran its checks by hand: overflow, console and network errors, contrast, keyboard, reduced motion, page weight.

**Verdict: GO for merge.** Nothing blocks the merge. The launch gates in CHECKLIST.md are still open and come after the merge: Discussions on, private vulnerability reporting on, Pages on, tag and release. Fix #1 before launch day.

### Pass-1 fixes re-checked

All 13 are resolved or accepted:
- #1: HN title is now 79 chars.
- #2: all README images resolve.
- #3: `orc pane` outside cmux now prints `not running inside a cmux terminal`, and a missing cmux binary prints `cmux not found …` with no traceback (I ran both).
- #4: CONTRIBUTING wording fixed.
- #5, #6: now hard gates in CHECKLIST.
- #8: the demo-script beat now cats the job file.
- #9: posts softened.
- #10: `--help` matches the README.
- #11: CHANGELOG folded into Added.
- #12: `orc list` prints a hint.

X posts after the edits: 253 / 265 / 219 / 245 / 233 / 218 weighted chars, all ≤ 280. `py_compile` passes.

### What passed

- **Layout:** no horizontal overflow at 1440 or 390, in light or dark.
- **Console:** no console errors. No 4xx responses.
- **Contrast:** no WCAG AA text contrast failures on solid backgrounds, light or dark.
- **Demo, every action:**
  - Spawn: two children, then the button disables.
  - Send job: J-001 goes open → taken, and QA's stages run.
  - The ⚠ appears on Docs: tab `⚠ Docs · drafting`, red row `⚠ needs you · drafting`, and "Answer the ⚠" enables.
  - Answer the ⚠: the button focuses the option, and the mark clears.
  - `orc list`: output in the CLI's format.
  - Workspace switch: the Sessions overview shows `Shop-Orc  4 working · 1 idle` and `notes  idle`.
  - Pause freezes both the steps and the clocks. Reset restores the start state.
  - Copy all: puts the exact 3 lines on the clipboard.
- **Demo fidelity:** its output strings match bin/orc (`init`, `spawn`, `stage`, `job new`/`set`, `list`, `[orc inbox]`).
- **Keyboard:** every control is reachable in a logical order, with a visible 2px outline. The skip link is visible on focus.
- **Reduced motion:** the GIFs are not loaded (the still drawings stay), and no CSS animation or transition runs.
- **Media sizes:** every GIF ≤ 5 MB (largest 1.45 MB). Hero GIF 7.2 s at 800 px. Promo 80 s at 1920×1080, 30 fps. docs/media is byte-identical to assets/media.
- **Media frames:** sampled frames match the code: the sidebar layout, colours, `⚠ needs you · <stage>`, the rollup text, the job file header and Log format, the `orc init`/`spawn` output, the tab title `Role · stage`. All names are fictional (Shop-*, /Users/demo, /Users/you).
- **Privacy:** grep of docs/, video/ and launch/ is clean. The working tree is clean, and video/raw and node_modules are git-ignored.

### Findings

| # | Sev | Where | Problem | Suggested fix |
|---|---|---|---|---|
| 1 | Medium | docs/site.js:45-55 | First visit downloads about 5.2 MB: the four feature GIFs (4.5 MB) plus the 539 KB promo poster. `new Image()` sets `src` at once, so `img.loading = "lazy"` (set in onload) has no effect. Heavy on mobile data. | Use the feature mp4s (141–410 KB each) as `<video autoplay muted loop playsinline>`, keeping the reduced-motion path. Or set `src` only when an IntersectionObserver fires. Convert the poster to JPEG/WebP (about 100 KB). |
| 2 | Low | docs/index.html, "Status sidebar" card | It says `(“4 working · ⚠ 1 need you”)`. The sidebar code (and README:25) puts ⚠ first. | `(“⚠ 1 need you · 4 working”)` |
| 3 | Low | docs/index.html, "Orcs" card | "…and asks you before each new one" states the skill rule as fact. Pass-1 #9 softened this everywhere else. | "Its skill has it ask you before each new one." |
| 4 | Low | docs/index.html, FAQ "Does it need cmux?" | Missing the README's new sentence about `orc setup` (14cdaae), so the site FAQ has drifted from the README. | Copy the README sentence. |
| 5 | Low | docs/index.html, `<main id="main">` | The skip link moves the hash, but focus stays on `BODY`, because `main` is not focusable. | Add `tabindex="-1"` to `<main>`. |
| 6 | Low | assets/media/feature-jobs.*, promo shot 7 | The video shows the `[orc inbox]` notice as a visible block in the child's transcript. In Claude Code it is UserPromptSubmit `additionalContext`, which may not show like that (same issue as pass-1 #8; the demo script was fixed, the render was not). | Optional: label it as what the session receives, or accept it as an illustration. |
| 7 | Info | video/STORYBOARD.md | The last note says the README's `S-001` example for Shop-QA does not match. The README now uses J-001 correctly, so the note is stale. The feature clips run 6.0–7.0 s against the stated 4–6 s. | Delete the note and update the clip length. |
| 8 | Info | local only | Chrome reports the site.js HEAD for the promo mp4 as `net::ERR_ABORTED` against python's http.server. The server logs 200 and the video still swaps in. | Re-check once Pages is live. |
| 9 | Info | repo | The promo, poster and four GIFs are stored twice (assets/media and docs/media), about 9 MB extra in git history. | Accept it (Pages from /docs cannot reach assets/), or drop the GIFs from assets/media and point the README at docs/media. |
