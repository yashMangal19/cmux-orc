// A browser simulation of one cmux window running cmux-orc. Nothing here talks to Claude.
// Rendering follows cmux/sidebars/orc-status.js; tab titles and command output follow bin/orc.
(() => {
  const $ = (id) => document.getElementById(id);
  const root = $("cmux");
  if (!root) return;

  const HOME = "/Users/you";
  const ORC = "Shop-Orc", PROJECT = "Shop", TEAL = "#2ec4b6", AMBER = "#f5b301";
  const INBOX = `${HOME}/.agentic/sessions/orcs/${ORC}/inbox`;

  // Same values and labels as orc-status.js.
  const STATUS = {
    needs_input: { color: "#FF9F0A", label: "your turn" },
    working: { color: "#0A84FF", label: "working" },
    idle: { color: "#34C759", label: "idle" },
  };
  const BLOCKED = "#FF453A";

  function fmtAgo(secs) {
    const s = Math.max(0, Math.floor(secs));
    if (s < 60) return s + "s";
    const m = Math.floor(s / 60);
    if (m < 60) return m + "m";
    const h = Math.floor(m / 60);
    return h < 24 ? h + "h " + String(m % 60).padStart(2, "0") + "m" : Math.floor(h / 24) + "d";
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const now = () => Date.now() / 1000;
  const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

  const SPAWNS = [
    { role: "API", brief: "Add the /refunds endpoint", stages: ["reading code", "writing tests", "tests 3/9", "tests 9/9 pass", "done"] },
    { role: "Perf", brief: "Profile checkout page load", stages: ["baseline run", "trace 1/3", "trace 3/3", "report written", "done"] },
  ];
  const JOBS = [
    { title: "Refund cases", task: "Run the 4 refund cases", n: 4 },
    { title: "Coupon cases", task: "Run the 3 coupon cases", n: 3 },
    { title: "Gift card cases", task: "Run the 2 gift card cases", n: 2 },
  ];

  let S, timer = null, started = false, paused = false;

  function child(role, extra) {
    return { role, name: `${PROJECT}-${role}`, stage: "", status: "working", since: now(), blocked: false,
      log: [], queue: [], fresh: false, ...extra };
  }

  function reset() {
    const t = now();
    S = {
      ws: "orc", focus: ORC, spawned: 0, jobs: [], nextJob: 1,
      orc: { stage: "checkout release", status: "idle", since: t - 95, log: [] },
      kids: [
        child("QA", { stage: "case 3/12", since: t - 252 }),
        child("Docs", { stage: "outline", since: t - 41 }),
      ],
    };
    const o = S.orc.log;
    cmd(o, "orc init Shop-Orc --colour Teal"); out(o, "Shop-Orc: Teal, pinned");
    cmd(o, 'orc spawn QA --cwd ~/shop --brief "Run the checkout smoke cases"'); out(o, `Shop-QA: tab opened in Shop-Orc (${HOME}/shop)`);
    cmd(o, 'orc spawn Docs --cwd ~/shop --brief "Update the README for the new checkout"'); out(o, `Shop-Docs: tab opened in Shop-Orc (${HOME}/shop)`);
    cmd(o, 'orc stage "checkout release"'); out(o, "Shop-Orc · checkout release");

    const [qa, docs] = S.kids;
    dim(qa.log, "Shop-QA running the checkout smoke cases…");
    cmd(qa.log, 'orc stage "case 3/12"'); out(qa.log, "QA · case 3/12");
    for (let i = 4; i <= 12; i++) qa.queue.push(stageStep(`case ${i}/12`));
    qa.queue.push(stageStep("12/12 pass"), msgStep("Smoke cases: 12/12 pass"));

    dim(docs.log, "Shop-Docs updating the README…");
    cmd(docs.log, 'orc stage "outline"'); out(docs.log, "Docs · outline");
    docs.queue.push(stageStep("drafting"), wait, askStep(), stageStep("install section"), stageStep("FAQ"), stageStep("done"),
      msgStep("README updated"));
    paused = false;
    $("d-pause").setAttribute("aria-pressed", "false");
    $("d-pause").textContent = "Pause";
    render();
  }

  // ---- terminal lines
  const cmd = (log, t) => log.push(`<div class="cmd">${esc(t)}</div>`);
  const out = (log, t) => log.push(`<div>${esc(t)}</div>`);
  const dim = (log, t) => log.push(`<div class="dim">${esc(t)}</div>`);
  const ok = (log, t) => log.push(`<div class="ok">${esc(t)}</div>`);

  // ---- steps a child runs, one per tick
  const wait = () => {};
  function stageStep(text) {
    return (c) => {
      if (c.status !== "working") setStatus(c, "working");
      c.stage = text;
      c.fresh = false;
      cmd(c.log, `orc stage "${text}"`); out(c.log, `${c.role} · ${text}`);
    };
  }
  function msgStep(text) {
    return (c) => {
      dim(c.log, `SendMessage → ${ORC}: ${text}`);
      out(S.orc.log, `← ${c.name}: ${text}`);
    };
  }
  function askStep() {
    return (c) => {
      c.blocked = true;
      c.since = now();
      c.ask = { q: "The README has two install sections. Which one stays?", opts: ["Plugin install", "Manual install"] };
      announce(`${c.name} needs you: it asked a question.`);
      flashRow = c.name;
    };
  }
  function setStatus(c, status) { c.status = status; c.since = now(); }

  function answer(c, choice) {
    if (!c?.blocked) return;
    dim(c.log, `AskUserQuestion: ${c.ask.q}`);
    ok(c.log, `You chose: ${choice}`);
    c.blocked = false;
    c.ask = null;
    c.since = now();
    announce(`Answered. ${c.name} is working again.`);
    render();
  }

  function tick() {
    for (const c of S.kids) {
      if (c.blocked) continue;
      const step = c.queue.shift();
      if (step) step(c);
      else if (c.status === "working") setStatus(c, "idle");
    }
    render();
  }

  // ---- user actions
  function spawn() {
    const sp = SPAWNS[S.spawned];
    if (!sp) return;
    S.spawned++;
    const o = S.orc.log;
    dim(o, `Orc: start ${PROJECT}-${sp.role}? Every child is a full Claude session. (You said yes.)`);
    cmd(o, `orc spawn ${sp.role} --cwd ~/shop --brief "${sp.brief}"`);
    out(o, `${PROJECT}-${sp.role}: tab opened in ${ORC} (${HOME}/shop)`);
    const c = child(sp.role, { fresh: true });
    dim(c.log, `claude -n ${c.name} "You are ${c.name}, a child session of ${ORC}. Talk only to ${ORC} …"`);
    c.queue.push(wait, ...sp.stages.map(stageStep), msgStep(sp.stages.at(-2)));
    S.kids.push(c);
    newTab = c.name;
    announce(`${c.name} tab opened.`);
    run();
    render();
  }

  function sendJob() {
    const spec = JOBS[(S.nextJob - 1) % JOBS.length];
    const id = `J-${String(S.nextJob++).padStart(3, "0")}`;
    const to = `${PROJECT}-QA`;
    const file = `${to}--${id}-${slug(spec.title)}.md`;
    const job = { id, file, status: "open", note: "" };
    S.jobs.push(job);
    const o = S.orc.log;
    cmd(o, `orc job new --to ${to} --title "${spec.title}" --task "${spec.task}"`);
    out(o, `${id} ${INBOX}/${file}`);
    out(o, `next: SendMessage to "${to}" saying ${id} is in its inbox (if it is running).`);
    dim(o, `SendMessage → ${to}: ${id} is in your inbox`);
    const qa = S.kids[0];
    const set = (status, note) => (c) => {
      if (c.status !== "working") setStatus(c, "working");
      job.status = status;
      job.note = note ?? "";
      cmd(c.log, `orc job set ${id} ${status}` + (note ? ` "${note}"` : ""));
      out(c.log, `${id}: ${status}  (${INBOX}/${file})`);
      if (status === "done") announce(`Job ${id} is done: ${note}.`);
    };
    qa.queue.push(
      (c) => {
        setStatus(c, "working");
        dim(c.log, `[orc inbox] You are ${to}. Jobs for you:\n- ${INBOX}/${file} (status: open)`);
      },
      set("taken"), msgStep(`${id} taken`),
      ...Array.from({ length: spec.n }, (_, i) => stageStep(`${slug(spec.title).split("-")[0]} case ${i + 1}/${spec.n}`)),
      set("done", `${spec.n}/${spec.n} pass`), msgStep(`${id} done, ${spec.n}/${spec.n} pass`),
    );
    announce(`Job ${id} written to the team inbox.`);
    run();
    render();
  }

  function orcList() {
    const o = S.orc.log;
    cmd(o, "orc list");
    out(o, `■ ${ORC}  (Teal)  — ${S.orc.stage}`);
    for (const c of S.kids) {
      const state = c.blocked ? "needs you" : c.status === "working" ? "working" : "idle";
      out(o, `   ● ${c.name}  ${state}  ${c.stage}`);
    }
    S.ws = "orc";
    S.focus = ORC;
    render();
  }

  // ---- view model, as orc-status.js builds it from cmux workspaces
  function splitTitle(title) {
    const raw = String(title ?? "");
    const t = raw.replace(/^[^\w~./]+\s*/, "");
    const i = t.indexOf(" · ");
    const blocked = raw.trimStart().startsWith("⚠");
    return i < 0 ? { name: t, stage: "", blocked } : { name: t.slice(0, i), stage: t.slice(i + 3), blocked };
  }
  // `orc stage` renames the tab to "<Role> · <stage>"; the hook prefixes "⚠ " while blocked.
  function tabTitle(c) {
    const base = c.fresh ? c.name : `${c.role} · ${c.stage}`;
    return c.blocked ? "⚠ " + base : base;
  }
  const orcTabTitle = () => `${ORC} · ${S.orc.stage}`;

  function workspaces() {
    return [
      { id: "orc", title: ORC, sub: "~/shop", color: TEAL, pinned: true },
      { id: "mgr", title: "Sessions-Manager", sub: "~", color: AMBER },
      { id: "notes", title: "notes", sub: "~/notes" },
    ];
  }

  let newTab = null, flashRow = null;

  // Re-rendering replaces nodes; put keyboard focus back on the same control.
  const KEYS = ["ws", "tab", "row", "orc", "answer"];
  function render() {
    const a = document.activeElement;
    const k = a && root.contains(a) ? KEYS.find((x) => a.dataset[x] !== undefined) : null;
    const keep = k ? [k, a.dataset[k]] : null;
    draw();
    if (keep) root.querySelector(`[data-${keep[0]}="${CSS.escape(keep[1])}"]`)?.focus({ preventScroll: true });
  }

  function draw() {
    const t = now();
    // left panel
    $("ws-list").innerHTML = workspaces().map((w, i) => `${i === 1 ? '<li class="ws-sep" aria-hidden="true"></li>' : ""}
      <li><button type="button" class="ws${w.color ? " coloured" : ""}${S.ws === w.id ? " sel" : ""}" data-ws="${w.id}"
        ${w.color ? `style="--ws-c:${w.color}"` : ""} aria-pressed="${S.ws === w.id}">
        <span class="ws-name">${esc(w.title)}</span>${w.pinned ? '<span class="pin" aria-label="pinned">📌</span>' : "<span></span>"}
        <small>${esc(w.sub)}</small></button></li>`).join("");

    // tabs + terminal
    let tabs, log;
    if (S.ws === "orc") {
      tabs = [{ id: ORC, title: orcTabTitle() }, ...S.kids.map((c) => ({ id: c.name, title: tabTitle(c), blocked: c.blocked }))];
      const c = S.kids.find((k) => k.name === S.focus);
      log = c ? c.log : S.orc.log;
      if (c?.ask) {
        log = [...log, `<div class="ask"><b>⚠ Question from ${esc(c.name)}</b><br>${esc(c.ask.q)}<br>` +
          c.ask.opts.map((o) => `<button type="button" data-answer="${esc(o)}">${esc(o)}</button>`).join("") + "</div>"];
      }
    } else if (S.ws === "mgr") {
      tabs = [{ id: "mgr", title: "Sessions-Manager" }];
      log = ['<div class="dim">Sessions-Manager routes jobs between Orcs and independent sessions.</div>', '<div class="cmd">orc job list</div>', "<div>(no open jobs in the top-level inbox)</div>"];
    } else {
      tabs = [{ id: "notes", title: "notes" }];
      log = ['<div class="dim">An independent Claude session. It shows in the Sessions overview, not inside an Orc.</div>'];
    }
    const focusId = S.ws === "orc" ? S.focus : tabs[0].id;
    const bar = $("tabs"), left = bar.scrollLeft;
    bar.innerHTML = tabs.map((tb) => `<button type="button" role="tab" class="tab${tb.blocked ? " blocked" : ""}${tb.id === newTab ? " new" : ""}"
      aria-selected="${tb.id === focusId}" data-tab="${esc(tb.id)}">${esc(tb.title)}</button>`).join("");
    newTab = null;
    // Keep the bar where it was; on narrow screens bring a ⚠ tab (or the focused one) into view.
    bar.scrollLeft = left;
    const show = bar.querySelector(".tab.blocked") ?? bar.querySelector('[aria-selected="true"]');
    if (show && (show.offsetLeft < bar.scrollLeft || show.offsetLeft + show.offsetWidth > bar.scrollLeft + bar.clientWidth)) {
      bar.scrollLeft = show.offsetLeft - 8;
    }
    const term = $("term");
    const stick = term.scrollHeight - term.scrollTop - term.clientHeight < 40;
    term.innerHTML = log.join("");
    if (stick || S.focusChanged) term.scrollTop = term.scrollHeight;
    S.focusChanged = false;

    // right sidebar
    $("side").innerHTML = S.ws === "orc" ? orcSidebar(t) : overview(t);
    if (flashRow) {
      root.querySelector(`[data-row="${CSS.escape(flashRow)}"]`)?.classList.add("flash");
      flashRow = null;
    }

    // inbox
    $("inbox").innerHTML = S.jobs.length
      ? S.jobs.map((j) => `<li><span class="fn">${esc(j.file)}</span>${j.note ? `<span class="note">${esc(j.note)}</span>` : ""}<span class="chip s-${j.status}">${j.status}</span></li>`).join("")
      : '<li class="empty">No jobs yet. Press “Send a job to QA”.</li>';

    const blocked = S.kids.find((c) => c.blocked);
    $("d-answer").disabled = !blocked;
    $("d-spawn").disabled = S.spawned >= SPAWNS.length;
    $("d-spawn").title = S.spawned >= SPAWNS.length ? "This demo has two more children to start." : "";
  }

  function row({ key, name, stage, status, since, blocked, focused, child }, t) {
    const st = STATUS[status] ?? STATUS.idle;
    const color = blocked ? BLOCKED : st.color;
    const l2 = blocked ? "⚠ needs you" + (stage ? " · " + stage : "")
      : stage || (child && status === "needs_input" ? "waiting" : st.label);
    const cls = blocked ? "blocked" : status === "needs_input" ? "turn" : stage ? "" : "ter";
    return `<button type="button" class="s-row${focused ? " focused" : ""}" data-row="${esc(key)}">
      <span class="l1"><span class="dot sm" style="background:${color}"></span><span class="nm">${esc(name)}</span><time data-since="${since}">${fmtAgo(t - since)}</time></span>
      <span class="l2 ${cls}">${esc(l2)}</span></button>`;
  }

  function orcSidebar(t) {
    const head = splitTitle(orcTabTitle());
    let h = `<div class="s-title"><div class="h"><span class="dot" style="background:${TEAL}"></span>${ORC}</div><div class="sub2">${esc(head.stage)}</div></div>`;
    for (const c of S.kids) {
      const tt = splitTitle(tabTitle(c));
      h += row({ key: c.name, name: tt.name, stage: tt.stage, status: c.status, since: c.since, blocked: tt.blocked,
        focused: S.focus === c.name, child: true }, t);
    }
    if (!S.kids.length) h += '<div class="s-note">No children yet. The Orc starts one with `orc spawn`.</div>';
    return h;
  }

  function overview(t) {
    const agents = [S.orc, ...S.kids];
    const n = (s) => agents.filter((a) => a.status === s).length;
    const blocked = S.kids.filter((c) => c.blocked).length;
    const bits = [];
    if (blocked) bits.push("⚠ " + blocked + " need you");
    if (n("working")) bits.push(n("working") + " working");
    if (n("needs_input")) bits.push(n("needs_input") + " waiting");
    if (n("idle")) bits.push(n("idle") + " idle");
    return `<div class="s-title"><div class="h">Sessions</div><div class="sub2"></div></div>
      <div class="s-sec">ORCS</div>
      <button type="button" class="s-row s-orc" data-orc="1"><span class="l1"><span class="dot" style="background:${TEAL}"></span><span class="nm" style="font-weight:600">${ORC}</span></span>
      <span class="l2">${esc(bits.join(" · ") || "no sessions")}</span></button>
      <div class="s-sec">SESSIONS</div>` +
      row({ key: "notes", name: "notes", stage: "", status: "idle", since: t - 1380, blocked: false, focused: false }, t);
  }

  // ---- events
  let liveT;
  function announce(msg) {
    clearTimeout(liveT);
    liveT = setTimeout(() => { $("d-live").textContent = msg; }, 50);
  }

  root.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-ws], [data-tab], [data-row], [data-orc], [data-answer]");
    if (!el) return;
    if (el.dataset.ws) { S.ws = el.dataset.ws; S.focusChanged = true; }
    else if (el.dataset.tab && S.ws === "orc") { S.focus = el.dataset.tab; S.focusChanged = true; }
    else if (el.dataset.orc) { S.ws = "orc"; S.focusChanged = true; }
    else if (el.dataset.row && el.dataset.row !== "notes") { S.ws = "orc"; S.focus = el.dataset.row; S.focusChanged = true; }
    else if (el.dataset.row === "notes") { S.ws = "notes"; S.focusChanged = true; }
    else if (el.dataset.answer) { answer(S.kids.find((c) => c.name === S.focus), el.dataset.answer); return; }
    render();
  });

  $("d-spawn").addEventListener("click", spawn);
  $("d-job").addEventListener("click", sendJob);
  $("d-list").addEventListener("click", orcList);
  $("d-reset").addEventListener("click", () => { reset(); run(); });
  $("d-answer").addEventListener("click", () => {
    const c = S.kids.find((k) => k.blocked);
    if (!c) return;
    S.ws = "orc"; S.focus = c.name; S.focusChanged = true;
    render();
    $("term").querySelector("[data-answer]")?.focus();
  });
  $("d-pause").addEventListener("click", (ev) => {
    paused = !paused;
    ev.currentTarget.setAttribute("aria-pressed", String(paused));
    ev.currentTarget.textContent = paused ? "Play" : "Pause";
    paused ? stop() : run();
  });

  function run() {
    if (paused || timer) return;
    timer = setInterval(tick, 1600);
  }
  function stop() { clearInterval(timer); timer = null; }

  // The clock only redraws times; steps run on their own timer.
  setInterval(() => {
    if (paused || !started) return;
    const t = now();
    for (const el of root.querySelectorAll("time[data-since]")) el.textContent = fmtAgo(t - Number(el.dataset.since));
  }, 1000);

  reset();
  // Start when the window scrolls into view, so the ⚠ happens while someone is watching.
  const io = new IntersectionObserver((es) => {
    for (const e of es) {
      if (e.isIntersecting && !started) { started = true; run(); }
      else if (!e.isIntersecting && started && !paused) stop();
      else if (e.isIntersecting && started && !paused) run();
    }
  }, { threshold: 0.35 });
  io.observe(root);
})();
