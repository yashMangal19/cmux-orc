// Deterministic scene renderer for the cmux-orc promo. window.render(t) draws the frame for
// time t (seconds) of the config named by ?cfg=. render.mjs screenshots each frame.
// Every UI string and rule below mirrors bin/orc, hooks/orc-hook.py and cmux/sidebars/orc-status.js.

const NEVER = 1e9, PAST = -1e9;
const PURPLE = "#9b6dff";

// ---------- port of cmux/sidebars/orc-status.js (data logic kept verbatim) ----------
const STATUS = {
  needs_input: { color: "#FF9F0A", label: "your turn", rank: 0 },
  working: { color: "#0A84FF", label: "working", rank: 1 },
  idle: { color: "#34C759", label: "idle", rank: 2 },
  ended: { color: "#7f7f7f66", label: "ended", rank: 3 },
};
const NONE = { color: "#7f7f7f44", label: "no session", rank: 4 };
const statusOf = (a) => (a ? STATUS[a.status] ?? NONE : NONE);
const isOrc = (w) => /-Orc$/.test(w.title ?? "");
const isManager = (w) => /^sessions[ -]manager$/i.test(w.title ?? "");
function fmtAgo(secs) {
  const s = Math.max(0, Math.floor(secs));
  if (s < 60) return s + "s";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  return h < 24 ? h + "h " + String(m % 60).padStart(2, "0") + "m" : Math.floor(h / 24) + "d";
}
function timeText(a, epoch) {
  if (!a) return "";
  const since = (a.status === "working" || a.status === "needs_input") ? a.sinceEpoch : a.lastActivityAt;
  return since ? fmtAgo(epoch - since) : "";
}
const BLOCKED = { color: "#FF453A", label: "needs you" };
function splitTitle(title) {
  const raw = String(title ?? "");
  const t = raw.replace(/^[^\w~./]+\s*/, "");
  const i = t.indexOf(" · ");
  const blocked = raw.trimStart().startsWith("⚠");
  return i < 0 ? { name: t, stage: "", blocked } : { name: t.slice(0, i), stage: t.slice(i + 3), blocked };
}
const blockedWs = (w) => (w.tabs ?? []).some((t) => splitTitle(t.title).blocked);
const agentFor = (w, tab) => (w.agents ?? []).find((a) => a.surfaceId && a.surfaceId === tab.surfaceId);
function entries(all) {
  const sel = all.find((w) => w.selected);
  const out = [];
  if (sel && isOrc(sel)) {
    const tabs = sel.tabs ?? [];
    const head = splitTitle(tabs[0]?.title);
    out.push({ key: "t:" + sel.id, kind: "title", text: sel.title, sub: head.stage, color: sel.color });
    for (const tab of tabs.slice(1)) {
      const a = agentFor(sel, tab);
      const t = splitTitle(tab.title);
      out.push({ key: "c:" + tab.id, kind: "row", wsId: sel.id, surfaceId: tab.surfaceId,
        name: t.name || a?.name || "tab", stage: t.stage, agent: a, focused: tab.focused, child: true, blocked: t.blocked });
    }
    if (tabs.length <= 1) out.push({ key: "e:" + sel.id, kind: "note", text: "No children yet. The Orc starts one with `orc spawn`." });
    return out;
  }
  out.push({ key: "t:overview", kind: "title", text: "Sessions", sub: "", color: null });
  const orcs = all.filter(isOrc);
  if (orcs.length) out.push({ key: "s:orcs", kind: "section", text: "ORCS" });
  for (const w of orcs) {
    const c = { working: 0, needs_input: 0, idle: 0 };
    for (const a of w.agents ?? []) if (c[a.status] !== undefined) c[a.status] += 1;
    const blocked = (w.tabs ?? []).filter((t) => splitTitle(t.title).blocked).length;
    const bits = [];
    if (blocked) bits.push("⚠ " + blocked + " need you");
    if (c.working) bits.push(c.working + " working");
    if (c.needs_input) bits.push(c.needs_input + " waiting");
    if (c.idle) bits.push(c.idle + " idle");
    out.push({ key: "o:" + w.id, kind: "orc", wsId: w.id, name: w.title, color: w.color,
      counts: bits.join(" · ") || "no sessions", jobs: w.description ?? "" });
  }
  const solo = all.filter((w) => !isOrc(w) && !isManager(w) && (w.agents ?? []).length)
    .sort((x, y) => statusOf(x.agents[0]).rank - statusOf(y.agents[0]).rank)
    .sort((x, y) => Number(blockedWs(y)) - Number(blockedWs(x)));
  if (solo.length) out.push({ key: "s:solo", kind: "section", text: "SESSIONS" });
  for (const w of solo) {
    const a = w.agents[0];
    const tab = (w.tabs ?? []).find((x) => x.surfaceId === a.surfaceId) ?? (w.tabs ?? [])[0];
    out.push({ key: "i:" + w.id, kind: "row", wsId: w.id, surfaceId: a.surfaceId,
      name: splitTitle(w.title).name, stage: splitTitle(tab?.title).stage, agent: a, focused: false,
      blocked: splitTitle(tab?.title).blocked });
  }
  return out;
}

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const fade = (t, t0, t1, d = 0.35) => clamp(Math.min((t - t0) / d, (t1 - t) / d), 0, 1);
const SPIN = ["✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳"];
const spin = (t) => SPIN[Math.floor(t * 8) % SPIN.length];
const CPS = 28;
const typeDur = (s) => s.length / CPS;
// last entry of [{t,...}] at or before t
const lastAt = (list, t, dflt) => (list || []).filter((e) => e.t <= t).reduce((p, e) => e, dflt);

