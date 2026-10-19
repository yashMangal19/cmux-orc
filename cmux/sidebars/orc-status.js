// orc-status: claude-orc's right-sidebar panel.
// In an Orc workspace (title ends in "-Orc") it lists that Orc's children with
// status and stage; everywhere else it shows the Sessions overview: one rollup
// row per Orc, then every independent session (waiting ones first).
//   cmux right-sidebar set custom orc-status
//
// Stage text comes from tab titles: `orc stage "case 41/88"` renames the tab to
// "QA · case 41/88". The sidebar context has no filesystem, so that is the channel.

const STATUS = {
  // cmux reports needs_input whenever a finished turn is waiting on input, not only for questions.
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

// "✳ QA · case 41/88" -> { name: "QA", stage: "case 41/88", blocked: false }
// A leading "⚠" is claude-orc's hook marking a session blocked on a question or permission prompt.
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

// One flat keyed list; the kind is encoded in the key so row templates stay stable.
const entries = computed(() => {
  const all = data.workspaces() ?? [];
  const sel = all.find((w) => w.selected);
  const out = [];

  if (sel && isOrc(sel)) {
    const tabs = sel.tabs ?? [];
    const head = splitTitle(tabs[0]?.title);
    out.push({ key: "t:" + sel.id, kind: "title", text: sel.title, sub: head.stage, color: sel.color });
    for (const tab of tabs.slice(1)) {
      const a = agentFor(sel, tab);
      const t = splitTitle(tab.title);
      out.push({
        key: "c:" + tab.id, kind: "row", wsId: sel.id, surfaceId: tab.surfaceId,
        name: t.name || a?.name || "tab", stage: t.stage, agent: a, focused: tab.focused, child: true,
        blocked: t.blocked,
      });
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
    out.push({
      key: "o:" + w.id, kind: "orc", wsId: w.id, name: w.title, color: w.color,
      counts: bits.join(" · ") || "no sessions", jobs: w.description ?? "",
    });
  }

  // Waiting sessions sort first; an Orc's waiting children stay inside the Orc row's count.
  const solo = all.filter((w) => !isOrc(w) && !isManager(w) && (w.agents ?? []).length)
    .sort((x, y) => statusOf(x.agents[0]).rank - statusOf(y.agents[0]).rank)
    .sort((x, y) => Number(blockedWs(y)) - Number(blockedWs(x)));
  if (solo.length) out.push({ key: "s:solo", kind: "section", text: "SESSIONS" });
  for (const w of solo) {
    const a = w.agents[0];
    const tab = (w.tabs ?? []).find((x) => x.surfaceId === a.surfaceId) ?? (w.tabs ?? [])[0];
    out.push({
      key: "i:" + w.id, kind: "row", wsId: w.id, surfaceId: a.surfaceId,
      name: splitTitle(w.title).name, stage: splitTitle(tab?.title).stage, agent: a, focused: false,
      blocked: splitTitle(tab?.title).blocked,
    });
  }
  return out;
});

function jump(e) {
  cmux("workspace.select", { workspace_id: e.wsId });
  if (e.surfaceId) cmux("surface.focus", { surface_id: e.surfaceId, workspace_id: e.wsId });
}

function titleRow(e) {
  return VStack({ spacing: 2 }, [
    HStack({ spacing: 6 }, [
      Circle({ size: 8 }).fill(() => e().color ?? "clear"),
      Text(() => e().text).font(14).weight("semibold").lineLimit(1),
      Spacer(),
    ]),
    Text(() => e().sub).font(10).color("tertiary").lineLimit(1).truncation("tail"),
  ]).paddingHorizontal(10).paddingVertical(4);
}

function sectionRow(e) {
  return Text(() => e().text).font(10).weight("semibold").color("tertiary")
    .paddingHorizontal(10).paddingVertical(3);
}

function noteRow(e) {
  return Text(() => e().text).font(11).color("tertiary").paddingHorizontal(10);
}

// Status dot + name + time; second line is the stage, or the status when no stage was reported.
function sessionRow(e) {
  const a = () => e().agent;
  return VStack({ spacing: 2 }, [
    HStack({ spacing: 6 }, [
      Circle({ size: 7 }).fill(() => (e().blocked ? BLOCKED.color : statusOf(a()).color)),
      Text(() => e().name).font(12).weight("medium").lineLimit(1).truncation("tail"),
      Spacer(),
      Text(() => timeText(a(), data.clock()?.epoch ?? 0)).font(10).monospaced().color("tertiary")
        .frame({ minWidth: 52 }),  // .fixedSize() is missing in cmux 0.64
    ]),
    Text(() => (e().blocked ? "⚠ needs you" + (e().stage ? " · " + e().stage : "")
      : e().stage || (e().child && a()?.status === "needs_input" ? "waiting" : statusOf(a()).label)))
      .font(11).lineLimit(2).truncation("tail")
      .color(() => (e().blocked ? BLOCKED.color : a()?.status === "needs_input" ? "#FF9F0A" : e().stage ? "secondary" : "tertiary"))
      .paddingLeading(13),
  ])
    .paddingHorizontal(10).paddingVertical(5)
    .cornerRadius(8)
    .background(() => (e().focused ? "#7f7f7f2e" : null))
    .hoverBackground("#7f7f7f24")
    .frame({ maxWidth: "infinity" })
    .onTap(() => jump(e()));
}

function orcRow(e) {
  return VStack({ spacing: 2 }, [
    HStack({ spacing: 6 }, [
      Circle({ size: 8 }).fill(() => e().color ?? "#7f7f7f"),
      Text(() => e().name).font(12).weight("semibold").lineLimit(1),
      Spacer(),
    ]),
    Text(() => e().counts).font(11).color("secondary").paddingLeading(14),
    Text(() => e().jobs).font(10).color("tertiary").lineLimit(2).paddingLeading(14),
  ])
    .paddingHorizontal(10).paddingVertical(5)
    .cornerRadius(8)
    .hoverBackground("#7f7f7f24")
    .frame({ maxWidth: "infinity" })
    .onTap(() => cmux("workspace.select", { workspace_id: e().wsId }));
}

sidebar(() =>
  VStack({ spacing: 4 }, [
    ForEach({ items: entries, key: (e) => e.key }, (e) => {
      const kind = e().kind;
      if (kind === "title") return titleRow(e);
      if (kind === "section") return sectionRow(e);
      if (kind === "note") return noteRow(e);
      if (kind === "orc") return orcRow(e);
      return sessionRow(e);
    }),
    Spacer(),
  ]).paddingHorizontal(6).paddingVertical(6),
  { surface: "glass" }
);
