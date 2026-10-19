// Timelines for each output. Times are seconds. NEVER = the event does not happen; PAST = already happened.
(() => {
  const NEVER = 1e9, PAST = -1e9;
  const base = {
    initPrompt: PAST, initTool: PAST, initOut: PAST, initMsg: PAST,
    spawnPrompt: PAST, ask: PAST, yes: PAST, spawn: [PAST, PAST, PAST], spawnMsg: PAST,
    stages: [], orcStage: null, orcWork: [],
    apiWarn: NEVER, apiAnswer: NEVER, docsWarn: NEVER, qaIdle: NEVER,
    jobPrompt: NEVER, jobNew: NEVER, jobMsg: NEVER, qaHook: NEVER, jobTaken: NEVER, jobOutput: NEVER, jobDone: NEVER,
    selTab: [], selWs: [],
  };
  const ev = (o) => ({ ...base, ...o });

  // ---- master: 1920×1080, 80 s ----
  const master = {
    view: { w: 1920, h: 1080, cx: 960, cy: 470 }, dur: 80, fps: 30,
    win: { x: 80, y: 30, w: 1760, h: 880 },
    layout: { leftW: 240, sideW: 380, sb: 1.45 },
    cap: { size: 54, bottom: 34, maxW: 1560 },
    segments: [
      { kind: "title", t0: 0, t1: 5.2 },
      { kind: "problem", t0: 5.0, t1: 12.2 },
      { kind: "app", t0: 12.0, t1: 72.4 },
      { kind: "end", t0: 72.0, t1: 80.4 },
    ],
    E: ev({
      initPrompt: 12.8, initTool: 15.0, initOut: 15.7, initMsg: 16.5,
      orcWork: [[14.6, 16.5], [24.4, 25.0], [26.1, 31.0], [40.9, 41.4], [56.2, 58.0]],
      spawnPrompt: 22.4, ask: 25.0, yes: 25.7, spawn: [27.2, 28.6, 30.0], spawnMsg: 31.0,
      stages: [
        { sf: "sf-qa", text: "case 3/12", t: 35.0 }, { sf: "sf-docs", text: "README pass", t: 36.2 },
        { sf: "sf-api", text: "migrations", t: 37.4 }, { sf: "sf-qa", text: "case 7/12", t: 39.2 },
        { sf: "sf-qa", text: "case 9/12", t: 42.6 }, { sf: "sf-qa", text: "case 12/12", t: 60.6 },
      ],
      orcStage: { text: "watching 3 children", t: 41.4 },
      apiWarn: 45.0, apiAnswer: 50.2,
      selTab: [{ t: 48.3, sf: "sf-api" }, { t: 54.2, sf: "sf-orc" }, { t: 58.9, sf: "sf-qa" }],
      jobPrompt: 54.6, jobNew: 56.9, jobMsg: 57.6,
      qaHook: 59.4, jobTaken: 60.0, jobOutput: 61.3, jobDone: 62.0, qaIdle: 62.5,
      docsWarn: 64.4, selWs: [{ t: 65.4, ws: "ws-blog" }],
    }),
    cam: [
      { t: 12.0, home: true }, { t: 15.0, home: true },
      { t: 15.8, target: "ws-ws-shop", s: 2.0, dx: 260, dy: 120 }, { t: 17.8, target: "ws-ws-shop", s: 2.0, dx: 260, dy: 120 },
      { t: 18.8, target: "side", s: 1.7, dy: -120 }, { t: 21.4, target: "side", s: 1.7, dy: -120 },
      { t: 22.3, target: "term", s: 1.3, dx: -60, dy: 120 }, { t: 25.8, target: "term", s: 1.3, dx: -60, dy: 120 },
      { t: 26.8, point: { x: 900, y: 330 }, s: 1.35 }, { t: 30.6, point: { x: 900, y: 330 }, s: 1.35 },
      { t: 31.6, target: "side", s: 1.9, dy: -150 }, { t: 33.8, target: "side", s: 1.9, dy: -150 },
      { t: 34.4, point: { x: 1000, y: 340 }, s: 1.3 }, { t: 38.6, point: { x: 1000, y: 340 }, s: 1.3 },
      { t: 39.6, target: "side", s: 2.1, dy: -160 }, { t: 43.8, target: "side", s: 2.1, dy: -160 },
      { t: 44.6, target: "row-sf-api", s: 2.4, dx: -60 }, { t: 47.2, target: "row-sf-api", s: 2.4, dx: -60 },
      { t: 48.6, point: { x: 1000, y: 420 }, s: 1.28 }, { t: 53.4, point: { x: 1000, y: 420 }, s: 1.28 },
      { t: 54.4, point: { x: 760, y: 420 }, s: 1.3 }, { t: 63.6, point: { x: 760, y: 420 }, s: 1.3 },
      { t: 64.2, home: true }, { t: 65.0, home: true },
      { t: 66.2, target: "side", s: 2.1, dy: -160 }, { t: 72, target: "side", s: 2.1, dy: -160 },
    ],
    cursorShow: [[46.4, 51.2], [53.0, 54.6], [58.0, 59.3], [64.0, 66.4]],
    cursor: [
      { t: 46.4, point: { x: 1100, y: 600 } }, { t: 47.8, target: "row-sf-api", dx: -40, dy: 4 },
      { t: 48.4, target: "row-sf-api", dx: -40, dy: 4 }, { t: 49.6, target: "term", dx: -300, dy: 250 },
      { t: 51.2, target: "term", dx: -300, dy: 250 },
      { t: 53.0, point: { x: 700, y: 300 } }, { t: 53.9, target: "tab-sf-orc", dx: 10, dy: 4 }, { t: 54.6, target: "tab-sf-orc", dx: 10, dy: 4 },
      { t: 58.0, point: { x: 600, y: 300 } }, { t: 58.7, target: "tab-sf-qa", dx: 10, dy: 4 }, { t: 59.3, target: "tab-sf-qa", dx: 10, dy: 4 },
      { t: 64.0, point: { x: 600, y: 500 } }, { t: 65.1, target: "ws-ws-blog", dx: -20, dy: 4 }, { t: 66.4, target: "ws-ws-blog", dx: -20, dy: 4 },
    ],
    clicks: [48.1, 50.0, 54.1, 58.8, 65.3],
    chips: [
      { t0: 34.6, t1: 37.0, anchor: "tab-sf-qa", text: 'orc stage "case 3/12"' },
      { t0: 37.2, t1: 39.0, anchor: "tab-sf-api", text: 'orc stage "migrations"' },
    ],
    card: { t0: 57.1, t1: 63.7, x: 1180, y: 120, s: 1.25 },
    captions: [
      { t0: 5.4, t1: 11.8, html: "Eight Claude sessions. Which one needs you?" },
      { t0: 12.6, t1: 21.8, html: "One session becomes an <b>Orc</b>: one coloured, pinned tile." },
      { t0: 22.4, t1: 33.8, html: "The Orc starts children as tabs. It asks you first." },
      { t0: 34.2, t1: 43.8, html: "Each child reports its stage. The sidebar shows it live." },
      { t0: 44.2, t1: 53.8, html: "Stuck on a question or a permission?<br><b>⚠</b> on the tab, red in the sidebar." },
      { t0: 54.2, t1: 63.8, html: "Jobs are Markdown files in an inbox.<br>A hook shows each session its new ones." },
      { t0: 64.2, t1: 71.8, html: "Step out: one row per Orc, then every other session." },
    ],
  };

  // ---- hero GIF: 1000×600 → 800 px, 7 s loop, no captions ----
  const hero = {
    view: { w: 1000, h: 600, cx: 500, cy: 300 }, dur: 7.0, fps: 30, loopFade: 0.35,
    win: { x: 16, y: 16, w: 968, h: 568 },
    layout: { leftW: 0, sideW: 400, sb: 1.6 },
    cap: { size: 0, bottom: 0, maxW: 0 },
    E: ev({
      spawnPrompt: PAST, ask: PAST, yes: PAST, initMsg: PAST,
      spawn: [0.5, 1.0, 1.5], spawnMsg: NEVER, orcWork: [[0.0, 1.8]],
      stages: [{ sf: "sf-qa", text: "case 3/12", t: 2.1 }, { sf: "sf-docs", text: "README pass", t: 2.5 },
        { sf: "sf-api", text: "migrations", t: 2.9 }, { sf: "sf-qa", text: "case 7/12", t: 3.5 }, { sf: "sf-qa", text: "case 9/12", t: 5.9 }],
      apiWarn: 3.9, apiAnswer: 5.5,
    }),
    cam: [{ t: 0, home: true }],
  };

  // ---- feature clips: 1200×700 → 800 px ----
  const clipBase = {
    view: { w: 1200, h: 700, cx: 600, cy: 290 }, fps: 30, loopFade: 0.3,
    win: { x: 20, y: 14, w: 1160, h: 552 },
    cap: { size: 40, bottom: 22, maxW: 1140 },
    cam: [{ t: 0, home: true }],
  };
  const orcTabs = {
    ...clipBase, dur: 6.0, layout: { leftW: 230, sideW: 340, sb: 1.4 },
    E: ev({
      initPrompt: PAST, initTool: 0.4, initOut: 1.0, initMsg: NEVER,
      spawnPrompt: NEVER, ask: NEVER, yes: NEVER, spawn: [2.2, 2.9, 3.6], spawnMsg: NEVER,
      orcWork: [[0, 4.2]],
    }),
    captions: [{ t0: 0.0, t1: 6.0, html: "An <b>Orc</b> gets a coloured, pinned tile.<br>Its children open as tabs." }],
  };
  // initPrompt PAST would type nothing; show the init prompt as already submitted
  const sidebar = {
    ...clipBase, dur: 6.5, layout: { leftW: 0, sideW: 440, sb: 1.6 },
    E: ev({
      stages: [{ sf: "sf-qa", text: "case 3/12", t: 0.5 }, { sf: "sf-docs", text: "README pass", t: 1.0 },
        { sf: "sf-api", text: "migrations", t: 1.5 }, { sf: "sf-qa", text: "case 7/12", t: 2.3 }],
      orcStage: { text: "watching 3 children", t: 2.8 },
      selWs: [{ t: 3.9, ws: "ws-blog" }],
    }),
    cam: [{ t: 0, point: { x: 860, y: 300 }, s: 1.2 }],
    chips: [{ t0: 0.3, t1: 1.9, anchor: "tab-sf-qa", text: 'orc stage "case 3/12"' }],
    captions: [{ t0: 0, t1: 3.8, html: "Every child's stage, live in the sidebar." },
      { t0: 3.8, t1: 6.5, html: "Step out: one row per Orc." }],
  };
  const needsYou = {
    ...clipBase, dur: 6.5, layout: { leftW: 0, sideW: 420, sb: 1.6 },
    E: ev({
      stages: [{ sf: "sf-qa", text: "case 7/12", t: PAST }, { sf: "sf-docs", text: "README pass", t: PAST }, { sf: "sf-api", text: "migrations", t: PAST }],
      orcStage: { text: "watching 3 children", t: PAST },
      apiWarn: 0.7, apiAnswer: 4.2, selTab: [{ t: 2.5, sf: "sf-api" }],
    }),
    cursorShow: [[1.4, 5.0]],
    cursor: [{ t: 1.4, point: { x: 600, y: 420 } }, { t: 2.2, target: "row-sf-api", dx: -40, dy: 4 }, { t: 2.6, target: "row-sf-api", dx: -40, dy: 4 },
      { t: 3.6, target: "term", dx: -180, dy: 160 }, { t: 5.0, target: "term", dx: -180, dy: 160 }],
    clicks: [2.4, 4.0],
    captions: [{ t0: 0, t1: 6.5, html: "Blocked on you? <b>⚠</b> on the tab, red in the sidebar." }],
  };
  const jobs = {
    ...clipBase, dur: 7.0, layout: { leftW: 0, sideW: 0, sb: 1.4 },
    E: ev({
      stages: [{ sf: "sf-qa", text: "case 9/12", t: PAST }, { sf: "sf-qa", text: "case 12/12", t: 4.1 }],
      jobNew: 0.8, jobMsg: 1.4, selTab: [{ t: 2.3, sf: "sf-qa" }],
      qaHook: 2.7, jobTaken: 3.3, jobOutput: 4.6, jobDone: 5.3, qaIdle: 5.6,
    }),
    cam: [{ t: 0, point: { x: 700, y: 300 }, s: 1.15 }],
    card: { t0: 1.0, t1: 7.0, x: 690, y: 30, s: 0.95 },
    captions: [{ t0: 0, t1: 7.0, html: "Jobs are Markdown files in an inbox.<br>A hook shows each session its new ones." }],
  };

  window.CONFIGS = { master, hero, "orc-tabs": orcTabs, sidebar, "needs-you": needsYou, jobs };
})();