// ---------- world: cmux state at time t ----------
const ROLES = [["QA", "sf-qa", "Run the checkout smoke cases"], ["Docs", "sf-docs", "Update the README for the release"],
  ["API", "sf-api", "Add the order-status endpoint"]];

function statusAt(timeline, t) {
  // timeline: [{t, status}] sorted; returns {status, since}
  let cur = null;
  for (const e of timeline) if (e.t <= t) cur = e;
  return cur;
}

function world(t, E) {
  const ep = (x) => 100000 + x;              // seconds → fake epoch
  const inited = t >= E.initOut;
  const spawned = ROLES.map((r, i) => t >= E.spawn[i]);
  const st = (sf) => (E.stages || []).filter((s) => s.sf === sf && s.t <= t).pop();
  const wsSel = lastAt(E.selWs, t, { ws: "ws-shop" }).ws;
  const tabSel = lastAt(E.selTab, t, { sf: "sf-orc" }).sf;

  // agent status timelines
  const orcTL = [{ t: PAST, status: "needs_input" }];
  for (const [a, b] of E.orcWork || []) { orcTL.push({ t: a, status: "working" }, { t: b, status: "needs_input" }); }
  orcTL.sort((x, y) => x.t - y.t);
  const tl = {
    "sf-orc": orcTL,
    "sf-qa": [{ t: E.spawn[0], status: "working" }, { t: E.qaIdle ?? NEVER, status: "idle" }],
    "sf-docs": [{ t: E.spawn[1], status: "working" }, { t: E.docsWarn ?? NEVER, status: "needs_input" }],
    "sf-api": [{ t: E.spawn[2], status: "working" }, { t: E.apiWarn ?? NEVER, status: "needs_input" }, { t: E.apiAnswer ?? NEVER, status: "working" }],
  };
  const agent = (sf) => {
    const s = statusAt(tl[sf].filter((e) => e.t > -1e8 || true).sort((x, y) => x.t - y.t), t);
    if (!s) return null;
    const since = s.t < -1e8 ? ep(t - 75) : ep(s.t);
    return { surfaceId: sf, status: s.status, sinceEpoch: since, lastActivityAt: since };
  };

  // tab titles
  const warn = (sf) => (sf === "sf-api" && t >= (E.apiWarn ?? NEVER) && t < (E.apiAnswer ?? NEVER))
    || (sf === "sf-docs" && t >= (E.docsWarn ?? NEVER));
  const orcStage = E.orcStage && t >= E.orcStage.t ? E.orcStage.text : null;
  const orcTitle = !inited ? "✳ shop" : orcStage ? `Shop-Orc · ${orcStage}` : `${agent("sf-orc").status === "working" ? spin(t) : "✳"} Shop-Orc`;
  const tabs = [{ id: "tab-sf-orc", surfaceId: "sf-orc", title: orcTitle }];
  ROLES.forEach(([role, sf], i) => {
    if (!spawned[i]) return;
    const s = st(sf);
    let title = s ? `${role} · ${s.text}` : `${spin(t + i)} Shop-${role}`;
    if (warn(sf)) title = "⚠ " + (s ? `${role} · ${s.text}` : `Shop-${role}`);
    tabs.push({ id: "tab-" + sf, surfaceId: sf, title, born: E.spawn[i] });
  });
  tabs.forEach((x) => (x.focused = x.surfaceId === tabSel));

  const shop = {
    id: "ws-shop", title: inited ? "Shop-Orc" : "shop", color: inited ? PURPLE : null, pinned: inited,
    sub: "~/shop · main", selected: wsSel === "ws-shop", tabs,
    agents: tabs.map((x) => agent(x.surfaceId)).filter(Boolean), flashAt: E.initOut,
  };
  const blog = { id: "ws-blog", title: "Blog", sub: "~/blog · drafts", selected: wsSel === "ws-blog",
    tabs: [{ id: "tab-sf-blog", surfaceId: "sf-blog", title: `${spin(t + 3)} Blog`, focused: true }],
    agents: [{ surfaceId: "sf-blog", status: "working", sinceEpoch: ep(-200), lastActivityAt: ep(-200) }] };
  const dot = { id: "ws-dot", title: "Dotfiles", sub: "~/dotfiles · main", selected: wsSel === "ws-dot",
    tabs: [{ id: "tab-sf-dot", surfaceId: "sf-dot", title: "✳ Dotfiles", focused: true }],
    agents: [{ surfaceId: "sf-dot", status: "needs_input", sinceEpoch: ep(-540), lastActivityAt: ep(-540) }] };
  const all = inited ? [shop, blog, dot] : [blog, shop, dot];
  return { all, epoch: ep(t), wsSel, tabSel, warn };
}

