# Contributing to cmux-orc

Thanks for helping. Bug reports, fixes and docs changes are all welcome. For a larger change, open an issue first so we can agree on the shape before you write it.

## Layout

| Path | What |
|---|---|
| `bin/orc` | The CLI. One stdlib Python file. |
| `hooks/orc-hook.py`, `hooks/hooks.json` | The hook: inbox notices and the ⚠ tab mark. |
| `cmux/sidebars/orc-status.js` | The cmux Custom Sidebar. |
| `skills/` | The `orc`, `sessions-manager` and `sessions-setup` skills. |
| `.claude-plugin/` | Plugin and marketplace manifests. |

## Run from a clone

```
git clone https://github.com/yashMangal19/cmux-orc
cd cmux-orc
python3 bin/orc --help
```

To use your clone as the plugin in Claude Code, start Claude with it as a plugin directory:

```
claude --plugin-dir /path/to/cmux-orc
```

`bin/orc setup` links `~/.local/bin/orc` and `~/.config/cmux/sidebars/orc-status.js` to your clone. That replaces any links an installed plugin made, so run it only if you want your clone to be the live copy. When a session next starts from the installed plugin, its hook links both back to the plugin.

## Test without touching your real state

Point `CLAUDE_ORC_HOME` at a scratch folder. Every `orc` command and the hook then read and write only there.

```
export CLAUDE_ORC_HOME="$(mktemp -d)"
python3 bin/orc job new --to Sessions-Manager --title "Test job" --task "Check the inbox" --from Me
python3 bin/orc job set S-001 taken "on it"
python3 bin/orc job list --all
```

The job commands and `orc list` work outside cmux. `init`, `spawn`, `stage`, `close`, `resume` and `pane` need a cmux terminal. Try them in a cmux workspace that you use only for testing, with the same `CLAUDE_ORC_HOME`.

To run the hook by hand, give it the JSON that Claude Code would send on stdin:

```
printf '{"type":"custom-title","customTitle":"Sessions-Manager"}\n' > "$CLAUDE_ORC_HOME/t.jsonl"
echo "{\"hook_event_name\":\"SessionStart\",\"session_id\":\"test\",\"transcript_path\":\"$CLAUDE_ORC_HOME/t.jsonl\"}" \
  | python3 -I hooks/orc-hook.py
```

It prints the `[orc inbox]` notice for that session's jobs.

Before you open a pull request:

```
python3 -m py_compile bin/orc hooks/orc-hook.py
node --check cmux/sidebars/orc-status.js     # if you have node
```

and in cmux, `cmux sidebar validate orc-status` after linking the sidebar.

## Style

- **Python: standard library only.** No third-party packages, no `requirements.txt`. It must run on the `python3` from Apple's Command Line Tools.
- Keep the CLI one file. Match the code around you: short functions, a docstring where the reason is not obvious, comments only for the non-obvious.
- Every cmux call goes through the `cmux()` helper.
- The sidebar has no file access. Data reaches it through cmux's workspace and tab data (tab titles today).
- Write docs and help text in short, plain sentences. Commands and flags in the README must match `orc --help`.

## Commits and pull requests

- Small commits with a clear subject line in the imperative ("orc close: refuse while the child waits on the user").
- One topic per pull request. Fill in the template, including how you tested.
- Update `README.md` and `CHANGELOG.md` (under "Unreleased") when behaviour changes.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By taking part you agree to it.
