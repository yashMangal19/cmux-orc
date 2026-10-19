## What and why

<!-- One or two sentences. Link the issue: Fixes #123 -->

## How I tested it

<!-- Commands you ran. Use a scratch CLAUDE_ORC_HOME (see CONTRIBUTING.md). Say which cmux and Claude Code versions you used. -->

## Checklist

- [ ] `python3 -m py_compile bin/orc hooks/orc-hook.py` passes
- [ ] Standard library only; no new dependencies
- [ ] `cmux sidebar validate orc-status` passes (if the sidebar changed)
- [ ] README and `orc --help` agree (if commands or flags changed)
- [ ] `CHANGELOG.md` updated under "Unreleased" (if behaviour changed)