// ---------- terminal transcripts ----------
const L = {
  user: (t, text) => ({ t, kind: "user", text }),
  tool: (t, name, arg) => ({ t, html: `<span class="dot">⏺</span> <span class="tool"><b>${name}</b>(${esc(arg)})</span>` }),
  out: (t, text) => ({ t, html: `<span class="dim">  ⎿  </span><span class="mut">${esc(text)}</span>` }),
  msg: (t, text) => ({ t, html: `<span>⏺</span> ${esc(text)}` }),
  raw: (t, html) => ({ t, html }),
};
const head = (cwd) => L.raw(PAST, `<span class="dim">✻ Claude Code   ${cwd}</span>`);
const briefLine = (role, brief) => L.raw(PAST, `<div class="user">&gt; You are Shop-${role}, a child session of Shop-Orc. Talk only to Shop-Orc (SendMessage to "Shop-Orc"); never ask other sessions for work directly. Report your stage at milestones with \`orc stage "&lt;short text&gt;"\`. ${esc(brief)}</div>`);

function transcript(sf, E) {
  const out = [];
  const orcStageLines = (role, sf2) => (E.stages || []).filter((s) => s.sf === sf2).forEach((s) => {
    out.push(L.tool(s.t - 0.5, "Bash", `orc stage "${s.text}"`), L.out(s.t, `${role} · ${s.text}`));
  });
  if (sf === "sf-orc") {
    out.push(head("~/shop"));
    out.push(L.user(E.initPrompt, "Make this workspace an Orc called Shop-Orc"));
    out.push(L.tool(E.initTool, "Bash", "orc init Shop-Orc"), L.out(E.initOut, "Shop-Orc: Purple, pinned"));
    out.push(L.msg(E.initMsg, "Shop-Orc is set up. Which children should I start?"));
    out.push(L.user(E.spawnPrompt, "Start QA, Docs and API for the checkout release"));
    out.push(L.msg(E.ask, "Start 3 children: Shop-QA, Shop-Docs and Shop-API? Each one is a full Claude session."));
    out.push(L.user(E.yes, "yes"));
    ROLES.forEach(([role, , brief], i) => {
      out.push(L.tool(E.spawn[i] - 0.6, "Bash", `orc spawn ${role} --cwd ~/shop --brief "${brief}"`));
      out.push(L.out(E.spawn[i], `Shop-${role}: tab opened in Shop-Orc (/Users/demo/shop)`));
    });
    out.push(L.msg(E.spawnMsg, "All three are running. Their stages show in the sidebar."));
    if (E.orcStage) out.push(L.tool(E.orcStage.t - 0.5, "Bash", `orc stage "${E.orcStage.text}"`), L.out(E.orcStage.t, `Shop-Orc · ${E.orcStage.text}`));
    out.push(L.user(E.jobPrompt, "Give QA the 12 smoke cases as a job"));
    out.push(L.tool(E.jobNew - 0.6, "Bash", `orc job new --to Shop-QA --title "Smoke cases" --task "Run the 12 checkout cases"`));
    out.push(L.out(E.jobNew, "J-001 ~/.agentic/sessions/orcs/Shop-Orc/inbox/Shop-QA--J-001-smoke-cases.md"));
    out.push(L.tool(E.jobMsg, "SendMessage", "Shop-QA"), L.out(E.jobMsg + 0.4, "J-001 is in your inbox"));
  } else if (sf === "sf-qa") {
    out.push(head("~/shop"), briefLine("QA", ROLES[0][2]));
    orcStageLines("QA", "sf-qa");
    out.push(L.raw(E.qaHook, `<div class="hook">[orc inbox] You are Shop-QA. Jobs for you:\n- ~/.agentic/sessions/orcs/Shop-Orc/inbox/Shop-QA--J-001-smoke-cases.md (status: open)</div>`));
    out.push(L.tool(E.jobTaken - 0.4, "Bash", "orc job set J-001 taken"), L.out(E.jobTaken, "J-001: taken  (…/Shop-QA--J-001-smoke-cases.md)"));
    out.push(L.tool(E.jobOutput - 0.4, "Update", "…/Shop-QA--J-001-smoke-cases.md"), L.out(E.jobOutput, "## Output: 12/12 pass"));
    out.push(L.tool(E.jobDone - 0.4, "Bash", `orc job set J-001 done "12/12 pass"`), L.out(E.jobDone, "J-001: done  (…/Shop-QA--J-001-smoke-cases.md)"));
  } else if (sf === "sf-api") {
    out.push(head("~/shop"), briefLine("API", ROLES[2][2]));
    out.push(L.tool(E.spawn[2] + 1.0, "Write", "src/routes/order-status.ts"), L.out(E.spawn[2] + 1.5, "Wrote 48 lines"));
    orcStageLines("API", "sf-api");
    out.push(L.tool(E.apiWarn - 0.3, "Bash", "npm run db:migrate"));
    out.push({ t: E.apiWarn, until: E.apiAnswer, html: `<div class="box"><b>Bash command</b>\n\n  npm run db:migrate\n  <span class="dim">Run the pending database migrations</span>\n\nDo you want to proceed?\n<span class="sel1">❯ 1. Yes</span>\n  2. Yes, and don't ask again for <b>npm run db:migrate</b> commands in /Users/demo/shop\n  3. No, and tell Claude what to do differently <span class="dim">(esc)</span></div>` });
    out.push(L.out(E.apiAnswer + 0.3, "3 migrations applied"));
  } else if (sf === "sf-docs") {
    out.push(head("~/shop"), briefLine("Docs", ROLES[1][2]));
    orcStageLines("Docs", "sf-docs");
  } else if (sf === "sf-blog") {
    out.push(head("~/blog"), L.raw(PAST, `<div class="user">&gt; Draft an outline for the next post</div>`),
      L.tool(PAST, "Read", "posts/ideas.md"), L.out(PAST, "Read 64 lines"), L.msg(PAST, "Drafting the outline: three sections, one example each…"));
  }
  return out.filter((x) => x.t > -1e8 - 1 || x.t === PAST).sort((a, b) => a.t - b.t);
}

