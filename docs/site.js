// Copy buttons for the install commands.
(() => {
  const cmds = [...document.querySelectorAll("[data-copy]")].map((b) => b.dataset.copy);

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = Object.assign(document.createElement("textarea"), { value: text });
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    }
  }

  function flash(btn, ok) {
    const label = btn.dataset.label ?? (btn.dataset.label = btn.textContent);
    btn.textContent = ok ? "Copied" : "Press ⌘C";
    btn.classList.toggle("ok", ok);
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.textContent = label; btn.classList.remove("ok"); }, 1600);
  }

  document.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("[data-copy], [data-copy-all]");
    if (!btn) return;
    const text = btn.hasAttribute("data-copy-all") ? cmds.join("\n") : btn.dataset.copy;
    flash(btn, await copy(text));
  });
})();

// Media slots: use the promo video and feature GIFs once they are in docs/media/; until then keep the placeholders.
(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const slot = document.querySelector("[data-video]");
  if (slot) {
    fetch(slot.dataset.video, { method: "HEAD" }).then((r) => {
      if (!r.ok) return;
      const v = document.createElement("video");
      Object.assign(v, { controls: true, preload: "none", playsInline: true, src: slot.dataset.video, poster: slot.dataset.poster });
      v.setAttribute("aria-label", "cmux-orc promo video");
      slot.replaceChildren(v);
    }).catch(() => {});
  }

  // Clips animate, so reduced-motion visitors keep the still drawings.
  // Each loops as a muted video and loads only when it nears the viewport.
  if (still) return;
  const show = (viz) => {
    const v = document.createElement("video");
    Object.assign(v, { muted: true, loop: true, autoplay: true, playsInline: true, preload: "auto" });
    v.className = "feat-gif";
    v.setAttribute("aria-label", viz.dataset.alt);
    v.addEventListener("loadeddata", () => viz.replaceWith(v), { once: true });
    v.src = viz.dataset.clip;
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); show(e.target); }
  }, { rootMargin: "200px" });
  document.querySelectorAll("[data-clip]").forEach((viz) => io.observe(viz));
})();
