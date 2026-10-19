---
name: sessions-setup
description: First-time setup for cmux-orc after installing the plugin. Links the orc command and the status sidebar into place and opens the sidebar.
disable-model-invocation: true
---

Run `orc setup` with the Bash tool and show the user its output.

If it says `~/.local/bin` is not on PATH, tell the user to add `export PATH="$HOME/.local/bin:$PATH"` to their shell profile. Inside Claude Code the plugin's `bin/` is already on PATH, so `orc` works there regardless.

Then tell the user:
- Restart running Claude sessions so they load the plugin's hooks.
- Make a session an Orc: `/rename <Name>-Orc`, then `orc init <Name>-Orc`.
- Name one session `Sessions-Manager` to route work between Orcs and independent sessions.
- `orc pane` brings the status panel back if the right sidebar shows Files, Find or Vault.