function termHTML(sf, E, t) {
  const lines = transcript(sf, E);
  let html = "", typing = null;
  for (const ln of lines) {
    if (ln.kind === "user") {
      const dur = typeDur(ln.text), submit = ln.t + dur + 0.25;
      if (t >= submit) html += `<div class="user">&gt; ${esc(ln.text)}</div>`;
      else if (t >= ln.t) typing = ln.text.slice(0, Math.floor((t - ln.t) * CPS));
      continue;
    }
    if (t < ln.t || (ln.until !== undefined && t >= ln.until)) continue;
    html += ln.html.startsWith("<div") ? ln.html : `<div class="l">${ln.html}</div>`;
  }
  const caretOn = Math.floor(t * 2) % 2 === 0 || typing !== null;
  html += `<div class="promptbar">&gt; ${esc(typing ?? "")}<span class="caret" style="opacity:${caretOn ? 1 : 0}">_</span></div>`;
  return html;
}

// ---------- drawing ----------
function sidebarHTML(all, epoch, t, E) {
  return entries(all).map((e) => {
    if (e.kind === "title") return `<div class="sb-title" id="sb-title"><div class="h"><span class="circ" style="width:calc(8px*var(--sb));height:calc(8px*var(--sb));background:${e.color ?? "transparent"}"></span>${esc(e.text)}</div><div class="s">${esc(e.sub)}</div></div>`;
    if (e.kind === "section") return `<div class="sb-sec">${esc(e.text)}</div>`;
    if (e.kind === "note") return `<div class="sb-note">${esc(e.text)}</div>`;
    if (e.kind === "orc") return `<div class="sb-row sb-orc" id="row-${e.wsId}"><div class="h"><span class="circ" style="width:calc(8px*var(--sb));height:calc(8px*var(--sb));background:${e.color ?? "#7f7f7f"}"></span><span class="n" style="font-weight:600">${esc(e.name)}</span></div><div class="c">${esc(e.counts)}</div>${e.jobs ? `<div class="c dim">${esc(e.jobs)}</div>` : ""}</div>`;
    const a = e.agent;
    const dotc = e.blocked ? BLOCKED.color : statusOf(a).color;
    const line = e.blocked ? "⚠ needs you" + (e.stage ? " · " + e.stage : "")
      : e.stage || (e.child && a?.status === "needs_input" ? "waiting" : statusOf(a).label);
    const lc = e.blocked ? BLOCKED.color : a?.status === "needs_input" ? "#FF9F0A" : e.stage ? "var(--orc-text-muted)" : "var(--orc-text-faint)";
    return `<div class="sb-row ${e.focused ? "foc" : ""}" id="row-${e.surfaceId}"><div class="h"><span class="circ ${e.blocked ? "pulse" : ""}" style="width:calc(7px*var(--sb));height:calc(7px*var(--sb));background:${dotc}"></span><span class="n">${esc(e.name)}</span><span class="tm">${timeText(a, epoch)}</span></div><div class="ln" style="color:${lc}">${esc(line)}</div></div>`;
  }).join("");
}

