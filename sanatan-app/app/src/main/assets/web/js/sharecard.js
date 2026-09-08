/* Bhakti Daily — shareable devotional cards (canvas -> image -> native share).
 * Sirf app-generated artwork (gradient + text + branding). Koi copyrighted image nahi. */
(function () {
  "use strict";

  function hexToRgb(h) {
    h = h.replace("#", "");
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function darken(hex, f) {
    var c = hexToRgb(hex);
    return "rgb(" + Math.round(c[0] * f) + "," + Math.round(c[1] * f) + "," + Math.round(c[2] * f) + ")";
  }

  function wrap(ctx, text, maxW) {
    var words = text.split(/\s+/), lines = [], line = "";
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  // opts: { title, deity, accent, snippet }
  function build(opts) {
    var S = 1080;
    var c = document.createElement("canvas");
    c.width = S; c.height = S;
    var ctx = c.getContext("2d");
    var accent = opts.accent || "#E8590C";

    // background gradient
    var g = ctx.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, accent);
    g.addColorStop(1, darken(accent, 0.55));
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);

    // soft vignette
    var rg = ctx.createRadialGradient(S / 2, S / 2, S * 0.2, S / 2, S / 2, S * 0.75);
    rg.addColorStop(0, "rgba(255,255,255,0.10)");
    rg.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, S, S);

    // border frame
    ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 6;
    ctx.strokeRect(48, 48, S - 96, S - 96);

    // ॐ watermark
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.font = "700 520px 'Noto Sans Devanagari', serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("ॐ", S / 2, S / 2 + 30);

    // deity label (top)
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "600 40px 'Noto Sans Devanagari', sans-serif";
    ctx.fillText(opts.title || "", S / 2, 130);

    // snippet (center)
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 62px 'Noto Sans Devanagari', serif";
    var lines = [];
    (opts.snippet || "").split("\n").forEach(function (para) {
      wrap(ctx, para, S - 260).forEach(function (l) { lines.push(l); });
    });
    if (lines.length > 6) lines = lines.slice(0, 6);
    var lh = 92, startY = S / 2 - (lines.length - 1) * lh / 2;
    ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
    lines.forEach(function (l, i) { ctx.fillText(l, S / 2, startY + i * lh); });
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // branding footer
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "700 44px 'Noto Sans Devanagari', sans-serif";
    ctx.fillText("🚩 Bhakti Daily", S / 2, S - 110);
    ctx.font = "400 30px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText("रोज़ भक्ति — Chalisa • Aarti • Mantra", S / 2, S - 62);

    return c.toDataURL("image/png");
  }

  window.ShareCard = {
    build: build,
    // item + optional snippet -> share via native
    shareItem: function (item, snippet) {
      var text = snippet || (item.text || "").split("\n").slice(0, 2).join(" ");
      var url = build({ title: item.title, accent: item.accent, deity: item.deity, snippet: text });
      var caption = item.title + "\n\n" + text + "\n\n🚩 Bhakti Daily se — Chalisa, Aarti, Mantra roz.";
      if (window.Bridge) window.Bridge.shareImage(url, caption);
      return url;
    },
  };
})();
