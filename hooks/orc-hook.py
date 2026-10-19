#!/usr/bin/env python3
"""cmux-orc hook: inbox notices and the ⚠ "needs you" tab marker.

  SessionStart, UserPromptSubmit  show this session its new or changed jobs
  PreToolUse(AskUserQuestion), Notification(permission/elicitation)
                                  mark the cmux tab "⚠ …" (the session is blocked on the user)
  PostToolUse, UserPromptSubmit, Stop
                                  clear the mark

The session's name is its last /rename (`custom-title` in the transcript).
Inboxes and Orcs come from $CLAUDE_ORC_HOME/registry.json (see bin/orc).
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

HOME = Path(os.environ.get("CLAUDE_ORC_HOME", "~/.agentic/sessions")).expanduser()
STATE_DIR = HOME / "state"
CMUX = os.environ.get("CMUX_BUNDLED_CLI_PATH") or "cmux"
TITLE = re.compile(r'"customTitle":"([^"]*)"')
BLOCKING_NOTIFICATIONS = ("permission_prompt", "elicitation_dialog")


def session_name(state, transcript):
    # Scan only the bytes added since the last run, so long transcripts stay cheap.
    try:
        size = transcript.stat().st_size
        with transcript.open("rb") as f:
            start = state.get("offset", 0) if state.get("offset", 0) <= size else 0
            f.seek(start)
            found = TITLE.findall(f.read().decode("utf-8", "ignore"))
        if found:
            state["name"] = found[-1]
        state["offset"] = size
    except OSError:
        pass
    if not state.get("name"):
        state["name"] = launch_name()
    return state.get("name", "")


def launch_name():
    """`claude -n <name>` is written to the transcript only after SessionStart; cmux passes argv in env."""
    import base64
    raw = os.environ.get("CMUX_AGENT_LAUNCH_ARGV_B64")
    if not raw:
        return ""
    argv = base64.b64decode(raw).decode("utf-8", "ignore").split("\0")
    for i, arg in enumerate(argv[:-1]):
        if arg in ("-n", "--name"):
            return argv[i + 1]
    return ""


def registry():
    try:
        return json.loads((HOME / "registry.json").read_text())
    except (OSError, ValueError):
        return {"orcs": {}}


def inbox_dirs(reg):
    yield HOME / "inbox", "Sessions-Manager"
    for name, orc in reg["orcs"].items():
        yield Path(orc.get("inbox") or HOME / "orcs" / name / "inbox").expanduser(), name


def inbox_notice(name, state, reg):
    shown = state.setdefault("shown", {})
    lines, owners = [], set()
    for d, owner in inbox_dirs(reg):
        if not d.is_dir():
            continue
        for job in sorted(d.glob(f"{name}--*.md")):
            m = re.search(r"^status:\s*(\S+)", job.read_text(errors="ignore"), re.M)
            status = m.group(1) if m else "open"
            if status == "done" or shown.get(str(job)) == status:
                continue
            shown[str(job)] = status
            lines.append(f"- {job} (status: {status})")
            owners.add(owner)
    if not lines:
        return None
    return (f"[orc inbox] You are {name}. Jobs for you:\n" + "\n".join(lines)
            + f"\nRead each job, run `orc job set <id> taken`, and message {' / '.join(sorted(owners))}"
            " at every status change (taken, blocked, done).")


def stage_label(reg, surface):
    for orc_name, orc in reg["orcs"].items():
        if orc.get("surface") == surface:
            return f"{orc_name} · {orc['stage']}" if orc.get("stage") else None
        for c in orc["children"].values():
            if c.get("surface") == surface and c.get("status") == "open":
                return f"{c['role']} · {c['stage']}" if c.get("stage") else None
    return None


def cmux(*args):
    subprocess.run([CMUX, *args], capture_output=True, env={**os.environ, "CMUX_QUIET": "1"}, timeout=5)


def set_mark(state, on, name, reg):
    surface, ws = os.environ.get("CMUX_SURFACE_ID"), os.environ.get("CMUX_WORKSPACE_ID")
    if not surface or not ws or state.get("marked", False) == on:
        return
    state["marked"] = on
    label = stage_label(reg, surface)
    if on:
        cmux("rename-tab", "--workspace", ws, "--surface", surface, "⚠ " + (label or name or "needs you"))
    elif label:
        cmux("rename-tab", "--workspace", ws, "--surface", surface, label)
    else:
        cmux("tab-action", "--workspace", ws, "--surface", surface, "--action", "clear-name")


def relink_plugin():
    """After a plugin update the versioned plugin dir moves; point the orc and sidebar links at it."""
    root = os.environ.get("CLAUDE_PLUGIN_ROOT")
    if not root:
        return
    sidebar = Path("~/.config/cmux/sidebars/orc-status.js").expanduser()
    if sidebar.is_symlink() and not sidebar.exists() or \
            sidebar.is_symlink() and not str(sidebar.resolve()).startswith(str(Path(root).resolve())):
        subprocess.run([sys.executable, str(Path(root) / "bin" / "orc"), "setup", "--quiet"],
                       capture_output=True, timeout=5)


def main():
    data = json.load(sys.stdin)
    event = data.get("hook_event_name", "")
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    state_file = STATE_DIR / f"{data.get('session_id', 'unknown')}.json"
    try:
        state = json.loads(state_file.read_text())
    except (OSError, ValueError):
        state = {}
    reg = registry()
    name = session_name(state, Path(data.get("transcript_path", "")))
    out = None

    if event == "SessionStart":
        state["shown"] = {}
        relink_plugin()
    if event in ("PreToolUse",) and data.get("tool_name") == "AskUserQuestion":
        set_mark(state, True, name, reg)
    elif event == "Notification" and (data.get("notification_type") in BLOCKING_NOTIFICATIONS
                                      or "permission" in data.get("message", "").lower()):
        set_mark(state, True, name, reg)
    elif event in ("PostToolUse", "UserPromptSubmit", "Stop"):
        set_mark(state, False, name, reg)

    if event in ("SessionStart", "UserPromptSubmit") and name:
        msg = inbox_notice(name, state, reg)
        if msg:
            out = {"hookSpecificOutput": {"hookEventName": event, "additionalContext": msg}}

    state_file.write_text(json.dumps(state))
    if out:
        print(json.dumps(out))


if __name__ == "__main__":
    main()