function leftHTML(all, t) {
  const pinned = all.filter((w) => w.pinned), rest = all.filter((w) => !w.pinned);
  const tile = (w) => {
    const fl = w.flashAt !== undefined && t >= w.flashAt && t < w.flashAt + 1.2;
    return `<div class="ws ${w.selected ? "sel" : ""}" id="ws-${w.id}" style="${w.color ? `background:${w.color}${w.selected ? "40" : "22"};` : ""}${fl ? `box-shadow:0 0 0 ${2 + 3 * Math.sin((t - w.flashAt) / 1.2 * Math.PI)}px ${w.color};` : ""}">
      <div class="bar" style="background:${w.color ?? "transparent"}"></div>
      <div class="tt">${esc(w.title)}${w.pinned ? `<span class="pin">📌</span>` : ""}</div>
      <div class="sub">${esc(w.sub)}</div></div>`;
  };
  return (pinned.length ? `<div class="lsec">PINNED</div>` + pinned.map(tile).join("") : "")
    + `<div class="lsec">WORKSPACES</div>` + rest.map(tile).join("");
}

function tabsHTML(ws, t) {
  return ws.tabs.map((x) => {
    const born = x.born ?? PAST;
    const k = clamp((t - born) / 0.35, 0, 1);
    const blocked = splitTitle(x.title).blocked;
    return `<div class="tab ${x.focused ? "act" : ""} ${blocked ? "warn" : ""}" id="${x.id}" style="--tc:${ws.color ?? "#2ec4b6"};opacity:${k};transform:translateY(${(1 - k) * 18}px)">${esc(x.title)}</div>`;
  }).join("");
}

