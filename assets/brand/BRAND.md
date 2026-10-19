# cmux-orc brand

## Tagline

**Run a team of Claude Code sessions. See which one needs you.**

Alternates:

- Run many Claude Code sessions in cmux without losing track of them.
- One Claude runs the team. You answer the ⚠.
- Every Claude session, its status and its stage, in one sidebar.

## Logo

The Orc is a dot, and its children are the rows after it, the same shape as a sidebar row.

| File | Use |
|---|---|
| `logo.svg` | Mark plus wordmark. Uses `currentColor`. The wordmark is live text in Inter: load Inter, or set the name in HTML next to the mark. |
| `logo-mark.svg` | Square mark, `currentColor`. Works at 16px. |
| `favicon.svg` | Colour mark on a dark tile: teal Orc, light rows, last row red (⚠). |
| `og-card.svg` / `og-card.png` | 1200×630 social preview. Render the PNG from the SVG with Chrome headless and Inter loaded. |

Leave clear space around the mark at least the size of the dot's radius. Show the mark in one colour, or in the favicon colours. Don't use other colours.

## Palette

All values are in `tokens.css` (`--orc-*`). The site is dark first; light is a full alternate theme.

| Role | Dark | Light |
|---|---|---|
| Background | `#0d1117` | `#f7f8fa` |
| Surface | `#151b23` | `#ffffff` |
| Border | `#2a3340` | `#d9dee6` |
| Text | `#e6eaf0` | `#11161d` |
| Muted text | `#9aa4b2` | `#4b5563` |
| Faint text | `#848e9e` | `#636b78` |
| Accent (Teal) | `#2ec4b6` | `#0b7a70` |

Every text colour reaches WCAG AA (4.5:1) on background, surface and raised in its theme. So do white on the light accent and `--orc-accent-ink` on the dark accent.

Status colours are the exact values the sidebar (`cmux/sidebars/orc-status.js`) draws. They are the same in both themes. Never use them for decoration.

| Status | Colour | Sidebar label |
|---|---|---|
| working | `#0a84ff` | working |
| idle | `#34c759` | idle |
| finished a turn | `#ff9f0a` | your turn / waiting |
| ⚠ blocked on a question or permission | `#ff453a` | ⚠ needs you |
| ended | `#7f7f7f66` | ended |

Orange and red mean different things. Orange is cmux's "finished a turn". Only red ⚠ means a session is blocked on you.

The Orc workspace colours follow `bin/orc`'s order: Purple, Teal, Blue, Rose, Green, Orange, Indigo, Crimson, Aqua, Olive, Magenta, Navy, Brown. Amber is reserved for Sessions-Manager. The hexes in `tokens.css` are ours, for visuals only. cmux picks its own shades.

## Type

- **Inter** (400/500/600/700) for UI, headlines and body. Headlines use weight 700 with tight tracking (`-0.02em`).
- **JetBrains Mono** (400) for commands, file paths and times in the sidebar.

Both are free on Google Fonts. Type scale: 12 / 14 / 16 / 20 / 26 / 36 / 52 / 72 px.

## Voice

- Plain and concrete. Say what the tool does: "the sidebar shows each child's status and stage", not "unlock effortless orchestration".
- Use the product's own words: Orc, child, tab, stage, job, inbox, Sessions-Manager, ⚠ needs you.
- Short sentences, active voice, present tense.
- Every claim must match the code. If the README doesn't say it, check `bin/orc`, `hooks/orc-hook.py` or the sidebar before you write it.
- Say what it doesn't do, too (see the README's Known limits).
- No hype words: revolutionary, seamless, effortless, supercharge, 10x, magic, game-changing, unleash, blazing.

## Do / Don't

| Do | Don't |
|---|---|
| Show a fictional team (Shop-Orc: QA, API, Docs, Release) | Show real workspaces, real sessions or work projects |
| Use status colours only for status | Use red or orange as an accent |
| Use teal for the brand, links and the main CTA | Mix several Orc colours in one decoration |
| Show the real commands (`orc spawn`, `orc stage`, `orc job new`) | Invent commands or flags |
| Say "Claude Code sessions" and "cmux" accurately | Suggest it's made by Anthropic or by cmux |
| Use dark backgrounds for hero art and social cards | Use gradients, glows or 3D on the mark |
