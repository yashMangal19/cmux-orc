# Launch-day checklist

Everything here that publishes, pushes or changes GitHub settings is done by the user, or by Launch-Orc with the user's yes. Do the steps in order. Tick each one.

## T-1 day: ready the repo

- [ ] `launch` branch reviewed and merged to `main` (no force push).
- [ ] On a clean machine or a fresh macOS user: the three install lines from the README work, `/cmux-orc:sessions-setup` prints its links, and the sidebar appears.
- [ ] Every command in the README runs as written: `orc --help`, `init`, `spawn`, `stage`, `close`, `resume`, `list`, `pane`, `job new/set/list`.
- [ ] Every image the README references exists in `assets/media/`, and the README renders on GitHub in light and dark themes.
- [ ] `.claude-plugin/plugin.json` version is `0.1.0`.
- [ ] No other workspaces, real session names, employer or work projects in any image, GIF, video or post.
- [ ] `launch/posts.md` copy checked against the README FAQ one last time.

## T-0: GitHub settings (user)

- [ ] **Description:** `Run a team of Claude Code sessions in cmux. See which one needs you.`
- [ ] **Website:** the GitHub Pages URL (after Pages is on), else blank.
- [ ] **Topics:** `claude-code`, `claude-code-plugin`, `cmux`, `ai-agents`, `multi-agent`, `orchestration`, `developer-tools`, `macos`, `terminal`, `python`.
- [ ] **Social preview:** Settings → General → Social preview → upload `assets/brand/og-card.png`.
- [ ] **Features:** Issues on, Discussions on, Wiki off. **Gate:** Discussions must be on before launch. The issue template's "Questions and ideas" link points there and is a 404 until then.
- [ ] **Pages:** Settings → Pages → deploy from the branch and folder that Web names. Open the URL and check it.
- [ ] **Security:** Settings → Security → Private vulnerability reporting on. **Gate:** must be on before launch. SECURITY.md and the issue template link to it, and the link does not work until then.

## T-0: release

- [ ] `git tag -a v0.1.0 -m "cmux-orc v0.1.0"` on `main`, then `git push origin v0.1.0`.
- [ ] Releases → Draft a new release → tag `v0.1.0`, title `cmux-orc v0.1.0`, body from `launch/release-notes-v0.1.0.md`. Attach `assets/media/cmux-orc-promo.mp4` if it is ready.
- [ ] Install once more from the public repo, now that `main` is final.

## Posting order and timing

Times are US Eastern. Tuesday to Thursday is best for HN. Leave about 30 minutes between posts so you can answer the first comments on each one.

| When | Where | Text | Media |
|---|---|---|---|
| 08:30 | **Show HN** | `posts.md` → Show HN title + URL. Post the first comment right away. | none (HN has no media) |
| 09:00 | **X thread** | `posts.md` → X thread, 6 posts | hero GIF, 4 feature GIFs, og-card |
| 09:30 | **r/ClaudeAI** | `posts.md` → r/ClaudeAI | hero GIF |
| 10:00 | **LinkedIn** | `posts.md` → LinkedIn | promo mp4 (or hero GIF) |
| +1 day | X | One follow-up post with the full promo video and a link to the release. | promo mp4 |

Do not ask anyone to upvote the HN post. Do not post the HN link in the other posts in the first hours.

## Replies

- **Who:** the user answers every comment personally, from their own accounts. Agents can draft replies; the user posts them.
- **First 3 hours:** check HN every 15 minutes, the rest every 30. After that, twice a day for 3 days.
- **Source of truth:** answer from the README FAQ. If a question is not in the FAQ and comes up twice, add it to the FAQ.
- **Bug reports in comments:** thank them, ask them to open an issue (bug template), and link it back in the thread.
- **Tone:** plain and specific. Say what it does not do. No arguments.
- **Common questions to expect:** Linux/Windows (no; cmux is macOS), cost of children (each is a full session), how it differs from Claude Code's own subagents (children are full interactive sessions in their own tabs that you can talk to, close and resume), privacy (no network calls of its own).

## After launch

- [ ] Move "Unreleased" in `CHANGELOG.md` under `0.1.0` with the date, if anything was added since.
- [ ] Triage new issues within 48 hours.