function windowHTML(W, t, cfg) {
  const ws = W.all.find((w) => w.selected);
  const sf = ws.tabs.find((x) => x.focused)?.surfaceId ?? ws.tabs[0].surfaceId;
  const lay = cfg.layout;
  return `<div class="titlebar"><span class="light" style="background:#ff5f57"></span><span class="light" style="background:#febc2e"></span><span class="light" style="background:#28c840"></span><span class="wt">cmux</span></div>
  <div class="body">
    ${lay.leftW ? `<div class="left" style="width:${lay.leftW}px">${leftHTML(W.all, t)}</div>` : ""}
    <div class="center"><div class="tabs" id="tabs">${tabsHTML(ws, t)}</div><div class="term" id="term">${termHTML(sf, cfg.E, t)}</div></div>
    ${lay.sideW ? `<div class="side" id="side" style="width:${lay.sideW}px">${sidebarHTML(W.all, W.epoch, t, cfg.E)}</div>` : ""}
  </div>`;
}

// problem shot: eight identical sessions
function problemHTML(t, cfg) {
  const subs = ["~/shop", "~/shop", "~/blog", "~/shop", "~/api", "~/shop", "~/notes", "~/api"];
  const tiles = subs.map((s, i) => `<div class="ws ${i === Math.floor(t * 0.9) % 8 ? "sel" : ""}" id="pw-${i}"><div class="tt">${i === 5 ? "✳" : spin(t + i * 0.37)} Claude Code</div><div class="sub">${s}</div></div>`).join("");
  const term = Array.from({ length: 40 }, (_, i) => {
    const n = Math.floor(t * 6) + i;
    return `<div class="l dim">${["⏺ Bash(npm test)", "  ⎿  running…", "⏺ Read(src/app.ts)", "⏺ Update(README.md)", "  ⎿  Updated 4 lines", "⏺ Thinking…"][n % 6]}</div>`;
  }).join("");
  return `<div class="titlebar"><span class="light" style="background:#ff5f57"></span><span class="light" style="background:#febc2e"></span><span class="light" style="background:#28c840"></span><span class="wt">cmux</span></div>
  <div class="body"><div class="left" style="width:${cfg.layout.leftW || 260}px"><div class="lsec">WORKSPACES</div>${tiles}</div>
  <div class="center"><div class="tabs"><div class="tab act">${spin(t)} Claude Code</div></div><div class="term">${term}</div></div></div>`;
}

const LOGO = `<svg viewBox="0 0 32 32" width="100%" height="100%"><g fill="currentColor"><circle cx="9" cy="16" r="5.5"/><rect x="18" y="6" width="10" height="4" rx="2"/><rect x="18" y="14" width="10" height="4" rx="2"/><rect x="18" y="22" width="10" height="4" rx="2"/></g></svg>`;

function titleCard(t, t0, t1) {
  const k = fade(t, t0, t1, 0.5), rise = (1 - ease(clamp((t - t0) / 0.9, 0, 1))) * 30;
  return `<div class="full" style="opacity:${k}">
    <div style="display:flex;align-items:center;gap:36px;transform:translateY(${rise}px)">
      <div style="width:150px;height:150px;color:var(--orc-accent)">${LOGO}</div>
      <div style="font-size:150px;font-weight:700;letter-spacing:-0.035em">cmux-orc</div></div>
    <div style="margin-top:34px;font-size:52px;color:var(--orc-text-muted);opacity:${clamp((t - t0 - 0.6) / 0.6, 0, 1)}">Run many Claude Code sessions in cmux<br>without losing track of them.</div></div>`;
}

function endCard(t, t0, t1) {
  const k = fade(t, t0, t1, 0.5);
  const line = (s, d) => `<div style="opacity:${clamp((t - t0 - d) / 0.4, 0, 1)}">${s}</div>`;
  return `<div class="full" style="opacity:${k}">
    <div style="display:flex;align-items:center;gap:22px"><div style="width:84px;height:84px;color:var(--orc-accent)">${LOGO}</div>
      <div style="font-size:84px;font-weight:700;letter-spacing:-0.03em">cmux-orc</div></div>
    <div style="margin-top:40px;font-size:30px;color:var(--orc-text-muted)">Install it in Claude Code:</div>
    <div class="mono" style="margin-top:18px;font-size:38px;line-height:1.6;background:#ffffff0d;border:1px solid #ffffff1a;border-radius:16px;padding:22px 40px">
      ${line("/plugin marketplace add yashMangal19/cmux-orc", 0.3)}${line("/plugin install cmux-orc@cmux-orc", 0.6)}${line("/cmux-orc:sessions-setup", 0.9)}</div>
    <div style="margin-top:44px;font-size:46px;font-weight:600;color:var(--orc-accent-strong)">github.com/yashMangal19/cmux-orc</div>
    <div style="margin-top:16px;font-size:30px;color:var(--orc-text-faint)">MIT · macOS · cmux 0.64+</div></div>`;
}

const CURSOR = `<svg viewBox="0 0 26 26" width="26" height="26"><path d="M4 2 L4 21 L9 16.5 L12.5 24 L15.6 22.6 L12.2 15.3 L19 15.3 Z" fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/></svg>`;

// ---------- camera + measuring ----------
function localRect(el, win) {
  const r = el.getBoundingClientRect(), w = win.getBoundingClientRect();
  return { x: r.left - w.left, y: r.top - w.top, w: r.width, h: r.height };
}
function resolvePoint(k, win, cfg) {
  if (k.home) return { x: cfg.view.cx - cfg.win.x, y: cfg.view.cy - cfg.win.y };
  if (k.point) return k.point;
  const el = win.querySelector("#" + k.target);
  if (!el) return null;
  const r = localRect(el, win);
  return { x: r.x + r.w / 2 + (k.dx || 0), y: r.y + r.h / 2 + (k.dy || 0) };
}
function track(keys, t, win, cfg, valueOf) {
  // interpolate between keyframes with eased motion
  if (!keys || !keys.length) return null;
  let i = keys.findIndex((k) => k.t > t);
  if (i === -1) return valueOf(keys[keys.length - 1]);
  if (i === 0) return valueOf(keys[0]);
  const a = keys[i - 1], b = keys[i], u = ease((t - a.t) / (b.t - a.t));
  const va = valueOf(a), vb = valueOf(b);
  if (!va) return vb;
  if (!vb) return va;
  const out = {};
  for (const k in va) out[k] = va[k] + (vb[k] - va[k]) * u;
  return out;
}

// ---------- main ----------
const params = new URLSearchParams(location.search);
const CFG = window.CONFIGS[params.get("cfg") || "master"];

window.setup = () => {
  const st = document.getElementById("stage");
  st.style.width = CFG.view.w + "px";
  st.style.height = CFG.view.h + "px";
  document.documentElement.style.setProperty("--sb", CFG.layout.sb || 1.25);
  return { w: CFG.view.w, h: CFG.view.h, fps: CFG.fps || 30, dur: CFG.dur };
};

window.render = (t) => {
  const st = document.getElementById("stage");
  const segs = CFG.segments || [{ kind: "app", t0: 0, t1: CFG.dur, nofade: true }];
  let html = "";
  for (const s of segs) {
    if (t < s.t0 - 0.01 || t > s.t1 + 0.01) continue;
    const k = s.nofade ? 1 : fade(t, s.t0, s.t1, 0.4);
    if (s.kind === "title") html += titleCard(t, s.t0, s.t1);
    else if (s.kind === "end") html += endCard(t, s.t0, s.t1);
    else html += `<div class="seg" data-kind="${s.kind}" style="position:absolute;inset:0;opacity:${k}"><div id="win-${s.kind}" class="winx" style="position:absolute;left:0;top:0;width:${CFG.win.w}px;height:${CFG.win.h}px;transform-origin:0 0;border-radius:14px;overflow:hidden;background:#11161d;box-shadow:0 30px 80px #000000a0, 0 0 0 1px #ffffff14;display:flex;flex-direction:column">${s.kind === "problem" ? problemHTML(t, CFG) : windowHTML(world(t, CFG.E), t, CFG)}</div></div>`;
  }
  // loop fade (hero)
  const gk = CFG.loopFade ? Math.min(clamp(t / CFG.loopFade, 0, 1), clamp((CFG.dur - t) / CFG.loopFade, 0, 1)) : 1;
  st.innerHTML = `<div style="position:absolute;inset:0;opacity:${gk}">${html}</div><div id="cap"></div>`;

  for (const win of st.querySelectorAll(".winx")) {
    const kind = win.id.slice(4);
    const camKeys = kind === "problem" ? [{ t: 0, home: true }] : CFG.cam;
    const cam = track(camKeys, t, win, CFG, (k) => {
      const p = resolvePoint(k, win, CFG);
      return p && { x: p.x, y: p.y, s: k.home ? 1 : k.s };
    }) || { x: CFG.view.cx - CFG.win.x, y: CFG.view.cy - CFG.win.y, s: 1 };
    // cursor (local coords, measured before the camera transform)
    if (kind === "app" && CFG.cursor) {
      const vis = (CFG.cursorShow || []).some(([a, b]) => t >= a && t < b);
      if (vis) {
        const p = track(CFG.cursor, t, win, CFG, (k) => resolvePoint(k, win, CFG));
        if (p) {
          win.insertAdjacentHTML("beforeend", `<div id="cursor" style="left:${p.x}px;top:${p.y}px">${CURSOR}</div>`);
          for (const c of CFG.clicks || []) {
            const u = (t - c) / 0.4;
            if (u >= 0 && u < 1) win.insertAdjacentHTML("beforeend", `<div class="ring" style="left:${p.x - 4 - 18 * u}px;top:${p.y - 4 - 18 * u}px;width:${8 + 36 * u}px;height:${8 + 36 * u}px;opacity:${1 - u}"></div>`);
          }
        }
      }
    }
    // chips: code callouts anchored to an element
    if (kind === "app") for (const c of CFG.chips || []) {
      if (t < c.t0 || t > c.t1) continue;
      const el = win.querySelector("#" + c.anchor);
      if (!el) continue;
      const r = localRect(el, win), k = fade(t, c.t0, c.t1, 0.25);
      win.insertAdjacentHTML("beforeend", `<div class="chip" style="left:${r.x + (c.dx || 0)}px;top:${r.y + r.h + 10 + (c.dy || 0)}px;opacity:${k};transform:translateY(${(1 - k) * 8}px)">$ ${esc(c.text)}</div>`);
    }
    win.style.transform = `translate(${CFG.view.cx - cam.s * cam.x}px, ${CFG.view.cy - cam.s * cam.y}px) scale(${cam.s})`;
  }

  // job card (stage coords)
  const E = CFG.E;
  if (CFG.card && t >= CFG.card.t0 && t <= CFG.card.t1) {
    const k = fade(t, CFG.card.t0, CFG.card.t1, 0.3);
    const status = t >= E.jobDone ? "done" : t >= E.jobTaken ? "taken" : "open";
    const chg = (x) => t >= x && t < x + 1.2 ? "hl" : "";
    const statusAtT = t >= E.jobDone ? E.jobDone : E.jobTaken;
    const log = (t >= E.jobTaken ? `\n- 2026-10-19 10:44 Shop-QA: taken` : "") + (t >= E.jobDone ? `\n- 2026-10-19 10:51 Shop-QA: done — 12/12 pass` : "");
    const card = `<div class="fn">~/.agentic/sessions/orcs/Shop-Orc/inbox/Shop-QA--J-001-smoke-cases.md</div>id: J-001
<span class="${chg(statusAtT)}">status: ${status}</span>
from: Shop-Orc
to: Shop-QA
assigned-by: Shop-Orc
created: 2026-10-19 10:42

# Smoke cases

## Task
Run the 12 checkout cases

## Inputs

## Output
<span class="${chg(E.jobOutput)}">${t >= E.jobOutput ? "12/12 pass" : ""}</span>
## Log<span class="${chg(Math.max(E.jobTaken, t >= E.jobDone ? E.jobDone : -1))}">${log}</span>`;
    st.insertAdjacentHTML("beforeend", `<div class="card" style="left:${CFG.card.x}px;top:${CFG.card.y}px;transform:scale(${CFG.card.s}) translateY(${(1 - k) * 20}px);transform-origin:0 0;opacity:${k}">${card}</div>`);
  }

  // caption
  const cap = (CFG.captions || []).find((c) => t >= c.t0 && t <= c.t1);
  if (cap) {
    const k = fade(t, cap.t0, cap.t1, 0.3);
    const C = CFG.cap;
    document.getElementById("cap").outerHTML = `<div id="cap" style="bottom:${C.bottom}px;opacity:${k}"><span style="font-size:${C.size}px;padding:${C.size * 0.28}px ${C.size * 0.55}px;max-width:${C.maxW}px">${cap.html}</span></div>`;
  }
};
